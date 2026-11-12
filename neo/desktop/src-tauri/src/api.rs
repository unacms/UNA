//! The page's requests to the site's API, sent from here with the session's token on them.
//!
//! The page never holds a token. It names the session it means (the site and which sign-in, as
//! `get_session` gave them) and the request; this module checks that the address is that site's
//! API (`{site}/api/v2` and below, nothing else of the site and no other host), attaches a
//! current token of that session, and gives back the status and headers, then the body in
//! pieces as they arrive (an agent's reply streams). A session that is over gets no request at
//! all. A 401 renews the session here (auth.rs `refused`) before the page hears of it.
//!
//! A site that says its API is turned off (503 `api_v2_disabled` or `api_disabled`,
//! availability.rs) is remembered: until it answers again the page's requests get that problem
//! from here and are not sent, but one every half minute. The session is kept as it is.
//!
//! What a page can and cannot do with it: it chooses the method, the path under the API, a few
//! headers (`REQUEST_HEADERS`) and the body. It cannot set `Authorization` or `Cookie`, reach
//! another origin or another path of the site, or follow a redirect out of the API: a redirect
//! is followed only to an address that passes the same check, so the token never leaves.

use std::collections::HashMap;
use std::sync::Mutex;

use futures_util::future::{AbortHandle, Abortable};
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use tauri::ipc::{Channel, InvokeResponseBody};
use tauri::{AppHandle, Manager, Runtime, State};

use crate::auth::{self, AuthState};
use crate::availability::{self, MAX_PROBLEM};
use crate::i18n::tr_vars;

/// Request headers a page may set. Everything else is dropped: the token is this module's to
/// attach, and there are no cookies.
const REQUEST_HEADERS: &[&str] = &[
    "accept",
    "accept-language",
    "content-type",
    "if-match",
    "if-none-match",
    "if-modified-since",
    "cache-control",
    "prefer",
    "idempotency-key",
    "last-event-id",
];

/// Response headers a page does not get.
const HIDDEN_RESPONSE_HEADERS: &[&str] = &["set-cookie", "set-cookie2"];

/// A request body is JSON or a small form: files go through upload.rs.
const MAX_BODY: usize = 16 * 1024 * 1024;

const MAX_REDIRECTS: usize = 5;
const CONNECT_TIMEOUT: std::time::Duration = std::time::Duration::from_secs(15);

/// The first byte of each message on the body channel.
const BODY_DATA: u8 = 0;
const BODY_END: u8 = 1;
const BODY_FAILED: u8 = 2;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiRequest {
    /// The page's name for this request, to stop it by (`api_abort`).
    id: String,
    site_url: String,
    generation: u64,
    method: String,
    url: String,
    #[serde(default)]
    headers: Vec<(String, String)>,
    #[serde(default)]
    body: Option<Vec<u8>>,
}

#[derive(Serialize, Debug, PartialEq)]
pub struct ApiHead {
    status: u16,
    headers: Vec<(String, String)>,
}

/// Why no answer came. `code`: `session_over` (the session the page named is no longer the
/// one signed in), `invalid_request`, `unreachable`, `cancelled`.
#[derive(Serialize, Debug, PartialEq)]
pub struct ApiFailure {
    status: u16,
    code: String,
    message: String,
}

impl ApiFailure {
    fn new(code: &str, message: impl Into<String>) -> Self {
        Self { status: 0, code: code.into(), message: message.into() }
    }

    fn invalid(message: impl Into<String>) -> Self {
        Self::new("invalid_request", message)
    }
}

#[derive(Default)]
pub struct ApiCalls {
    /// One client per site (one connection pool each), with that site's redirect rule.
    clients: Mutex<HashMap<String, reqwest::Client>>,
    /// The requests under way, by the page's id.
    running: Mutex<HashMap<String, AbortHandle>>,
}

