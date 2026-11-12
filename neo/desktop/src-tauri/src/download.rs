//! Downloads of a file a page shows (a Files entry's `media.download_url`), saved from here:
//! the system's save dialog asks where (a sheet on the window, with the file's own name), and
//! the file streams to disk with progress going back to the page over a `Channel`.
//!
//! The web view never names a place on disk and gets no file system permission: it sends the
//! link and the name it suggests, Rust opens the dialog and writes only where the person chose.
//! A link is taken only from the signed-in site of the page's session (or https, for a site
//! that keeps its files elsewhere); the access token goes only to the site's own origin.

use std::path::{Path, PathBuf};
use std::time::{Duration, Instant};

use futures_util::StreamExt;
use serde::Serialize;
use tauri::ipc::Channel;
use tauri::{AppHandle, State, WebviewWindow};
use tauri_plugin_dialog::DialogExt;
use tokio::io::AsyncWriteExt;
use tokio::sync::oneshot;

use crate::auth::{self, AuthState};
use crate::i18n::{tr, tr_vars};

const CONNECT_TIMEOUT: Duration = Duration::from_secs(20);
/// A download fails when no bytes came for this long (it may take as long as it takes otherwise).
const STALL_TIMEOUT: Duration = Duration::from_secs(60);
const PROGRESS_EVERY: Duration = Duration::from_millis(100);

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadProgress {
    received: u64,
    /// 0 when the site did not say how big it is
    total: u64,
}

/// Why a download failed: the HTTP status (0 when the site was not reached) and a code, so the
/// page can say what to do.
#[derive(Serialize, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DownloadError {
    status: u16,
    code: String,
    message: String,
}

impl DownloadError {
    fn local(code: &str, message: impl Into<String>) -> Self {
        Self { status: 0, code: code.into(), message: message.into() }
    }
}

/// What a download did: saved under this name, or nothing (the dialog was cancelled).
#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Saved {
    saved: bool,
    name: String,
}

/// A link the page may have saved: of the site (its scheme, host and port), or https elsewhere
/// (a storage the site keeps its files in). Whether the token goes with it: only to the site.
fn check_link(link: &str, site: &str) -> Result<(url::Url, bool), DownloadError> {
    let refuse = || DownloadError::local("invalid_link", tr("This is not a link of the network to download"));
    let url = url::Url::parse(link).map_err(|_| refuse())?;
    let site = url::Url::parse(site).map_err(|_| refuse())?;
    if !url.username().is_empty() || url.password().is_some() || url.host_str().is_none() {
        return Err(refuse());
    }
    let same = url.scheme() == site.scheme() && url.host_str() == site.host_str() && url.port_or_known_default() == site.port_or_known_default();
    if same || url.scheme() == "https" {
        Ok((url, same))
    } else {
        Err(refuse())
    }
}

/// Whether a redirect may be followed: to the site, or https elsewhere (as `check_link`), at most
/// `MAX_REDIRECTS` of them. reqwest drops the token itself once the host changes.
fn redirect_allowed(next: &str, site: &str, hops: usize) -> Result<(), &'static str> {
    if hops >= MAX_REDIRECTS {
        return Err("too many redirects");
    }
    check_link(next, site).map(|_| ()).map_err(|_| "a redirect off the network")
}

const MAX_REDIRECTS: usize = 10;

/// The client of one download: its redirects are checked as its link was (`redirect_allowed`).
fn download_client(site: &str) -> Result<reqwest::Client, DownloadError> {
    let site = site.to_string();
    reqwest::Client::builder()
        .connect_timeout(CONNECT_TIMEOUT)
        .redirect(reqwest::redirect::Policy::custom(move |attempt| match redirect_allowed(attempt.url().as_str(), &site, attempt.previous().len()) {
            Ok(()) => attempt.follow(),
            Err(why) => attempt.error(why),
        }))
        .build()
        .map_err(|e| DownloadError::local("internal", e.to_string()))
}

