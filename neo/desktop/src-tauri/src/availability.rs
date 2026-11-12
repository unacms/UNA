//! A network whose API is turned off, told apart from one that is down or has no API v2.
//!
//! API v2 is a preview a site turns on (Studio > API > Settings, off as installed). With it off,
//! or with the whole API off, every /api/v2 request is answered 503 with a problem (RFC 9457)
//! whose `code` says which: `api_v2_disabled` or `api_disabled` (BxDolApiV2Router). That is not a
//! sign-out and not a failure to retry: the session stays as it is, and what is kept here is
//! that the site said so, per site, so other networks are not touched.
//!
//! While a site is known to be off, the page's requests are answered from here with the same
//! problem and never sent (api.rs), but for one every `RECHECK`, which finds out when the API is
//! back; the sync poll keeps asking at its usual interval (sync.rs) and the sockets wait
//! (realtime.rs). Any other answer of the API clears it. Every change is told to the windows
//! (`EVENT`: `{ site, code }`, the code null once the API answers again), which show it and load
//! again what failed (src/lib/api-availability.ts).

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use serde::Deserialize;
use serde_json::json;
use tauri::State;

use crate::auth::AuthState;
use crate::i18n::{tr, tr_vars};

/// The windows' event with each change: `{ site, code }`.
pub const EVENT: &str = "api-availability";

/// API v2 (a preview) is turned off on the site.
pub const V2_OFF: &str = "api_v2_disabled";
/// The site's whole API is turned off.
pub const API_OFF: &str = "api_disabled";

/// How often one request of the page goes out to a site that said its API is off.
const RECHECK: Duration = Duration::from_secs(30);
const HTTP_TIMEOUT: Duration = Duration::from_secs(20);
/// A problem is a few hundred bytes; a longer 503 is a maintenance page, not read as one.
pub const MAX_PROBLEM: usize = 64 * 1024;

#[derive(Deserialize)]
struct Problem {
    code: Option<String>,
}

/// Which of the two an answer says, or None for any other answer: another status, a 503 of a
/// proxy or a maintenance page, a problem with another code.
pub fn off_code(status: u16, body: &[u8]) -> Option<&'static str> {
    if status != 503 || body.len() > MAX_PROBLEM {
        return None;
    }
    match serde_json::from_slice::<Problem>(body).ok()?.code?.as_str() {
        V2_OFF => Some(V2_OFF),
        API_OFF => Some(API_OFF),
        _ => None,
    }
}

/// What is said of the network one is signed in to.
pub fn off_here(code: &str) -> String {
    if code == API_OFF {
        tr("The API is turned off on this network")
    } else {
        tr("API v2 is turned off on this network")
    }
}

/// What is said of a site one is adding or signing in to.
pub fn off_at(site_url: &str, code: &str) -> String {
    if code == API_OFF {
        tr_vars("{{site}} has its API turned off", &[("site", site_url)])
    } else {
        tr_vars("{{site}} has API v2 (a preview) turned off. Its administrator can turn it on in Studio > API > Settings.", &[("site", site_url)])
    }
}

/// The problem a request gets that is not sent: the site's own, in the person's language.
pub fn problem_body(code: &str) -> Vec<u8> {
    json!({ "type": "about:blank", "title": "Service Unavailable", "status": 503, "code": code, "detail": off_here(code) }).to_string().into_bytes()
}

struct Off {
    code: &'static str,
    /// When a request last went out to find out whether it still is.
    asked: Instant,
}