impl ApiCalls {
    fn client(&self, site: &str) -> Result<reqwest::Client, ApiFailure> {
        let mut clients = self.clients.lock().unwrap_or_else(|e| e.into_inner());
        if let Some(client) = clients.get(site) {
            return Ok(client.clone());
        }
        let of = site.to_string();
        let client = reqwest::Client::builder()
            .connect_timeout(CONNECT_TIMEOUT)
            .redirect(reqwest::redirect::Policy::custom(move |attempt| {
                if redirect_allowed(attempt.url().as_str(), &of, attempt.previous().len()) {
                    attempt.follow()
                } else {
                    // the page gets the redirect itself, as an answer it cannot follow
                    attempt.stop()
                }
            }))
            .build()
            .map_err(|e| ApiFailure::new("internal", e.to_string()))?;
        clients.insert(site.to_string(), client.clone());
        Ok(client)
    }

    fn start(&self, id: &str, handle: AbortHandle) {
        self.running.lock().unwrap_or_else(|e| e.into_inner()).insert(id.to_string(), handle);
    }

    fn finish(&self, id: &str) {
        self.running.lock().unwrap_or_else(|e| e.into_inner()).remove(id);
    }

    fn abort(&self, id: &str) {
        if let Some(handle) = self.running.lock().unwrap_or_else(|e| e.into_inner()).remove(id) {
            handle.abort();
        }
    }
}

/// The address as a URL when it is the site's API: the site's scheme, host and port, no user or
/// password, and the path `{site path}/api/v2` or below it. `Url::parse` resolves `..` and its
/// percent-encoded forms first, so a path cannot climb out.
pub(crate) fn api_url(url: &str, site: &str) -> Option<url::Url> {
    let url = url::Url::parse(url).ok()?;
    let site = url::Url::parse(site).ok()?;
    if !matches!(url.scheme(), "http" | "https") || !url.username().is_empty() || url.password().is_some() {
        return None;
    }
    if url.scheme() != site.scheme()
        || url.host_str().is_none()
        || url.host_str() != site.host_str()
        || url.port_or_known_default() != site.port_or_known_default()
    {
        return None;
    }
    let base = format!("{}/api/v2", site.path().trim_end_matches('/'));
    let path = url.path();
    (path == base || path.strip_prefix(&base).is_some_and(|rest| rest.starts_with('/'))).then_some(url)
}

/// Whether a redirect is followed: only to the site's API again (reqwest keeps the token on a
/// redirect to the same host and port), and a few times at most.
pub(crate) fn redirect_allowed(next: &str, site: &str, hops: usize) -> bool {
    hops < MAX_REDIRECTS && api_url(next, site).is_some()
}

pub(crate) fn method_of(method: &str) -> Option<reqwest::Method> {
    match method.to_ascii_uppercase().as_str() {
        "GET" => Some(reqwest::Method::GET),
        "HEAD" => Some(reqwest::Method::HEAD),
        "POST" => Some(reqwest::Method::POST),
        "PUT" => Some(reqwest::Method::PUT),
        "PATCH" => Some(reqwest::Method::PATCH),
        "DELETE" => Some(reqwest::Method::DELETE),
        _ => None,
    }
}

/// The page's headers that go out: the allowed names, with values a header can carry.
pub(crate) fn request_headers(headers: &[(String, String)]) -> Vec<(String, String)> {
    headers
        .iter()
        .map(|(name, value)| (name.to_ascii_lowercase(), value))
        .filter(|(name, value)| REQUEST_HEADERS.contains(&name.as_str()) && reqwest::header::HeaderValue::from_str(value).is_ok())
        .map(|(name, value)| (name, value.clone()))
        .collect()
}

/// The answer's headers as the page gets them.
fn response_headers(headers: &reqwest::header::HeaderMap) -> Vec<(String, String)> {
    headers
        .iter()
        .filter(|(name, _)| !HIDDEN_RESPONSE_HEADERS.contains(&name.as_str()))
        .filter_map(|(name, value)| Some((name.as_str().to_string(), value.to_str().ok()?.to_string())))
        .collect()
}

fn body_message(kind: u8, bytes: &[u8]) -> InvokeResponseBody {
    let mut message = Vec::with_capacity(bytes.len() + 1);
    message.push(kind);
    message.extend_from_slice(bytes);
    InvokeResponseBody::Raw(message)
}

