//! Uploads for posts (`POST /api/v2/uploads`), sent from here: the file streams from disk as a
//! multipart body with the access token attached on this side, and progress goes back to the
//! page over a `Channel`.
//!
//! The web view never names a file on disk. A file reaches an upload in one of three ways,
//! each of which gives the page an opaque handle:
//! - picked in a file dialog this side opens (`pick_files`), so the web view needs no dialog
//!   open permission;
//! - dropped on the window: the window's own drop event records the paths here
//!   (`record_drop`), and `stage_dropped` takes only paths dropped in the last minutes;
//! - bytes the page has itself (a pasted image), sent as a raw IPC body (`stage_bytes`).
//!
//! The site decides what it takes (type, size, quota); the dialog offers photos and videos, or
//! any file for the Files module (`any_files`: a drop then takes any file too).

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex, OnceLock};
use std::time::{Duration, Instant};

use futures_util::stream;
use rand::RngCore;
use serde::Serialize;
use tauri::ipc::{Channel, InvokeBody, Request};
use tauri::{AppHandle, State, WebviewWindow};
use tauri_plugin_dialog::DialogExt;
use tokio::io::AsyncReadExt;
use tokio::sync::{oneshot, Semaphore};

use crate::auth::{self, AuthState};
use crate::i18n::{tr, tr_vars};

/// Extensions the file dialog offers. The site's storages decide in the end.
const IMAGE_EXTENSIONS: &[&str] = &["jpg", "jpeg", "jpe", "png", "gif", "webp", "heic", "heif", "avif", "bmp"];
const VIDEO_EXTENSIONS: &[&str] = &["mp4", "m4v", "mov", "webm", "mkv", "avi", "3gp", "mpeg", "mpg", "wmv"];
/// A drop is good for this long: the page asks for the files right after the drop event.
const DROP_LIFETIME: Duration = Duration::from_secs(120);
/// Bytes the page sends itself are held in memory until uploaded: keep that bounded. Larger
/// files go through the dialog or a drop, which stream from disk.
const MAX_STAGED_BYTES: usize = 50 * 1024 * 1024;
const CHUNK: usize = 64 * 1024;
const PROGRESS_EVERY: Duration = Duration::from_millis(100);
const CONNECT_TIMEOUT: Duration = Duration::from_secs(20);
/// No total timeout: a video on a slow line takes as long as it takes. While the body goes out,
/// an upload fails when the connection takes no new bytes for this long (`Watch`).
const STALL_TIMEOUT: Duration = Duration::from_secs(120);
/// Once the whole body is sent, how long the site may take to store the file and answer.
const ANSWER_TIMEOUT: Duration = Duration::from_secs(300);
const WATCH_EVERY: Duration = Duration::from_secs(2);
/// Uploads that send at once; the others wait their turn (they share one uplink).
const PARALLEL_UPLOADS: usize = 3;

enum Source {
    Path(PathBuf),
    Bytes(Arc<Vec<u8>>),
}

struct Staged {
    source: Source,
    name: String,
    size: u64,
    mime: String,
}

/// A file ready to upload, as the page sees it.
#[derive(Clone, Serialize, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct StagedFile {
    handle: String,
    name: String,
    size: u64,
    mime: String,
    /// image or video, from the extension
    kind: &'static str,
}

/// Files of a drop or a pick, and the names of those that are not photos or videos.
#[derive(Serialize, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct Staging {
    files: Vec<StagedFile>,
    refused: Vec<String>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UploadProgress {
    sent: u64,
    total: u64,
}

/// Why an upload failed: the HTTP status (0 when the site was not reached) and the problem's
/// code and message, so the page can say what to do.
#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct UploadError {
    status: u16,
    code: String,
    message: String,
}

impl UploadError {
    fn local(code: &str, message: impl Into<String>) -> Self {
        Self { status: 0, code: code.into(), message: message.into() }
    }
}