type Listener = Arc<dyn Fn(&str, Option<&'static str>) + Send + Sync>;

/// The sites that said their API is off (part of `AuthState`, so it is at hand wherever a
/// request is sent).
#[derive(Default)]
pub struct Availability {
    off: Mutex<HashMap<String, Off>>,
    listener: Mutex<Option<Listener>>,
}

fn key(site: &str) -> &str {
    site.trim_end_matches('/')
}

impl Availability {
    fn lock(&self) -> std::sync::MutexGuard<'_, HashMap<String, Off>> {
        self.off.lock().unwrap_or_else(|e| e.into_inner())
    }

    /// Who hears each change (lib.rs: the windows, the sync poll and the sockets).
    pub fn listen(&self, listener: impl Fn(&str, Option<&'static str>) + Send + Sync + 'static) {
        *self.listener.lock().unwrap_or_else(|e| e.into_inner()) = Some(Arc::new(listener));
    }

    fn tell(&self, site: &str, code: Option<&'static str>) {
        let listener = self.listener.lock().unwrap_or_else(|e| e.into_inner()).clone();
        if let Some(listener) = listener {
            listener(key(site), code);
        }
    }

    /// What the site said of its API, when it said it is off.
    pub fn code(&self, site: &str) -> Option<&'static str> {
        self.lock().get(key(site)).map(|off| off.code)
    }

    /// The code to answer a request of the page with instead of sending it: the site is off and
    /// was asked lately. None when the request goes out: the site is not known to be off, or it
    /// is this interval's one request to it (which this call takes).
    pub fn held_back(&self, site: &str) -> Option<&'static str> {
        self.held_back_at(site, Instant::now())
    }

    fn held_back_at(&self, site: &str, now: Instant) -> Option<&'static str> {
        let mut off = self.lock();
        let entry = off.get_mut(key(site))?;
        if now.saturating_duration_since(entry.asked) >= RECHECK {
            entry.asked = now;
            return None;
        }
        Some(entry.code)
    }

    /// The site said its API is off.
    pub fn turned_off(&self, site: &str, code: &'static str) {
        let before = self.lock().insert(key(site).to_string(), Off { code, asked: Instant::now() }).map(|off| off.code);
        if before != Some(code) {
            self.tell(site, Some(code));
        }
    }

    /// The site's API answered something else: it is on, as far as is known.
    pub fn answers(&self, site: &str) {
        let was = self.lock().remove(key(site)).is_some();
        if was {
            self.tell(site, None);
        }
    }

    /// Take an answer of the site's API: the code when it says the API is off. A 503 that says
    /// nothing of it (maintenance, a proxy) changes nothing; any other status means it answers.
    pub fn saw(&self, site: &str, status: u16, body: &[u8]) -> Option<&'static str> {
        let code = off_code(status, body);
        match code {
            Some(code) => self.turned_off(site, code),
            None if status != 503 => self.answers(site),
            None => {}
        }
        code
    }
}

/// Ask the site now (its discovery document, which needs no token): the code while it is off.
/// `Err` when it could not be reached, and then nothing is known and nothing changes.
pub async fn probe(availability: &Availability, site: &str) -> Result<Option<&'static str>, String> {
    let client = reqwest::Client::builder().timeout(HTTP_TIMEOUT).build().map_err(|e| e.to_string())?;
    let response = client
        .get(format!("{}/api/v2", key(site)))
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| tr_vars("Could not reach the network: {{reason}}", &[("reason", &e.to_string())]))?;
    let status = response.status().as_u16();
    // only a 503 can say it; the body of any other answer is not needed
    let body = if status == 503 { response.bytes().await.map(|b| b.to_vec()).unwrap_or_default() } else { Vec::new() };
    Ok(availability.saw(site, status, &body))
}

