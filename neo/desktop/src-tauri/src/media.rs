//! `una-media`: pictures of a local development site, which a bundled page can't load itself.
//!
//! The bundled page is `tauri://localhost` (macOS), a secure context, and WebKit blocks every
//! plain-http picture there as mixed content, local hosts included (checked on the 2026-11-06
//! build: no request reached `desktop.localhost:8090`). So `mediaSrc` (src/lib/media.ts) sends
//! a local http picture of the signed-in site through this scheme instead:
//! `una-media://localhost/?u=<the picture's URL>` (`http://una-media.localhost/?u=…` on Windows).
//!
//! Rust fetches it only when it is on the signed-in site's own origin, that site is a local
//! development host (`auth::is_local_host`, the hosts that may sign in over http), and the
//! asking web view is one of the app's (the main window or a window of its own); redirects stay
//! on that origin; only images and videos come back, up to `MAX_BYTES`. No token is sent: the
//! site's picture links carry their own signature. https pictures never come here.
//!
//! Answers: 403 for a request that may not be fetched, 404 and 415 for one that is not a
//! picture there (lasting), 503 for what may pass (no session read yet, a switch under way, a
//! timeout, the site failing), which the page tries once more before showing the fallback. A
//! Range request (video) is passed on and its 206 passed back. Answers carry a Cache-Control,
//! so WebKit's memory cache serves a picture again when a list mounts again.

use std::sync::OnceLock;
use std::time::Duration;

use tokio::sync::Semaphore;

use tauri::http::{header, Request, Response, StatusCode};
use tauri::{Manager, Runtime, UriSchemeContext, UriSchemeResponder};
use url::Url;

use crate::auth::{is_local_host, AuthState};

pub const SCHEME: &str = "una-media";
const MAX_BYTES: usize = 25 * 1024 * 1024;
const TIMEOUT: Duration = Duration::from_secs(20);
const MAX_REDIRECTS: usize = 5;
/// Pictures fetched at once; the rest wait (each may hold up to `MAX_BYTES`).
const PARALLEL: usize = 6;
/// When the site sends none: the page's memory cache keeps it for the run's use.
const DEFAULT_CACHE: &str = "private, max-age=3600";

/// The picture a `una-media` request names, when the signed-in site may hand it out: plain
/// http, on `site_url`'s origin, a local host, with no user info.
#[cfg(test)]
pub(crate) fn media_target(request_uri: &str, site_url: Option<&str>) -> Option<Url> {
    media_target_of(request_uri, &[site_url])
}

/// media_target for any of these sites: the signed-in one and the one previewed on the sign-in
/// screen (a network being added shows its mark before it is signed in to).
pub(crate) fn media_target_of(request_uri: &str, sites: &[Option<&str>]) -> Option<Url> {
    let request = Url::parse(request_uri).ok()?;
    let target = request.query_pairs().find(|(k, _)| k == "u").map(|(_, v)| v.into_owned())?;
    let target = Url::parse(&target).ok()?;
    if target.scheme() != "http" || !is_local_host(&target) || !target.username().is_empty() || target.password().is_some() {
        return None;
    }
    let on = |site: &Option<&str>| site.and_then(|s| Url::parse(s).ok()).is_some_and(|site| site.origin() == target.origin());
    sites.iter().any(on).then_some(target)
}

/// Web views that may ask: the main window and the windows of their own (windows.rs).
fn is_app_webview(label: &str) -> bool {
    label == "main" || label.starts_with(crate::windows::LABEL_PREFIX)
}

/// Whether a redirect is followed: only on the origin of the first request (the image
/// transcoder's 302 to the file), and only `MAX_REDIRECTS` times. Never to another port or
/// local host (a local site must not reach another service on the machine through this).
pub(crate) fn follow_redirect(first: &Url, next: &Url, hops: usize) -> bool {
    hops <= MAX_REDIRECTS && first.origin() == next.origin()
}

fn slots() -> &'static Semaphore {
    static SLOTS: OnceLock<Semaphore> = OnceLock::new();
    SLOTS.get_or_init(|| Semaphore::new(PARALLEL))
}

fn client() -> Option<&'static reqwest::Client> {
    static CLIENT: OnceLock<Option<reqwest::Client>> = OnceLock::new();
    CLIENT
        .get_or_init(|| {
            reqwest::Client::builder()
                .timeout(TIMEOUT)
                // the image transcoder answers with a redirect to the file: on the same origin only
                .redirect(reqwest::redirect::Policy::custom(|attempt| {
                    let follow = attempt.previous().first().is_some_and(|first| follow_redirect(first, attempt.url(), attempt.previous().len()));
                    if follow {
                        attempt.follow()
                    } else {
                        attempt.stop()
                    }
                }))
                .build()
                .map_err(|e| log::error!("media: {e}"))
                .ok()
        })
        .as_ref()
}

