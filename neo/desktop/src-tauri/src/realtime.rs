//! Live events from the signed-in network's sockets server (GET /api/v2/realtime: Soketi, which
//! speaks Pusher's protocol over a WebSocket), here and not in the page, which has no network of
//! its own.
//!
//! One connection, to the active network's server. It listens to the channels the windows ask
//! for (`realtime_watch`: the feed's, an open post's comments) and to the viewer's connections
//! channel, and passes each event to the windows that asked for its channel (`realtime`:
//! `{ channel, event, data }`). The events carry ids, never content: the channels are public, so
//! the page loads what changed through the API, as the viewer may see it. A change to the
//! viewer's connections also polls the sync at once (sync.rs), for the friend requests badge.
//!
//! Channels are public ones only: a name with `private-` or `presence-` in front, or with
//! anything but letters, digits, `_`, `-` and `.`, is refused. Without a sockets server (or
//! signed out) there is no connection, and the sync's polling is all there is. A connection
//! that drops is opened again after a growing pause (1 s to a minute); another sign-in, another
//! network or another acting profile opens a new one.

use std::collections::{BTreeMap, BTreeSet, HashMap};
use std::sync::Mutex;
use std::time::Duration;

use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tauri::{AppHandle, Emitter, Manager, Runtime, State, WebviewWindow};
use tokio::sync::Notify;
use tokio_tungstenite::tungstenite::Message;
use url::Url;

use crate::auth;
use crate::availability::Availability;

/// The windows' event with each live event: `{ channel, event, data }`.
pub const REALTIME_EVENT: &str = "realtime";
/// Every window's event when the connection opens or closes, or the site's channels change.
pub const STATUS_EVENT: &str = "realtime-status";

/// Channels one window may listen to at once.
const MAX_CHANNELS: usize = 50;
const MAX_CHANNEL_LEN: usize = 160;
/// A message bigger than this is dropped (events are ids, a few hundred bytes).
const MAX_MESSAGE: usize = 64 * 1024;
const CONNECT_TIMEOUT: Duration = Duration::from_secs(15);
const HTTP_TIMEOUT: Duration = Duration::from_secs(20);
/// Pusher's: a ping when nothing came for this long (the server's own figure wins), and the wait
/// for its pong.
const ACTIVITY_TIMEOUT: Duration = Duration::from_secs(120);
const PONG_TIMEOUT: Duration = Duration::from_secs(30);
const BACKOFF_MIN: Duration = Duration::from_secs(1);
const BACKOFF_MAX: Duration = Duration::from_secs(60);
/// How long a site without a sockets server waits before it is asked again.
const DISABLED_RECHECK: Duration = Duration::from_secs(600);

/// What the windows know of the live events.
#[derive(Serialize, Clone, Debug, Default, PartialEq)]
pub struct Status {
    /// A connection is open now.
    pub connected: bool,
    /// The site's channels by what they carry (`activities`, `connections`), as GET /realtime
    /// names them; empty without a sockets server.
    pub channels: BTreeMap<String, String>,
}

/// GET /realtime's answer.
#[derive(Deserialize, Debug, Default, PartialEq)]
pub(crate) struct Info {
    #[serde(default)]
    pub enabled: bool,
    #[serde(default)]
    pub url: Option<String>,
    #[serde(default)]
    pub channels: BTreeMap<String, String>,
}

#[derive(Default)]
struct Inner {
    /// Each window's channels, by window label.
    watchers: HashMap<String, BTreeSet<String>>,
    /// The acting profile the windows say they show, so a profile switch reconnects (its
    /// connections channel is another).
    viewer: Option<String>,
    status: Status,
}

#[derive(Default)]
pub struct RealtimeState {
    inner: Mutex<Inner>,
    /// The windows' channels or the viewer changed.
    changed: Notify,
}