pub struct UploadState {
    files: Mutex<HashMap<String, Staged>>,
    dropped: Mutex<Vec<(PathBuf, Instant)>>,
    cancels: Mutex<HashMap<String, oneshot::Sender<()>>>,
    /// One client for every upload (one connection pool), built at the first upload.
    client: OnceLock<reqwest::Client>,
    slots: Arc<Semaphore>,
}

impl Default for UploadState {
    fn default() -> Self {
        Self {
            files: Mutex::default(),
            dropped: Mutex::default(),
            cancels: Mutex::default(),
            client: OnceLock::new(),
            slots: Arc::new(Semaphore::new(PARALLEL_UPLOADS)),
        }
    }
}

/// When an upload last moved: the body's last chunk taken by the connection, or the end of the
/// body. reqwest's read_timeout can't be used for this: it is one timer from the start of the
/// request to the response headers, so it would fail any upload longer than it.
struct Watch {
    last: Instant,
    body_sent: bool,
}

impl Watch {
    fn new() -> Self {
        Self { last: Instant::now(), body_sent: false }
    }

    /// Why the upload should stop now, if it should.
    fn overdue(&self, now: Instant) -> Option<&'static str> {
        let idle = now.saturating_duration_since(self.last);
        if self.body_sent {
            (idle >= ANSWER_TIMEOUT).then_some(NO_ANSWER)
        } else {
            (idle >= STALL_TIMEOUT).then_some(STALLED)
        }
    }
}

/// Why the watchdog stops an upload (`Watch::overdue`): which of the two it is, never shown as
/// they are. The page is told with `stopped_message`.
const NO_ANSWER: &str = "the site did not answer";
const STALLED: &str = "the connection stalled";

/// What the page is told when the watchdog stopped the upload of `name`.
fn stopped_message(name: &str, reason: &str) -> String {
    if reason == NO_ANSWER {
        tr_vars("Could not send {{name}}: the site did not answer", &[("name", name)])
    } else {
        tr_vars("Could not send {{name}}: the connection stalled", &[("name", name)])
    }
}

/// Resolves once the upload stopped moving (see `Watch`).
async fn watchdog(watch: Arc<Mutex<Watch>>) -> &'static str {
    loop {
        tokio::time::sleep(WATCH_EVERY).await;
        let reason = watch.lock().ok().and_then(|w| w.overdue(Instant::now()));
        if let Some(reason) = reason {
            return reason;
        }
    }
}

impl UploadState {
    /// The window's drop event: these paths may be staged for a while.
    pub fn record_drop(&self, paths: &[PathBuf]) {
        if let Ok(mut dropped) = self.dropped.lock() {
            let now = Instant::now();
            dropped.retain(|(_, at)| now.duration_since(*at) < DROP_LIFETIME);
            dropped.extend(paths.iter().map(|p| (p.clone(), now)));
            // a drop of a whole folder's worth is not a post
            let excess = dropped.len().saturating_sub(200);
            dropped.drain(..excess);
        }
    }

    /// Take a dropped path, once: true when it was dropped on the window lately.
    fn take_dropped(&self, path: &Path) -> bool {
        let Ok(mut dropped) = self.dropped.lock() else { return false };
        let now = Instant::now();
        dropped.retain(|(_, at)| now.duration_since(*at) < DROP_LIFETIME);
        match dropped.iter().position(|(p, _)| p == path) {
            Some(i) => {
                dropped.remove(i);
                true
            }
            None => false,
        }
    }

    fn stage(&self, staged: Staged) -> Result<StagedFile, String> {
        let handle = new_handle();
        let file = StagedFile {
            handle: handle.clone(),
            name: staged.name.clone(),
            size: staged.size,
            mime: staged.mime.clone(),
            // image, video, or any other file (staged only where any file is asked for)
            kind: kind_of(&staged.mime).unwrap_or("file"),
        };
        self.files.lock().map_err(|_| "state lock poisoned".to_string())?.insert(handle, staged);
        Ok(file)
    }

