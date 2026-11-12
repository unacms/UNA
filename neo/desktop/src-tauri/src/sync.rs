//! One poller for what changed on the site (GET /api/v2/sync), here and not in the web view:
//! a hidden or minimized web view stops its timers (WebKit suspends it after a few minutes),
//! and the window may be closed to the tray, but the badge and notifications should keep
//! coming. Each round:
//!
//! - asks with the last cursor and ETag, so nothing new costs a 304 with no body;
//! - puts the unread count (notifications and messages) on the dock, taskbar and tray;
//! - shows an OS notification for new unread notifications, only while the window is not
//!   focused (`to_notify`): what the person is looking at already shows them;
//! - sends the answer to the page (`sync` event), which updates the sidebar and its lists;
//! - asks again at once when the answer says `more` (more came than one answer takes).
//!
//! New notifications are the answer's `changes` of type `notification`
//! (the `SyncResponse`); changes of other types are skipped.
//!
//! It polls every 30 s while the window has focus and every 60 s otherwise, backs off up to
//! 10 minutes while the site fails (but not while it says its API is turned off: then it keeps
//! the usual interval, and its first other answer clears that, availability.rs), and polls at once when the page asks (`sync_now`: after
//! sign-in, a refresh, marking notifications read) and when the window gets focus.
//!
//! A click on a notification brings the window back and asks the page to open what it is about
//! (`open-notification`, with the notification as the API sent it and the profile it was shown
//! for: after a profile switch the page doesn't open, or mark read, another profile's).
//!
//! An answer belongs to the sign-in it was asked with (`AuthState::generation`): one that comes
//! back after a sign-out or another sign-in is dropped, and a new sign-in starts over, even on
//! the same site.

use std::collections::VecDeque;

use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use std::sync::Mutex;
use std::time::Duration;

use serde::Deserialize;
use serde_json::{json, Value};
use tauri::{AppHandle, Emitter, Manager, Runtime, State};
use tauri_plugin_notification::NotificationExt;
use tokio::sync::Notify;
use url::Url;

use crate::i18n::trn;
use crate::{auth, badge, tray};

/// The page's event with each new answer: `{ sync, notified }`.
pub const SYNC_EVENT: &str = "sync";
/// The page's event when a notification is clicked: `{ notification, profile_id }`, the
/// notification (null when it is not known) and the profile it was shown for (null when unknown).
pub const OPEN_EVENT: &str = "open-notification";

const FOCUSED_INTERVAL: Duration = Duration::from_secs(30);
const BACKGROUND_INTERVAL: Duration = Duration::from_secs(60);
const BACKOFF_MAX: Duration = Duration::from_secs(600);
const HTTP_TIMEOUT: Duration = Duration::from_secs(20);
/// The pause before the next part when an answer says `more`.
const MORE_DELAY: Duration = Duration::from_millis(250);
/// More new notifications than this at once are one notification that says how many.
const NOTIFY_MAX: usize = 3;
/// Shown notifications remembered for their clicks.
const SHOWN_MAX: usize = 50;

#[derive(Deserialize, Default, Clone, Copy, Debug, PartialEq)]
pub(crate) struct Badges {
    #[serde(default)]
    pub notifications: u32,
    #[serde(default)]
    pub messages: u32,
    #[serde(default)]
    pub friend_requests: u32,
}

impl Badges {
    /// The count on the dock, taskbar and tray: what is unread. Friend requests come as
    /// notifications too, so they are not counted twice.
    pub fn total(&self) -> u32 {
        self.notifications.saturating_add(self.messages)
    }
}

/// One of the answer's `changes`: an entity that changed (`data`), or a tombstone (`gone`).
#[derive(Deserialize, Debug)]
struct Change {
    #[serde(rename = "type")]
    kind: String,
    id: String,
    #[serde(default)]
    data: Option<Value>,
    #[serde(default)]
    gone: bool,
}

/// A new notification: its id and the Notification as the API sent it.
#[derive(Clone, Debug)]
pub(crate) struct Entry {
    pub id: String,
    pub data: Value,
}

#[derive(Deserialize, Debug)]
struct SyncBody {
    cursor: String,
    #[serde(default)]
    badges: Badges,
    #[serde(default)]
    changes: Vec<Change>,
    /// More changes are waiting: sync again at once.
    #[serde(default)]
    more: bool,
    /// The cursor was another profile's (a profile switch): what was shown is not this one's.
    #[serde(default)]
    reset: bool,
}