fn empty(status: StatusCode) -> Response<Vec<u8>> {
    let mut response = Response::new(Vec::new());
    *response.status_mut() = status;
    // a refusal or a failure is never kept: the page's second try must reach Rust again
    response.headers_mut().insert(header::CACHE_CONTROL, header::HeaderValue::from_static("no-store"));
    response
}

/// Only pictures and videos are handed to the page.
pub(crate) fn is_media_type(content_type: &str) -> bool {
    let essence = content_type.split(';').next().unwrap_or("").trim().to_ascii_lowercase();
    (essence.starts_with("image/") && essence != "image/svg+xml") || essence.starts_with("video/")
}

/// What an upstream status gives the page: lasting (404) or worth another try (503).
pub(crate) fn failure_status(upstream: StatusCode) -> StatusCode {
    if upstream.is_server_error() || upstream == StatusCode::TOO_MANY_REQUESTS || upstream == StatusCode::REQUEST_TIMEOUT {
        StatusCode::SERVICE_UNAVAILABLE
    } else {
        StatusCode::NOT_FOUND
    }
}

async fn fetch(target: Url, range: Option<header::HeaderValue>) -> Result<Response<Vec<u8>>, StatusCode> {
    let client = client().ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;
    let _slot = slots().acquire().await.map_err(|_| StatusCode::SERVICE_UNAVAILABLE)?;
    let mut request = client.get(target);
    if let Some(range) = range {
        request = request.header(header::RANGE, range);
    }
    let mut upstream = request.send().await.map_err(|e| {
        log::warn!("media: {e}");
        // a timeout or a refused connection may pass
        StatusCode::SERVICE_UNAVAILABLE
    })?;
    let status = upstream.status();
    if !status.is_success() {
        return Err(failure_status(status));
    }
    let content_type = upstream.headers().get(header::CONTENT_TYPE).and_then(|v| v.to_str().ok()).unwrap_or("").to_string();
    if !is_media_type(&content_type) {
        return Err(StatusCode::UNSUPPORTED_MEDIA_TYPE);
    }
    if upstream.content_length().is_some_and(|n| n as usize > MAX_BYTES) {
        return Err(StatusCode::PAYLOAD_TOO_LARGE);
    }
    let passed: Vec<_> = [header::CACHE_CONTROL, header::CONTENT_RANGE, header::ACCEPT_RANGES, header::ETAG, header::LAST_MODIFIED]
        .into_iter()
        .filter_map(|name| upstream.headers().get(&name).cloned().map(|v| (name, v)))
        .collect();
    let mut body = Vec::new();
    while let Some(chunk) = upstream.chunk().await.map_err(|_| StatusCode::SERVICE_UNAVAILABLE)? {
        if body.len() + chunk.len() > MAX_BYTES {
            return Err(StatusCode::PAYLOAD_TOO_LARGE);
        }
        body.extend_from_slice(&chunk);
    }
    let mut response = Response::new(body);
    // 200, or 206 for a range
    *response.status_mut() = if status == StatusCode::PARTIAL_CONTENT { status } else { StatusCode::OK };
    let headers = response.headers_mut();
    headers.insert(header::CONTENT_TYPE, content_type.parse().map_err(|_| StatusCode::BAD_GATEWAY)?);
    for (name, value) in passed {
        headers.insert(name, value);
    }
    if !headers.contains_key(header::CACHE_CONTROL) {
        headers.insert(header::CACHE_CONTROL, header::HeaderValue::from_static(DEFAULT_CACHE));
    }
    Ok(response)
}