    fn stage_path(&self, path: PathBuf, staging: &mut Staging, any_files: bool) {
        let name = path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
        let Some(mime) = mime_of(&name).or_else(|| any_files.then(|| file_mime_of(&name))) else {
            staging.refused.push(name);
            return;
        };
        match std::fs::metadata(&path) {
            Ok(meta) if meta.is_file() => match self.stage(Staged { source: Source::Path(path), name, size: meta.len(), mime: mime.into() }) {
                Ok(file) => staging.files.push(file),
                Err(e) => log::warn!("upload: {e}"),
            },
            _ => staging.refused.push(name),
        }
    }
}

fn new_handle() -> String {
    let mut buf = [0u8; 16];
    rand::thread_rng().fill_bytes(&mut buf);
    buf.iter().map(|b| format!("{b:02x}")).collect()
}

fn extension(name: &str) -> String {
    Path::new(name).extension().map(|e| e.to_string_lossy().to_lowercase()).unwrap_or_default()
}

/// The type of a photo or video by its name, or None for anything else.
fn mime_of(name: &str) -> Option<&'static str> {
    Some(match extension(name).as_str() {
        "jpg" | "jpeg" | "jpe" => "image/jpeg",
        "png" => "image/png",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "heic" => "image/heic",
        "heif" => "image/heif",
        "avif" => "image/avif",
        "bmp" => "image/bmp",
        "mp4" | "m4v" => "video/mp4",
        "mov" => "video/quicktime",
        "webm" => "video/webm",
        "mkv" => "video/x-matroska",
        "avi" => "video/x-msvideo",
        "3gp" => "video/3gpp",
        "mpeg" | "mpg" => "video/mpeg",
        "wmv" => "video/x-ms-wmv",
        _ => return None,
    })
}

/// The type of any other file by its name, for the Files module: the common ones, else
/// application/octet-stream (the site's storage goes by the extension anyway).
fn file_mime_of(name: &str) -> &'static str {
    match extension(name).as_str() {
        "pdf" => "application/pdf",
        "txt" | "log" => "text/plain",
        "md" | "markdown" => "text/markdown",
        "csv" => "text/csv",
        "rtf" => "application/rtf",
        "json" => "application/json",
        "xml" => "application/xml",
        "zip" => "application/zip",
        "gz" | "tgz" => "application/gzip",
        "7z" => "application/x-7z-compressed",
        "rar" => "application/vnd.rar",
        "doc" => "application/msword",
        "docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "xls" => "application/vnd.ms-excel",
        "xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "ppt" => "application/vnd.ms-powerpoint",
        "pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "odt" => "application/vnd.oasis.opendocument.text",
        "ods" => "application/vnd.oasis.opendocument.spreadsheet",
        "odp" => "application/vnd.oasis.opendocument.presentation",
        "epub" => "application/epub+zip",
        "mp3" => "audio/mpeg",
        "m4a" => "audio/mp4",
        "wav" => "audio/wav",
        "ogg" | "oga" => "audio/ogg",
        "flac" => "audio/flac",
        "svg" => "image/svg+xml",
        _ => "application/octet-stream",
    }
}

fn kind_of(mime: &str) -> Option<&'static str> {
    if mime.starts_with("image/") {
        Some("image")
    } else if mime.starts_with("video/") {
        Some("video")
    } else {
        None
    }
}

/// A name the page sent: its last path part only, at most 200 characters.
fn clean_name(raw: &str) -> String {
    let base = raw.rsplit(['/', '\\']).next().unwrap_or("").trim();
    let base: String = base.chars().filter(|c| !c.is_control()).take(200).collect();
    if base.is_empty() || base == "." || base == ".." {
        String::new()
    } else {
        base
    }
}