impl RealtimeState {
    fn lock(&self) -> std::sync::MutexGuard<'_, Inner> {
        self.inner.lock().unwrap_or_else(|e| e.into_inner())
    }

    /// Look again now (the site's API answers again, availability.rs).
    pub fn wake(&self) {
        self.changed.notify_one();
    }

    /// A window closed: its channels go.
    pub fn forget(&self, label: &str) {
        if self.lock().watchers.remove(label).is_some() {
            self.changed.notify_one();
        }
    }

    /// Every channel a window asked for, and the site's own `extra` ones.
    fn wanted(&self, extra: &[String]) -> BTreeSet<String> {
        let inner = self.lock();
        inner.watchers.values().flatten().cloned().chain(extra.iter().cloned()).collect()
    }

    fn viewer(&self) -> Option<String> {
        self.lock().viewer.clone()
    }

    /// The windows asking for `channel`.
    fn watching(&self, channel: &str) -> Vec<String> {
        self.lock().watchers.iter().filter(|(_, set)| set.contains(channel)).map(|(label, _)| label.clone()).collect()
    }
}

/// A public channel's name, as UNA makes them (`bx_timeline_0`, `cmts_bx_posts_12`).
pub(crate) fn valid_channel(name: &str) -> bool {
    !name.is_empty()
        && name.len() <= MAX_CHANNEL_LEN
        && !name.starts_with("private-")
        && !name.starts_with("presence-")
        && name.bytes().all(|b| b.is_ascii_alphanumeric() || matches!(b, b'_' | b'-' | b'.'))
}

/// The address GET /realtime gave, if it is a WebSocket one.
pub(crate) fn socket_url(info: &Info) -> Option<Url> {
    let url = Url::parse(info.url.as_deref()?).ok()?;
    matches!(url.scheme(), "ws" | "wss").then_some(url)
}

/// What to subscribe to and what to leave, going from `now` to `wanted`.
pub(crate) fn changes(now: &BTreeSet<String>, wanted: &BTreeSet<String>) -> (Vec<String>, Vec<String>) {
    (wanted.difference(now).cloned().collect(), now.difference(wanted).cloned().collect())
}

/// One message from the server, as Pusher's protocol has it.
#[derive(Debug, PartialEq)]
pub(crate) enum Frame {
    /// `pusher:connection_established`: the server's figure for the ping, in seconds.
    Established {
        activity_timeout: Option<u64>,
    },
    Ping,
    Pong,
    Error(String),
    /// Anything of the protocol's own (subscription_succeeded ...).
    Internal,
    /// A site event on a channel, its data parsed when it is JSON (Pusher sends it as a string).
    Event {
        channel: String,
        event: String,
        data: Value,
    },
}

pub(crate) fn parse_frame(text: &str) -> Option<Frame> {
    if text.len() > MAX_MESSAGE {
        return None;
    }
    let v: Value = serde_json::from_str(text).ok()?;
    let event = v.get("event")?.as_str()?;
    // data is a JSON string (Pusher's), or a value. UNA's events come encoded twice: sendEvent
    // takes JSON text, which the Pusher library encodes again, so a string that is JSON text
    // once more is read too.
    let data = match v.get("data") {
        Some(Value::String(s)) => match serde_json::from_str::<Value>(s) {
            Ok(Value::String(inner)) => serde_json::from_str::<Value>(&inner).ok().filter(|x| x.is_object() || x.is_array()).unwrap_or(Value::String(inner)),
            Ok(value) => value,
            Err(_) => Value::String(s.clone()),
        },
        Some(other) => other.clone(),
        None => Value::Null,
    };
    Some(match event {
        "pusher:connection_established" => Frame::Established { activity_timeout: data.get("activity_timeout").and_then(Value::as_u64) },
        "pusher:ping" => Frame::Ping,
        "pusher:pong" => Frame::Pong,
        "pusher:error" => Frame::Error(data.get("message").and_then(Value::as_str).unwrap_or("").to_string()),
        e if e.starts_with("pusher:") || e.starts_with("pusher_internal:") => Frame::Internal,
        e => Frame::Event { channel: v.get("channel")?.as_str()?.to_string(), event: e.to_string(), data },
    })
}