/// Invisible characters that change how a name reads (bidi controls such as U+202E, which can
/// make "invoice\u{202E}fdp.app" show as "invoiceppa.pdf", and zero-width ones). The joiners
/// U+200C and U+200D stay: Persian and emoji need them.
fn is_misleading(c: char) -> bool {
    matches!(c, '\u{061C}' | '\u{200B}' | '\u{200E}' | '\u{200F}' | '\u{202A}'..='\u{202E}' | '\u{2060}'..='\u{2069}' | '\u{FEFF}')
}

/// Marks a downloaded file as from the Internet, as browsers do, so the system checks it before
/// it opens (macOS: com.apple.quarantine, which Gatekeeper reads; Windows: the Mark of the Web).
/// A volume that keeps no such attributes (a FAT drive) takes the file without it, as for any
/// browser.
#[cfg(target_os = "macos")]
fn quarantine(path: &Path) -> std::io::Result<()> {
    use std::os::unix::ffi::OsStrExt;
    let secs = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0);
    // 0083: downloaded by an app, not yet opened, and Gatekeeper is to check it
    let value = format!("0083;{secs:x};{};", crate::brand::NAME);
    let c_path = std::ffi::CString::new(path.as_os_str().as_bytes())?;
    // SAFETY: both strings are NUL-terminated C strings that live through the call, and value
    // points at value.len() readable bytes.
    let rc = unsafe { libc::setxattr(c_path.as_ptr(), c"com.apple.quarantine".as_ptr(), value.as_ptr().cast(), value.len(), 0, 0) };
    if rc == 0 {
        return Ok(());
    }
    let error = std::io::Error::last_os_error();
    if error.raw_os_error() == Some(libc::ENOTSUP) {
        return Ok(());
    }
    Err(error)
}

#[cfg(windows)]
fn quarantine(path: &Path) -> std::io::Result<()> {
    let mut stream = path.as_os_str().to_os_string();
    stream.push(":Zone.Identifier");
    // ZoneId 3: the Internet zone. A volume without streams (FAT) takes the file without it.
    match std::fs::write(PathBuf::from(stream), "[ZoneTransfer]\r\nZoneId=3\r\n") {
        Err(e) if e.kind() == std::io::ErrorKind::Unsupported || e.raw_os_error() == Some(123) => Ok(()),
        other => other,
    }
}

#[cfg(not(any(target_os = "macos", windows)))]
fn quarantine(_path: &Path) -> std::io::Result<()> {
    Ok(())
}

/// Names Windows keeps for devices, with any extension ("CON", "nul.txt", "COM1.log"): a file
/// cannot be called that there.
fn is_windows_device_name(name: &str) -> bool {
    let stem = name.split('.').next().unwrap_or("").trim_end().to_ascii_uppercase();
    matches!(stem.as_str(), "CON" | "PRN" | "AUX" | "NUL" | "CONIN$" | "CONOUT$")
        || (stem.len() == 4 && (stem.starts_with("COM") || stem.starts_with("LPT")) && stem.as_bytes()[3].is_ascii_digit() && stem.as_bytes()[3] != b'0')
}

/// The name the dialog suggests: the last part of what the page sent, without control
/// characters, misleading invisible ones (`is_misleading`), a leading dot or trailing dots and
/// spaces (Windows drops them), at most 200 characters; a device name of Windows gets a `_`
/// before it; "download" for none.
fn suggested_name(raw: &str) -> String {
    let base = raw.rsplit(['/', '\\']).next().unwrap_or("").trim();
    let base: String =
        base.chars().filter(|c| !c.is_control() && !is_misleading(*c) && !matches!(c, ':' | '*' | '?' | '"' | '<' | '>' | '|')).take(200).collect();
    let base = base.trim_start_matches('.').trim().trim_end_matches(['.', ' ']).to_string();
    if base.is_empty() {
        "download".into()
    } else if is_windows_device_name(&base) {
        format!("_{base}")
    } else {
        base
    }
}