/// The scheme's handler (lib.rs): answers on a task of its own, never on the main thread.
pub fn handle<R: Runtime>(ctx: UriSchemeContext<'_, R>, request: Request<Vec<u8>>, responder: UriSchemeResponder) {
    if !is_app_webview(ctx.webview_label()) {
        responder.respond(empty(StatusCode::FORBIDDEN));
        return;
    }
    let app = ctx.app_handle().clone();
    let uri = request.uri().to_string();
    let range = request.headers().get(header::RANGE).cloned();
    tauri::async_runtime::spawn(async move {
        // the signed-in site, once the keychain was read (never starts the read itself), and
        // the one looked up on the sign-in screen: GET of a picture, no token, either way
        let auth = app.state::<AuthState>();
        let site = auth.site_url();
        let previewed = auth.previewed_site();
        let response = match (media_target_of(&uri, &[site.as_deref(), previewed.as_deref()]), site) {
            (Some(target), _) => fetch(target, range).await.unwrap_or_else(empty),
            // not read yet, or between two sessions: the page tries again
            (None, None) => empty(StatusCode::SERVICE_UNAVAILABLE),
            (None, Some(_)) => empty(StatusCode::FORBIDDEN),
        };
        responder.respond(response);
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    const SITE: &str = "http://desktop.localhost:8090";

    fn ask(u: &str) -> String {
        format!("una-media://localhost/?u={}", url::form_urlencoded::byte_serialize(u.as_bytes()).collect::<String>())
    }

    #[test]
    fn a_network_being_added_shows_its_mark_and_no_other_site_does() {
        let mark = "http://network2.localhost:8092/s/sys_images_custom/m.png";
        // signed in to one network, looking up another: the other's pictures pass too
        assert!(media_target_of(&ask(mark), &[Some(SITE), Some("http://network2.localhost:8092")]).is_some());
        // the first network being added: nothing signed in yet
        assert!(media_target_of(&ask(mark), &[None, Some("http://network2.localhost:8092")]).is_some());
        // a site neither signed in to nor looked up, another port of it, another scheme
        assert!(media_target_of(&ask(mark), &[Some(SITE), None]).is_none());
        assert!(media_target_of(&ask("http://network2.localhost:9999/m.png"), &[Some(SITE), Some("http://network2.localhost:8092")]).is_none());
        assert!(media_target_of(&ask("http://example.com/m.png"), &[Some(SITE), Some("http://example.com")]).is_none(), "not a local host");
    }

    #[test]
    fn only_the_signed_in_local_site_is_fetched() {
        let pic = "http://desktop.localhost:8090/image_transcoder.php?o=bx_persons_avatar&h=46&s=abc";
        assert_eq!(media_target(&ask(pic), Some(SITE)).map(|u| u.to_string()).as_deref(), Some(pic));
        // the Windows form of the same request
        let windows = ask(pic).replace("una-media://localhost/", "http://una-media.localhost/");
        assert!(media_target(&windows, Some(SITE)).is_some());

        assert!(media_target(&ask(pic), None).is_none(), "signed out, or the keychain not read yet");
        assert!(media_target(&ask("http://desktop.localhost:8091/a.jpg"), Some(SITE)).is_none(), "another port");
        assert!(media_target(&ask("http://other.localhost:8090/a.jpg"), Some(SITE)).is_none(), "another local host");
        assert!(media_target(&ask("http://127.0.0.1:8088/a.jpg"), Some(SITE)).is_none(), "a local service that is not the site");
        assert!(media_target(&ask("https://desktop.localhost:8090/a.jpg"), Some(SITE)).is_none(), "https goes direct");
        assert!(media_target(&ask("http://community.example/a.jpg"), Some("http://community.example")).is_none(), "not a local site");
        assert!(media_target(&ask("http://u:p@desktop.localhost:8090/a.jpg"), Some(SITE)).is_none(), "user info");
        assert!(media_target(&ask("file:///etc/passwd"), Some(SITE)).is_none());
        assert!(media_target("una-media://localhost/", Some(SITE)).is_none(), "no picture named");
        assert!(media_target("not a url", Some(SITE)).is_none());
    }

    #[test]
    fn only_pictures_and_videos_go_back() {
        assert!(is_media_type("image/jpeg"));
        assert!(is_media_type("image/png; charset=binary"));
        assert!(is_media_type("video/mp4"));
        assert!(!is_media_type("image/svg+xml"), "an SVG can carry script");
        assert!(!is_media_type("text/html"));
        assert!(!is_media_type(""));
    }

    #[test]
    fn redirects_stay_on_the_first_origin() {
        let first = Url::parse("http://desktop.localhost:8090/image_transcoder.php?o=a").unwrap();
        let file = Url::parse("http://desktop.localhost:8090/storage/a.jpg").unwrap();
        assert!(follow_redirect(&first, &file, 1), "the transcoder's 302 to the file");
        assert!(!follow_redirect(&first, &Url::parse("http://desktop.localhost:5432/").unwrap(), 1), "another port");
        assert!(!follow_redirect(&first, &Url::parse("http://other.localhost:8090/a.jpg").unwrap(), 1), "another local host");
        assert!(!follow_redirect(&first, &Url::parse("http://127.0.0.1:8090/a.jpg").unwrap(), 1), "the same port on another name");
        assert!(!follow_redirect(&first, &Url::parse("https://desktop.localhost:8090/a.jpg").unwrap(), 1), "http to https");
        assert!(follow_redirect(&first, &file, MAX_REDIRECTS));
        assert!(!follow_redirect(&first, &file, MAX_REDIRECTS + 1), "too many hops");
    }

    #[test]
    fn failures_say_whether_to_try_again() {
        assert_eq!(failure_status(StatusCode::NOT_FOUND), StatusCode::NOT_FOUND);
        assert_eq!(failure_status(StatusCode::FORBIDDEN), StatusCode::NOT_FOUND);
        assert_eq!(failure_status(StatusCode::BAD_GATEWAY), StatusCode::SERVICE_UNAVAILABLE);
        assert_eq!(failure_status(StatusCode::SERVICE_UNAVAILABLE), StatusCode::SERVICE_UNAVAILABLE);
        assert_eq!(failure_status(StatusCode::TOO_MANY_REQUESTS), StatusCode::SERVICE_UNAVAILABLE);
    }

    #[test]
    fn only_the_apps_own_web_views_may_ask() {
        assert!(is_app_webview("main"));
        assert!(is_app_webview("win-0123456789abcdef"));
        assert!(!is_app_webview("settings-preview"));
    }
}