impl SyncBody {
    /// The new notifications, newest first: the changes of type `notification` with data.
    fn notifications(&self) -> Vec<Entry> {
        self.changes
            .iter()
            .filter(|c| c.kind == "notification" && !c.gone)
            .filter_map(|c| c.data.clone().map(|data| Entry { id: c.id.clone(), data }))
            .collect()
    }
}

/// A notification shown on the screen, for its click.
#[derive(Clone, Debug, PartialEq)]
pub(crate) struct Shown {
    pub os_id: i32,
    pub data: Value,
    /// The profile it was shown for (the cursor of the answer that brought it).
    pub profile_id: Option<String>,
}

#[derive(Default)]
struct Inner {
    /// The site the cursor and ETag are for; another site (or none) starts over.
    site: Option<String>,
    /// The sign-in they are for (`AuthState::generation`); another one starts over too.
    generation: Option<u64>,
    cursor: Option<String>,
    etag: Option<String>,
    /// The last answer sent to the page, for a page that (re)loads.
    last: Option<Value>,
    language: Option<String>,
    failures: u32,
    shown: VecDeque<Shown>,
}

impl Inner {
    /// Start over for a session (a site and a sign-in), keeping the page's language.
    fn start_over(&mut self, site: Option<String>, generation: Option<u64>) {
        let language = self.language.take();
        *self = Inner { site, generation, language, ..Inner::default() };
    }

    /// Whether the cursor and ETag are this session's.
    fn is_for(&self, site: &str, generation: u64) -> bool {
        self.site.as_deref() == Some(site) && self.generation == Some(generation)
    }

    /// An answer that says the profile changed: notifications shown before are another
    /// profile's, and their clicks open nothing of this one.
    fn take_reset(&mut self, reset: bool) {
        if reset {
            self.shown.clear();
        }
    }

    fn remember_shown(&mut self, shown: Shown) {
        self.shown.retain(|s| s.os_id != shown.os_id);
        self.shown.push_back(shown);
        while self.shown.len() > SHOWN_MAX {
            self.shown.pop_front();
        }
    }
}

/// The profile a sync cursor is for (`p` in the cursor's JSON; BxDolApiV2Request::encodeCursor).
pub(crate) fn cursor_profile(cursor: &str) -> Option<String> {
    let bytes = URL_SAFE_NO_PAD.decode(cursor.trim_end_matches('=')).ok()?;
    let value: Value = serde_json::from_slice(&bytes).ok()?;
    match value.get("p")? {
        Value::Number(n) => n.as_u64().map(|n| n.to_string()),
        Value::String(s) if !s.is_empty() => Some(s.clone()),
        _ => None,
    }
}

/// What the page gets when a notification is clicked.
pub(crate) fn open_payload(shown: Option<&Shown>) -> Value {
    json!({
        "notification": shown.map(|s| s.data.clone()),
        "profile_id": shown.and_then(|s| s.profile_id.clone()),
    })
}

#[derive(Default)]
pub struct SyncState {
    wake: Notify,
    inner: Mutex<Inner>,
}

impl SyncState {
    fn lock(&self) -> std::sync::MutexGuard<'_, Inner> {
        self.inner.lock().unwrap_or_else(|e| e.into_inner())
    }

    /// Poll now instead of at the next interval.
    pub fn wake(&self) {
        self.wake.notify_one();
    }
}

/// The new notifications to show as OS notifications: none while the window has focus (the
/// page shows them), and only unread ones (a notification read on the site in the meantime is
/// not news).
pub(crate) fn to_notify(window_focused: bool, entries: &[Entry]) -> Vec<&Entry> {
    if window_focused {
        return Vec::new();
    }
    entries.iter().filter(|e| e.data.get("read").and_then(Value::as_bool) != Some(true)).collect()
}

/// How long to wait before the next round: shorter while the window has focus, doubling from
/// 30 s while the site fails, up to 10 minutes.
pub(crate) fn next_delay(failures: u32, window_focused: bool) -> Duration {
    if failures == 0 {
        return if window_focused { FOCUSED_INTERVAL } else { BACKGROUND_INTERVAL };
    }
    let doubled = FOCUSED_INTERVAL.saturating_mul(1u32 << failures.saturating_sub(1).min(10));
    doubled.min(BACKOFF_MAX)
}