/// How much of the chosen file's name its temporary file keeps: with the suffix it stays under
/// the 255 bytes (or UTF-16 units) a file system gives a name.
const PART_NAME_BYTES: usize = 120;
const PART_TRIES: usize = 16;

/// The name of the file a download is written to until it is whole: the start of the chosen
/// file's name, then `tag`, which no other download of that file has.
fn part_name(path: &Path, tag: u32) -> std::ffi::OsString {
    let name = path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
    let mut kept = String::new();
    for c in name.chars() {
        if kept.len() + c.len_utf8() > PART_NAME_BYTES {
            break;
        }
        kept.push(c);
    }
    format!("{kept}.{tag:08x}.download").into()
}

/// The temporary file of one download. It is removed when this is dropped, however the download
/// ended (an error, or the command's future dropped part-way), unless it became the chosen file.
struct Part {
    path: PathBuf,
    keep: bool,
}

impl Drop for Part {
    fn drop(&mut self) {
        if !self.keep {
            let _ = std::fs::remove_file(&self.path);
        }
    }
}

/// A new, empty temporary file for a download to `path`, beside it, so the rename at the end
/// never crosses disks. Every download gets its own (`create_new`: never a file that exists, so
/// two downloads to one place never write the same file).
async fn create_part(path: &Path) -> std::io::Result<(Part, tokio::fs::File)> {
    let mut tries = 0;
    loop {
        let part = path.with_file_name(part_name(path, rand::random()));
        match tokio::fs::OpenOptions::new().write(true).create_new(true).open(&part).await {
            Ok(file) => return Ok((Part { path: part, keep: false }, file)),
            Err(e) if e.kind() == std::io::ErrorKind::AlreadyExists && tries < PART_TRIES => tries += 1,
            Err(e) => return Err(e),
        }
    }
}

/// Whether Windows refused a rename because another program holds one of the two files open
/// without sharing it: access denied for the file being replaced, ERROR_SHARING_VIOLATION (32,
/// which has no `ErrorKind` of its own) for the one being moved.
fn held_open(e: &std::io::Error) -> bool {
    cfg!(windows) && (e.kind() == std::io::ErrorKind::PermissionDenied || e.raw_os_error() == Some(32))
}

/// Puts a whole download where it was asked for, in one step: who opens `path` sees the file
/// that was there or the new one, never a part of either. Windows refuses while another program
/// holds the old file or the new one open without sharing it (a virus scanner reading what was
/// just written, a viewer), so it is asked again for a second.
async fn replace(part: &Path, path: &Path) -> std::io::Result<()> {
    let mut tries = 0;
    loop {
        match tokio::fs::rename(part, path).await {
            Err(e) if held_open(&e) && tries < 10 => {
                tries += 1;
                tokio::time::sleep(Duration::from_millis(100)).await;
            }
            other => return other,
        }
    }
}