fn subscribe_message(channel: &str, subscribe: bool) -> Message {
    let event = if subscribe { "pusher:subscribe" } else { "pusher:unsubscribe" };
    Message::text(json!({ "event": event, "data": { "channel": channel } }).to_string())
}

fn ping_message() -> Message {
    Message::text(json!({ "event": "pusher:ping", "data": {} }).to_string())
}

fn pong_message() -> Message {
    Message::text(json!({ "event": "pusher:pong", "data": {} }).to_string())
}

/// The next pause after a connection that failed or dropped.
pub(crate) fn next_backoff(now: Duration) -> Duration {
    (now * 2).clamp(BACKOFF_MIN, BACKOFF_MAX)
}

/// Listen to these channels (the window's whole set: what it listened to before and is not in
/// it is left). `viewer` is the acting profile the window shows. Answers how things stand.
#[tauri::command]
pub fn realtime_watch(window: WebviewWindow, state: State<'_, RealtimeState>, channels: Vec<String>, viewer: Option<String>) -> Result<Status, String> {
    if channels.len() > MAX_CHANNELS {
        return Err(format!("At most {MAX_CHANNELS} channels"));
    }
    if let Some(bad) = channels.iter().find(|c| !valid_channel(c)) {
        return Err(format!("Not a public channel: {bad}"));
    }
    let set: BTreeSet<String> = channels.into_iter().collect();
    let mut inner = state.lock();
    let changed_viewer = viewer.is_some() && inner.viewer != viewer;
    if changed_viewer {
        inner.viewer = viewer;
    }
    let before = inner.watchers.insert(window.label().to_string(), set.clone());
    if changed_viewer || before.as_ref() != Some(&set) {
        state.changed.notify_one();
    }
    Ok(inner.status.clone())
}

fn set_status<R: Runtime>(app: &AppHandle<R>, status: Status) {
    let state = app.state::<RealtimeState>();
    let changed = {
        let mut inner = state.lock();
        let changed = inner.status != status;
        inner.status = status.clone();
        changed
    };
    if changed {
        let _ = app.emit(STATUS_EVENT, status);
    }
}

/// Why a connection ended.
enum Ended {
    /// The session, the network or the acting profile changed: connect again at once.
    Changed,
    /// It dropped or failed: connect again after a pause.
    Dropped(String),
}

pub fn start<R: Runtime>(app: AppHandle<R>) {
    tauri::async_runtime::spawn(async move {
        // rustls needs a crypto provider for the WebSocket's TLS; reqwest's is ring too
        let _ = rustls::crypto::ring::default_provider().install_default();
        let client = match reqwest::Client::builder().timeout(HTTP_TIMEOUT).build() {
            Ok(client) => client,
            Err(e) => {
                log::error!("realtime: {e}");
                return;
            }
        };
        let auth_state = app.state::<auth::AuthState>();
        // as the sync: the keychain is read once the page asks for the session
        auth_state.wait_loaded().await;
        let mut backoff = Duration::ZERO;
        loop {
            let ended = connect_once(&app, &client).await;
            set_status(&app, Status { connected: false, channels: app.state::<RealtimeState>().lock().status.channels.clone() });
            match ended {
                Ok(Some(Ended::Changed)) => backoff = Duration::ZERO,
                Ok(Some(Ended::Dropped(why))) => {
                    log::info!("realtime: {why}");
                    backoff = next_backoff(backoff);
                }
                // signed out, or no sockets server: wait for a change
                Ok(None) => {
                    backoff = Duration::ZERO;
                    let state = app.state::<RealtimeState>();
                    tokio::select! {
                        _ = state.changed.notified() => {}
                        _ = tokio::time::sleep(DISABLED_RECHECK) => {}
                    }
                    continue;
                }
                Err(e) => {
                    log::warn!("realtime: {e}");
                    backoff = next_backoff(backoff);
                }
            }
            tokio::time::sleep(backoff).await;
        }
    });
}