/// What is known of a network's API, for a page that (re)loads: the code while it is off.
#[tauri::command]
pub fn api_availability(auth: State<'_, AuthState>, site_url: String) -> Option<&'static str> {
    auth.availability.code(&site_url)
}

/// The page's Retry: ask the site now. Only a network signed in to is asked.
#[tauri::command]
pub async fn api_check(auth: State<'_, AuthState>, site_url: String) -> Result<Option<&'static str>, String> {
    if !auth.summaries().iter().any(|s| key(s.site_url()) == key(&site_url)) {
        return Err(tr("Not a network the app is signed in to"));
    }
    probe(&auth.availability, &site_url).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::net::TcpListener;

    const V2_OFF_BODY: &str = r#"{"type":"about:blank","title":"Service Unavailable","status":503,"code":"api_v2_disabled","detail":"API v2 is a preview and is turned off on this site"}"#;
    const SITE: &str = "https://community.example";

    #[test]
    fn only_a_503_problem_with_one_of_the_two_codes_says_the_api_is_off() {
        assert_eq!(off_code(503, V2_OFF_BODY.as_bytes()), Some(V2_OFF));
        assert_eq!(off_code(503, br#"{"status":503,"code":"api_disabled"}"#), Some(API_OFF));
        // maintenance, a proxy's page, another problem, another status
        assert_eq!(off_code(503, b"<html>Down for maintenance</html>"), None);
        assert_eq!(off_code(503, b""), None);
        assert_eq!(off_code(503, br#"{"status":503,"code":"maintenance"}"#), None);
        assert_eq!(off_code(503, br#"{"status":503,"code":7}"#), None);
        assert_eq!(off_code(500, V2_OFF_BODY.as_bytes()), None);
        assert_eq!(off_code(200, V2_OFF_BODY.as_bytes()), None);
        let long = format!(r#"{{"code":"api_v2_disabled","detail":"{}"}}"#, "x".repeat(MAX_PROBLEM));
        assert_eq!(off_code(503, long.as_bytes()), None);
    }

    #[test]
    fn the_two_are_said_apart() {
        assert!(off_at(SITE, V2_OFF).contains("Studio > API > Settings"));
        assert!(off_at(SITE, V2_OFF).contains(SITE));
        assert!(!off_at(SITE, API_OFF).contains("v2"));
        assert_ne!(off_here(V2_OFF), off_here(API_OFF));
        let problem: serde_json::Value = serde_json::from_slice(&problem_body(API_OFF)).unwrap();
        assert_eq!(problem["code"], API_OFF);
        assert_eq!(problem["status"], 503);
        assert_eq!(off_code(503, &problem_body(V2_OFF)), Some(V2_OFF));
    }

    /// The changes a listener heard: each site and its code.
    type Heard = Arc<Mutex<Vec<(String, Option<&'static str>)>>>;

    fn heard(availability: &Availability) -> Heard {
        let heard = Arc::new(Mutex::new(Vec::new()));
        let kept = heard.clone();
        availability.listen(move |site, code| kept.lock().unwrap().push((site.to_string(), code)));
        heard
    }

    #[test]
    fn each_site_is_kept_apart_and_each_change_is_told_once() {
        let availability = Availability::default();
        let heard = heard(&availability);
        assert_eq!(availability.code(SITE), None);

        assert_eq!(availability.saw(SITE, 503, V2_OFF_BODY.as_bytes()), Some(V2_OFF));
        assert_eq!(availability.saw("https://community.example/", 503, V2_OFF_BODY.as_bytes()), Some(V2_OFF));
        assert_eq!(availability.code("https://community.example/"), Some(V2_OFF));
        assert_eq!(availability.code("https://other.example"), None, "another network keeps working");

        // a maintenance page says nothing either way
        availability.saw(SITE, 503, b"<html>");
        assert_eq!(availability.code(SITE), Some(V2_OFF));
        // the whole API off is another state
        availability.saw(SITE, 503, br#"{"code":"api_disabled"}"#);
        // any other answer: it is back (a 401 too, which is the API speaking)
        availability.saw(SITE, 401, b"{}");
        availability.saw(SITE, 200, b"{}");
        assert_eq!(availability.code(SITE), None);

        assert_eq!(*heard.lock().unwrap(), vec![(SITE.to_string(), Some(V2_OFF)), (SITE.to_string(), Some(API_OFF)), (SITE.to_string(), None)]);
    }

    #[test]
    fn one_request_an_interval_goes_out_while_a_site_is_off() {
        let availability = Availability::default();
        let now = Instant::now();
        assert_eq!(availability.held_back_at(SITE, now), None, "a site not known to be off is asked");
        availability.turned_off(SITE, V2_OFF);
        assert_eq!(availability.held_back_at(SITE, now), Some(V2_OFF));
        assert_eq!(availability.held_back_at(SITE, now + RECHECK - Duration::from_secs(1)), Some(V2_OFF));
        // the interval's one request, and the ones after it wait again
        let later = now + RECHECK + Duration::from_secs(1);
        assert_eq!(availability.held_back_at(SITE, later), None);
        assert_eq!(availability.held_back_at(SITE, later), Some(V2_OFF));
        assert_eq!(availability.held_back_at("https://other.example", now), None);
        availability.answers(SITE);
        assert_eq!(availability.held_back_at(SITE, later), None);
    }

    /// A site that answers each connection with the next of `answers`.
    async fn site(answers: Vec<String>) -> String {
        use tokio::io::{AsyncReadExt, AsyncWriteExt};
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let url = format!("http://127.0.0.1:{}", listener.local_addr().unwrap().port());
        tokio::spawn(async move {
            for answer in answers {
                let Ok((mut stream, _)) = listener.accept().await else { return };
                let mut buffer = [0u8; 4096];
                let _ = stream.read(&mut buffer).await;
                let _ = stream.write_all(answer.as_bytes()).await;
                let _ = stream.shutdown().await;
            }
        });
        url
    }

    fn answer(status: &str, body: &str) -> String {
        format!("HTTP/1.1 {status}\r\ncontent-type: application/problem+json\r\ncontent-length: {}\r\nconnection: close\r\n\r\n{body}", body.len())
    }

    #[tokio::test]
    async fn a_check_finds_the_api_off_and_then_back() {
        let url = site(vec![answer("503 Service Unavailable", V2_OFF_BODY), answer("503 Service Unavailable", "down"), answer("200 OK", "{}")]).await;
        let availability = Availability::default();
        let heard = heard(&availability);
        assert_eq!(probe(&availability, &url).await, Ok(Some(V2_OFF)));
        // a 503 that says nothing: still off, as last heard
        assert_eq!(probe(&availability, &url).await, Ok(None));
        assert_eq!(availability.code(&url), Some(V2_OFF));
        assert_eq!(probe(&availability, &url).await, Ok(None));
        assert_eq!(availability.code(&url), None);
        assert_eq!(*heard.lock().unwrap(), vec![(url.clone(), Some(V2_OFF)), (url.clone(), None)]);
    }

    #[tokio::test]
    async fn a_site_that_cannot_be_reached_stays_as_it_was() {
        // nothing listens here any more
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let url = format!("http://127.0.0.1:{}", listener.local_addr().unwrap().port());
        drop(listener);
        let availability = Availability::default();
        availability.turned_off(&url, API_OFF);
        assert!(probe(&availability, &url).await.is_err());
        assert_eq!(availability.code(&url), Some(API_OFF));
    }
}