/// A notification's OS notification: who did it as the title, what happened as the body.
pub(crate) fn title_and_body(data: &Value) -> (String, String) {
    let actor = data.pointer("/actor/display_name").and_then(Value::as_str).filter(|s| !s.is_empty());
    let text = data.get("text").and_then(Value::as_str).unwrap_or_default();
    (actor.unwrap_or(crate::brand::NAME).to_string(), text.to_string())
}

/// The OS notification id of an API id (the plugin takes an i32).
pub(crate) fn os_id(id: &str) -> i32 {
    id.parse::<u64>().map(|n| (n % i32::MAX as u64) as i32).unwrap_or(0)
}

/// The URL of a sync with this cursor.
pub(crate) fn sync_url(site: &str, cursor: Option<&str>) -> Result<Url, String> {
    let mut url = Url::parse(&format!("{}/api/v2/sync", site.trim_end_matches('/'))).map_err(|e| e.to_string())?;
    if let Some(cursor) = cursor {
        url.query_pairs_mut().append_pair("cursor", cursor);
    }
    Ok(url)
}

fn window_focused<R: Runtime>(app: &AppHandle<R>) -> bool {
    app.get_webview_window("main")
        .map(|w| w.is_visible().unwrap_or(false) && !w.is_minimized().unwrap_or(false) && w.is_focused().unwrap_or(false))
        .unwrap_or(false)
}

pub fn start<R: Runtime>(app: AppHandle<R>) {
    tauri::async_runtime::spawn(async move {
        let client = match reqwest::Client::builder().timeout(HTTP_TIMEOUT).build() {
            Ok(client) => client,
            Err(e) => {
                log::error!("sync: {e}");
                return;
            }
        };
        // the keychain is read when the page asks for the session, after its window shows:
        // the poller never starts that read (a prompt with no window), it waits for it
        app.state::<auth::AuthState>().wait_loaded().await;
        loop {
            let failures = match poll(&app, &client).await {
                // more is waiting: the next part at once, without the wait (bounded by the site,
                // which ends a round once it has sent what came)
                Ok(true) => {
                    state_reset_failures(&app);
                    tokio::time::sleep(MORE_DELAY).await;
                    continue;
                }
                Ok(false) => 0,
                Err(e) => {
                    log::warn!("sync: {e}");
                    // a site whose API is turned off is asked again at the usual interval, not
                    // less and less often: this is how the app learns that it is back
                    u32::from(!api_is_off(&app))
                }
            };
            let state = app.state::<SyncState>();
            let failures = {
                let mut inner = state.lock();
                inner.failures = if failures == 0 { 0 } else { inner.failures.saturating_add(1) };
                inner.failures
            };
            let delay = next_delay(failures, window_focused(&app));
            tokio::select! {
                _ = tokio::time::sleep(delay) => {}
                _ = state.wake.notified() => {}
            }
        }
    });
}

/// Whether the signed-in site said its API is turned off (availability.rs).
fn api_is_off<R: Runtime>(app: &AppHandle<R>) -> bool {
    let auth = app.state::<auth::AuthState>();
    auth.site_url().is_some_and(|site| auth.availability.code(&site).is_some())
}

/// A round that worked: no back-off for the next.
fn state_reset_failures<R: Runtime>(app: &AppHandle<R>) {
    app.state::<SyncState>().lock().failures = 0;
}