/// The answer to a request that is not sent, because the site said its API is turned off: the
/// 503 and the problem the site itself would give.
fn off_answer(code: &str, on_body: &Channel<InvokeResponseBody>) -> ApiHead {
    let _ = on_body.send(body_message(BODY_DATA, &availability::problem_body(code)));
    let _ = on_body.send(body_message(BODY_END, &[]));
    ApiHead { status: 503, headers: vec![("content-type".into(), "application/problem+json".into())] }
}

/// Whether the session a request names is the one signed in (read without the keychain or the
/// site: `page_token` is what decides, this only says when it would).
fn names_the_session(auth_state: &AuthState, request: &ApiRequest) -> bool {
    auth_state.generation() == request.generation
        && auth_state.site_url().is_some_and(|site| site.trim_end_matches('/') == request.site_url.trim_end_matches('/'))
}

/// Send a request of the page to the site's API with its session's token, and answer the status
/// and headers. The body follows on `on_body`: messages of raw bytes whose first byte says what
/// the rest is (`BODY_DATA`, then one `BODY_END`, or `BODY_FAILED` with the reason as text).
#[tauri::command]
pub async fn api_request<R: Runtime>(
    app: AppHandle<R>,
    auth_state: State<'_, AuthState>,
    calls: State<'_, ApiCalls>,
    request: ApiRequest,
    on_body: Channel<InvokeResponseBody>,
) -> Result<ApiHead, ApiFailure> {
    let method = method_of(&request.method).ok_or_else(|| ApiFailure::invalid("Not a method the API takes"))?;
    if request.id.is_empty() || request.id.len() > 64 {
        return Err(ApiFailure::invalid("A request needs an id of 1 to 64 characters"));
    }
    if request.body.as_ref().is_some_and(|b| b.len() > MAX_BODY) {
        return Err(ApiFailure::invalid("The request is too big"));
    }
    // the site said its API is turned off and was asked lately: its answer again, nothing sent
    // (a session that is over still hears that it is, below)
    if names_the_session(&auth_state, &request) {
        if let Some(code) = auth_state.availability.held_back(&request.site_url) {
            return Ok(off_answer(code, &on_body));
        }
    }
    let auth::SessionToken { site, token, .. } = match auth::page_token(&auth_state, &request.site_url, request.generation).await {
        // the page says this in its own words (lib/api.ts SessionOverError)
        Ok(token) => token.ok_or_else(|| ApiFailure::new("session_over", "The session is over"))?,
        Err(e) => {
            // the token could not be renewed because the API is off: that, not "unreachable"
            return match auth_state.availability.code(&request.site_url) {
                Some(code) => Ok(off_answer(code, &on_body)),
                None => Err(ApiFailure::new("unreachable", e)),
            };
        }
    };
    let url = api_url(&request.url, &site).ok_or_else(|| ApiFailure::invalid("Not an address of the network's API"))?;

    let mut builder = calls.client(&site)?.request(method, url).bearer_auth(&token);
    for (name, value) in request_headers(&request.headers) {
        builder = builder.header(name, value);
    }
    if let Some(body) = request.body {
        builder = builder.body(body);
    }

    // one handle stops the request while it waits for the answer and while its body arrives
    let (handle, registration) = AbortHandle::new_pair();
    calls.start(&request.id, handle.clone());
    let cancelled = || ApiFailure::new("cancelled", "The request was stopped");
    let response = match Abortable::new(builder.send(), registration).await {
        Ok(Ok(response)) => response,
        Ok(Err(e)) => {
            calls.finish(&request.id);
            return Err(ApiFailure::new("unreachable", tr_vars("Could not reach the network: {{reason}}", &[("reason", &e.to_string())])));
        }
        Err(_) => return Err(cancelled()),
    };
    let status = response.status().as_u16();
    if status == 401 {
        // renewed here, with the token that was refused: the page only hears that it was
        if let Err(e) = auth::refused(&app, &auth_state, &site, request.generation, &token).await {
            log::warn!("api: a refused token was not renewed: {e}");
        }
    }
    // any answer but a 503 is the API speaking; a 503 says which it is in its body (below)
    if status != 503 {
        auth_state.availability.answers(&site);
    }
    let head = ApiHead { status, headers: response_headers(response.headers()) };

    // from here `api_abort` stops the body; an abort that came since the answer did is seen now
    let id = request.id;
    let (stop_body, registration) = AbortHandle::new_pair();
    calls.start(&id, stop_body);
    if handle.is_aborted() {
        calls.finish(&id);
        return Err(cancelled());
    }
    let app = app.clone();
    let reader = app.clone();
    let pump = Abortable::new(
        async move {
            // a 503's body is kept too (up to a problem's size), to read what it says
            let mut problem = (status == 503).then(Vec::new);
            let mut body = response.bytes_stream();
            while let Some(chunk) = body.next().await {
                let sent = match chunk {
                    Ok(bytes) if bytes.is_empty() => Ok(()),
                    Ok(bytes) => {
                        if let Some(kept) = problem.as_mut().filter(|kept| kept.len() <= MAX_PROBLEM) {
                            kept.extend_from_slice(&bytes);
                        }
                        on_body.send(body_message(BODY_DATA, &bytes))
                    }
                    Err(e) => {
                        let _ = on_body.send(body_message(BODY_FAILED, e.to_string().as_bytes()));
                        return;
                    }
                };
                // the page is gone (its window closed): nobody reads the rest
                if sent.is_err() {
                    return;
                }
            }
            if let Some(kept) = problem {
                // turned off: remembered before the page reads the end of the answer
                reader.state::<AuthState>().availability.saw(&site, 503, &kept);
            }
            let _ = on_body.send(body_message(BODY_END, &[]));
        },
        registration,
    );
    tauri::async_runtime::spawn(async move {
        let _ = pump.await;
        if let Some(calls) = app.try_state::<ApiCalls>() {
            calls.finish(&id);
        }
    });
    Ok(head)
}