/// Writes `body` to `path`: into a temporary file of its own beside it, which takes the place of
/// `path` once it is whole and marked as downloaded. Of two downloads to one place the one that
/// ends last stays, whole. A download that fails or is dropped leaves `path` as it was and no
/// temporary file.
async fn write_download<S, B, E>(path: &Path, body: S, total: u64, progress: impl Fn(DownloadProgress)) -> Result<(), DownloadError>
where
    S: futures_util::Stream<Item = Result<B, E>>,
    B: AsRef<[u8]>,
    E: std::fmt::Display,
{
    let unwritable = |e: std::io::Error| DownloadError::local("unwritable", tr_vars("Can't write the file: {{reason}}", &[("reason", &e.to_string())]));
    let (mut part, mut file) = create_part(path).await.map_err(|e| {
        DownloadError::local("unwritable", tr_vars("Can't write {{path}}: {{reason}}", &[("path", &path.display().to_string()), ("reason", &e.to_string())]))
    })?;
    let mut body = std::pin::pin!(body);
    let mut received = 0u64;
    let mut last = Instant::now();
    progress(DownloadProgress { received, total });
    loop {
        let next = tokio::time::timeout(STALL_TIMEOUT, body.next()).await.map_err(|_| DownloadError::local("unreachable", tr("The download stalled")))?;
        let Some(chunk) = next else { break };
        let chunk = chunk.map_err(|e| DownloadError::local("unreachable", tr_vars("The download broke off: {{reason}}", &[("reason", &e.to_string())])))?;
        let chunk = chunk.as_ref();
        file.write_all(chunk).await.map_err(unwritable)?;
        received += chunk.len() as u64;
        if last.elapsed() >= PROGRESS_EVERY {
            progress(DownloadProgress { received, total });
            last = Instant::now();
        }
    }
    file.flush().await.map_err(unwritable)?;
    drop(file);
    progress(DownloadProgress { received, total: total.max(received) });
    // from the Internet, as a browser's download: before the rename, so the file is never
    // where it was asked for without the mark
    quarantine(&part.path)
        .map_err(|e| DownloadError::local("unwritable", tr_vars("Can't mark the file as downloaded: {{reason}}", &[("reason", &e.to_string())])))?;
    replace(&part.path, path).await.map_err(|e| {
        DownloadError::local("unwritable", tr_vars("Can't save {{path}}: {{reason}}", &[("path", &path.display().to_string()), ("reason", &e.to_string())]))
    })?;
    part.keep = true;
    Ok(())
}