/// One round; `Ok(true)` when the answer says more is waiting.
async fn poll<R: Runtime>(app: &AppHandle<R>, client: &reqwest::Client) -> Result<bool, String> {
    let auth = app.state::<auth::AuthState>();
    let state = app.state::<SyncState>();

    let Some(auth::SessionToken { site, token, generation }) = auth::session_token(&auth).await? else {
        // signed out: nothing is unread here any more
        let had = {
            let mut inner = state.lock();
            let had = inner.site.is_some();
            if had {
                inner.start_over(None, None);
            }
            had
        };
        if had {
            badge::show(app, 0);
            let _ = app.emit_to("main", SYNC_EVENT, Value::Null);
        }
        return Ok(false);
    };

    let (cursor, etag, language) = {
        let mut inner = state.lock();
        if !inner.is_for(&site, generation) {
            // another site, or another sign-in on the same one: nothing of the last one is kept
            inner.start_over(Some(site.clone()), Some(generation));
        }
        (inner.cursor.clone(), inner.etag.clone(), inner.language.clone())
    };

    let mut request = client.get(sync_url(&site, cursor.as_deref())?).bearer_auth(&token).header(reqwest::header::ACCEPT, "application/json");
    if let Some(etag) = &etag {
        request = request.header(reqwest::header::IF_NONE_MATCH, etag);
    }
    if let Some(language) = &language {
        request = request.header(reqwest::header::ACCEPT_LANGUAGE, language);
    }
    let response = request.send().await.map_err(|e| format!("could not reach the site: {e}"))?;
    let status = response.status();
    if status == reqwest::StatusCode::SERVICE_UNAVAILABLE {
        // the site may say its API is turned off (availability.rs): the session is kept, the
        // page is told, and this poll is what finds out when it is back
        let body = response.bytes().await.unwrap_or_default();
        return Err(match auth.availability.saw(&site, status.as_u16(), &body) {
            Some(code) => format!("the site answered {status} ({code})"),
            None => format!("the site answered {status}"),
        });
    }
    auth.availability.answers(&site);
    if status == reqwest::StatusCode::NOT_MODIFIED {
        return Ok(false);
    }
    if status == reqwest::StatusCode::UNPROCESSABLE_ENTITY {
        // a cursor the site no longer takes: start over
        let mut inner = state.lock();
        if inner.is_for(&site, generation) {
            inner.cursor = None;
            inner.etag = None;
        }
        return Err("the site refused the cursor; starting over".into());
    }
    if status == reqwest::StatusCode::UNAUTHORIZED {
        // renewed at once, or kept in the list as signed out: never forgotten (auth::refused)
        auth::refused(app, &auth, &site, generation, &token).await?;
        return Err("the site answered 401 Unauthorized".into());
    }
    if !status.is_success() {
        return Err(format!("the site answered {status}"));
    }
    let new_etag = response.headers().get(reqwest::header::ETAG).and_then(|v| v.to_str().ok()).map(str::to_owned);
    let value: Value = response.json().await.map_err(|e| format!("not a sync answer: {e}"))?;
    let body: SyncBody = serde_json::from_value(value.clone()).map_err(|e| format!("not a sync answer: {e}"))?;

    // a sign-out or another sign-in while this was on its way (on the same site too): its
    // answer is another session's, and nothing of it may reach this one
    if !state.lock().is_for(&site, generation) || auth.generation() != generation {
        return Ok(false);
    }

    badge::show(app, body.badges.total());
    state.lock().take_reset(body.reset);

    let entries = body.notifications();
    let more = body.more;
    // with OS notifications off in Settings the page announces them when it has focus, as before
    let shown = if crate::settings::os_notifications(app) { to_notify(window_focused(app), &entries) } else { Vec::new() };
    let notified = !shown.is_empty();
    if notified {
        show_notifications(app, &state, &shown, cursor_profile(&body.cursor));
    }

    let payload = json!({ "sync": value, "notified": notified });
    {
        let mut inner = state.lock();
        inner.cursor = Some(body.cursor);
        inner.etag = new_etag;
        inner.last = Some(json!({ "sync": value, "notified": false }));
    }
    if let Err(e) = app.emit_to("main", SYNC_EVENT, payload) {
        log::error!("sync event: {e}");
    }
    Ok(more)
}

fn show_notifications<R: Runtime>(app: &AppHandle<R>, state: &SyncState, entries: &[&Entry], profile_id: Option<String>) {
    let notification = app.notification();
    if entries.len() > NOTIFY_MAX {
        // one that says how many; a click opens the notifications
        let result = notification
            .builder()
            .id(0)
            .title(crate::brand::NAME)
            .body(trn(entries.len() as u64, "{{count}} new notification", "{{count}} new notifications"))
            .show();
        if let Err(e) = result {
            log::warn!("notification: {e}");
        }
        return;
    }
    // oldest first, so the newest is on top
    for entry in entries.iter().rev() {
        let (title, body) = title_and_body(&entry.data);
        let id = os_id(&entry.id);
        state.lock().remember_shown(Shown { os_id: id, data: entry.data.clone(), profile_id: profile_id.clone() });
        if let Err(e) = notification.builder().id(id).title(title).body(body).show() {
            log::warn!("notification: {e}");
        }
    }
}

