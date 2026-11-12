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

/// Where a download is written until it is whole: beside the chosen file, so the rename at the
/// end never crosses disks.
fn part_path(path: &Path) -> PathBuf {
    let mut name = path.file_name().map(|n| n.to_os_string()).unwrap_or_default();
    name.push(".download");
    path.with_file_name(name)
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

    let part = part_path(&path);
    let mut file = tokio::fs::File::create(&part).await.map_err(|e| {
        DownloadError::local("unwritable", tr_vars("Can't write {{path}}: {{reason}}", &[("path", &path.display().to_string()), ("reason", &e.to_string())]))
    })?;
    let result = async {
        let mut received = 0u64;
        let mut last = Instant::now();
        let _ = on_progress.send(DownloadProgress { received, total });
        let mut body = response.bytes_stream();
        loop {
            let next = tokio::time::timeout(STALL_TIMEOUT, body.next()).await.map_err(|_| DownloadError::local("unreachable", tr("The download stalled")))?;
            let Some(chunk) = next else { break };
            let chunk = chunk.map_err(|e| DownloadError::local("unreachable", tr_vars("The download broke off: {{reason}}", &[("reason", &e.to_string())])))?;
            file.write_all(&chunk)
                .await
                .map_err(|e| DownloadError::local("unwritable", tr_vars("Can't write the file: {{reason}}", &[("reason", &e.to_string())])))?;
            received += chunk.len() as u64;
            if last.elapsed() >= PROGRESS_EVERY {
                let _ = on_progress.send(DownloadProgress { received, total });
                last = Instant::now();
            }
        }
        file.flush().await.map_err(|e| DownloadError::local("unwritable", tr_vars("Can't write the file: {{reason}}", &[("reason", &e.to_string())])))?;
        let _ = on_progress.send(DownloadProgress { received, total: total.max(received) });
        Ok::<(), DownloadError>(())
    }
    .await;
    drop(file);
    // from the Internet, as a browser's download: before the rename, so the file is never
    // where it was asked for without the mark
    let result = result.and_then(|()| {
        quarantine(&part)
            .map_err(|e| DownloadError::local("unwritable", tr_vars("Can't mark the file as downloaded: {{reason}}", &[("reason", &e.to_string())])))
    });
    if let Err(e) = result {
        let _ = tokio::fs::remove_file(&part).await;
        return Err(e);
    }
    tokio::fs::rename(&part, &path).await.map_err(|e| {
        DownloadError::local("unwritable", tr_vars("Can't save {{path}}: {{reason}}", &[("path", &path.display().to_string()), ("reason", &e.to_string())]))
    })?;
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

    #[cfg(target_os = "macos")]
    #[test]
    fn a_download_is_marked_as_from_the_internet() {
        let dir = std::env::temp_dir().join(format!("una-download-test-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let part = part_path(&dir.join("a.pdf"));
        std::fs::write(&part, b"%PDF").unwrap();
        quarantine(&part).unwrap();
        let output = std::process::Command::new("/usr/bin/xattr").args(["-p", "com.apple.quarantine"]).arg(&part).output().unwrap();
        let value = String::from_utf8_lossy(&output.stdout).trim().to_string();
        let _ = std::fs::remove_dir_all(&dir);
        assert!(value.starts_with("0083;") && value.ends_with(";UNA;"), "{value}");
    }

    #[test]
    fn a_download_is_written_beside_where_it_goes() {
        assert_eq!(part_path(Path::new("/Users/me/Downloads/a.pdf")), PathBuf::from("/Users/me/Downloads/a.pdf.download"));
    }
}