/// Open the system's file dialog (a sheet on the window) for photos and videos: photos only for
/// a message, videos only for a new video, any file for the Files module.
#[tauri::command]
pub async fn pick_files(
    app: AppHandle,
    window: WebviewWindow,
    state: State<'_, UploadState>,
    photos_only: Option<bool>,
    videos_only: Option<bool>,
    any_files: Option<bool>,
) -> Result<Staging, String> {
    let (tx, rx) = oneshot::channel();
    let any_files = any_files.unwrap_or(false);
    let dialog = app.dialog().file().set_parent(&window);
    let dialog = if any_files {
        dialog.set_title(tr("Add files"))
    } else if photos_only.unwrap_or(false) {
        dialog.set_title(tr("Add photos")).add_filter(tr("Photos"), IMAGE_EXTENSIONS)
    } else if videos_only.unwrap_or(false) {
        dialog.set_title(tr("Add a video")).add_filter(tr("Videos"), VIDEO_EXTENSIONS)
    } else {
        let mut all: Vec<&str> = IMAGE_EXTENSIONS.to_vec();
        all.extend_from_slice(VIDEO_EXTENSIONS);
        dialog
            .set_title(tr("Add photos or videos"))
            .add_filter(tr("Photos and videos"), &all)
            .add_filter(tr("Photos"), IMAGE_EXTENSIONS)
            .add_filter(tr("Videos"), VIDEO_EXTENSIONS)
    };
    dialog.pick_files(move |paths| {
        let _ = tx.send(paths);
    });
    let picked = rx.await.map_err(|_| tr("The file dialog closed"))?;

    let mut staging = Staging::default();
    for file in picked.unwrap_or_default() {
        match file.into_path() {
            Ok(path) => state.stage_path(path, &mut staging, any_files),
            Err(e) => log::warn!("upload: picked a file without a path: {e}"),
        }
    }
    Ok(staging)
}

/// Files dropped on the window: only paths the window's drop event recorded (any file for the
/// Files module, photos and videos otherwise).
#[tauri::command]
pub fn stage_dropped(state: State<'_, UploadState>, paths: Vec<String>, any_files: Option<bool>) -> Result<Staging, String> {
    let any_files = any_files.unwrap_or(false);
    let mut staging = Staging::default();
    for path in paths.into_iter().take(50) {
        let path = PathBuf::from(path);
        if state.take_dropped(&path) {
            state.stage_path(path, &mut staging, any_files);
        } else {
            log::warn!("upload: {} was not dropped on the window", path.display());
        }
    }
    Ok(staging)
}

/// Bytes the page has (a pasted image): the raw IPC body, with the name and type in the
/// `x-file-name` (percent-encoded) and `x-file-type` headers.
#[tauri::command]
pub fn stage_bytes(state: State<'_, UploadState>, request: Request<'_>) -> Result<StagedFile, String> {
    let InvokeBody::Raw(bytes) = request.body() else {
        return Err("Send the file's bytes as the body".into());
    };
    if bytes.is_empty() {
        return Err(tr("The file is empty"));
    }
    if bytes.len() > MAX_STAGED_BYTES {
        return Err(tr("This file is too large to paste. Use Add photos or videos, or drop it on the window"));
    }
    let header = |name: &str| request.headers().get(name).and_then(|v| v.to_str().ok()).unwrap_or("").to_string();
    let decoded = url::form_urlencoded::parse(format!("n={}", header("x-file-name")).as_bytes()).next().map(|(_, v)| v.into_owned()).unwrap_or_default();
    let typed = header("x-file-type").to_lowercase();

    let mut name = clean_name(&decoded);
    let mime = match mime_of(&name) {
        Some(m) => m.to_string(),
        None => {
            // a pasted screenshot has no useful name: name it by its type
            let ext = match typed.as_str() {
                "image/png" => "png",
                "image/jpeg" => "jpg",
                "image/gif" => "gif",
                "image/webp" => "webp",
                "video/mp4" => "mp4",
                "video/quicktime" => "mov",
                "video/webm" => "webm",
                _ => return Err(tr("Only photos and videos can be attached")),
            };
            name = format!("{}.{ext}", if name.is_empty() { "pasted".into() } else { name });
            mime_of(&name).unwrap_or("image/png").to_string()
        }
    };

    state.stage(Staged { source: Source::Bytes(Arc::new(bytes.clone())), size: bytes.len() as u64, name, mime })
}