/// GET /realtime of the session's site; None when the site says its API is turned off.
async fn info(client: &reqwest::Client, site: &str, token: &str, availability: &Availability) -> Result<Option<Info>, String> {
    let url = format!("{}/api/v2/realtime", site.trim_end_matches('/'));
    let response = client
        .get(url)
        .bearer_auth(token)
        .header(reqwest::header::ACCEPT, "application/json")
        .send()
        .await
        .map_err(|e| format!("could not reach the site: {e}"))?;
    let status = response.status();
    if !status.is_success() {
        let body = response.bytes().await.unwrap_or_default();
        if availability.saw(site, status.as_u16(), &body).is_some() {
            return Ok(None);
        }
        return Err(format!("GET /realtime: {status}"));
    }
    response.json::<Info>().await.map(Some).map_err(|e| format!("GET /realtime: {e}"))
}

/// One connection, from asking the site where to its end. `Ok(None)`: nothing to connect to.
async fn connect_once<R: Runtime>(app: &AppHandle<R>, client: &reqwest::Client) -> Result<Option<Ended>, String> {
    let auth_state = app.state::<auth::AuthState>();
    let state = app.state::<RealtimeState>();
    // a site that said its API is turned off is not asked from here: the sync poll finds out
    // when it is back, and this is woken then (`wake`)
    if auth_state.site_url().is_some_and(|site| auth_state.availability.code(&site).is_some()) {
        set_status(app, Status::default());
        return Ok(None);
    }
    let Some(auth::SessionToken { site, token, generation }) = auth::session_token(&auth_state).await? else {
        set_status(app, Status::default());
        return Ok(None);
    };
    let viewer = state.viewer();
    let Some(info) = info(client, &site, &token, &auth_state.availability).await? else {
        set_status(app, Status::default());
        return Ok(None);
    };
    let Some(url) = info.enabled.then(|| socket_url(&info)).flatten() else {
        set_status(app, Status::default());
        return Ok(None);
    };
    // the site's own channels the shell listens to itself
    let connections = info.channels.get("connections").filter(|c| valid_channel(c)).cloned();
    let extra: Vec<String> = connections.iter().cloned().collect();

    let (mut socket, _) = tokio::time::timeout(CONNECT_TIMEOUT, tokio_tungstenite::connect_async(url.as_str()))
        .await
        .map_err(|_| "the sockets server did not answer".to_string())?
        .map_err(|e| format!("could not connect: {e}"))?;

    let mut subscribed: BTreeSet<String> = BTreeSet::new();
    let mut activity = ACTIVITY_TIMEOUT;
    let mut pinged = false;
    let mut established = false;
    let mut check = tokio::time::interval(Duration::from_secs(5));
    loop {
        // the ping when nothing came for the activity timeout, then the pong's wait
        let quiet = tokio::time::sleep(if pinged { PONG_TIMEOUT } else { activity });
        tokio::select! {
            message = socket.next() => {
                let text = match message {
                    Some(Ok(Message::Text(text))) => text,
                    Some(Ok(Message::Ping(payload))) => {
                        let _ = socket.send(Message::Pong(payload)).await;
                        continue;
                    }
                    Some(Ok(Message::Close(_))) | None => return Ok(Some(Ended::Dropped("the server closed the connection".into()))),
                    Some(Ok(_)) => continue,
                    Some(Err(e)) => return Ok(Some(Ended::Dropped(format!("connection lost: {e}")))),
                };
                pinged = false;
                match parse_frame(text.as_str()) {
                    Some(Frame::Established { activity_timeout }) => {
                        established = true;
                        if let Some(secs) = activity_timeout.filter(|s| *s > 0) {
                            activity = Duration::from_secs(secs).min(ACTIVITY_TIMEOUT);
                        }
                        sync_subscriptions(&mut socket, &mut subscribed, &state.wanted(&extra)).await?;
                        set_status(app, Status { connected: true, channels: info.channels.clone() });
                    }
                    Some(Frame::Ping) => {
                        let _ = socket.send(pong_message()).await;
                    }
                    Some(Frame::Error(message)) => log::warn!("realtime: the server says: {message}"),
                    Some(Frame::Event { channel, event, data }) if subscribed.contains(&channel) => {
                        if connections.as_deref() == Some(channel.as_str()) {
                            app.state::<crate::sync::SyncState>().wake();
                        }
                        let payload = json!({ "channel": channel, "event": event, "data": data });
                        for label in state.watching(&channel) {
                            let _ = app.emit_to(label.as_str(), REALTIME_EVENT, payload.clone());
                        }
                    }
                    _ => {}
                }
            }
            _ = state.changed.notified() => {
                if state.viewer() != viewer {
                    let _ = socket.close(None).await;
                    return Ok(Some(Ended::Changed));
                }
                if established {
                    sync_subscriptions(&mut socket, &mut subscribed, &state.wanted(&extra)).await?;
                }
            }
            _ = check.tick() => {
                if auth_state.generation() != generation {
                    let _ = socket.close(None).await;
                    return Ok(Some(Ended::Changed));
                }
            }
            _ = quiet => {
                if pinged {
                    return Ok(Some(Ended::Dropped("no pong".into())));
                }
                pinged = true;
                socket.send(ping_message()).await.map_err(|e| format!("could not ping: {e}"))?;
            }
        }
    }
}