/// Clicks on the app's notifications: the window comes back and the page opens what the
/// notification is about (or the notifications, for one that stands for several).
pub fn listen_for_clicks<R: Runtime>(app: &AppHandle<R>) {
    let handle = app.clone();
    let result = app.notification().on_action(move |action| {
        if action.action_id() != "tap" {
            return;
        }
        tray::show_main(&handle);
        let id = action.notification().map(|n| n.id());
        let shown = id.and_then(|id| {
            let state = handle.state::<SyncState>();
            let inner = state.lock();
            inner.shown.iter().find(|s| s.os_id == id).cloned()
        });
        if let Err(e) = handle.emit_to("main", OPEN_EVENT, open_payload(shown.as_ref())) {
            log::error!("notification click: {e}");
        }
    });
    if let Err(e) = result {
        log::warn!("notification clicks: {e}");
    }
}

/// Poll now (after sign-in, a refresh, marking notifications read), in the page's language.
/// Answers the last sync, so a page that (re)loads has the badges at once.
#[tauri::command]
pub fn sync_now(state: State<'_, SyncState>, language: Option<String>) -> Option<Value> {
    let last = {
        let mut inner = state.lock();
        if let Some(language) = language.filter(|l| !l.is_empty() && l.len() < 64) {
            if inner.language.as_deref() != Some(language.as_str()) {
                inner.language = Some(language);
                // notification texts are in the viewer's language: ask again in the new one
                inner.etag = None;
            }
        }
        inner.last.clone()
    };
    state.wake();
    last
}

#[cfg(test)]
mod tests {
    use super::*;

    fn entry(id: &str, read: bool) -> Entry {
        Entry { id: id.into(), data: json!({ "id": id, "read": read, "text": "Eric commented", "actor": { "display_name": "Eric" } }) }
    }

    #[test]
    fn no_os_notification_while_the_window_has_focus() {
        let entries = vec![entry("5", false), entry("4", false)];
        assert!(to_notify(true, &entries).is_empty(), "focused: the page shows them");
        assert_eq!(to_notify(false, &entries).len(), 2, "not focused: each new one");
        assert!(to_notify(false, &[]).is_empty(), "nothing new: nothing");
    }

    #[test]
    fn read_ones_are_not_news() {
        let entries = vec![entry("5", true), entry("4", false)];
        let shown: Vec<&str> = to_notify(false, &entries).iter().map(|e| e.id.as_str()).collect();
        assert_eq!(shown, vec!["4"]);
    }

    #[test]
    fn polls_slower_in_the_background_and_backs_off() {
        assert_eq!(next_delay(0, true), Duration::from_secs(30));
        assert_eq!(next_delay(0, false), Duration::from_secs(60));
        assert_eq!(next_delay(1, false), Duration::from_secs(30));
        assert_eq!(next_delay(2, true), Duration::from_secs(60));
        assert_eq!(next_delay(3, true), Duration::from_secs(120));
        assert_eq!(next_delay(8, true), Duration::from_secs(600));
        assert_eq!(next_delay(u32::MAX, true), Duration::from_secs(600));
    }

    #[test]
    fn the_badge_counts_notifications_and_messages() {
        let badges: Badges = serde_json::from_value(json!({ "notifications": 3, "messages": 2, "friend_requests": 1 })).unwrap();
        assert_eq!(badges.total(), 5);
        let none: Badges = serde_json::from_value(json!({ "notifications": 1 })).unwrap();
        assert_eq!(none.total(), 1, "a site without Conversations");
    }

    #[test]
    fn titles_name_who_did_it() {
        assert_eq!(title_and_body(&entry("1", false).data), ("Eric".into(), "Eric commented".into()));
        assert_eq!(title_and_body(&json!({ "text": "Something" })), ("UNA".into(), "Something".into()), "anonymous");
    }

    #[test]
    fn ids_fit_the_plugin() {
        assert_eq!(os_id("42"), 42);
        assert!(os_id("99999999999") >= 0);
        assert_eq!(os_id("x"), 0);
    }