/// Forget a staged file (taken off the post before it was sent).
#[tauri::command]
pub fn release_file(state: State<'_, UploadState>, handle: String) {
    if let Ok(mut files) = state.files.lock() {
        files.remove(&handle);
    }
    cancel(&state, &handle);
}

/// Stop an upload on its way; its upload_file answers `cancelled`.
#[tauri::command]
pub fn cancel_upload(state: State<'_, UploadState>, handle: String) {
    cancel(&state, &handle);
}

fn cancel(state: &UploadState, handle: &str) {
    if let Some(tx) = state.cancels.lock().ok().and_then(|mut c| c.remove(handle)) {
        let _ = tx.send(());
    }
}

/// What a body reads from: the file on disk, or bytes in memory.
enum Reader {
    File(tokio::fs::File),
    Bytes(Arc<Vec<u8>>, usize),
}

impl Reader {
    async fn next_chunk(&mut self) -> std::io::Result<Option<Vec<u8>>> {
        match self {
            Reader::File(file) => {
                let mut buf = vec![0u8; CHUNK];
                let n = file.read(&mut buf).await?;
                if n == 0 {
                    return Ok(None);
                }
                buf.truncate(n);
                Ok(Some(buf))
            }
            Reader::Bytes(bytes, at) => {
                if *at >= bytes.len() {
                    return Ok(None);
                }
                let end = (*at + CHUNK).min(bytes.len());
                let chunk = bytes[*at..end].to_vec();
                *at = end;
                Ok(Some(chunk))
            }
        }
    }
}

/// What an upload is for (the API's UploadForm.purpose): a post when none is given.
fn check_purpose(purpose: Option<&str>) -> Result<Option<&str>, UploadError> {
    match purpose {
        None | Some("post") => Ok(None),
        Some(p) if !p.is_empty() && p.len() <= 32 && p.bytes().all(|b| b.is_ascii_lowercase() || b == b'_') => Ok(Some(p)),
        Some(_) => Err(UploadError::local("invalid", "Not a purpose an upload can have")),
    }
}