/// Stop a request of the page (it was aborted there): while it waits, and while its body arrives.
#[tauri::command]
pub fn api_abort(calls: State<'_, ApiCalls>, id: String) {
    calls.abort(&id);
}

#[cfg(test)]
mod tests {
    use super::*;

    const SITE: &str = "https://community.example";

    #[test]
    fn only_the_sites_api_is_an_address() {
        for ok in [
            "https://community.example/api/v2",
            "https://community.example/api/v2/",
            "https://community.example/api/v2/me",
            "https://community.example/api/v2/feed?limit=20&cursor=a%2Fb",
            "https://community.example:443/api/v2/me",
            "https://COMMUNITY.example/api/v2/me",
        ] {
            assert!(api_url(ok, SITE).is_some(), "{ok}");
        }
        for bad in [
            "https://community.example/",
            "https://community.example/api/v1/me",
            "https://community.example/api/v2x",
            "https://community.example/api/v2/../../member.php",
            "https://community.example/api/v2/%2e%2e/%2e%2e/member.php",
            "https://community.example/api/v2/..%2F..%2Fmember.php/../../../x",
            "https://community.example/oauth2/token",
            "http://community.example/api/v2/me",
            "https://community.example:8443/api/v2/me",
            "https://other.example/api/v2/me",
            "https://community.example.evil.test/api/v2/me",
            "https://user:pass@community.example/api/v2/me",
            "https://user@community.example/api/v2/me",
            "https://community.example@evil.test/api/v2/me",
            "//community.example/api/v2/me",
            "/api/v2/me",
            "file:///api/v2/me",
            "javascript:alert(1)",
            "",
        ] {
            assert!(api_url(bad, SITE).is_none(), "{bad}");
        }
    }

    #[test]
    fn a_site_in_a_folder_has_its_api_under_the_folder() {
        let site = "https://example.org/community/";
        assert!(api_url("https://example.org/community/api/v2/me", site).is_some());
        assert!(api_url("https://example.org/api/v2/me", site).is_none());
        // resolved first: this one comes back into the folder's API, the next climbs out of the folder
        assert_eq!(api_url("https://example.org/community/api/v2/../../api/v2/me", site).unwrap().path(), "/community/api/v2/me");
        assert!(api_url("https://example.org/community/api/v2/../../../api/v2/me", site).is_none());
        let dev = "http://desktop.localhost:8090";
        assert!(api_url("http://desktop.localhost:8090/api/v2/hashtags", dev).is_some());
        assert!(api_url("http://desktop.localhost:8091/api/v2/hashtags", dev).is_none());
        assert!(api_url("https://desktop.localhost:8090/api/v2/hashtags", dev).is_none());
    }