/// Ask where to save `name` (the save dialog, a sheet on the window), then download `url` there.
/// For the page's session only (as access_token): after a switch to another network nothing
/// is fetched. Answers whether it was saved and under which name.
#[tauri::command]
#[allow(clippy::too_many_arguments)]
pub async fn save_download(
    app: AppHandle,
    window: WebviewWindow,
    auth_state: State<'_, AuthState>,
    url: String,
    name: String,
    site_url: String,
    generation: u64,
    on_progress: Channel<DownloadProgress>,
) -> Result<Saved, DownloadError> {
    let session_over = || DownloadError { status: 401, code: "session_over".into(), message: tr("You are signed out of this network: nothing was downloaded") };
    let auth::SessionToken { site, token, .. } =
        auth::page_token(&auth_state, &site_url, generation).await.map_err(|e| DownloadError::local("unreachable", e))?.ok_or_else(session_over)?;
    let (link, to_site) = check_link(&url, &site)?;

    let suggested = suggested_name(&name);
    let (tx, rx) = oneshot::channel();
    app.dialog().file().set_parent(&window).set_title(tr("Save File")).set_file_name(&suggested).save_file(move |path| {
        let _ = tx.send(path);
    });
    let Some(chosen) = rx.await.map_err(|_| DownloadError::local("cancelled", tr("The save dialog closed")))? else {
        return Ok(Saved { saved: false, name: suggested });
    };
    let path = chosen.into_path().map_err(|e| DownloadError::local("invalid_path", tr_vars("Can't save there: {{reason}}", &[("reason", &e.to_string())])))?;
    // the page's session still (the dialog may have stayed open through a switch)
    if auth_state.generation() != generation {
        return Err(session_over());
    }

    let client = download_client(&site)?;
    let mut request = client.get(link);
    if to_site {
        request = request.bearer_auth(&token);
    }
    let response =
        request.send().await.map_err(|e| DownloadError::local("unreachable", tr_vars("Could not download it: {{reason}}", &[("reason", &e.to_string())])))?;
    let status = response.status();
    if !status.is_success() {
        let message = if status.as_u16() == 403 || status.as_u16() == 404 {
            tr("The network no longer gives this file: ask for it again")
        } else {
            tr_vars("The site answered {{status}}", &[("status", &status.to_string())])
        };
        return Err(DownloadError { status: status.as_u16(), code: "http_error".into(), message });
    }
    let total = response.content_length().unwrap_or(0);

    write_download(&path, response.bytes_stream(), total, |progress| {
        let _ = on_progress.send(progress);
    })
    .await?;
    let saved = path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or(suggested);
    Ok(Saved { saved: true, name: saved })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn links_are_the_sites_or_https() {
        let site = "http://desktop.localhost:8090";
        let (u, token) = check_link("http://desktop.localhost:8090/s/bx_files_files/a.pdf?t=1", site).unwrap();
        assert_eq!((u.path(), token), ("/s/bx_files_files/a.pdf", true));
        // a storage elsewhere over https: fetched, without the token
        let (_, token) = check_link("https://files.example/a.pdf", site).unwrap();
        assert!(!token);
        // the same host on another port or scheme is not the site
        assert!(!check_link("https://desktop.localhost:8090/a.pdf", site).unwrap().1);
        for bad in [
            "http://evil.example/a.pdf",
            "http://desktop.localhost:8091/a",
            "file:///etc/passwd",
            "ftp://desktop.localhost/a",
            "not a link",
            "https://user:pw@files.example/a",
        ] {
            assert!(check_link(bad, site).is_err(), "{bad}");
        }
        let (_, token) = check_link("https://community.example/s/x.zip", "https://community.example/").unwrap();
        assert!(token, "https site, default port");
    }

    #[test]
    fn suggested_names_lose_folders_and_odd_characters() {
        assert_eq!(suggested_name("Agenda.pdf"), "Agenda.pdf");
        assert_eq!(suggested_name("../../etc/passwd"), "passwd");
        assert_eq!(suggested_name("C:\\Users\\me\\plan.docx"), "plan.docx");
        assert_eq!(suggested_name(".hidden"), "hidden");
        assert_eq!(suggested_name("a\u{0}b:c?.txt"), "abc.txt");
        assert_eq!(suggested_name(""), "download");
        assert_eq!(suggested_name("Отчёт 2026.pdf"), "Отчёт 2026.pdf");
        // names Windows cannot save
        assert_eq!(suggested_name("notes. . "), "notes");
        assert_eq!(suggested_name("..."), "download");
        assert_eq!(suggested_name("CON"), "_CON");
        assert_eq!(suggested_name("nul.txt"), "_nul.txt");
        assert_eq!(suggested_name("com1.tar.gz"), "_com1.tar.gz");
        assert_eq!(suggested_name("LPT9"), "_LPT9");
        assert_eq!(suggested_name("COM0.txt"), "COM0.txt");
        assert_eq!(suggested_name("console.log"), "console.log");
        assert_eq!(suggested_name("Concert.pdf"), "Concert.pdf");
        assert_eq!(suggested_name(&"x".repeat(300)).chars().count(), 200);
        // bidi controls and zero-width characters that make a name read otherwise
        assert_eq!(suggested_name("invoice\u{202E}fdp.app"), "invoicefdp.app");
        assert_eq!(suggested_name("\u{2066}a\u{2069}\u{200F}b\u{200B}\u{FEFF}.txt"), "ab.txt");
        // the joiners stay
        assert_eq!(suggested_name("می\u{200C}خواهم.pdf"), "می\u{200C}خواهم.pdf");
    }

    #[test]
    fn redirects_stay_on_the_network_or_https() {
        let site = "http://desktop.localhost:8090";
        assert!(redirect_allowed("http://desktop.localhost:8090/storage.php?f=a", site, 0).is_ok());
        assert!(redirect_allowed("https://cdn.example/a.pdf", site, 3).is_ok());
        for bad in ["http://elsewhere.example/a.pdf", "http://127.0.0.1:9/a", "http://192.168.1.2/a", "file:///etc/passwd"] {
            assert!(redirect_allowed(bad, site, 0).is_err(), "{bad}");
        }
        assert!(redirect_allowed("https://cdn.example/a.pdf", site, MAX_REDIRECTS).is_err(), "no more than 10");
    }

    /// The site answers with a redirect to plain http elsewhere: the download fails there,
    /// without asking that host for anything.
    #[tokio::test]
    async fn a_redirect_to_http_elsewhere_is_not_followed() {
        use tokio::io::{AsyncReadExt, AsyncWriteExt};
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let site = format!("http://127.0.0.1:{}", listener.local_addr().unwrap().port());
        tokio::spawn(async move {
            let (mut socket, _) = listener.accept().await.unwrap();
            let mut buf = [0u8; 1024];
            let _ = socket.read(&mut buf).await;
            let _ = socket.write_all(b"HTTP/1.1 302 Found\r\nLocation: http://elsewhere.invalid/a.pdf\r\nContent-Length: 0\r\nConnection: close\r\n\r\n").await;
        });
        let error = download_client(&site).unwrap().get(format!("{site}/a.pdf")).send().await.unwrap_err();
        assert!(error.is_redirect(), "{error}");
        assert!(format!("{error:?}").contains("off the network"), "{error:?}");
    }

    /// A folder of one test, empty.
    fn test_dir(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("una-download-test-{}-{name}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn names_in(dir: &Path) -> Vec<String> {
        let mut names: Vec<String> = std::fs::read_dir(dir).unwrap().map(|e| e.unwrap().file_name().to_string_lossy().into_owned()).collect();
        names.sort();
        names
    }

    /// A body of `chunks` chunks of `byte`, which lets other tasks run between them.
    fn slow_body(byte: u8, chunks: usize) -> impl futures_util::Stream<Item = Result<Vec<u8>, String>> {
        futures_util::stream::unfold(0, move |sent| async move {
            if sent == chunks {
                return None;
            }
            tokio::task::yield_now().await;
            Some((Ok(vec![byte; 4096]), sent + 1))
        })
    }

    #[cfg(target_os = "macos")]
    #[test]
    fn a_download_is_marked_as_from_the_internet() {
        let dir = test_dir("quarantine");
        let part = dir.join("a.pdf.download");
        std::fs::write(&part, b"%PDF").unwrap();
        quarantine(&part).unwrap();
        let output = std::process::Command::new("/usr/bin/xattr").args(["-p", "com.apple.quarantine"]).arg(&part).output().unwrap();
        let value = String::from_utf8_lossy(&output.stdout).trim().to_string();
        let _ = std::fs::remove_dir_all(&dir);
        assert!(value.starts_with("0083;") && value.ends_with(";UNA;"), "{value}");
    }

    #[test]
    fn a_download_is_written_beside_where_it_goes() {
        assert_eq!(part_name(Path::new("/Users/me/Downloads/a.pdf"), 0x2a), "a.pdf.0000002a.download");
        // a long name is cut on a character, so the temporary name still fits a file system
        let long = part_name(&Path::new("/tmp").join("ж".repeat(200)), 1).to_string_lossy().into_owned();
        assert_eq!(long, format!("{}.00000001.download", "ж".repeat(60)));
        assert!(part_name(&Path::new("/tmp").join("文".repeat(200)), u32::MAX).len() <= 255);
    }

    #[tokio::test]
    async fn every_download_has_its_own_temporary_file() {
        let dir = test_dir("own-part");
        let path = dir.join("a.pdf");
        let (first, first_file) = create_part(&path).await.unwrap();
        let (second, second_file) = create_part(&path).await.unwrap();
        assert_ne!(first.path, second.path);
        assert_eq!(first.path.parent(), Some(dir.as_path()));
        assert_eq!(names_in(&dir).len(), 2);
        // closed first, as write_download does: Windows lists a removed file until it is closed
        drop((first_file.into_std().await, second_file.into_std().await));
        drop((first, second));
        assert!(names_in(&dir).is_empty(), "dropped: removed");
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[tokio::test]
    async fn a_download_takes_the_place_of_the_file_that_was_there() {
        let dir = test_dir("replace");
        let path = dir.join("a.bin");
        std::fs::write(&path, b"old").unwrap();
        let seen = std::sync::Mutex::new(Vec::new());
        write_download(&path, slow_body(b'n', 3), 3 * 4096, |p| seen.lock().unwrap().push((p.received, p.total))).await.unwrap();
        assert_eq!(std::fs::read(&path).unwrap(), vec![b'n'; 3 * 4096]);
        assert_eq!(names_in(&dir), ["a.bin"]);
        let seen = seen.into_inner().unwrap();
        assert_eq!((seen.first(), seen.last()), (Some(&(0, 3 * 4096)), Some(&(3 * 4096, 3 * 4096))));
        let _ = std::fs::remove_dir_all(&dir);
    }

    /// Two windows save to one place at once: each writes its own file, and what stays is the
    /// whole of one of them.
    #[tokio::test]
    async fn two_downloads_to_one_place_do_not_mix() {
        let dir = test_dir("two");
        let path = dir.join("a.bin");
        for round in 0..20 {
            // of different sizes, so each ends last in some rounds
            let (a_chunks, b_chunks) = (8 + round % 5, 10 - round % 5);
            let (a, b) = tokio::join!(write_download(&path, slow_body(b'a', a_chunks), 0, |_| {}), write_download(&path, slow_body(b'b', b_chunks), 0, |_| {}));
            assert_eq!((a, b), (Ok(()), Ok(())));
            let saved = std::fs::read(&path).unwrap();
            assert!(saved == vec![b'a'; a_chunks * 4096] || saved == vec![b'b'; b_chunks * 4096], "round {round}: {} bytes, mixed or cut", saved.len());
            assert_eq!(names_in(&dir), ["a.bin"], "no temporary file stays");
        }
        let _ = std::fs::remove_dir_all(&dir);
    }

    /// One of two downloads to a place breaks off: the other is saved whole, and the broken
    /// one removes only its own temporary file.
    #[tokio::test]
    async fn a_failed_download_leaves_the_other_one_alone() {
        let dir = test_dir("one-fails");
        let path = dir.join("a.bin");
        let broken = futures_util::stream::iter([Ok(vec![b'x'; 4096]), Err("reset".to_string())]);
        let (bad, good) = tokio::join!(write_download(&path, broken, 0, |_| {}), write_download(&path, slow_body(b'g', 6), 0, |_| {}));
        assert_eq!(bad.unwrap_err().code, "unreachable");
        assert_eq!(good, Ok(()));
        assert_eq!(std::fs::read(&path).unwrap(), vec![b'g'; 6 * 4096]);
        assert_eq!(names_in(&dir), ["a.bin"]);
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[tokio::test]
    async fn a_failed_or_dropped_download_leaves_what_was_there() {
        let dir = test_dir("fails");
        let path = dir.join("a.bin");
        std::fs::write(&path, b"old").unwrap();
        let broken = futures_util::stream::iter([Ok(vec![b'x'; 4096]), Err("reset".to_string())]);
        assert_eq!(write_download(&path, broken, 0, |_| {}).await.unwrap_err().code, "unreachable");
        assert_eq!(names_in(&dir), ["a.bin"]);
        // dropped part-way (the window closed): a chunk came, then nothing
        let stuck = futures_util::stream::iter([Ok::<_, String>(vec![b'x'; 4096])]).chain(futures_util::stream::pending());
        assert!(tokio::time::timeout(Duration::from_millis(200), write_download(&path, stuck, 0, |_| {})).await.is_err());
        assert_eq!(names_in(&dir), ["a.bin"]);
        assert_eq!(std::fs::read(&path).unwrap(), b"old");
        // a folder that is not there: nothing to write to
        assert_eq!(write_download(&dir.join("none").join("a.bin"), slow_body(b'x', 1), 0, |_| {}).await.unwrap_err().code, "unwritable");
        let _ = std::fs::remove_dir_all(&dir);
    }
}