/// Send a staged file to the signed-in site. Answers the site's `Media` for the upload.
/// `purpose` is what takes it (a feed post when none: the API's default; `message` or
/// `conversation` for a message's photo); `inline`, a picture for a text, goes to
/// POST /uploads/inline instead and answers its `InlineImage`.
#[tauri::command]
pub async fn upload_file(
    auth_state: State<'_, AuthState>,
    state: State<'_, UploadState>,
    handle: String,
    purpose: Option<String>,
    site_url: String,
    generation: u64,
    on_progress: Channel<UploadProgress>,
) -> Result<serde_json::Value, UploadError> {
    let purpose = check_purpose(purpose.as_deref())?.map(str::to_string);
    // a picture for a text: its own path, which takes the file alone
    let inline = purpose.as_deref() == Some(INLINE);
    let purpose = if inline { None } else { purpose };
    let (source, name, size, mime) = {
        let files = state.files.lock().map_err(|_| UploadError::local("internal", "state lock poisoned"))?;
        let staged = files.get(&handle).ok_or_else(|| UploadError::local("not_staged", tr("This file is no longer there to send")))?;
        let source = match &staged.source {
            Source::Path(p) => Source::Path(p.clone()),
            Source::Bytes(b) => Source::Bytes(b.clone()),
        };
        (source, staged.name.clone(), staged.size, staged.mime.clone())
    };

    // the page's session only (as access_token): after a switch to another network, a file
    // picked in this one goes nowhere rather than to the other network's site
    let session_over = || UploadError { status: 401, code: "session_over".into(), message: tr("You are signed out of this network: the file was not sent") };
    let auth::SessionToken { site, token, generation } =
        auth::page_token(&auth_state, &site_url, generation).await.map_err(|e| UploadError::local("unreachable", e))?.ok_or_else(session_over)?;

    let reader =
        match source {
            Source::Path(path) => Reader::File(tokio::fs::File::open(&path).await.map_err(|e| {
                UploadError::local("unreadable", tr_vars("Could not read {{name}}: {{reason}}", &[("name", &name), ("reason", &e.to_string())]))
            })?),
            Source::Bytes(bytes) => Reader::Bytes(bytes, 0),
        };

    let _ = on_progress.send(UploadProgress { sent: 0, total: size });
    let progress = on_progress.clone();
    let watch = Arc::new(Mutex::new(Watch::new()));
    let body_watch = watch.clone();
    let body = stream::unfold((reader, 0u64, Instant::now(), false), move |(mut reader, sent, last, done)| {
        let progress = progress.clone();
        let watch = body_watch.clone();
        async move {
            if done {
                return None;
            }
            // the connection asks for the next chunk once it took the last one
            let next = reader.next_chunk().await;
            if let Ok(mut w) = watch.lock() {
                w.last = Instant::now();
                w.body_sent = matches!(next, Ok(None));
            }
            match next {
                Ok(Some(chunk)) => {
                    let sent = sent + chunk.len() as u64;
                    let last = if last.elapsed() >= PROGRESS_EVERY || sent >= size {
                        let _ = progress.send(UploadProgress { sent, total: size });
                        Instant::now()
                    } else {
                        last
                    };
                    Some((Ok::<Vec<u8>, std::io::Error>(chunk), (reader, sent, last, false)))
                }
                Ok(None) => None,
                Err(e) => Some((Err(e), (reader, sent, last, true))),
            }
        }
    });

    let part = reqwest::multipart::Part::stream_with_length(reqwest::Body::wrap_stream(body), size)
        .file_name(name.clone())
        .mime_str(&mime)
        .map_err(|e| UploadError::local("internal", e.to_string()))?;
    let mut form = reqwest::multipart::Form::new();
    if let Some(purpose) = purpose {
        form = form.text("purpose", purpose);
    }
    let form = form.part("file", part);

    let client = match state.client.get() {
        Some(client) => client.clone(),
        None => {
            let built = reqwest::Client::builder().connect_timeout(CONNECT_TIMEOUT).build().map_err(|e| UploadError::local("internal", e.to_string()))?;
            state.client.get_or_init(|| built).clone()
        }
    };

    let (cancel_tx, mut cancel_rx) = oneshot::channel();
    if let Ok(mut cancels) = state.cancels.lock() {
        cancels.insert(handle.clone(), cancel_tx);
    }
    // wait for a free slot (stoppable), then send, until the answer, a stall or a stop
    let slots = state.slots.clone();
    let result = tokio::select! {
        permit = slots.acquire_owned() => match permit {
            Err(_) => Err(UploadError::local("internal", "upload slots closed")),
            // waited for a slot: still the page's session (its token is of that site anyway)
            Ok(_) if auth_state.generation() != generation => Err(session_over()),
            Ok(_permit) => {
                if let Ok(mut w) = watch.lock() {
                    *w = Watch::new();
                }
                let send = client
                    .post(if inline { inline_uploads_url(&site) } else { uploads_url(&site) })
                    .bearer_auth(&token)
                    .header(reqwest::header::ACCEPT, "application/json")
                    .multipart(form)
                    .send();
                tokio::select! {
                    r = send => r.map_err(|e| UploadError::local("unreachable", tr_vars("Could not send {{name}}: {{reason}}", &[("name", &name), ("reason", &e.to_string())]))),
                    reason = watchdog(watch.clone()) => Err(UploadError::local("unreachable", stopped_message(&name, reason))),
                    _ = &mut cancel_rx => Err(UploadError::local("cancelled", tr("The upload was stopped"))),
                }
            }
        },
        _ = &mut cancel_rx => Err(UploadError::local("cancelled", tr("The upload was stopped"))),
    };
    if let Ok(mut cancels) = state.cancels.lock() {
        cancels.remove(&handle);
    }

    let response = result?;
    let status = response.status();
    let text = response.text().await.unwrap_or_default();
    let json: serde_json::Value = serde_json::from_str(&text).unwrap_or(serde_json::Value::Null);
    if !status.is_success() {
        return Err(problem(status.as_u16(), &json));
    }

    // sent: the page has the Media now, and the file is not sent twice
    if let Ok(mut files) = state.files.lock() {
        files.remove(&handle);
    }
    Ok(json)
}