    #[test]
    fn a_redirect_is_followed_only_into_the_api_and_a_few_times() {
        assert!(redirect_allowed("https://community.example/api/v2/me/", SITE, 0));
        assert!(redirect_allowed("https://community.example/api/v2/me/", SITE, MAX_REDIRECTS - 1));
        assert!(!redirect_allowed("https://community.example/api/v2/me/", SITE, MAX_REDIRECTS));
        assert!(!redirect_allowed("https://community.example/member.php", SITE, 0), "out of the API");
        assert!(!redirect_allowed("https://evil.test/api/v2/me", SITE, 0), "another host");
        assert!(!redirect_allowed("http://community.example/api/v2/me", SITE, 0), "down to http");
    }

    #[test]
    fn the_page_sets_only_harmless_headers() {
        let sent = request_headers(&[
            ("Accept".into(), "application/json".into()),
            ("Content-Type".into(), "application/json".into()),
            ("If-None-Match".into(), "\"abc\"".into()),
            ("Accept-Language".into(), "ru".into()),
            ("Authorization".into(), "Bearer stolen".into()),
            ("authorization".into(), "Bearer stolen".into()),
            ("Cookie".into(), "memberSession=1".into()),
            ("Host".into(), "evil.test".into()),
            ("X-Forwarded-For".into(), "10.0.0.1".into()),
            ("Proxy-Authorization".into(), "Basic x".into()),
            ("Accept".into(), "bad\r\nAuthorization: Bearer x".into()),
        ]);
        assert_eq!(
            sent,
            [
                ("accept".to_string(), "application/json".to_string()),
                ("content-type".to_string(), "application/json".to_string()),
                ("if-none-match".to_string(), "\"abc\"".to_string()),
                ("accept-language".to_string(), "ru".to_string()),
            ]
        );
    }

    #[test]
    fn the_api_takes_six_methods() {
        for ok in ["GET", "get", "HEAD", "POST", "PUT", "PATCH", "DELETE"] {
            assert!(method_of(ok).is_some(), "{ok}");
        }
        for bad in ["CONNECT", "TRACE", "OPTIONS", "", "GET /"] {
            assert!(method_of(bad).is_none(), "{bad}");
        }
    }

    #[test]
    fn the_page_gets_no_cookies() {
        let mut headers = reqwest::header::HeaderMap::new();
        headers.insert("content-type", "application/json".parse().unwrap());
        headers.insert("etag", "\"abc\"".parse().unwrap());
        headers.append("set-cookie", "memberSession=1; HttpOnly".parse().unwrap());
        headers.insert("retry-after", "3".parse().unwrap());
        let mut seen = response_headers(&headers);
        seen.sort();
        assert_eq!(
            seen,
            [
                ("content-type".to_string(), "application/json".to_string()),
                ("etag".to_string(), "\"abc\"".to_string()),
                ("retry-after".to_string(), "3".to_string())
            ]
        );
    }

    #[test]
    fn a_body_message_says_what_it_is_first() {
        let InvokeResponseBody::Raw(data) = body_message(BODY_DATA, b"{}") else { panic!("raw") };
        assert_eq!(data, [0, b'{', b'}']);
        let InvokeResponseBody::Raw(end) = body_message(BODY_END, &[]) else { panic!("raw") };
        assert_eq!(end, [1]);
    }

    #[test]
    fn a_request_is_stopped_by_its_id_once() {
        let calls = ApiCalls::default();
        let (handle, _registration) = AbortHandle::new_pair();
        calls.start("a", handle.clone());
        calls.abort("b");
        assert!(!handle.is_aborted(), "another request's id");
        calls.abort("a");
        assert!(handle.is_aborted());
        assert!(calls.running.lock().unwrap().is_empty());
        calls.abort("a");
    }

    #[test]
    fn a_site_has_one_client() {
        let calls = ApiCalls::default();
        calls.client(SITE).unwrap();
        calls.client(SITE).unwrap();
        calls.client("http://desktop.localhost:8090").unwrap();
        assert_eq!(calls.clients.lock().unwrap().len(), 2);
    }
}