    #[test]
    fn sync_urls_carry_the_cursor() {
        assert_eq!(sync_url("http://desktop.localhost:8090/", None).unwrap().as_str(), "http://desktop.localhost:8090/api/v2/sync");
        assert_eq!(sync_url("https://a.example", Some("eyJw+Ij")).unwrap().as_str(), "https://a.example/api/v2/sync?cursor=eyJw%2BIj");
    }

    fn shown(id: i32, profile: &str) -> Shown {
        Shown { os_id: id, data: json!({ "id": id.to_string() }), profile_id: Some(profile.into()) }
    }

    #[test]
    fn a_reset_answer_forgets_what_was_shown() {
        let mut inner = Inner::default();
        inner.remember_shown(shown(500, "4"));
        inner.take_reset(false);
        assert_eq!(inner.shown.len(), 1, "the same profile: clicks still open");
        inner.take_reset(true);
        assert!(inner.shown.is_empty(), "another profile: none of the first one's clicks open");
    }

    #[test]
    fn another_sign_in_on_the_same_site_starts_over() {
        let mut inner = Inner::default();
        inner.start_over(Some("https://a.example".into()), Some(1));
        inner.cursor = Some("c".into());
        inner.etag = Some("e".into());
        inner.language = Some("de".into());
        inner.remember_shown(shown(1, "4"));
        assert!(inner.is_for("https://a.example", 1));
        assert!(!inner.is_for("https://a.example", 2), "an answer of the session before is not for this one");
        assert!(!inner.is_for("https://b.example", 1));

        inner.start_over(Some("https://a.example".into()), Some(2));
        assert!(inner.is_for("https://a.example", 2));
        assert_eq!((inner.cursor.as_deref(), inner.etag.as_deref(), inner.shown.len()), (None, None, 0));
        assert_eq!(inner.language.as_deref(), Some("de"), "the page's language stays");
    }

    #[test]
    fn shown_notifications_are_remembered_once_and_not_without_end() {
        let mut inner = Inner::default();
        inner.remember_shown(shown(1, "4"));
        inner.remember_shown(shown(1, "8"));
        assert_eq!(inner.shown.len(), 1);
        assert_eq!(inner.shown[0].profile_id.as_deref(), Some("8"));
        for i in 0..(SHOWN_MAX as i32 + 10) {
            inner.remember_shown(shown(i + 2, "4"));
        }
        assert_eq!(inner.shown.len(), SHOWN_MAX);
    }

    #[test]
    fn cursors_say_whose_they_are() {
        // as BxDolApiV2Request::encodeCursor writes them: base64url of the JSON, no padding
        let cursor = URL_SAFE_NO_PAD.encode(br#"{"p":8,"n":120}"#);
        assert_eq!(cursor_profile(&cursor).as_deref(), Some("8"));
        assert_eq!(cursor_profile("not a cursor"), None);
        assert_eq!(cursor_profile(&URL_SAFE_NO_PAD.encode(br#"{"n":1}"#)), None);
    }

    #[test]
    fn clicks_say_which_profile_the_notification_was_for() {
        assert_eq!(open_payload(Some(&shown(5, "4"))), json!({ "notification": { "id": "5" }, "profile_id": "4" }));
        assert_eq!(open_payload(None), json!({ "notification": null, "profile_id": null }));
    }

    #[test]
    fn sync_answers_parse() {
        let body: SyncBody = serde_json::from_value(json!({
            "cursor": "c", "more": true, "reset": false, "lists": {},
            "badges": { "notifications": 2 },
            "changes": [
                { "type": "notification", "id": "9", "version": "abc", "data": { "read": false } },
                { "type": "activity", "id": "5", "version": "def", "data": { "id": "5" } },
                { "type": "notification", "id": "8", "gone": true }
            ]
        }))
        .unwrap();
        assert_eq!(body.cursor, "c");
        assert_eq!(body.badges.notifications, 2);
        assert!(!body.reset);
        assert!(body.more);
        let entries = body.notifications();
        assert_eq!(entries.len(), 1, "only notifications, and not tombstones");
        assert_eq!(entries[0].id, "9");
        assert_eq!(entries[0].data, json!({ "read": false }));
    }
}