fn uploads_url(site: &str) -> String {
    format!("{}/api/v2/uploads", site.trim_end_matches('/'))
}

/// The purpose of a picture for a text (POST /uploads/inline).
const INLINE: &str = "inline";

fn inline_uploads_url(site: &str) -> String {
    format!("{}/api/v2/uploads/inline", site.trim_end_matches('/'))
}

/// An API problem document as an UploadError.
fn problem(status: u16, json: &serde_json::Value) -> UploadError {
    let field = |k: &str| json.get(k).and_then(|v| v.as_str()).map(str::to_string);
    let message = field("detail")
        .or_else(|| json.get("errors").and_then(|e| e.get(0)).and_then(|e| e.get("message")).and_then(|m| m.as_str()).map(str::to_string))
        .or_else(|| field("title"))
        .unwrap_or_else(|| tr_vars("The site answered {{status}}", &[("status", &status.to_string())]));
    UploadError { status, code: field("code").unwrap_or_else(|| "http_error".into()), message }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn purposes_are_plain_words() {
        assert_eq!(check_purpose(None).unwrap(), None);
        assert_eq!(check_purpose(Some("post")).unwrap(), None, "the API's default is not sent");
        assert_eq!(check_purpose(Some("message")).unwrap(), Some("message"));
        assert_eq!(check_purpose(Some("conversation")).unwrap(), Some("conversation"));
        assert_eq!(check_purpose(Some("profile")).unwrap(), Some("profile"), "a profile's picture or cover");
        for bad in ["", "Message", "a b", "x\r\nContent-Type: text/html", &"a".repeat(33)] {
            assert!(check_purpose(Some(bad)).is_err(), "{bad:?}");
        }
    }

    #[test]
    fn types_come_from_the_extension() {
        assert_eq!(mime_of("IMG_1.JPG"), Some("image/jpeg"));
        assert_eq!(mime_of("clip.mov"), Some("video/quicktime"));
        assert_eq!(mime_of("notes.txt"), None);
        assert_eq!(mime_of("noext"), None);
        assert_eq!(kind_of("video/mp4"), Some("video"));
        assert_eq!(kind_of("application/pdf"), None);
    }

    #[test]
    fn any_file_is_staged_only_where_files_are_asked_for() {
        let dir = std::env::temp_dir().join(format!("una-upload-test-{}", new_handle()));
        std::fs::create_dir_all(&dir).unwrap();
        let pdf = dir.join("Agenda.pdf");
        let odd = dir.join("notes.xyz");
        std::fs::write(&pdf, b"%PDF-1.4").unwrap();
        std::fs::write(&odd, b"x").unwrap();
        let state = UploadState::default();
        let mut photos = Staging::default();
        state.stage_path(pdf.clone(), &mut photos, false);
        assert_eq!((photos.files.len(), photos.refused.clone()), (0, vec!["Agenda.pdf".to_string()]));
        let mut files = Staging::default();
        state.stage_path(pdf, &mut files, true);
        state.stage_path(odd, &mut files, true);
        assert_eq!(
            files.files.iter().map(|f| (f.mime.as_str(), f.kind)).collect::<Vec<_>>(),
            [("application/pdf", "file"), ("application/octet-stream", "file")]
        );
        std::fs::remove_dir_all(&dir).unwrap();
        assert_eq!(file_mime_of("Budget.XLSX"), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        assert_eq!(file_mime_of("song.mp3"), "audio/mpeg");
    }

    #[test]
    fn names_from_the_page_lose_their_folders() {
        assert_eq!(clean_name("../../etc/passwd"), "passwd");
        assert_eq!(clean_name("C:\\Users\\me\\a.png"), "a.png");
        assert_eq!(clean_name(".."), "");
        assert_eq!(clean_name("a\u{0}b.png"), "ab.png");
    }

    #[test]
    fn only_paths_dropped_on_the_window_are_taken_once() {
        let state = UploadState::default();
        let dropped = PathBuf::from("/tmp/dropped.png");
        state.record_drop(std::slice::from_ref(&dropped));
        assert!(!state.take_dropped(Path::new("/etc/hosts")));
        assert!(state.take_dropped(&dropped));
        assert!(!state.take_dropped(&dropped), "a drop is good for one upload");
    }

    #[test]
    fn staged_files_have_unique_handles() {
        let state = UploadState::default();
        let a = state.stage(Staged { source: Source::Bytes(Arc::new(vec![1])), name: "a.png".into(), size: 1, mime: "image/png".into() }).unwrap();
        let b = state.stage(Staged { source: Source::Bytes(Arc::new(vec![1])), name: "b.mp4".into(), size: 1, mime: "video/mp4".into() }).unwrap();
        assert_ne!(a.handle, b.handle);
        assert_eq!(a.handle.len(), 32);
        assert_eq!(b.kind, "video");
    }

    #[test]
    fn problems_carry_the_sites_words() {
        let e = problem(413, &serde_json::json!({ "code": "file_too_big", "detail": "Too big" }));
        assert_eq!((e.status, e.code.as_str(), e.message.as_str()), (413, "file_too_big", "Too big"));
        let e = problem(422, &serde_json::json!({ "code": "validation_failed", "errors": [{ "message": "Send the file" }] }));
        assert_eq!(e.message, "Send the file");
        let e = problem(502, &serde_json::Value::Null);
        assert_eq!((e.code.as_str(), e.message.as_str()), ("http_error", "The site answered 502"));
        assert_eq!(uploads_url("https://example.com/"), "https://example.com/api/v2/uploads");
        assert_eq!(inline_uploads_url("https://example.com/"), "https://example.com/api/v2/uploads/inline");
        assert_eq!(check_purpose(Some(INLINE)).unwrap(), Some(INLINE), "a picture for a text");
    }

    #[test]
    fn a_slow_upload_is_not_a_stalled_one() {
        let start = Instant::now();
        let mut w = Watch { last: start, body_sent: false };
        // the body keeps moving: never overdue, however long the upload takes
        assert_eq!(w.overdue(start + STALL_TIMEOUT - Duration::from_secs(1)), None);
        w.last = start + Duration::from_secs(600);
        assert_eq!(w.overdue(start + Duration::from_secs(700)), None);
        // no new bytes taken for the stall time
        assert_eq!(w.overdue(start + Duration::from_secs(600) + STALL_TIMEOUT), Some("the connection stalled"));
        // the body is out: the site gets its own time to answer
        w.body_sent = true;
        assert_eq!(w.overdue(start + Duration::from_secs(600) + STALL_TIMEOUT), None);
        assert_eq!(w.overdue(start + Duration::from_secs(600) + ANSWER_TIMEOUT), Some("the site did not answer"));
    }

    #[tokio::test]
    async fn bytes_are_read_in_chunks() {
        let mut reader = Reader::Bytes(Arc::new(vec![7u8; CHUNK + 10]), 0);
        assert_eq!(reader.next_chunk().await.unwrap().unwrap().len(), CHUNK);
        assert_eq!(reader.next_chunk().await.unwrap().unwrap().len(), 10);
        assert!(reader.next_chunk().await.unwrap().is_none());
    }
}