async fn sync_subscriptions<S>(socket: &mut S, subscribed: &mut BTreeSet<String>, wanted: &BTreeSet<String>) -> Result<(), String>
where
    S: futures_util::Sink<Message> + Unpin,
    S::Error: std::fmt::Display,
{
    let (add, drop) = changes(subscribed, wanted);
    for channel in add {
        socket.send(subscribe_message(&channel, true)).await.map_err(|e| format!("could not subscribe: {e}"))?;
        subscribed.insert(channel);
    }
    for channel in drop {
        socket.send(subscribe_message(&channel, false)).await.map_err(|e| format!("could not unsubscribe: {e}"))?;
        subscribed.remove(&channel);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn only_public_channels_of_unas_names() {
        for good in ["bx_timeline_0", "cmts_bx_posts_12", "sys_connections_4", "a.b-c"] {
            assert!(valid_channel(good), "{good}");
        }
        for bad in ["", "private-sys_4", "presence-room", "a b", "a/b", "ä", &"x".repeat(MAX_CHANNEL_LEN + 1)] {
            assert!(!valid_channel(bad), "{bad}");
        }
    }

    #[test]
    fn only_websocket_addresses() {
        let info = |url: &str| Info { enabled: true, url: Some(url.into()), channels: BTreeMap::new() };
        assert_eq!(socket_url(&info("wss://s.example/app/k?protocol=7")).map(|u| u.host_str().map(str::to_string)), Some(Some("s.example".into())));
        assert!(socket_url(&info("ws://127.0.0.1:6001/app/k")).is_some());
        assert!(socket_url(&info("https://s.example/app/k")).is_none());
        assert!(socket_url(&info("not a url")).is_none());
        assert!(socket_url(&Info::default()).is_none());
    }

    #[test]
    fn subscriptions_follow_what_is_wanted() {
        let set = |a: &[&str]| a.iter().map(|s| s.to_string()).collect::<BTreeSet<_>>();
        assert_eq!(changes(&set(&["a", "b"]), &set(&["b", "c"])), (vec!["c".to_string()], vec!["a".to_string()]));
        assert_eq!(changes(&set(&[]), &set(&[])), (vec![], vec![]));
    }

    #[test]
    fn frames_parse_as_pusher_sends_them() {
        assert_eq!(
            parse_frame(r#"{"event":"pusher:connection_established","data":"{\"socket_id\":\"1.2\",\"activity_timeout\":30}"}"#),
            Some(Frame::Established { activity_timeout: Some(30) })
        );
        assert_eq!(parse_frame(r#"{"event":"pusher:ping","data":{}}"#), Some(Frame::Ping));
        assert_eq!(parse_frame(r#"{"event":"pusher_internal:subscription_succeeded","channel":"bx_timeline_0","data":"{}"}"#), Some(Frame::Internal));
        assert_eq!(parse_frame(r#"{"event":"pusher:error","data":{"message":"Over quota","code":4004}}"#), Some(Frame::Error("Over quota".into())));
        assert_eq!(
            parse_frame(r#"{"event":"added","channel":"bx_timeline_0","data":"{\"id\":\"12\",\"author_id\":4}"}"#),
            Some(Frame::Event { channel: "bx_timeline_0".into(), event: "added".into(), data: json!({ "id": "12", "author_id": 4 }) })
        );
        // UNA's: the JSON text encoded again by the Pusher library (as Soketi passed it on)
        assert_eq!(
            parse_frame(r#"{"event":"added","channel":"bx_timeline_0","data":"\"{\\\"id\\\":12345,\\\"author_id\\\":4}\""}"#),
            Some(Frame::Event { channel: "bx_timeline_0".into(), event: "added".into(), data: json!({ "id": 12345, "author_id": 4 }) })
        );
        // data that is not JSON stays a string; a site event needs its channel
        assert_eq!(
            parse_frame(r#"{"event":"x","channel":"c_1","data":"plain"}"#),
            Some(Frame::Event { channel: "c_1".into(), event: "x".into(), data: json!("plain") })
        );
        assert_eq!(parse_frame(r#"{"event":"x","data":"{}"}"#), None);
        assert_eq!(parse_frame("not json"), None);
        assert_eq!(parse_frame(&format!(r#"{{"event":"x","channel":"c","data":"{}"}}"#, "a".repeat(MAX_MESSAGE))), None);
    }

    #[test]
    fn a_dropped_connection_waits_longer_each_time() {
        assert_eq!(next_backoff(Duration::ZERO), BACKOFF_MIN);
        assert_eq!(next_backoff(Duration::from_secs(4)), Duration::from_secs(8));
        assert_eq!(next_backoff(Duration::from_secs(50)), BACKOFF_MAX);
    }

    #[test]
    fn a_window_listens_to_its_own_set() {
        let state = RealtimeState::default();
        state.lock().watchers.insert("main".into(), ["bx_timeline_0".to_string()].into());
        state.lock().watchers.insert("win-1".into(), ["cmts_bx_timeline_12".to_string(), "bx_timeline_0".to_string()].into());
        let wanted = state.wanted(&["sys_connections_4".to_string()]);
        assert_eq!(wanted.into_iter().collect::<Vec<_>>(), ["bx_timeline_0", "cmts_bx_timeline_12", "sys_connections_4"]);
        let mut watching = state.watching("bx_timeline_0");
        watching.sort();
        assert_eq!(watching, ["main", "win-1"]);
        state.forget("win-1");
        assert_eq!(state.watching("cmts_bx_timeline_12"), Vec::<String>::new());
    }

    /// A Pusher server on this machine: the client subscribes to what is wanted once the
    /// connection is established, answers a ping, and the events of its channels come through.
    #[tokio::test]
    async fn speaks_pusher_with_a_server() {
        use tokio::net::TcpListener;

        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();
        let server = tokio::spawn(async move {
            let (tcp, _) = listener.accept().await.unwrap();
            let mut ws = tokio_tungstenite::accept_async(tcp).await.unwrap();
            ws.send(Message::text(r#"{"event":"pusher:connection_established","data":"{\"socket_id\":\"1.1\",\"activity_timeout\":120}"}"#)).await.unwrap();
            let mut got = Vec::new();
            while got.len() < 2 {
                if let Some(Ok(Message::Text(t))) = ws.next().await {
                    got.push(serde_json::from_str::<Value>(t.as_str()).unwrap());
                }
            }
            ws.send(Message::text(r#"{"event":"pusher:ping","data":{}}"#)).await.unwrap();
            let pong = loop {
                if let Some(Ok(Message::Text(t))) = ws.next().await {
                    break serde_json::from_str::<Value>(t.as_str()).unwrap();
                }
            };
            ws.send(Message::text(r#"{"event":"added","channel":"bx_timeline_0","data":"{\"id\":\"7\"}"}"#)).await.unwrap();
            (got, pong)
        });

        let (mut socket, _) = tokio_tungstenite::connect_async(format!("ws://{addr}/app/k?protocol=7")).await.unwrap();
        let first = socket.next().await.unwrap().unwrap();
        assert!(matches!(parse_frame(first.to_text().unwrap()), Some(Frame::Established { .. })));
        let wanted: BTreeSet<String> = ["bx_timeline_0".to_string(), "sys_connections_4".to_string()].into();
        let mut subscribed = BTreeSet::new();
        sync_subscriptions(&mut socket, &mut subscribed, &wanted).await.unwrap();
        assert_eq!(subscribed, wanted);
        let ping = socket.next().await.unwrap().unwrap();
        assert_eq!(parse_frame(ping.to_text().unwrap()), Some(Frame::Ping));
        socket.send(pong_message()).await.unwrap();
        let event = socket.next().await.unwrap().unwrap();
        assert_eq!(
            parse_frame(event.to_text().unwrap()),
            Some(Frame::Event { channel: "bx_timeline_0".into(), event: "added".into(), data: json!({ "id": "7" }) })
        );

        let (got, pong) = server.await.unwrap();
        assert_eq!(
            got,
            [
                json!({ "event": "pusher:subscribe", "data": { "channel": "bx_timeline_0" } }),
                json!({ "event": "pusher:subscribe", "data": { "channel": "sys_connections_4" } })
            ]
        );
        assert_eq!(pong["event"], "pusher:pong");
    }

    /// Against a real sockets server, by hand: `REALTIME_CHECK_URL=ws://127.0.0.1:6001/app/key?protocol=7
    /// cargo test against_a_sockets_server -- --ignored --nocapture`, then send an event to
    /// `bx_timeline_0` within 60 s (UNA's Pusher library, as BxDolSocketsSoketi does).
    #[tokio::test]
    #[ignore]
    async fn against_a_sockets_server() {
        let url = std::env::var("REALTIME_CHECK_URL").expect("REALTIME_CHECK_URL");
        let info = Info { enabled: true, url: Some(url), channels: BTreeMap::new() };
        let url = socket_url(&info).expect("a ws or wss address");
        let (mut socket, _) = tokio_tungstenite::connect_async(url.as_str()).await.expect("connects");
        let first = socket.next().await.unwrap().unwrap();
        let Some(Frame::Established { activity_timeout }) = parse_frame(first.to_text().unwrap()) else { panic!("not established: {first:?}") };
        println!("established, activity timeout {activity_timeout:?}");
        let wanted: BTreeSet<String> = ["bx_timeline_0".to_string()].into();
        let mut subscribed = BTreeSet::new();
        sync_subscriptions(&mut socket, &mut subscribed, &wanted).await.unwrap();
        println!("subscribed; send an event to bx_timeline_0 now");
        let event = tokio::time::timeout(Duration::from_secs(60), async {
            loop {
                let m = socket.next().await.unwrap().unwrap();
                match parse_frame(m.to_text().unwrap_or("")) {
                    Some(f @ Frame::Event { .. }) => break f,
                    other => println!("frame: {other:?}"),
                }
            }
        })
        .await
        .expect("an event within 60 s");
        println!("event: {event:?}");
        assert!(matches!(event, Frame::Event { ref channel, .. } if channel == "bx_timeline_0"));
    }
}
