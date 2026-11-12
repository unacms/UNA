//! Sign-in for native apps (RFC 8252): the system browser opens the site's OAuth 2 authorize
//! page, the person approves the app there, the code comes back to a loopback port, and the code
//! is exchanged with PKCE (RFC 7636). Tokens stay on this side: the refresh token never reaches
//! the web view, which asks for a current access token before each request. They are kept in the
//! OS keychain.
//!
//! Several networks: each sign-in is a session of one site and one account (its key is
//! `site|account`), kept in the keychain under that key, with a list of them and which one is
//! active. Only the active session gives tokens: the page names the session it has
//! (`access_token`), Rust's own requests take the active one with its site, so one site's token
//! never goes to another site. Switching (`switch_session`) is a new generation, as a sign-in is.
//!
//! The keychain is read once, after the window is on screen (`ensure_loaded`, from the first
//! command that needs it), never while the app starts: macOS may ask the person to allow it, and
//! a prompt before the event loop runs leaves the app without a window. A read that fails (access
//! denied, a locked keychain) keeps the entries and is tried again by the next command; until a
//! read succeeds the app is signed out and the poller waits (`wait_loaded`).
//!
//! The web view has no network of its own and never holds a token: its requests to the site's
//! API go out from api.rs, which attaches the token of the session the page names, and before
//! sign-in the site is looked up from here (`discover_site`).

use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use tauri::{AppHandle, Manager, Runtime, State};
use tauri_plugin_opener::OpenerExt;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::{mpsc, oneshot};
use url::Url;

use crate::availability::{self, off_at, off_code, off_here, Availability};
use crate::i18n::{tr, tr_vars, trn};

const KEYRING_SERVICE: &str = crate::brand::IDENTIFIER;
/// The one session of versions before several networks; read once and moved to the list.
const LEGACY_ENTRY: &str = "session";
/// The keys of the sessions and which one is active (no secrets).
const INDEX_ENTRY: &str = "sessions";
/// An index that could not be read, kept as it was instead of being written over.
const DAMAGED_INDEX_ENTRY: &str = "sessions.unreadable";
const SIGN_IN_TIMEOUT: Duration = Duration::from_secs(300);
/// How long one connection to the loopback listener may take to send its request line and headers.
const CALLBACK_READ_TIMEOUT: Duration = Duration::from_secs(5);
const HTTP_TIMEOUT: Duration = Duration::from_secs(20);
/// Each revocation at sign-out; it runs after the session is gone here, so it only bounds the task.
const REVOKE_TIMEOUT: Duration = Duration::from_secs(5);
const REFRESH_MARGIN_SECS: u64 = 60;
/// The most networks the app keeps (Cmd+Ctrl+1 to 9 switch between them).
pub const MAX_SESSIONS: usize = 9;

/// What a sign-in stopped by cancel_sign_in answers.
fn cancelled() -> String {
    tr("Sign-in was cancelled")
}

#[derive(Clone, Serialize, Deserialize)]
struct StoredSession {
    site_url: String,
    token_endpoint: String,
    revocation_endpoint: String,
    client_id: String,
    access_token: String,
    refresh_token: Option<String>,
    expires_at: u64,
    /// The account on the site (GET /api/v2/me); empty for a session of an older version.
    #[serde(default)]
    account_id: String,
    /// The network's name (its discovery document), for the session list.
    #[serde(default)]
    site_name: String,
    /// The profile that acted at sign-in, for the session list.
    #[serde(default)]
    account_name: String,
    /// The site no longer takes this sign-in (its refresh token was refused): the network stays
    /// in the list, signed out, until the person signs in again or signs out of it.
    #[serde(default)]
    refused: bool,
}

/// The key of a session: one site and one account. A site's address has no `|` (check_site_url).
pub(crate) fn session_key(site_url: &str, account_id: &str) -> String {
    format!("{}|{}", site_url.trim_end_matches('/'), account_id)
}

impl StoredSession {
    fn key(&self) -> String {
        session_key(&self.site_url, &self.account_id)
    }
}

/// The signed-in site and which sign-in it is (`AuthState::generation`): a page keeps both and
/// names them when it asks for a token (access_token), so it never gets another session's.
#[derive(Serialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SessionInfo {
    site_url: String,
    generation: u64,
    /// The session's key (`site|account`): what the page keys what it saves by.
    key: String,
    site_name: String,
    account_name: String,
    /// The site signed this sign-in out: the page asks to sign in again (no token is given).
    needs_sign_in: bool,
}

/// One network of the session list.
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SessionSummary {
    key: String,
    site_url: String,
    site_name: String,
    account_name: String,
    active: bool,
    /// Signed out by the site: kept in the list until signed in again (or signed out of).
    #[serde(default)]
    needs_sign_in: bool,
}

impl SessionSummary {
    pub fn site_url(&self) -> &str {
        &self.site_url
    }

    /// What the menu and the switcher call it.
    pub fn label(&self) -> String {
        let site = if self.site_name.is_empty() {
            Url::parse(&self.site_url).ok().and_then(|u| u.host_str().map(str::to_string)).unwrap_or_else(|| self.site_url.clone())
        } else {
            self.site_name.clone()
        };
        let label = if self.account_name.is_empty() { site } else { format!("{site} – {}", self.account_name) };
        if self.needs_sign_in {
            tr_vars("{{network}} (signed out)", &[("network", &label)])
        } else {
            label
        }
    }
}

/// The keys of the sessions in the keychain, in the order they were added, and the active one.
#[derive(Default, Serialize, Deserialize, Debug, PartialEq)]
struct Index {
    keys: Vec<String>,
    active: Option<String>,
}

/// The sessions in memory and which one is active.
#[derive(Default)]
struct Sessions {
    list: Vec<StoredSession>,
    active: Option<String>,
    /// Keys the index named whose entries are no longer in the vault: the next index leaves
    /// them out. (A key whose entry is there but unreadable is kept: see save_index.)
    gone: Vec<String>,
}

impl Sessions {
    fn active(&self) -> Option<&StoredSession> {
        let key = self.active.as_ref()?;
        self.list.iter().find(|s| &s.key() == key)
    }

    fn find(&self, key: &str) -> Option<&StoredSession> {
        self.list.iter().find(|s| s.key() == key)
    }

    /// Add a session, or replace the one with the same key in its place.
    fn put(&mut self, session: StoredSession) {
        let key = session.key();
        match self.list.iter().position(|s| s.key() == key) {
            Some(i) => self.list[i] = session,
            None => self.list.push(session),
        }
    }

    fn remove(&mut self, key: &str) -> Option<StoredSession> {
        let i = self.list.iter().position(|s| s.key() == key)?;
        if self.active.as_deref() == Some(key) {
            self.active = None;
        }
        Some(self.list.remove(i))
    }

    fn index(&self) -> Index {
        Index { keys: self.list.iter().map(StoredSession::key).collect(), active: self.active.clone() }
    }

    fn summaries(&self) -> Vec<SessionSummary> {
        self.list
            .iter()
            .map(|s| SessionSummary {
                key: s.key(),
                site_url: s.site_url.clone(),
                site_name: s.site_name.clone(),
                account_name: s.account_name.clone(),
                active: self.active.as_deref() == Some(s.key().as_str()),
                needs_sign_in: s.refused,
            })
            .collect()
    }
}

/// Where sessions are kept: the OS keychain, or memory in tests.
pub(crate) trait Vault: Send + Sync {
    /// `Ok(None)` when there is no such entry; `Err` when it could not be read (access denied,
    /// a locked keychain), which is not the same as signed out.
    fn get(&self, entry: &str) -> Result<Option<String>, String>;
    fn set(&self, entry: &str, value: &str) -> Result<(), String>;
    fn delete(&self, entry: &str);
}

/// The OS keychain (macOS Keychain, Windows Credential Manager, the Secret Service on Linux).
struct Keychain;

impl Keychain {
    fn entry(name: &str) -> Result<keyring::Entry, String> {
        keyring::Entry::new(KEYRING_SERVICE, name).map_err(|e| e.to_string())
    }
}

impl Vault for Keychain {
    fn get(&self, entry: &str) -> Result<Option<String>, String> {
        match Self::entry(entry)?.get_password() {
            Ok(value) => Ok(Some(value)),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(e) => Err(e.to_string()),
        }
    }

    fn set(&self, entry: &str, value: &str) -> Result<(), String> {
        Self::entry(entry)?.set_password(value).map_err(|e| tr_vars("Could not save the sign-in in the keychain: {{reason}}", &[("reason", &e.to_string())]))
    }

    fn delete(&self, entry: &str) {
        if let Ok(e) = Self::entry(entry) {
            let _ = e.delete_credential();
        }
    }
}

/// A session's own keychain entry.
fn session_entry(key: &str) -> String {
    format!("session:{key}")
}

/// What the page is told when the keychain could not be read, with the reason.
fn keychain_error(reason: &str) -> String {
    tr_vars("{{app}} couldn't read your sign-in from the keychain: {{reason}}", &[("app", crate::brand::NAME), ("reason", reason)])
}

pub struct AuthState {
    sessions: Mutex<Sessions>,
    vault: Arc<dyn Vault>,
    // the keychain read: done once it succeeded (signed in or not); a failed one is tried again
    loaded: tokio::sync::OnceCell<()>,
    // true once the read succeeded, for those who wait for it without starting it (sync.rs)
    loaded_tx: tokio::sync::watch::Sender<bool>,
    // the active site's capability and the menu's network items were set after the read
    announced: AtomicBool,
    // which sign-in the active session is: changed on every sign-in, switch and sign-out (a
    // refresh keeps it), under the sessions' lock, so an answer to a request of an earlier
    // session is known as one
    generation: AtomicU64,
    // one refresh at a time: parallel requests wait for the same new token, and sign-out and
    // switching wait for a refresh in flight, so a renewed session can't come back after it
    refresh: tokio::sync::Mutex<()>,
    // the sign-in waiting for the browser, which cancel_sign_in stops
    pending: Mutex<Option<oneshot::Sender<()>>>,
    // the local development site last looked up on the sign-in screen (discover_site): its
    // branding pictures may go through una-media before it is signed in to (media.rs), read only
    previewed: Mutex<Option<String>>,
    // a session was marked signed out where no app handle was at hand (a refresh refused while
    // a token was asked for): the menu says so at the next command that has one
    menu_stale: AtomicBool,
    // the session whose refused token was renewed at once (token_refused), and when: a token
    // refused again that soon is the site signing it out, not its clock
    forced: Mutex<Option<(String, std::time::Instant)>>,
    /// The sites that said their API is turned off (availability.rs): kept here so it is at
    /// hand wherever a request is sent with a session's token.
    pub availability: Availability,
}

impl AuthState {
    /// The state before the keychain is read: signed out until `ensure_loaded`.
    pub fn pending() -> Self {
        Self::pending_with(Arc::new(Keychain))
    }

    fn pending_with(vault: Arc<dyn Vault>) -> Self {
        Self {
            sessions: Mutex::new(Sessions::default()),
            vault,
            loaded: tokio::sync::OnceCell::new(),
            loaded_tx: tokio::sync::watch::Sender::new(false),
            announced: AtomicBool::new(false),
            generation: AtomicU64::new(0),
            refresh: tokio::sync::Mutex::new(()),
            pending: Mutex::new(None),
            previewed: Mutex::new(None),
            menu_stale: AtomicBool::new(false),
            forced: Mutex::new(None),
            availability: Availability::default(),
        }
    }

    /// Read the keychain once, off the main thread (it may wait for the person to allow it).
    /// Parallel callers wait for the same read. A failed read is kept apart from "signed out":
    /// nothing is deleted, the error is answered, and the next caller tries again.
    pub async fn ensure_loaded(&self) -> Result<(), String> {
        self.loaded
            .get_or_try_init(|| async {
                let vault = self.vault.clone();
                let read = tauri::async_runtime::spawn_blocking(move || read_sessions(vault.as_ref())).await.map_err(|e| keychain_error(&e.to_string()))?;
                match read {
                    Ok(sessions) => {
                        *self.lock() = sessions;
                        self.loaded_tx.send_replace(true);
                        Ok(())
                    }
                    Err(e) => {
                        log::warn!("keychain: {e}");
                        Err(keychain_error(&e))
                    }
                }
            })
            .await
            .map(|_| ())
    }

    /// Wait until a keychain read has succeeded, without starting one (the poller: the read
    /// belongs after the window shows, when the page asks for the session).
    pub async fn wait_loaded(&self) {
        let mut loaded = self.loaded_tx.subscribe();
        let _ = loaded.wait_for(|done| *done).await;
    }

    /// The local site looked up last on the sign-in screen (none for an https one: its pictures
    /// need no help), whose mark the preview shows before it is signed in to.
    pub fn previewed_site(&self) -> Option<String> {
        self.previewed.lock().unwrap_or_else(|e| e.into_inner()).clone()
    }

    pub(crate) fn set_previewed_site(&self, site: &Url) {
        let local = site.scheme() == "http" && is_local_host(site);
        *self.previewed.lock().unwrap_or_else(|e| e.into_inner()) = local.then(|| site.origin().ascii_serialization());
    }

    pub fn site_url(&self) -> Option<String> {
        self.get().map(|s| s.site_url)
    }

    fn lock(&self) -> std::sync::MutexGuard<'_, Sessions> {
        self.sessions.lock().unwrap_or_else(|e| e.into_inner())
    }

    fn get(&self) -> Option<StoredSession> {
        self.lock().active().cloned()
    }

    /// The active session and which sign-in it is, read together.
    fn get_with_generation(&self) -> (Option<StoredSession>, u64) {
        let sessions = self.lock();
        (sessions.active().cloned(), self.generation.load(Ordering::SeqCst))
    }

    /// Which sign-in is current: another one after a sign-in, switch or sign-out, the same after a refresh.
    pub fn generation(&self) -> u64 {
        let _sessions = self.lock();
        self.generation.load(Ordering::SeqCst)
    }

    /// The active session as the page knows it.
    fn info(&self) -> Option<SessionInfo> {
        let sessions = self.lock();
        let generation = self.generation.load(Ordering::SeqCst);
        sessions.active().map(|s| info_of(s, generation))
    }

    /// The networks signed in to, in the order they were added.
    pub fn summaries(&self) -> Vec<SessionSummary> {
        self.lock().summaries()
    }

    /// A new sign-in: kept (replacing a sign-in of the same account on the same site, and the
    /// one of an older version on that site, whose account is not known) and active, another
    /// generation.
    /// Answers the sessions it replaced, whose tokens nothing holds any more (to revoke).
    fn add(&self, session: StoredSession) -> Result<Vec<StoredSession>, String> {
        let json = serde_json::to_string(&session).map_err(|e| e.to_string())?;
        let key = session.key();
        let mut sessions = self.lock();
        // the kept list first: a sign-in never replaces a list that was not read
        self.check_loaded()?;
        if sessions.find(&key).is_none() && sessions.list.len() >= MAX_SESSIONS {
            return Err(trn(
                MAX_SESSIONS as u64,
                "The app keeps up to {{count}} network: sign out of one first",
                "The app keeps up to {{count}} networks: sign out of one first",
            ));
        }
        self.vault.set(&session_entry(&key), &json)?;
        let older: Vec<String> =
            sessions.list.iter().filter(|s| s.account_id.is_empty() && s.site_url == session.site_url && s.key() != key).map(StoredSession::key).collect();
        let mut replaced = Vec::new();
        for old in &older {
            replaced.extend(sessions.remove(old));
            self.vault.delete(&session_entry(old));
        }
        // signed in again to the same account: the earlier sign-in's tokens go too (a sign-in
        // the site had signed out has none left)
        replaced.extend(
            sessions.find(&key).filter(|s| !s.refused && (s.refresh_token != session.refresh_token || s.access_token != session.access_token)).cloned(),
        );
        sessions.put(session);
        sessions.active = Some(key);
        self.generation.fetch_add(1, Ordering::SeqCst);
        self.save_index_logged(&sessions, &older);
        Ok(replaced)
    }

    /// The same sign-in with new tokens (a refresh): the same generation. A session that was
    /// signed out meanwhile stays out.
    fn renew(&self, session: StoredSession) -> Result<(), String> {
        let key = session.key();
        let mut sessions = self.lock();
        if sessions.find(&key).is_none_or(|s| s.refused) {
            return Ok(());
        }
        let json = serde_json::to_string(&session).map_err(|e| e.to_string())?;
        self.vault.set(&session_entry(&key), &json)?;
        sessions.put(session);
        Ok(())
    }

    /// Forget a session: only when the person signs out of it. When it was the active one, none
    /// is active now: another generation.
    fn remove(&self, key: &str) -> Option<StoredSession> {
        let mut sessions = self.lock();
        let was_active = sessions.active.as_deref() == Some(key);
        let removed = sessions.remove(key);
        if removed.is_some() {
            self.vault.delete(&session_entry(key));
            self.save_index_logged(&sessions, &[key.to_string()]);
        }
        if was_active {
            self.generation.fetch_add(1, Ordering::SeqCst);
        }
        removed
    }

    /// The site no longer takes a session (its refresh token was refused): it stays in the list,
    /// signed out, without its tokens, until the person signs in again or signs out of it. When
    /// it is the active one, it stays active, as another generation: no page gets a token of it,
    /// and the page asks to sign in again. True when it was not marked yet.
    fn refuse(&self, key: &str) -> bool {
        let mut sessions = self.lock();
        let active = sessions.active.as_deref() == Some(key);
        let Some(session) = sessions.list.iter_mut().find(|s| s.key() == key && !s.refused) else {
            return false;
        };
        session.refused = true;
        session.access_token.clear();
        session.refresh_token = None;
        session.expires_at = 0;
        match serde_json::to_string(&*session) {
            // kept in memory either way: a failed write only means the same refusal next launch
            Ok(json) => {
                if let Err(e) = self.vault.set(&session_entry(key), &json) {
                    log::warn!("sessions: {e}");
                }
            }
            Err(e) => log::warn!("sessions: {e}"),
        }
        if active {
            self.generation.fetch_add(1, Ordering::SeqCst);
        }
        self.menu_stale.store(true, Ordering::SeqCst);
        log::warn!("sessions: {} signed this sign-in out; kept in the list to sign in again", key.split('|').next().unwrap_or_default());
        true
    }

    /// Give the active session the network's name when its sign-in kept none (one of an older
    /// version): true when it changed. Only an empty name is filled, and only the active one's.
    fn name_active(&self, key: &str, name: &str) -> Result<bool, String> {
        let mut sessions = self.lock();
        if sessions.active.as_deref() != Some(key) {
            return Ok(false);
        }
        let Some(session) = sessions.list.iter_mut().find(|s| s.key() == key && s.site_name.is_empty()) else {
            return Ok(false);
        };
        session.site_name = name.to_string();
        let json = serde_json::to_string(&*session).map_err(|e| e.to_string())?;
        // kept in memory either way: the keychain only saves asking again next time
        if let Err(e) = self.vault.set(&session_entry(key), &json) {
            log::warn!("sessions: {e}");
        }
        Ok(true)
    }

    /// Make a kept session the active one: another generation, as a sign-in is.
    fn activate(&self, key: &str) -> Result<SessionInfo, String> {
        let mut sessions = self.lock();
        let Some(session) = sessions.find(key).cloned() else {
            return Err(tr("That network is not signed in"));
        };
        if sessions.active.as_deref() != Some(key) {
            sessions.active = Some(key.to_string());
            self.generation.fetch_add(1, Ordering::SeqCst);
            self.save_index_logged(&sessions, &[]);
        }
        Ok(info_of(&session, self.generation.load(Ordering::SeqCst)))
    }

    /// Err until the vault was read: nothing may write the index before that.
    fn check_loaded(&self) -> Result<(), String> {
        if *self.loaded_tx.borrow() {
            Ok(())
        } else {
            Err(tr_vars("{{app}} couldn't read your sign-in from the keychain: the networks were not read yet", &[("app", crate::brand::NAME)]))
        }
    }

    /// Write the index (merged_index): never before the vault was read, and never over an
    /// index that can't be read now. No write replaces a list it has not seen.
    fn save_index(&self, sessions: &Sessions, dropped: &[String]) -> Result<(), String> {
        self.check_loaded()?;
        let kept: Index = match self.vault.get(INDEX_ENTRY)? {
            None => Index::default(),
            Some(json) => serde_json::from_str(&json).map_err(|e| format!("the index in the keychain is not readable: {e}"))?,
        };
        let json = serde_json::to_string(&merged_index(sessions, &kept, dropped)).map_err(|e| e.to_string())?;
        self.vault.set(INDEX_ENTRY, &json)
    }

    /// The same, where a failure only means the order or the active one is not kept for next time.
    fn save_index_logged(&self, sessions: &Sessions, dropped: &[String]) {
        if let Err(e) = self.save_index(sessions, dropped) {
            log::warn!("sessions: the index was not written: {e}");
        }
    }

    /// The menu names a session the site signed out once some command with an app handle runs.
    fn announce_refusals<R: Runtime>(&self, app: &AppHandle<R>) {
        if self.menu_stale.swap(false, Ordering::SeqCst) {
            sessions_changed(app, self);
        }
    }
}

/// The index to write: the sessions in memory and the active one, then the keys of the index in
/// the vault (`kept`) that memory doesn't have: an entry this version could not read, or one
/// another copy of the app added. Only keys signed out of here (`dropped`) and keys whose entries
/// are gone leave it.
fn merged_index(sessions: &Sessions, kept: &Index, dropped: &[String]) -> Index {
    let mut index = sessions.index();
    for key in &kept.keys {
        if !index.keys.contains(key) && !dropped.contains(key) && !sessions.gone.contains(key) {
            index.keys.push(key.clone());
        }
    }
    index
}

/// The sessions the vault keeps; the one session of an older version is moved to the list.
/// Any entry that can't be read fails the whole read, so nothing is lost or written over.
fn read_sessions(vault: &dyn Vault) -> Result<Sessions, String> {
    let mut sessions = Sessions::default();
    let index: Index = match vault.get(INDEX_ENTRY)? {
        None => Index::default(),
        Some(json) => match serde_json::from_str(&json) {
            Ok(index) => index,
            Err(e) => {
                // kept aside, not written over: the sessions it named stay in their entries
                log::warn!("sessions: the index is not readable ({e}); kept as {DAMAGED_INDEX_ENTRY}");
                vault.set(DAMAGED_INDEX_ENTRY, &json)?;
                vault.delete(INDEX_ENTRY);
                Index::default()
            }
        },
    };
    for key in &index.keys {
        match vault.get(&session_entry(key))? {
            None => sessions.gone.push(key.clone()),
            Some(json) => match serde_json::from_str::<StoredSession>(&json) {
                Ok(session) if session.key() == *key => sessions.put(session),
                // not one this version reads: left as it is, its key stays in the index
                _ => log::warn!("sessions: the entry of {key} is not readable; kept"),
            },
        }
    }
    sessions.active = index.active.clone().filter(|k| sessions.find(k).is_some());

    if let Some(session) = vault.get(LEGACY_ENTRY)?.and_then(|s| serde_json::from_str::<StoredSession>(&s).ok()) {
        let key = session.key();
        if sessions.find(&key).is_none() {
            if let Ok(json) = serde_json::to_string(&session) {
                let _ = vault.set(&session_entry(&key), &json);
            }
            sessions.put(session);
            sessions.active.get_or_insert(key);
        }
        if let Ok(json) = serde_json::to_string(&merged_index(&sessions, &index, &[])) {
            let _ = vault.set(INDEX_ENTRY, &json);
        }
        vault.delete(LEGACY_ENTRY);
    }
    Ok(sessions)
}

/// The keychain read (once), then what follows from it, once: the menu names the networks. Every command that reads or changes sessions starts here.
async fn ready<R: Runtime>(app: &AppHandle<R>, state: &AuthState) -> Result<(), String> {
    state.ensure_loaded().await?;
    if !state.announced.swap(true, Ordering::SeqCst) {
        sessions_changed(app, state);
    }
    Ok(())
}

fn info_of(session: &StoredSession, generation: u64) -> SessionInfo {
    SessionInfo {
        site_url: session.site_url.clone(),
        generation,
        key: session.key(),
        site_name: session.site_name.clone(),
        account_name: session.account_name.clone(),
        needs_sign_in: session.refused,
    }
}

fn now() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0)
}

fn random_b64(bytes: usize) -> String {
    let mut buf = vec![0u8; bytes];
    rand::thread_rng().fill_bytes(&mut buf);
    URL_SAFE_NO_PAD.encode(buf)
}

/// The PKCE S256 code challenge of a verifier (RFC 7636 4.2).
fn pkce_challenge(verifier: &str) -> String {
    URL_SAFE_NO_PAD.encode(Sha256::digest(verifier.as_bytes()))
}

/// An access token that expires within the margin is renewed before it is handed out.
fn needs_refresh(expires_at: u64, now: u64) -> bool {
    expires_at <= now.saturating_add(REFRESH_MARGIN_SECS)
}

pub(crate) fn is_local_host(url: &Url) -> bool {
    matches!(url.host_str(), Some(h) if h == "localhost" || h == "127.0.0.1" || h.ends_with(".localhost"))
}

/// A site address: https, or http on a local development host; no user info, query or fragment.
fn check_site_url(site_url: &str) -> Result<Url, String> {
    let url = Url::parse(site_url.trim()).map_err(|_| tr("The site address is not a URL"))?;
    if url.scheme() != "https" && !(url.scheme() == "http" && is_local_host(&url)) {
        return Err(tr("The site address must use https"));
    }
    // `|` separates the site from the account in a session's key
    if url.host_str().is_none()
        || !url.username().is_empty()
        || url.password().is_some()
        || url.query().is_some()
        || url.fragment().is_some()
        || url.as_str().contains('|')
    {
        return Err(tr("The site address is not a plain site URL"));
    }
    Ok(url)
}

/// An endpoint the discovery document names must be on the site itself, and over https
/// unless the site is a local development host.
fn check_endpoint(site: &Url, endpoint: &str) -> Result<Url, String> {
    let url = Url::parse(endpoint).map_err(|_| tr_vars("Not a URL: {{address}}", &[("address", endpoint)]))?;
    if url.host_str() != site.host_str() || url.port_or_known_default() != site.port_or_known_default() {
        return Err(tr_vars("{{address}} is not on {{site}}", &[("address", endpoint), ("site", site.as_str())]));
    }
    if url.scheme() != "https" && !(is_local_host(&url) && url.scheme() == "http") {
        return Err(tr_vars("{{address}} must use https", &[("address", endpoint)]));
    }
    Ok(url)
}

fn http_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder().timeout(HTTP_TIMEOUT).build().map_err(|e| e.to_string())
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SignInRequest {
    site_url: String,
    authorization_endpoint: String,
    token_endpoint: String,
    revocation_endpoint: String,
    client_id: String,
    scope: String,
    /// The network's name from its discovery document, for the session list.
    #[serde(default)]
    site_name: String,
}

#[derive(Deserialize)]
struct TokenResponse {
    access_token: String,
    refresh_token: Option<String>,
    expires_in: Option<u64>,
}

#[derive(Deserialize)]
struct OAuthError {
    error: Option<String>,
    error_description: Option<String>,
}

/// The active session, or None (signed out, or signed out of the one that was active). The first
/// call reads the keychain (the page asks once its window is shown); `Err` when it could not be
/// read, and the next call tries again.
#[tauri::command]
pub async fn get_session<R: Runtime>(app: AppHandle<R>, state: State<'_, AuthState>) -> Result<Option<SessionInfo>, String> {
    ready(&app, &state).await?;
    Ok(state.info())
}

/// The networks signed in to, in the order they were added (Cmd+Ctrl+1 is the first).
#[tauri::command]
pub async fn list_sessions<R: Runtime>(app: AppHandle<R>, state: State<'_, AuthState>) -> Result<Vec<SessionSummary>, String> {
    ready(&app, &state).await?;
    Ok(state.summaries())
}

/// Make another network the active one. A refresh in flight finishes first; windows of their
/// own (of the session before) close; only the new site is reached from then on.
#[tauri::command]
pub async fn switch_session<R: Runtime>(app: AppHandle<R>, state: State<'_, AuthState>, key: String) -> Result<SessionInfo, String> {
    ready(&app, &state).await?;
    let info = {
        let _guard = state.refresh.lock().await;
        if state.lock().find(&key).is_none() {
            return Err(tr("That network is not signed in"));
        }
        state.activate(&key)?
    };
    crate::windows::close_all(&app);
    sessions_changed(&app, &state);
    Ok(info)
}

/// A network name as the page found it (the site's discovery document): one line, at most 200 characters.
pub(crate) fn clean_site_name(name: &str) -> String {
    let line: String = name.chars().map(|c| if c.is_control() { ' ' } else { c }).collect();
    line.split_whitespace().collect::<Vec<_>>().join(" ").chars().take(200).collect()
}

/// The active network's name, which the page asked its site for because the sign-in kept
/// none (a session of an older version): the menu and the switcher name it from then on.
#[tauri::command]
pub async fn name_network<R: Runtime>(app: AppHandle<R>, state: State<'_, AuthState>, key: String, name: String) -> Result<(), String> {
    ready(&app, &state).await?;
    let name = clean_site_name(&name);
    if !name.is_empty() && state.name_active(&key, &name)? {
        sessions_changed(&app, &state);
    }
    Ok(())
}

/// The menu's network items follow the list (menu.rs).
pub fn sessions_changed<R: Runtime>(app: &AppHandle<R>, state: &AuthState) {
    #[cfg(target_os = "macos")]
    crate::menu::show_networks(app, &state.summaries());
    #[cfg(not(target_os = "macos"))]
    let _ = (app, state);
}

#[derive(Deserialize)]
struct MeAccount {
    id: String,
}

#[derive(Deserialize)]
struct MeProfile {
    id: String,
    display_name: String,
}

#[derive(Deserialize)]
struct Me {
    account: MeAccount,
    active_profile_id: String,
    profiles: Vec<MeProfile>,
}

/// Whose the new tokens are: the account (a session's key) and the profile that acts.
async fn whose(site_url: &str, token: &str) -> Result<(String, String), String> {
    let response = http_client()?
        .get(format!("{}/api/v2/me", site_url.trim_end_matches('/')))
        .bearer_auth(token)
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| tr_vars("Could not reach the site: {{reason}}", &[("reason", &e.to_string())]))?;
    let status = response.status();
    if !status.is_success() {
        let body = availability::problem_of(response).await;
        return Err(match off_code(status.as_u16(), &body) {
            Some(code) => off_at(site_url, code),
            None => tr_vars("The site did not say whose account this is ({{status}})", &[("status", &status.to_string())]),
        });
    }
    let me: Me = response.json().await.map_err(|_| tr("The site sent an unexpected account"))?;
    let name = me.profiles.iter().find(|p| p.id == me.active_profile_id).map(|p| p.display_name.clone()).unwrap_or_default();
    Ok((me.account.id, name))
}

/// What discover_site answers for an address whose /api/v2 is not a discovery document.
fn not_a_discovery_document(site_url: &str) -> String {
    tr_vars("{{site}} has no UNA API v2 (not a discovery document)", &[("site", site_url)])
}

/// What discover_site answers for a site that did not give its discovery document: a site that
/// says its API v2 (a preview, off as installed) or its whole API is turned off has one, and its
/// administrator can turn it on; any other answer (no rewrite rule, maintenance, a page of the
/// site) is all the app knows.
fn not_available(site_url: &str, status: reqwest::StatusCode, body: &[u8]) -> String {
    match off_code(status.as_u16(), body) {
        Some(code) => off_at(site_url, code),
        None => tr_vars("{{site}} has no UNA API v2 (the site answered {{status}})", &[("site", site_url), ("status", &status.to_string())]),
    }
}

/// What a site is and how to sign in to it: its API v2 discovery document (GET /api/v2).
#[tauri::command]
pub async fn discover_site(state: State<'_, AuthState>, site_url: String) -> Result<serde_json::Value, String> {
    let site = check_site_url(&site_url)?;
    let url = format!("{}/api/v2", site.as_str().trim_end_matches('/'));
    let response = http_client()?
        .get(&url)
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| tr_vars("Could not reach that address: {{reason}}", &[("reason", &e.to_string())]))?;
    let status = response.status();
    if !status.is_success() {
        let body = availability::problem_of(response).await;
        return Err(not_available(&site_url, status, &body));
    }
    let info: serde_json::Value = response.json().await.map_err(|_| not_a_discovery_document(&site_url))?;
    if !info.get("name").is_some_and(|v| v.is_string()) || !info.get("api_version").is_some_and(|v| v.is_string()) {
        return Err(not_a_discovery_document(&site_url));
    }
    // the preview shows its mark: a local site's pictures go through una-media (media.rs)
    state.set_previewed_site(&site);
    Ok(info)
}

#[tauri::command]
pub async fn sign_in(app: AppHandle, state: State<'_, AuthState>, request: SignInRequest) -> Result<SessionInfo, String> {
    let site = check_site_url(&request.site_url)?;
    // the kept sessions first: a late read must not write over this sign-in, and one that
    // failed must not let this one replace the list it could not read
    ready(&app, &state).await?;
    let mut authorize = check_endpoint(&site, &request.authorization_endpoint)?;
    let token_endpoint = check_endpoint(&site, &request.token_endpoint)?;
    let revocation_endpoint = check_endpoint(&site, &request.revocation_endpoint)?;

    // PKCE: a 43-character verifier, sent as its S256 challenge
    let verifier = random_b64(32);
    let challenge = pkce_challenge(&verifier);
    let expected_state = random_b64(16);

    // a port the OS picks; the server accepts any port on 127.0.0.1 for this client
    let listener = TcpListener::bind("127.0.0.1:0").await.map_err(|e| e.to_string())?;
    let port = listener.local_addr().map_err(|e| e.to_string())?.port();
    let redirect_uri = format!("http://127.0.0.1:{port}/callback");

    authorize
        .query_pairs_mut()
        .append_pair("client_id", &request.client_id)
        .append_pair("response_type", "code")
        .append_pair("redirect_uri", &redirect_uri)
        .append_pair("scope", &request.scope)
        .append_pair("state", &expected_state)
        .append_pair("code_challenge", &challenge)
        .append_pair("code_challenge_method", "S256");

    // a new sign-in replaces one still waiting (dropping its sender cancels it)
    let (cancel_tx, cancel_rx) = oneshot::channel::<()>();
    *state.pending.lock().map_err(|_| "state lock poisoned".to_string())? = Some(cancel_tx);

    let result = async {
        app.opener()
            .open_url(authorize.as_str(), None::<&str>)
            .map_err(|e| tr_vars("Could not open the browser: {{reason}}", &[("reason", &e.to_string())]))?;

        tokio::select! {
            r = tokio::time::timeout(SIGN_IN_TIMEOUT, wait_for_callback(listener, &expected_state)) => {
                r.map_err(|_| tr("Sign-in timed out"))?
            }
            _ = cancel_rx => Err(cancelled()),
        }
    }
    .await;
    // the listener is closed by now: a late redirect gets "connection refused"
    if let Ok(mut pending) = state.pending.lock() {
        if pending.as_ref().is_some_and(|tx| tx.is_closed()) {
            *pending = None;
        }
    }
    let params = result?;
    // the browser had the person: the app comes forward to show them they are signed in
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }

    if let Some(error) = params.error {
        return Err(if error == "access_denied" { tr("Sign-in was not allowed on the site") } else { params.error_description.unwrap_or(error) });
    }
    let code = params.code.ok_or_else(|| tr("The sign-in reply has no code"))?;

    let response = http_client()?
        .post(token_endpoint.clone())
        .form(&[
            ("grant_type", "authorization_code"),
            ("code", code.as_str()),
            ("redirect_uri", redirect_uri.as_str()),
            ("client_id", request.client_id.as_str()),
            ("code_verifier", verifier.as_str()),
        ])
        .send()
        .await
        .map_err(|e| tr_vars("Could not reach the site: {{reason}}", &[("reason", &e.to_string())]))?;
    let tokens = match read_tokens(response).await {
        Ok(tokens) => tokens,
        Err(said) => return Err(exchange_refused(request.site_url.trim(), said).await),
    };

    let mut session = StoredSession {
        site_url: request.site_url.trim().trim_end_matches('/').to_string(),
        token_endpoint: token_endpoint.to_string(),
        revocation_endpoint: revocation_endpoint.to_string(),
        client_id: request.client_id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: now() + tokens.expires_in.unwrap_or(3600),
        account_id: String::new(),
        site_name: request.site_name.trim().chars().take(200).collect(),
        account_name: String::new(),
        refused: false,
    };
    // whose they are: a session is one site and one account
    match whose(&session.site_url, &session.access_token).await {
        Ok((account_id, name)) => {
            session.account_id = account_id;
            session.account_name = name;
        }
        Err(e) => {
            // tokens no one keeps are taken back
            tauri::async_runtime::spawn(revoke(session));
            return Err(e);
        }
    }
    let (info, replaced) = {
        let _guard = state.refresh.lock().await;
        let replaced = match state.add(session.clone()) {
            Ok(replaced) => replaced,
            Err(e) => {
                tauri::async_runtime::spawn(revoke(session));
                return Err(e);
            }
        };
        (state.info().ok_or_else(|| tr("The sign-in was not kept"))?, replaced)
    };
    // a sign-in this one replaced (the same account again, or an older version's on that site)
    // is ended on the site too, so no grant is left there that nothing here can end
    for old in replaced {
        tauri::async_runtime::spawn(revoke(old));
    }
    // windows of their own belong to the session before (windows.rs)
    crate::windows::close_all(&app);
    sessions_changed(&app, &state);
    Ok(info)
}

/// Stop the sign-in that is waiting for the browser; it answers "Sign-in was cancelled".
#[tauri::command]
pub fn cancel_sign_in(state: State<'_, AuthState>) -> Result<(), String> {
    if let Some(tx) = state.pending.lock().map_err(|_| "state lock poisoned".to_string())?.take() {
        let _ = tx.send(());
    }
    Ok(())
}

/// A current access token (refreshed when it is about to expire) of the session a page names,
/// the one get_session or sign_in gave it: None when signed out, and None when the current
/// session is of another site or another sign-in, so a request of a page (a window of its own
/// opened before) never carries one session's token to another session's site. For requests
/// sent from here only (`page_token`): no command gives a token to a page.
async fn token_for(state: &AuthState, site_url: &str, generation: u64) -> Result<Option<String>, String> {
    state.ensure_loaded().await?;
    let site_url = site_url.trim_end_matches('/');
    let is_for = |t: &SessionToken| t.generation == generation && t.site == site_url;
    // another session than the page's is not refreshed for it either
    let (session, current) = state.get_with_generation();
    if current != generation || !session.is_some_and(|s| s.site_url == site_url) {
        return Ok(None);
    }
    // and checked again: a sign-in or sign-out may come while a refresh waits for the lock
    Ok(current_token(state).await?.filter(is_for).map(|t| t.token))
}

/// A token for requests Rust sends itself, with the site it is for and which sign-in it is.
pub struct SessionToken {
    pub site: String,
    pub token: String,
    /// `AuthState::generation` of the session the token is of: when it is no longer the current
    /// one, an answer to a request with this token belongs to a session that is over.
    pub generation: u64,
}

/// The site and a current access token of the session a page names (as access_token), for a
/// request Rust sends for that page (an upload): None once that session is over, so a file
/// picked in one network never goes to another one that was switched to meanwhile.
pub async fn page_token(state: &AuthState, site_url: &str, generation: u64) -> Result<Option<SessionToken>, String> {
    let site = site_url.trim_end_matches('/').to_string();
    Ok(token_for(state, &site, generation).await?.map(|token| SessionToken { site, token, generation }))
}

/// The same with which sign-in it is (the sync poller, which drops an answer of another session).
pub async fn session_token(state: &AuthState) -> Result<Option<SessionToken>, String> {
    current_token(state).await
}

/// The site and a current access token, both from the one session read (or refreshed) here:
/// a token never goes with another session's site, even when a sign-in or sign-out comes
/// between two reads.
async fn current_token(state: &AuthState) -> Result<Option<SessionToken>, String> {
    state.ensure_loaded().await?;
    let _guard = state.refresh.lock().await;

    let (Some(session), generation) = state.get_with_generation() else { return Ok(None) };
    if session.refused {
        return Ok(None);
    }
    // a site that said its API is off is not asked for new tokens: with API v2 off UNA's token
    // endpoint (not under /api/v2) refuses the refresh grant as if this app were unknown, and
    // every API request is answered 503 before its token is looked at. The token goes as it is;
    // once the API is back, the first 401 renews it (refused)
    if !needs_refresh(session.expires_at, now()) || state.availability.code(&session.site_url).is_some() {
        return Ok(Some(SessionToken { site: session.site_url, token: session.access_token, generation }));
    }
    renew_session(state, session, generation).await
}

/// What the token endpoint said to a refresh.
enum Refreshed {
    Renewed(Box<StoredSession>),
    /// It refused the refresh token (revoked, expired, unknown): the site signed this sign-in out.
    Refused,
}

/// Whether a token endpoint's answer to a refresh says this sign-in is over: an OAuth error
/// (RFC 6749 5.2, status 400 or 401) that names the grant (the refresh token is revoked, expired
/// or unknown), the client (the site no longer knows this app) or the refresh grant itself (the
/// site does not let this app renew; UNA says so for a client it has removed). Any other refusal says nothing
/// of the sign-in: a firewall's 403, a 404 or 503 page while the site is down for maintenance, a
/// 429. Signing out on those would throw away a refresh token that still works.
fn ends_sign_in(status: reqwest::StatusCode, body: &str) -> bool {
    if status != reqwest::StatusCode::BAD_REQUEST && status != reqwest::StatusCode::UNAUTHORIZED {
        return false;
    }
    let error = serde_json::from_str::<OAuthError>(body).ok().and_then(|e| e.error);
    matches!(error.as_deref(), Some("invalid_grant" | "invalid_client" | "unauthorized_client" | "unsupported_grant_type"))
}

/// Whether a refusal of a refresh is what UNA's token endpoint says while API v2 is turned off:
/// the endpoint is /m/oauth2/token, not under /api/v2, so it never answers 503; with API v2 off
/// the site no longer has this app as a client and takes only authorization codes
/// (`unsupported_grant_type`, `invalid_client`). The same refresh token works again once API v2
/// is back on, so such a refusal ends the sign-in only when the API itself answers.
fn may_be_turned_off(body: &str) -> bool {
    let error = serde_json::from_str::<OAuthError>(body).ok().and_then(|e| e.error);
    matches!(error.as_deref(), Some("invalid_client" | "unauthorized_client" | "unsupported_grant_type"))
}

/// Ask the site for new tokens with the session's refresh token. `Err` when the site could not
/// be reached or gave an answer that does not say the sign-in is over (ends_sign_in): nothing is
/// known, nothing changes, and the next request tries again. A refusal that a site with its API
/// turned off gives too is checked against the API first (availability.rs): when it says it is
/// off, that is remembered and the sign-in is kept; when it cannot be asked or says nothing
/// (maintenance), nothing changes either.
async fn refresh(session: &StoredSession, availability: &Availability) -> Result<Refreshed, String> {
    let Some(refresh_token) = session.refresh_token.clone() else { return Ok(Refreshed::Refused) };
    let response = http_client()?
        .post(&session.token_endpoint)
        .form(&[("grant_type", "refresh_token"), ("refresh_token", refresh_token.as_str()), ("client_id", session.client_id.as_str())])
        .send()
        .await
        .map_err(|e| tr_vars("Could not reach the site: {{reason}}", &[("reason", &e.to_string())]))?;
    let status = response.status();
    let body = response.text().await.map_err(|e| e.to_string())?;
    if ends_sign_in(status, &body) {
        if !may_be_turned_off(&body) {
            return Ok(Refreshed::Refused);
        }
        let (api_status, problem) = availability::ask(&session.site_url).await?;
        return match availability.saw(&session.site_url, api_status, &problem) {
            // the site turned its API off: the sign-in is as good as it was, and is kept
            Some(code) => Err(off_here(code)),
            None if api_status == 503 => Err(tr_vars("The site answered {{status}}", &[("status", &api_status.to_string())])),
            None => Ok(Refreshed::Refused),
        };
    }
    let tokens = parse_tokens(status, &body)?;
    Ok(Refreshed::Renewed(Box::new(StoredSession {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token.or(Some(refresh_token)),
        expires_at: now() + tokens.expires_in.unwrap_or(3600),
        ..session.clone()
    })))
}

/// Renew a session (the refresh lock held): its new token, or None when the site refused the
/// refresh, and then the session stays in the list, signed out (refuse), never forgotten.
async fn renew_session(state: &AuthState, session: StoredSession, generation: u64) -> Result<Option<SessionToken>, String> {
    match refresh(&session, &state.availability).await? {
        Refreshed::Renewed(renewed) => {
            let token = SessionToken { site: renewed.site_url.clone(), token: renewed.access_token.clone(), generation };
            state.renew(*renewed)?;
            Ok(Some(token))
        }
        Refreshed::Refused => {
            state.refuse(&session.key());
            Ok(None)
        }
    }
}

/// How soon a token refused right after it was renewed here means the site signed the session
/// out (and not that its clock is ahead of this one's).
const REFUSED_AGAIN: Duration = Duration::from_secs(60);

/// The site answered 401 to `token`, a token of the session `generation` names. The site's clock
/// may be ahead of this one (the token ran out there first) or it may have revoked the access
/// token alone: the session is renewed at once, and only when the site refuses that too, or
/// refuses the new token within a minute, is it signed out, and kept in the list as such
/// (refuse). A token that is no longer the session's (renewed meanwhile by another request that
/// failed the same way) changes nothing. Answers the active session as it is now.
pub async fn refused<R: Runtime>(app: &AppHandle<R>, state: &AuthState, site_url: &str, generation: u64, token: &str) -> Result<Option<SessionInfo>, String> {
    ready(app, state).await?;
    renew_refused(state, site_url, generation, token).await?;
    state.announce_refusals(app);
    Ok(state.info())
}

async fn renew_refused(state: &AuthState, site_url: &str, generation: u64, token: &str) -> Result<(), String> {
    state.ensure_loaded().await?;
    let _guard = state.refresh.lock().await;
    let (session, current) = state.get_with_generation();
    let site_url = site_url.trim_end_matches('/');
    let Some(session) = session.filter(|s| current == generation && s.site_url == site_url && !s.refused && s.access_token == token) else {
        return Ok(());
    };
    let key = session.key();
    let again = {
        let forced = state.forced.lock().unwrap_or_else(|e| e.into_inner());
        forced.as_ref().is_some_and(|(k, at)| *k == key && at.elapsed() < REFUSED_AGAIN)
    };
    if again {
        state.refuse(&key);
    } else if renew_session(state, session, generation).await?.is_some() {
        *state.forced.lock().unwrap_or_else(|e| e.into_inner()) = Some((key, std::time::Instant::now()));
    }
    Ok(())
}

/// A request of the page was answered 401, or got no token because its session is over. The
/// renewing is done already, where the token was (api.rs calls `refused` with it): this answers
/// the active session as it is now. The page reloads what failed when the session is still
/// signed in, and asks to sign in again when it is not.
#[tauri::command]
pub async fn token_refused<R: Runtime>(app: AppHandle<R>, state: State<'_, AuthState>) -> Result<Option<SessionInfo>, String> {
    ready(&app, &state).await?;
    state.announce_refusals(&app);
    Ok(state.info())
}

/// Sign out of the active network here at once, then on the site in the background. Holding
/// the refresh lock, a refresh in flight finishes first and its new tokens are the ones revoked;
/// the session is gone before the lock is released, so no request after this gets its token. A
/// slow or unreachable site never keeps the person signed in here. Another network signed in
/// to becomes the active one (the first of the list), and is answered; None when there is none.
///
/// `generation` is the sign-in the page means: when another one is active by now (it switched
/// meanwhile, and a request of the page before failed), nothing is signed out and the active
/// one is answered.
#[tauri::command]
pub async fn sign_out<R: Runtime>(app: AppHandle<R>, state: State<'_, AuthState>, generation: Option<u64>) -> Result<Option<SessionInfo>, String> {
    ready(&app, &state).await?;
    let (session, next) = {
        let _guard = state.refresh.lock().await;
        if generation.is_some_and(|g| g != state.generation()) {
            return Ok(state.info());
        }
        let session = state.get().and_then(|s| state.remove(&s.key()));
        // one still signed in first; one the site signed out opens as its sign-in screen
        let next = {
            let sessions = state.lock();
            sessions.list.iter().find(|s| !s.refused).or(sessions.list.first()).map(StoredSession::key)
        };
        let next = match next {
            Some(key) => Some(state.activate(&key)?),
            None => None,
        };
        (session, next)
    };
    // what windows of their own show is that session's
    crate::windows::close_all(&app);
    sessions_changed(&app, &state);
    if let Some(session) = session {
        tauri::async_runtime::spawn(revoke(session));
    }
    Ok(next)
}

/// Revoke the refresh token first (that ends the grant, and the saved consent with it), then
/// the access token, each with a short timeout. Failures are only logged.
async fn revoke(session: StoredSession) {
    let client = match reqwest::Client::builder().timeout(REVOKE_TIMEOUT).build() {
        Ok(client) => client,
        Err(e) => {
            log::warn!("sign-out: could not revoke the tokens: {e}");
            return;
        }
    };
    // a sign-in the site signed out has no tokens left to revoke
    let tokens: Vec<(&str, &str)> = [(session.refresh_token.as_deref().unwrap_or_default(), "refresh_token"), (session.access_token.as_str(), "access_token")]
        .into_iter()
        .filter(|(token, _)| !token.is_empty())
        .collect();
    if tokens.is_empty() {
        return;
    }

    for (token, hint) in tokens {
        let result = client
            .post(&session.revocation_endpoint)
            .bearer_auth(&session.access_token)
            .form(&[("token", token), ("token_type_hint", hint), ("client_id", session.client_id.as_str())])
            .send()
            .await;
        match result {
            Ok(r) if r.status().is_success() => {}
            Ok(r) => log::warn!("sign-out: the site did not revoke the {hint} ({})", r.status()),
            Err(e) => log::warn!("sign-out: could not revoke the {hint}: {e}"),
        }
    }
}

/// What to say when the site did not give tokens for the browser's code. A site whose API v2
/// was turned off since the sign-in began refuses this app as a client it does not know
/// (/m/oauth2/token is not under /api/v2 and never answers 503), so the API is asked: when it
/// says it is off, that is the message, as for an address being added; otherwise what the token
/// endpoint said.
async fn exchange_refused(site_url: &str, said: String) -> String {
    let site_url = site_url.trim_end_matches('/');
    match availability::ask(site_url).await {
        Ok((status, problem)) => off_code(status, &problem).map_or(said, |code| off_at(site_url, code)),
        Err(_) => said,
    }
}

async fn read_tokens(response: reqwest::Response) -> Result<TokenResponse, String> {
    let status = response.status();
    let body = response.text().await.map_err(|e| e.to_string())?;
    parse_tokens(status, &body)
}

/// A token endpoint's answer: its tokens, or what it said went wrong.
fn parse_tokens(status: reqwest::StatusCode, body: &str) -> Result<TokenResponse, String> {
    if !status.is_success() {
        let err: Option<OAuthError> = serde_json::from_str(body).ok();
        let message =
            err.and_then(|e| e.error_description.or(e.error)).unwrap_or_else(|| tr_vars("The site answered {{status}}", &[("status", &status.to_string())]));
        return Err(message);
    }
    serde_json::from_str(body).map_err(|_| tr("The site sent an unexpected token response"))
}

#[derive(Default, Debug, PartialEq)]
struct CallbackParams {
    code: Option<String>,
    state: Option<String>,
    error: Option<String>,
    error_description: Option<String>,
}

/// The query of a request to /callback, from the head of an HTTP request; None for any other path.
fn parse_callback(head: &str) -> Option<CallbackParams> {
    let target = head.lines().next()?.split_whitespace().nth(1)?;
    if !target.starts_with('/') {
        return None;
    }
    let url = Url::parse(&format!("http://127.0.0.1{target}")).ok()?;
    if url.path() != "/callback" {
        return None;
    }
    let mut params = CallbackParams::default();
    for (key, value) in url.query_pairs() {
        match key.as_ref() {
            "code" => params.code = Some(value.into_owned()),
            "state" => params.state = Some(value.into_owned()),
            "error" => params.error = Some(value.into_owned()),
            "error_description" => params.error_description = Some(value.into_owned()),
            _ => {}
        }
    }
    Some(params)
}

/// Read one request head, within CALLBACK_READ_TIMEOUT. None for a connection that sends
/// nothing in time, fails, or asks for something other than /callback (it gets a 404).
async fn read_callback(mut stream: TcpStream) -> Option<(CallbackParams, TcpStream)> {
    let mut buf = vec![0u8; 8192];
    let mut len = 0;
    let read = tokio::time::timeout(CALLBACK_READ_TIMEOUT, async {
        while len < buf.len() {
            let n = stream.read(&mut buf[len..]).await.ok()?;
            if n == 0 {
                break;
            }
            len += n;
            if buf[..len].windows(4).any(|w| w == b"\r\n\r\n") {
                break;
            }
        }
        Some(())
    })
    .await;
    if !matches!(read, Ok(Some(()))) {
        return None;
    }

    let head = String::from_utf8_lossy(&buf[..len]).into_owned();
    match parse_callback(&head) {
        Some(params) => Some((params, stream)),
        None => {
            // the browser may ask for /favicon.ico first
            let _ = stream.write_all(b"HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\nConnection: close\r\n\r\n").await;
            None
        }
    }
}

async fn respond(stream: &mut TcpStream, status: &str, title: &str, text: &str) {
    let lang = crate::i18n::language();
    let page = format!(
        "<!doctype html><html lang=\"{lang}\"><head><meta charset=\"utf-8\"><title>{title}</title>\
         <style>body{{font:16px system-ui,sans-serif;display:grid;place-items:center;min-height:90vh;margin:0;color:#18181b;background:#fafafc}}\
         @media(prefers-color-scheme:dark){{body{{color:#fafafc;background:#0a0a0c}}}}</style></head>\
         <body><main><h1>{title}</h1><p>{text}</p></main></body></html>"
    );
    let _ = stream
        .write_all(
            format!(
                "HTTP/1.1 {status}\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nCache-Control: no-store\r\nConnection: close\r\n\r\n{page}",
                page.len()
            )
            .as_bytes(),
        )
        .await;
    let _ = stream.shutdown().await;
}

/// Serve the loopback listener until the browser's redirect for this sign-in (its state) comes
/// back. Each connection is read on its own task with its own timeout, so one that stalls
/// can't hold up the others; requests for other paths, or with another state, are answered and
/// the listener keeps going.
async fn wait_for_callback(listener: TcpListener, expected_state: &str) -> Result<CallbackParams, String> {
    let (tx, mut rx) = mpsc::channel::<(CallbackParams, TcpStream)>(8);
    loop {
        tokio::select! {
            accepted = listener.accept() => match accepted {
                Ok((stream, _)) => {
                    let tx = tx.clone();
                    tokio::spawn(async move {
                        if let Some(request) = read_callback(stream).await {
                            let _ = tx.send(request).await;
                        }
                    });
                }
                // e.g. too many open files: wait a little rather than spin
                Err(_) => tokio::time::sleep(Duration::from_millis(50)).await,
            },
            Some((params, mut stream)) = rx.recv() => {
                if params.state.as_deref() != Some(expected_state) {
                    respond(&mut stream, "400 Bad Request", &tr("Not this sign-in"), &tr("This reply does not belong to the sign-in the app is waiting for.")).await;
                    continue;
                }
                let (title, text) = if params.code.is_some() {
                    (tr("Signed in"), tr_vars("You are signed in. Go back to {{app}}: it is open on this network now. You can close this tab.", &[("app", crate::brand::NAME)]))
                } else {
                    (tr("Not signed in"), tr("Sign-in did not finish. Go back to the app to try again."))
                };
                respond(&mut stream, "200 OK", &title, &text).await;
                return Ok(params);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    #[test]
    fn site_urls() {
        assert!(check_site_url("https://community.example").is_ok());
        assert!(check_site_url("https://community.example/una").is_ok());
        assert!(check_site_url("http://desktop.localhost:8090").is_ok());
        assert!(check_site_url("http://127.0.0.1:8088").is_ok());
        assert!(check_site_url("http://community.example").is_err(), "plain http only for local hosts");
        assert!(check_site_url("https://user:pw@community.example").is_err());
        assert!(check_site_url("https://community.example/?x=1").is_err());
        assert!(check_site_url("ftp://community.example").is_err());
        assert!(check_site_url("not a url").is_err());
    }

    #[test]
    fn endpoints_must_be_on_the_site() {
        let site = Url::parse("https://community.example").unwrap();
        assert!(check_endpoint(&site, "https://community.example/m/oauth2/token").is_ok());
        assert!(check_endpoint(&site, "https://evil.example/m/oauth2/token").is_err());
        assert!(check_endpoint(&site, "https://community.example:8443/m/oauth2/token").is_err());
        assert!(check_endpoint(&site, "http://community.example/m/oauth2/token").is_err());
    }

    #[test]
    fn callback_requests() {
        let p = parse_callback("GET /callback?code=abc&state=s1 HTTP/1.1\r\nHost: 127.0.0.1\r\n\r\n").unwrap();
        assert_eq!(p.code.as_deref(), Some("abc"));
        assert_eq!(p.state.as_deref(), Some("s1"));

        let p = parse_callback("GET /callback?error=access_denied&state=s1 HTTP/1.1\r\n\r\n").unwrap();
        assert_eq!(p.error.as_deref(), Some("access_denied"));
        assert_eq!(p.code, None);

        assert!(parse_callback("GET /favicon.ico HTTP/1.1\r\n\r\n").is_none());
        assert!(parse_callback("GET http://evil.example/callback?code=x HTTP/1.1\r\n\r\n").is_none());
        assert!(parse_callback("").is_none());
    }

    #[test]
    fn pkce_challenge_is_s256_of_the_verifier() {
        // RFC 7636 appendix B
        assert_eq!(pkce_challenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"), "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
        // verifiers are 43 url-safe characters (32 random bytes), within RFC 7636's 43..=128
        let verifier = random_b64(32);
        assert_eq!(verifier.len(), 43);
        assert!(verifier.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_'));
        assert_ne!(pkce_challenge(&verifier), verifier);
    }

    #[test]
    fn tokens_are_renewed_inside_the_margin() {
        let now = 1_000_000;
        assert!(!needs_refresh(now + REFRESH_MARGIN_SECS + 1, now), "still valid past the margin");
        assert!(needs_refresh(now + REFRESH_MARGIN_SECS, now), "expires within the margin");
        assert!(needs_refresh(now - 5, now), "already expired");
        assert!(needs_refresh(u64::MAX - 1, u64::MAX - 1), "no overflow near the end of time");
    }

    #[test]
    fn callback_query_values_are_decoded_and_unknown_keys_ignored() {
        let p = parse_callback("GET /callback?code=a%2Fb%2Bc&state=s%201&error_description=Access+denied&extra=1 HTTP/1.1\r\n\r\n").unwrap();
        assert_eq!(p.code.as_deref(), Some("a/b+c"));
        assert_eq!(p.state.as_deref(), Some("s 1"));
        assert_eq!(p.error_description.as_deref(), Some("Access denied"));
        // a path that only starts with /callback is another path
        assert!(parse_callback("GET /callbackx?code=x HTTP/1.1\r\n\r\n").is_none());
        assert!(parse_callback("GET /callback/../x?code=x HTTP/1.1\r\n\r\n").is_none());
    }

    /// The keychain, in memory.
    #[derive(Default, Clone)]
    struct MemoryVault(std::sync::Arc<Mutex<HashMap<String, String>>>);

    impl Vault for MemoryVault {
        fn get(&self, entry: &str) -> Result<Option<String>, String> {
            Ok(self.0.lock().unwrap().get(entry).cloned())
        }
        fn set(&self, entry: &str, value: &str) -> Result<(), String> {
            self.0.lock().unwrap().insert(entry.into(), value.into());
            Ok(())
        }
        fn delete(&self, entry: &str) {
            self.0.lock().unwrap().remove(entry);
        }
    }

    impl AuthState {
        /// A state whose keychain read is done (as after the first command).
        fn with_vault(vault: Box<dyn Vault>) -> Self {
            let state = AuthState::pending_with(Arc::from(vault));
            *state.lock() = read_sessions(state.vault.as_ref()).unwrap();
            state.loaded.set(()).unwrap();
            state.loaded_tx.send_replace(true);
            state
        }
    }

    fn test_state() -> AuthState {
        AuthState::with_vault(Box::new(MemoryVault::default()))
    }

    fn session(site: &str, account: &str, token: &str) -> StoredSession {
        StoredSession {
            site_url: site.into(),
            token_endpoint: format!("{site}/token"),
            revocation_endpoint: format!("{site}/revoke"),
            client_id: "una-desktop".into(),
            access_token: token.into(),
            refresh_token: None,
            expires_at: u64::MAX,
            account_id: account.into(),
            site_name: String::new(),
            account_name: String::new(),
            refused: false,
        }
    }

    #[test]
    fn a_network_without_a_name_gets_the_one_its_site_gives() {
        let vault = MemoryVault::default();
        let state = AuthState::with_vault(Box::new(MemoryVault(vault.0.clone())));
        let mut named = session("https://b.example", "5", "u");
        named.site_name = "Gardeners".into();
        state.add(named).unwrap();
        state.add(session("http://desktop.localhost:8090", "1", "t")).unwrap();
        let local = session_key("http://desktop.localhost:8090", "1");
        let other = session_key("https://b.example", "5");
        // not the active one: nothing changes
        assert!(!state.name_active(&other, "Someone else").unwrap());
        assert!(state.name_active(&local, "UNA Makers").unwrap());
        let label = |key: &str| state.summaries().into_iter().find(|s| s.key == key).unwrap().label();
        assert_eq!(label(&local), "UNA Makers");
        // kept for the next start
        let saved: StoredSession = serde_json::from_str(&vault.0.lock().unwrap()[&session_entry(&local)]).unwrap();
        assert_eq!(saved.site_name, "UNA Makers");
        // a name the sign-in kept is never replaced
        assert!(!state.name_active(&local, "Other").unwrap());
        assert_eq!(label(&local), "UNA Makers");
        assert_eq!(label(&other), "Gardeners");
        assert_eq!(clean_site_name("  UNA\nMakers \u{7}"), "UNA Makers");
        assert_eq!(clean_site_name(&"x".repeat(300)).chars().count(), 200);
    }

    #[test]
    fn sessions_are_keyed_by_site_and_account() {
        assert_eq!(session_key("https://a.example/", "3"), "https://a.example|3");
        assert_eq!(session("https://a.example", "3", "t").key(), "https://a.example|3");
        assert_ne!(session_key("https://a.example", "3"), session_key("https://a.example", "5"), "two accounts of one site");
        assert_ne!(session_key("https://a.example", "3"), session_key("https://b.example", "3"), "the same account id on two sites");
        assert!(check_site_url("https://a.example/x|y").is_err(), "a site's address can't hold the separator");
    }

    #[test]
    fn each_sign_in_and_switch_is_another_generation_and_a_refresh_is_not() {
        let state = test_state();
        let start = state.generation();
        state.add(session("https://a.example", "3", "lily")).unwrap();
        let lily = state.generation();
        assert_ne!(lily, start);
        state.renew(session("https://a.example", "3", "lily-renewed")).unwrap();
        assert_eq!(state.generation(), lily, "a refresh is the same sign-in");
        state.add(session("https://a.example", "5", "mila")).unwrap();
        let mila = state.generation();
        assert_ne!(mila, lily, "another account on the same site is another session");
        state.activate("https://a.example|3").unwrap();
        assert_ne!(state.generation(), mila, "switching back is another generation too");
        let (current, _) = state.get_with_generation();
        assert_eq!(current.map(|s| s.access_token), Some("lily-renewed".to_string()));
        assert_eq!(state.summaries().len(), 2);
    }

    #[tokio::test]
    async fn a_token_goes_only_to_the_session_that_asks() {
        let state = test_state();
        assert_eq!(token_for(&state, "https://a.example", 0).await.unwrap(), None, "signed out");
        state.add(session("https://a.example", "3", "lily")).unwrap();
        let lily = state.generation();
        assert_eq!(token_for(&state, "https://a.example", lily).await.unwrap().as_deref(), Some("lily"));
        assert_eq!(token_for(&state, "https://a.example/", lily).await.unwrap().as_deref(), Some("lily"));
        assert_eq!(token_for(&state, "https://b.example", lily).await.unwrap(), None, "another site");

        // signed out and in again: a page of the sign-in before gets nothing, on any site
        state.remove("https://a.example|3");
        assert_eq!(token_for(&state, "https://a.example", lily).await.unwrap(), None);
        state.add(session("https://a.example", "5", "mila")).unwrap();
        let mila = state.generation();
        assert_eq!(token_for(&state, "https://a.example", lily).await.unwrap(), None, "the same site, another account");
        assert_eq!(token_for(&state, "https://a.example", mila).await.unwrap().as_deref(), Some("mila"));
        state.add(session("https://b.example", "3", "eric")).unwrap();
        assert_eq!(token_for(&state, "https://a.example", mila).await.unwrap(), None, "another site now");
    }

    #[tokio::test]
    async fn two_networks_never_get_each_others_token() {
        let state = test_state();
        state.add(session("https://a.example", "3", "token-a")).unwrap();
        let a = state.info().unwrap();
        state.add(session("https://b.example", "7", "token-b")).unwrap();
        let b = state.info().unwrap();
        assert_eq!(b.site_url, "https://b.example");

        // B is active: A's page gets nothing, not even for A's own site, and never B's token
        assert_eq!(token_for(&state, &a.site_url, a.generation).await.unwrap(), None);
        assert_eq!(token_for(&state, &a.site_url, b.generation).await.unwrap(), None, "B's sign-in for A's site");
        assert_eq!(token_for(&state, &b.site_url, b.generation).await.unwrap().as_deref(), Some("token-b"));
        let own = current_token(&state).await.unwrap().unwrap();
        assert_eq!((own.site.as_str(), own.token.as_str()), ("https://b.example", "token-b"), "Rust's requests: the token with its own site");

        // switched to A: B's page and generation get nothing, A's new one gets A's token only
        let a2 = state.activate("https://a.example|3").unwrap();
        assert_eq!(token_for(&state, &b.site_url, b.generation).await.unwrap(), None);
        assert_eq!(token_for(&state, &b.site_url, a2.generation).await.unwrap(), None, "A's sign-in for B's site");
        assert_eq!(token_for(&state, &a2.site_url, a2.generation).await.unwrap().as_deref(), Some("token-a"));
        let own = current_token(&state).await.unwrap().unwrap();
        assert_eq!((own.site.as_str(), own.token.as_str()), ("https://a.example", "token-a"));
        assert!(state.activate("https://c.example|1").is_err(), "a network not signed in");
    }

    #[test]
    fn sessions_last_in_the_vault_and_the_older_single_one_moves_in() {
        let vault = MemoryVault::default();
        let mut legacy = session("https://a.example", "", "old");
        legacy.site_name = "A".into();
        vault.set(LEGACY_ENTRY, &serde_json::to_string(&legacy).unwrap()).unwrap();

        let state = AuthState::with_vault(Box::new(vault.clone()));
        assert_eq!(state.site_url().as_deref(), Some("https://a.example"), "the session of the older version is active");
        assert!(vault.get(LEGACY_ENTRY).unwrap().is_none(), "and moved");
        state.add(session("https://b.example", "7", "b")).unwrap();
        // signing in again to the older one's site replaces it (its account was not known)
        state.add(session("https://a.example", "3", "a")).unwrap();
        assert_eq!(state.summaries().iter().map(|s| s.key.as_str()).collect::<Vec<_>>(), ["https://b.example|7", "https://a.example|3"]);

        // a restart: the same list and the same active one
        let again = AuthState::with_vault(Box::new(vault.clone()));
        assert_eq!(again.summaries(), state.summaries());
        assert_eq!(again.site_url().as_deref(), Some("https://a.example"));

        // signing out of one forgets it there too
        again.remove("https://a.example|3");
        assert!(vault.get(&session_entry("https://a.example|3")).unwrap().is_none());
        let third = AuthState::with_vault(Box::new(vault));
        assert_eq!(third.summaries().len(), 1);
        assert_eq!(third.site_url(), None, "none is active after signing out of the active one");
    }

    #[test]
    fn a_sign_in_replaced_is_handed_back_to_revoke() {
        let vault = MemoryVault::default();
        let legacy = session("https://a.example", "", "legacy");
        vault.set(LEGACY_ENTRY, &serde_json::to_string(&legacy).unwrap()).unwrap();
        let state = AuthState::with_vault(Box::new(vault));
        assert!(state.add(session("https://b.example", "7", "b")).unwrap().is_empty(), "a new network replaces nothing");

        // the older version's session of that site goes, and is handed back
        let replaced = state.add(session("https://a.example", "3", "a1")).unwrap();
        assert_eq!(replaced.iter().map(|s| s.access_token.as_str()).collect::<Vec<_>>(), ["legacy"]);

        // the same account again: the earlier sign-in's tokens
        let replaced = state.add(session("https://a.example", "3", "a2")).unwrap();
        assert_eq!(replaced.iter().map(|s| s.access_token.as_str()).collect::<Vec<_>>(), ["a1"]);
        assert_eq!(state.summaries().len(), 2);
    }

    #[tokio::test]
    async fn an_upload_gets_only_its_pages_session() {
        let state = test_state();
        state.add(session("https://a.example", "3", "token-a")).unwrap();
        let a = state.info().unwrap();
        let t = page_token(&state, "https://a.example/", a.generation).await.unwrap().unwrap();
        assert_eq!((t.site.as_str(), t.token.as_str()), ("https://a.example", "token-a"));

        // a photo picked in A, then a switch to B before it is sent: it goes nowhere
        state.add(session("https://b.example", "7", "token-b")).unwrap();
        assert!(page_token(&state, &a.site_url, a.generation).await.unwrap().is_none());
        assert!(page_token(&state, "https://b.example", a.generation).await.unwrap().is_none(), "not to B with A's page either");
        let b = state.info().unwrap();
        assert_eq!(page_token(&state, &b.site_url, b.generation).await.unwrap().map(|t| t.token).as_deref(), Some("token-b"));
    }

    /// A keychain that counts its reads and can refuse them (access denied).
    #[derive(Default, Clone)]
    struct GuardedVault {
        inner: MemoryVault,
        reads: std::sync::Arc<std::sync::atomic::AtomicUsize>,
        refuse: std::sync::Arc<AtomicBool>,
    }

    impl Vault for GuardedVault {
        fn get(&self, entry: &str) -> Result<Option<String>, String> {
            self.reads.fetch_add(1, Ordering::SeqCst);
            // a little slow, as a keychain prompt is: parallel callers overlap
            std::thread::sleep(Duration::from_millis(20));
            if self.refuse.load(Ordering::SeqCst) {
                return Err("User canceled the operation".into());
            }
            self.inner.get(entry)
        }
        fn set(&self, entry: &str, value: &str) -> Result<(), String> {
            self.inner.set(entry, value)
        }
        fn delete(&self, entry: &str) {
            self.inner.delete(entry)
        }
    }

    fn signed_in_vault() -> GuardedVault {
        let vault = GuardedVault::default();
        let lily = session("https://a.example", "3", "lily");
        vault.inner.set(&session_entry(&lily.key()), &serde_json::to_string(&lily).unwrap()).unwrap();
        let index = Index { keys: vec![lily.key()], active: Some(lily.key()) };
        vault.inner.set(INDEX_ENTRY, &serde_json::to_string(&index).unwrap()).unwrap();
        vault
    }

    #[tokio::test(flavor = "multi_thread", worker_threads = 4)]
    async fn the_keychain_is_read_once_and_only_when_asked() {
        let vault = signed_in_vault();
        let state = std::sync::Arc::new(AuthState::pending_with(Arc::new(vault.clone())));
        assert_eq!(vault.reads.load(Ordering::SeqCst), 0, "nothing is read when the app starts");
        assert_eq!(state.info(), None, "signed out until the read");

        let callers: Vec<_> = (0..8)
            .map(|_| {
                let state = state.clone();
                tokio::spawn(async move { state.ensure_loaded().await })
            })
            .collect();
        for caller in callers {
            caller.await.unwrap().unwrap();
        }
        let reads = vault.reads.load(Ordering::SeqCst);
        assert_eq!(reads, 3, "one read of the index, the session and the older entry, for all eight callers");
        assert_eq!(state.site_url().as_deref(), Some("https://a.example"));

        state.ensure_loaded().await.unwrap();
        assert_eq!(token_for(&state, "https://a.example", state.generation()).await.unwrap().as_deref(), Some("lily"));
        assert_eq!(vault.reads.load(Ordering::SeqCst), reads, "never again");
    }

    #[tokio::test]
    async fn no_keychain_entry_is_signed_out() {
        let vault = GuardedVault::default();
        let state = AuthState::pending_with(Arc::new(vault));
        state.ensure_loaded().await.unwrap();
        assert_eq!(state.info(), None);
        assert!(state.summaries().is_empty());
    }

    #[tokio::test]
    async fn a_refused_read_is_kept_apart_and_tried_again() {
        let vault = signed_in_vault();
        vault.refuse.store(true, Ordering::SeqCst);
        let state = std::sync::Arc::new(AuthState::pending_with(Arc::new(vault.clone())));

        let waiting = {
            let state = state.clone();
            tokio::spawn(async move { state.wait_loaded().await })
        };
        let e = state.ensure_loaded().await.unwrap_err();
        assert!(e.starts_with("UNA couldn't read your sign-in from the keychain"), "{e}");
        assert!(e.contains("User canceled"), "the reason goes with it: {e}");
        assert_eq!(state.info(), None);
        assert_eq!(token_for(&state, "https://a.example", 0).await.unwrap_err(), e, "no token, and the same reason");
        assert!(vault.inner.get(INDEX_ENTRY).unwrap().is_some(), "nothing is deleted");
        assert!(!waiting.is_finished(), "the poller still waits");

        // allowed this time: Try again reads it
        vault.refuse.store(false, Ordering::SeqCst);
        state.ensure_loaded().await.unwrap();
        assert_eq!(state.site_url().as_deref(), Some("https://a.example"));
        tokio::time::timeout(Duration::from_secs(1), waiting).await.unwrap().unwrap();
    }

    #[test]
    fn a_local_site_looked_up_is_previewed_and_an_https_one_needs_no_preview() {
        let state = AuthState::with_vault(Box::new(MemoryVault::default()));
        assert_eq!(state.previewed_site(), None);
        state.set_previewed_site(&Url::parse("http://network2.localhost:8092/").unwrap());
        assert_eq!(state.previewed_site().as_deref(), Some("http://network2.localhost:8092"));
        // a site whose pictures need no help (https) ends the preview of the one before
        state.set_previewed_site(&Url::parse("https://example.org/").unwrap());
        assert_eq!(state.previewed_site(), None);
    }

    #[test]
    fn at_most_nine_networks() {
        let state = test_state();
        for i in 0..MAX_SESSIONS {
            state.add(session(&format!("https://s{i}.example"), "1", "t")).unwrap();
        }
        assert!(state.add(session("https://ten.example", "1", "t")).is_err());
        assert!(state.add(session("https://s0.example", "1", "renewed")).is_ok(), "signing in again to one kept is fine");
    }

    #[test]
    fn labels_name_the_network_and_who() {
        let mut s = SessionSummary {
            key: "k".into(),
            site_url: "https://a.example".into(),
            site_name: String::new(),
            account_name: String::new(),
            active: false,
            needs_sign_in: false,
        };
        assert_eq!(s.label(), "a.example");
        s.site_name = "Gardeners".into();
        s.account_name = "Lily".into();
        assert_eq!(s.label(), "Gardeners – Lily");
        s.needs_sign_in = true;
        assert_eq!(s.label(), "Gardeners – Lily (signed out)");
    }

    /// A token endpoint on 127.0.0.1 that gives these answers in turn (the last one again after
    /// them) and counts the requests.
    async fn token_server(answers: Vec<(u16, &'static str)>) -> (String, Arc<std::sync::atomic::AtomicUsize>) {
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let port = listener.local_addr().unwrap().port();
        let hits = Arc::new(std::sync::atomic::AtomicUsize::new(0));
        let count = hits.clone();
        tokio::spawn(async move {
            loop {
                let Ok((mut stream, _)) = listener.accept().await else { return };
                let n = count.fetch_add(1, Ordering::SeqCst);
                let (status, body) = answers[n.min(answers.len() - 1)];
                // the request's head and its form body, then the answer
                let mut buf = vec![0u8; 8192];
                let mut read = 0;
                while let Ok(got) = stream.read(&mut buf[read..]).await {
                    read += got;
                    let text = String::from_utf8_lossy(&buf[..read]).to_string();
                    if let Some(head_end) = text.find("\r\n\r\n") {
                        let length = text[..head_end]
                            .lines()
                            .find_map(|l| l.to_ascii_lowercase().strip_prefix("content-length:").map(|v| v.trim().parse::<usize>().unwrap_or(0)))
                            .unwrap_or(0);
                        if read >= head_end + 4 + length {
                            break;
                        }
                    }
                    if got == 0 {
                        break;
                    }
                }
                let answer =
                    format!("HTTP/1.1 {status} X\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}", body.len());
                let _ = stream.write_all(answer.as_bytes()).await;
            }
        });
        (format!("http://127.0.0.1:{port}"), hits)
    }

    const NEW_TOKENS: &str = r#"{"access_token":"new","refresh_token":"r2","expires_in":3600,"token_type":"Bearer"}"#;
    const INVALID_GRANT: &str = r#"{"error":"invalid_grant","error_description":"Invalid refresh token"}"#;

    /// A session whose token endpoint is `endpoint` and whose access token ran out (or not).
    fn session_at(endpoint: &str, expired: bool) -> StoredSession {
        let mut s = session("http://desktop.localhost:8090", "1", "old");
        s.token_endpoint = format!("{endpoint}/token");
        s.refresh_token = Some("r1".into());
        s.expires_at = if expired { 0 } else { u64::MAX };
        s
    }

    fn index_of(vault: &MemoryVault) -> Index {
        serde_json::from_str(&vault.get(INDEX_ENTRY).unwrap().unwrap()).unwrap()
    }

    #[tokio::test]
    async fn a_refresh_the_site_refuses_keeps_the_network_listed_as_signed_out() {
        let (endpoint, _) = token_server(vec![(400, INVALID_GRANT)]).await;
        let vault = MemoryVault::default();
        let state = AuthState::with_vault(Box::new(vault.clone()));
        state.add(session("https://b.example", "5", "other")).unwrap();
        let local = session_at(&endpoint, true);
        let key = local.key();
        state.add(local).unwrap();
        let generation = state.generation();

        assert!(current_token(&state).await.unwrap().is_none(), "no token for a sign-in the site refused");
        // listed still, and saved so: the next launch shows it too
        let listed = state.summaries();
        assert_eq!(listed.len(), 2, "never forgotten");
        let it = listed.iter().find(|s| s.key == key).unwrap();
        assert!(it.needs_sign_in && it.active, "the open one, signed out: {it:?}");
        assert_eq!(it.label(), "desktop.localhost (signed out)");
        assert!(state.info().unwrap().needs_sign_in);
        assert!(state.generation() > generation, "pages of that sign-in get no token any more");
        assert!(index_of(&vault).keys.contains(&key));
        let kept: StoredSession = serde_json::from_str(&vault.get(&session_entry(&key)).unwrap().unwrap()).unwrap();
        assert!(kept.refused && kept.access_token.is_empty() && kept.refresh_token.is_none(), "its tokens are not kept");
        let again = read_sessions(&vault).unwrap();
        assert!(again.find(&key).unwrap().refused);
        // asked again: nothing goes to the site
        assert!(current_token(&state).await.unwrap().is_none());

        // signing in again to the same account replaces it, signed in
        state.add(session("http://desktop.localhost:8090", "1", "fresh")).unwrap();
        assert!(!state.info().unwrap().needs_sign_in);
        assert_eq!(current_token(&state).await.unwrap().unwrap().token, "fresh");
        assert_eq!(state.summaries().len(), 2);
    }

    #[test]
    fn only_an_oauth_refusal_of_the_grant_or_the_client_ends_a_sign_in() {
        use reqwest::StatusCode as S;
        assert!(ends_sign_in(S::BAD_REQUEST, INVALID_GRANT));
        assert!(ends_sign_in(S::UNAUTHORIZED, r#"{"error":"invalid_client"}"#));
        assert!(ends_sign_in(S::BAD_REQUEST, r#"{"error":"unauthorized_client"}"#));
        assert!(ends_sign_in(S::BAD_REQUEST, r#"{"error":"unsupported_grant_type","error_description":"Grant type \"refresh_token\" not supported"}"#));
        // the request itself was wrong, or the site is busy: the refresh token may be fine
        assert!(!ends_sign_in(S::BAD_REQUEST, r#"{"error":"invalid_request"}"#));
        assert!(!ends_sign_in(S::BAD_REQUEST, "<html>Bad request</html>"));
        assert!(!ends_sign_in(S::FORBIDDEN, INVALID_GRANT), "a firewall's page, whatever it says");
        assert!(!ends_sign_in(S::NOT_FOUND, ""));
        assert!(!ends_sign_in(S::TOO_MANY_REQUESTS, r#"{"error":"slow_down"}"#));
        assert!(!ends_sign_in(S::SERVICE_UNAVAILABLE, ""));
        assert!(!ends_sign_in(S::SERVICE_UNAVAILABLE, r#"{"status":503,"code":"api_v2_disabled"}"#));
        assert!(!ends_sign_in(S::SERVICE_UNAVAILABLE, r#"{"status":503,"code":"api_disabled"}"#));
    }

    #[tokio::test]
    async fn a_refresh_the_site_only_turns_away_keeps_the_sign_in() {
        // a firewall's 403, a maintenance 404, a 429: none says the refresh token is gone
        for (status, body) in [(403, "<html>Forbidden</html>"), (404, ""), (429, r#"{"error":"slow_down"}"#)] {
            let (endpoint, hits) = token_server(vec![(status, body), (200, NEW_TOKENS)]).await;
            let vault = MemoryVault::default();
            let state = AuthState::with_vault(Box::new(vault.clone()));
            let local = session_at(&endpoint, true);
            let key = local.key();
            state.add(local).unwrap();

            assert!(current_token(&state).await.is_err(), "{status}: not renewed, and said so");
            let listed = state.summaries();
            assert!(!listed.iter().find(|s| s.key == key).unwrap().needs_sign_in, "{status}: still signed in");
            let kept: StoredSession = serde_json::from_str(&vault.get(&session_entry(&key)).unwrap().unwrap()).unwrap();
            assert!(!kept.refused && kept.refresh_token.as_deref() == Some("r1"), "{status}: its refresh token is kept");
            // the next request tries again, and the site is back
            assert_eq!(current_token(&state).await.unwrap().unwrap().token, "new");
            assert_eq!(hits.load(Ordering::SeqCst), 2);
        }
    }

    #[tokio::test]
    async fn a_sign_in_without_a_refresh_token_is_kept_signed_out_when_it_runs_out() {
        let state = test_state();
        let mut old = session("https://a.example", "3", "lily");
        old.expires_at = 0;
        state.add(old).unwrap();
        assert!(current_token(&state).await.unwrap().is_none());
        assert_eq!(state.summaries().len(), 1);
        assert!(state.summaries()[0].needs_sign_in);
    }

    #[tokio::test]
    async fn a_token_the_site_refuses_early_is_renewed_and_the_network_stays() {
        // the site's clock ran ahead: it refused a token this one thinks has an hour left
        let (endpoint, hits) = token_server(vec![(200, NEW_TOKENS), (400, INVALID_GRANT)]).await;
        let vault = MemoryVault::default();
        let state = AuthState::with_vault(Box::new(vault.clone()));
        state.add(session_at(&endpoint, false)).unwrap();
        let generation = state.generation();
        let site = "http://desktop.localhost:8090";

        renew_refused(&state, site, generation, "old").await.unwrap();
        assert_eq!(hits.load(Ordering::SeqCst), 1, "renewed at once");
        let info = state.info().unwrap();
        assert!(!info.needs_sign_in);
        assert_eq!(info.generation, generation, "the same sign-in: pages keep going");
        assert_eq!(current_token(&state).await.unwrap().unwrap().token, "new");

        // the other requests that failed with the old token at the same time change nothing
        renew_refused(&state, site, generation, "old").await.unwrap();
        renew_refused(&state, site, generation + 1, "new").await.unwrap();
        renew_refused(&state, "https://b.example", generation, "new").await.unwrap();
        assert_eq!(hits.load(Ordering::SeqCst), 1);
        assert!(!state.info().unwrap().needs_sign_in);

        // the new token refused too, at once: the site signed it out (no second refresh)
        renew_refused(&state, site, generation, "new").await.unwrap();
        assert_eq!(hits.load(Ordering::SeqCst), 1);
        let info = state.info().unwrap();
        assert!(info.needs_sign_in);
        assert_eq!(state.summaries().len(), 1, "kept in the list");
        assert_eq!(index_of(&vault).keys.len(), 1);
    }

    #[tokio::test]
    async fn a_refused_token_whose_refresh_is_refused_too_signs_out_but_keeps_the_network() {
        let (endpoint, hits) = token_server(vec![(401, INVALID_GRANT)]).await;
        let state = test_state();
        state.add(session_at(&endpoint, false)).unwrap();
        renew_refused(&state, "http://desktop.localhost:8090/", state.generation(), "old").await.unwrap();
        assert_eq!(hits.load(Ordering::SeqCst), 1);
        assert!(state.info().unwrap().needs_sign_in);
        assert_eq!(state.summaries().len(), 1);
    }

    #[tokio::test]
    async fn a_site_that_cannot_be_reached_changes_nothing() {
        let (endpoint, _) = token_server(vec![(503, "{}")]).await;
        let state = test_state();
        state.add(session_at(&endpoint, false)).unwrap();
        assert!(renew_refused(&state, "http://desktop.localhost:8090", state.generation(), "old").await.is_err());
        let info = state.info().unwrap();
        assert!(!info.needs_sign_in, "a server error is not a sign-out");
    }

    #[test]
    fn no_write_replaces_an_index_it_has_not_read() {
        let vault = MemoryVault::default();
        let lily = session("https://a.example", "3", "lily");
        vault.set(&session_entry(&lily.key()), &serde_json::to_string(&lily).unwrap()).unwrap();
        vault.set(INDEX_ENTRY, &serde_json::to_string(&Index { keys: vec![lily.key()], active: Some(lily.key()) }).unwrap()).unwrap();
        let before = vault.get(INDEX_ENTRY).unwrap();

        // before the read: a sign-in is refused and nothing is written
        let state = AuthState::pending_with(Arc::new(vault.clone()));
        assert!(state.add(session("https://b.example", "5", "mila")).is_err());
        assert!(state.activate(&lily.key()).is_err());
        assert!(state.remove(&lily.key()).is_none());
        assert_eq!(vault.get(INDEX_ENTRY).unwrap(), before);
        assert!(vault.get(&session_entry(&session_key("https://b.example", "5"))).unwrap().is_none());
    }

    #[test]
    fn the_index_keeps_keys_it_could_not_read_or_another_copy_added() {
        let vault = MemoryVault::default();
        let lily = session("https://a.example", "3", "lily");
        vault.set(&session_entry(&lily.key()), &serde_json::to_string(&lily).unwrap()).unwrap();
        // an entry this version can't read, and one whose entry is gone
        vault.set(&session_entry("https://c.example|7"), "{not json").unwrap();
        let index = Index { keys: vec![lily.key(), "https://c.example|7".into(), "https://gone.example|1".into()], active: Some(lily.key()) };
        vault.set(INDEX_ENTRY, &serde_json::to_string(&index).unwrap()).unwrap();
        let state = AuthState::with_vault(Box::new(vault.clone()));
        assert_eq!(state.summaries().len(), 1);

        // another copy of the app signs in to a network meanwhile
        let mut theirs = index_of(&vault);
        theirs.keys.push("https://d.example|2".into());
        vault.set(INDEX_ENTRY, &serde_json::to_string(&theirs).unwrap()).unwrap();

        state.add(session("https://b.example", "5", "mila")).unwrap();
        assert_eq!(index_of(&vault).keys, vec![lily.key(), session_key("https://b.example", "5"), "https://c.example|7".into(), "https://d.example|2".into()]);
        assert_eq!(vault.get(&session_entry("https://c.example|7")).unwrap().as_deref(), Some("{not json"), "left as it was");

        // signing out of one takes only that one out
        state.remove(&lily.key());
        assert_eq!(index_of(&vault).keys, vec![session_key("https://b.example", "5"), "https://c.example|7".into(), "https://d.example|2".into()]);
    }

    #[test]
    fn an_unreadable_index_is_kept_aside_not_written_over() {
        let vault = MemoryVault::default();
        vault.set(INDEX_ENTRY, "{damaged").unwrap();
        let state = AuthState::with_vault(Box::new(vault.clone()));
        assert_eq!(vault.get(DAMAGED_INDEX_ENTRY).unwrap().as_deref(), Some("{damaged"));
        state.add(session("https://b.example", "5", "mila")).unwrap();
        assert_eq!(index_of(&vault).keys, vec![session_key("https://b.example", "5")]);
        assert_eq!(vault.get(DAMAGED_INDEX_ENTRY).unwrap().as_deref(), Some("{damaged"));
    }

    #[test]
    fn an_index_that_turns_unreadable_is_not_written_over() {
        let vault = MemoryVault::default();
        let state = AuthState::with_vault(Box::new(vault.clone()));
        state.add(session("https://a.example", "3", "lily")).unwrap();
        vault.set(INDEX_ENTRY, "{damaged").unwrap();
        state.add(session("https://b.example", "5", "mila")).unwrap();
        assert_eq!(vault.get(INDEX_ENTRY).unwrap().as_deref(), Some("{damaged"));
    }

    async fn send(port: u16, request: &str) -> String {
        let mut s = TcpStream::connect(("127.0.0.1", port)).await.unwrap();
        s.write_all(request.as_bytes()).await.unwrap();
        let mut out = String::new();
        let _ = s.read_to_string(&mut out).await;
        out
    }

    #[tokio::test]
    async fn listener_keeps_going_past_stray_and_stalled_connections() {
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let port = listener.local_addr().unwrap().port();
        let waiting = tokio::spawn(async move { wait_for_callback(listener, "good").await });

        // a connection that sends nothing doesn't block the others
        let _stalled = TcpStream::connect(("127.0.0.1", port)).await.unwrap();
        assert!(send(port, "GET /favicon.ico HTTP/1.1\r\n\r\n").await.starts_with("HTTP/1.1 404"));
        assert!(send(port, "GET /callback?code=x&state=bad HTTP/1.1\r\n\r\n").await.starts_with("HTTP/1.1 400"));
        assert!(send(port, "GET /callback?code=real&state=good HTTP/1.1\r\n\r\n").await.starts_with("HTTP/1.1 200"));

        let params = tokio::time::timeout(Duration::from_secs(5), waiting).await.unwrap().unwrap().unwrap();
        assert_eq!(params.code.as_deref(), Some("real"));
    }

    // The page's API requests (api.rs), end to end against a site on this machine. They are here
    // because a signed-in state is built here.

    /// A site that answers each connection with the next of `answers` and keeps what it was sent.
    async fn site(answers: Vec<&'static str>) -> (String, Arc<Mutex<Vec<String>>>) {
        use tokio::io::{AsyncReadExt, AsyncWriteExt};
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let url = format!("http://127.0.0.1:{}", listener.local_addr().unwrap().port());
        let seen = Arc::new(Mutex::new(Vec::new()));
        let kept = seen.clone();
        tokio::spawn(async move {
            for answer in answers {
                let Ok((mut stream, _)) = listener.accept().await else { return };
                let mut request = Vec::new();
                let mut buffer = [0u8; 4096];
                loop {
                    let n = stream.read(&mut buffer).await.unwrap_or(0);
                    request.extend_from_slice(&buffer[..n]);
                    let text = String::from_utf8_lossy(&request).to_string();
                    let Some(head_end) = text.find("\r\n\r\n") else {
                        if n == 0 {
                            break;
                        }
                        continue;
                    };
                    let length = text
                        .lines()
                        .find_map(|l| l.to_ascii_lowercase().strip_prefix("content-length:").map(|v| v.trim().parse::<usize>().unwrap_or(0)))
                        .unwrap_or(0);
                    if n == 0 || request.len() >= head_end + 4 + length {
                        break;
                    }
                }
                kept.lock().unwrap().push(String::from_utf8_lossy(&request).to_string());
                let _ = stream.write_all(answer.as_bytes()).await;
                let _ = stream.shutdown().await;
            }
        });
        (url, seen)
    }

    /// The app with `state` signed in, and what a request of its page comes to: the head or the
    /// failure as JSON, and the body's messages.
    async fn page_request(
        state: AuthState,
        request: serde_json::Value,
    ) -> (tauri::App<tauri::test::MockRuntime>, Result<serde_json::Value, serde_json::Value>, Vec<Vec<u8>>) {
        let app = tauri::test::mock_builder().build(crate::context()).unwrap();
        app.manage(state);
        app.manage(crate::api::ApiCalls::default());
        let (answer, body) = ask_page(&app, request).await;
        (app, answer, body)
    }

    /// A request of the page of an app that is running (page_request starts one).
    async fn ask_page(app: &tauri::App<tauri::test::MockRuntime>, request: serde_json::Value) -> (Result<serde_json::Value, serde_json::Value>, Vec<Vec<u8>>) {
        let (tx, rx) = std::sync::mpsc::channel();
        let on_body = tauri::ipc::Channel::new(move |body| {
            if let tauri::ipc::InvokeResponseBody::Raw(bytes) = body {
                let _ = tx.send(bytes);
            }
            Ok(())
        });
        let answer = crate::api::api_request(app.handle().clone(), app.state(), app.state(), serde_json::from_value(request).unwrap(), on_body).await;
        let answer = answer.map(|head| serde_json::to_value(head).unwrap()).map_err(|failure| serde_json::to_value(failure).unwrap());
        let mut body = Vec::new();
        if answer.is_ok() {
            // until the end message (1) or a failure (2)
            while let Ok(message) = tokio::task::block_in_place(|| rx.recv_timeout(Duration::from_secs(5))) {
                let last = message.first() != Some(&0);
                body.push(message);
                if last {
                    break;
                }
            }
        }
        (answer, body)
    }

    /// The data of an answer's body messages as text.
    fn body_text(messages: &[Vec<u8>]) -> String {
        let data: Vec<u8> = messages.iter().filter(|m| m.first() == Some(&0)).flat_map(|m| m[1..].to_vec()).collect();
        String::from_utf8_lossy(&data).to_string()
    }

    /// What a site answers every /api/v2 request with while its API is turned off (BxDolApiV2Router).
    fn turned_off(code: &str) -> &'static str {
        let body = format!(r#"{{"type":"about:blank","title":"Service Unavailable","status":503,"code":"{code}","detail":"Turned off on this site"}}"#);
        let answer = format!(
            "HTTP/1.1 503 Service Unavailable\r\ncontent-type: application/problem+json\r\ncontent-length: {}\r\nconnection: close\r\n\r\n{body}",
            body.len()
        );
        Box::leak(answer.into_boxed_str())
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn a_site_with_its_api_turned_off_is_told_apart_from_one_without_api_v2() {
        let (url, _) = site(vec![
            turned_off("api_v2_disabled"),
            turned_off("api_disabled"),
            "HTTP/1.1 503 Service Unavailable\r\ncontent-type: text/html\r\ncontent-length: 22\r\nconnection: close\r\n\r\n<html>Maintenance</html>",
            "HTTP/1.1 404 Not Found\r\ncontent-type: text/html\r\ncontent-length: 16\r\nconnection: close\r\n\r\n<html>404</html>",
        ])
        .await;
        let app = tauri::test::mock_builder().build(crate::context()).unwrap();
        app.manage(test_state());

        let v2_off = discover_site(app.state(), url.clone()).await.unwrap_err();
        assert!(v2_off.contains("has API v2 (a preview) turned off"), "{v2_off}");
        assert!(v2_off.contains("Studio > API > Settings"), "{v2_off}");
        assert!(v2_off.contains(&url), "{v2_off}");

        let api_off = discover_site(app.state(), url.clone()).await.unwrap_err();
        assert!(api_off.contains("has its API turned off"), "{api_off}");

        // maintenance and a site without the route: all the app knows is the status
        let maintenance = discover_site(app.state(), url.clone()).await.unwrap_err();
        assert!(maintenance.contains("has no UNA API v2 (the site answered 503"), "{maintenance}");
        let missing = discover_site(app.state(), url.clone()).await.unwrap_err();
        assert!(missing.contains("has no UNA API v2 (the site answered 404"), "{missing}");
    }

    /// A UNA site on 127.0.0.1 as the app sees one: its token endpoint (/m/oauth2/token, which
    /// is not under /api/v2) gives `token`, and /api/v2 gives `api`. Counts the requests to each.
    async fn una_site(
        token: (u16, &'static str),
        api: (u16, &'static str),
    ) -> (String, Arc<std::sync::atomic::AtomicUsize>, Arc<std::sync::atomic::AtomicUsize>) {
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let url = format!("http://127.0.0.1:{}", listener.local_addr().unwrap().port());
        let token_hits = Arc::new(std::sync::atomic::AtomicUsize::new(0));
        let api_hits = Arc::new(std::sync::atomic::AtomicUsize::new(0));
        let (tokens, apis) = (token_hits.clone(), api_hits.clone());
        tokio::spawn(async move {
            loop {
                let Ok((mut stream, _)) = listener.accept().await else { return };
                let mut buf = vec![0u8; 8192];
                let mut read = 0;
                while let Ok(got) = stream.read(&mut buf[read..]).await {
                    read += got;
                    let text = String::from_utf8_lossy(&buf[..read]).to_string();
                    if let Some(head_end) = text.find("\r\n\r\n") {
                        let length = text[..head_end]
                            .lines()
                            .find_map(|l| l.to_ascii_lowercase().strip_prefix("content-length:").map(|v| v.trim().parse::<usize>().unwrap_or(0)))
                            .unwrap_or(0);
                        if read >= head_end + 4 + length {
                            break;
                        }
                    }
                    if got == 0 {
                        break;
                    }
                }
                let head = String::from_utf8_lossy(&buf[..read]).to_string();
                let (status, body) = if head.starts_with("POST /m/oauth2/token") {
                    tokens.fetch_add(1, Ordering::SeqCst);
                    token
                } else {
                    apis.fetch_add(1, Ordering::SeqCst);
                    api
                };
                let answer =
                    format!("HTTP/1.1 {status} X\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}", body.len());
                let _ = stream.write_all(answer.as_bytes()).await;
            }
        });
        (url, token_hits, api_hits)
    }

    /// What UNA's token endpoint answers a refresh with while API v2 is off: the app is no
    /// client of it then, and only authorization codes are taken (OAuthAuthorizeTest.php).
    const REFRESH_NOT_TAKEN: &str = r#"{"error":"unsupported_grant_type","error_description":"Grant type \"refresh_token\" not supported"}"#;
    const V2_OFF_PROBLEM: &str = r#"{"type":"about:blank","title":"Service Unavailable","status":503,"code":"api_v2_disabled","detail":"Turned off"}"#;

    /// A state signed in to the site at `url` with a token that ran out, and its vault and key.
    fn expired_at(url: &str) -> (AuthState, MemoryVault, String) {
        let vault = MemoryVault::default();
        let state = AuthState::with_vault(Box::new(vault.clone()));
        let mut lily = session(url, "3", "old");
        lily.token_endpoint = format!("{url}/m/oauth2/token");
        lily.refresh_token = Some("r1".into());
        lily.expires_at = 0;
        let key = lily.key();
        state.add(lily).unwrap();
        (state, vault, key)
    }

    fn kept_in(vault: &MemoryVault, key: &str) -> StoredSession {
        serde_json::from_str(&vault.get(&session_entry(key)).unwrap().unwrap()).unwrap()
    }

    #[tokio::test]
    async fn a_refresh_refused_because_api_v2_is_turned_off_keeps_the_sign_in() {
        // a cold start: the token ran out and nothing is known of the site yet
        let (url, token_hits, api_hits) = una_site((400, REFRESH_NOT_TAKEN), (503, V2_OFF_PROBLEM)).await;
        let (state, vault, key) = expired_at(&url);
        let generation = state.generation();

        let said = current_token(&state).await.err().expect("no new token while the API is off");
        assert_eq!(said, "API v2 is turned off on this network");
        assert_eq!((token_hits.load(Ordering::SeqCst), api_hits.load(Ordering::SeqCst)), (1, 1));
        assert!(!state.info().unwrap().needs_sign_in, "a site that turned its API off did not sign anyone out");
        assert_eq!(state.generation(), generation);
        assert_eq!(state.availability.code(&url), Some("api_v2_disabled"));
        let kept = kept_in(&vault, &key);
        assert!(!kept.refused);
        assert_eq!(kept.refresh_token.as_deref(), Some("r1"), "the refresh token works again once API v2 is back on");
        assert_eq!(kept.access_token, "old");

        // while the site is held as off, it is not asked for tokens at all: the one it has goes
        for _ in 0..3 {
            let token = current_token(&state).await.unwrap().unwrap();
            assert_eq!(token.token, "old");
        }
        assert_eq!(token_hits.load(Ordering::SeqCst), 1, "the sync poll does not ask the token endpoint every round");
        assert!(!state.info().unwrap().needs_sign_in);
    }

    #[tokio::test]
    async fn a_token_that_runs_out_while_the_api_is_off_is_not_renewed() {
        let (url, token_hits, api_hits) = una_site((400, REFRESH_NOT_TAKEN), (503, V2_OFF_PROBLEM)).await;
        let (state, vault, key) = expired_at(&url);
        // the site said so already (a request of the page, the sync poll)
        state.availability.turned_off(&url, "api_v2_disabled");
        assert_eq!(current_token(&state).await.unwrap().unwrap().token, "old");
        assert_eq!((token_hits.load(Ordering::SeqCst), api_hits.load(Ordering::SeqCst)), (0, 0));
        assert_eq!(kept_in(&vault, &key).refresh_token.as_deref(), Some("r1"));

        // a 401 after it (the API back for a moment) renews; refused the same way, the API is
        // asked, and it is off still
        renew_refused(&state, &url, state.generation(), "old").await.unwrap_err();
        assert!(!state.info().unwrap().needs_sign_in);
        assert_eq!(kept_in(&vault, &key).refresh_token.as_deref(), Some("r1"));
    }

    #[tokio::test]
    async fn a_refresh_refused_by_a_site_whose_api_answers_ends_the_sign_in() {
        // the site removed this app as a client: its API is on, so that is what it means
        let (url, token_hits, api_hits) = una_site((400, REFRESH_NOT_TAKEN), (200, r#"{"name":"Site","api_version":"2"}"#)).await;
        let (state, vault, key) = expired_at(&url);
        assert!(current_token(&state).await.unwrap().is_none());
        assert_eq!((token_hits.load(Ordering::SeqCst), api_hits.load(Ordering::SeqCst)), (1, 1));
        assert!(state.info().unwrap().needs_sign_in);
        assert_eq!(state.availability.code(&url), None);
        let kept = kept_in(&vault, &key);
        assert!(kept.refused && kept.refresh_token.is_none());
    }

    #[tokio::test]
    async fn a_refresh_refused_by_a_site_that_says_nothing_of_its_api_changes_nothing() {
        // maintenance in front of the API: nothing is known, so nothing is thrown away
        let (url, _, _) = una_site((401, r#"{"error":"invalid_client"}"#), (503, "<html>Maintenance</html>")).await;
        let (state, vault, key) = expired_at(&url);
        assert!(current_token(&state).await.is_err());
        assert!(!state.info().unwrap().needs_sign_in);
        assert_eq!(state.availability.code(&url), None);
        assert_eq!(kept_in(&vault, &key).refresh_token.as_deref(), Some("r1"));

        // and a site that cannot be asked at all
        let (endpoint, _) = token_server(vec![(400, REFRESH_NOT_TAKEN)]).await;
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let gone = format!("http://127.0.0.1:{}", listener.local_addr().unwrap().port());
        drop(listener);
        let (state, vault, _) = expired_at(&gone);
        let mut moved = state.get().unwrap();
        moved.token_endpoint = format!("{endpoint}/token");
        let key = moved.key();
        state.add(moved).unwrap();
        assert!(current_token(&state).await.is_err());
        assert!(!state.info().unwrap().needs_sign_in);
        assert_eq!(kept_in(&vault, &key).refresh_token.as_deref(), Some("r1"));
    }

    #[tokio::test]
    async fn a_code_refused_by_a_site_that_turned_api_v2_off_says_so() {
        // /m/oauth2/token says only that it does not know this app (400 invalid_client)
        let (off, _, _) = una_site((400, r#"{"error":"invalid_client"}"#), (503, V2_OFF_PROBLEM)).await;
        let said = exchange_refused(&format!("{off}/"), "The client id supplied is invalid".into()).await;
        assert!(said.contains("has API v2 (a preview) turned off"), "{said}");
        assert!(said.contains(&off) && !said.contains(&format!("{off}/")), "{said}");

        // any other site keeps what its token endpoint said
        let (on, _, _) = una_site((400, r#"{"error":"invalid_grant"}"#), (200, "{}")).await;
        assert_eq!(exchange_refused(&on, "Authorization code expired".into()).await, "Authorization code expired");
        let (maintenance, _, _) = una_site((400, "{}"), (503, "<html>Maintenance</html>")).await;
        assert_eq!(exchange_refused(&maintenance, "The site answered 400 Bad Request".into()).await, "The site answered 400 Bad Request");
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn a_site_that_turns_its_api_off_keeps_the_session_and_is_not_asked_over_and_over() {
        let (url, seen) =
            site(vec![turned_off("api_v2_disabled"), "HTTP/1.1 200 OK\r\ncontent-type: application/json\r\ncontent-length: 2\r\nconnection: close\r\n\r\n{}"])
                .await;
        let (state, generation) = signed_in(&url, "lily-token");
        let request = |id: &str| serde_json::json!({ "id": id, "siteUrl": url, "generation": generation, "method": "GET", "url": format!("{url}/api/v2/me") });

        // the site's own answer reaches the page, and is remembered
        let (app, answer, body) = page_request(state, request("a")).await;
        assert_eq!(answer.unwrap()["status"], 503);
        assert!(body_text(&body).contains("api_v2_disabled"));
        let state = app.state::<AuthState>();
        assert_eq!(state.availability.code(&url), Some("api_v2_disabled"));

        // the next ones get the same problem from here: nothing is sent
        for id in ["b", "c"] {
            let (answer, body) = ask_page(&app, request(id)).await;
            let head = answer.unwrap();
            assert_eq!(head["status"], 503);
            let problem: serde_json::Value = serde_json::from_str(&body_text(&body)).unwrap();
            assert_eq!(problem["code"], "api_v2_disabled");
            assert_eq!(problem["detail"], "API v2 is turned off on this network");
        }
        assert_eq!(seen.lock().unwrap().len(), 1, "the site was asked once");

        // nobody was signed out, and the token is the session's still
        assert!(!state.info().unwrap().needs_sign_in);
        assert_eq!(state.summaries().len(), 1);
        assert_eq!(token_for(&state, &url, generation).await.unwrap().as_deref(), Some("lily-token"));

        // a window of a session that is over still hears that, not the site's state
        let (answer, _) =
            ask_page(&app, serde_json::json!({ "id": "d", "siteUrl": url, "generation": generation + 1, "method": "GET", "url": format!("{url}/api/v2/me") }))
                .await;
        assert_eq!(answer.unwrap_err()["code"], "session_over");

        // once the site is asked again and answers, requests go out as before
        state.availability.answers(&url);
        let (answer, _) = ask_page(&app, request("e")).await;
        assert_eq!(answer.unwrap()["status"], 200);
        assert_eq!(seen.lock().unwrap().len(), 2);
        assert_eq!(state.availability.code(&url), None);
    }

    fn signed_in(site_url: &str, token: &str) -> (AuthState, u64) {
        let state = test_state();
        let mut lily = session(site_url, "3", token);
        lily.refresh_token = Some("refresh-1".into());
        state.add(lily).unwrap();
        let generation = state.generation();
        (state, generation)
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn a_pages_request_carries_the_sessions_token_and_none_of_the_pages_own() {
        let (url, seen) = site(vec!["HTTP/1.1 200 OK\r\ncontent-type: application/json\r\nset-cookie: memberSession=1\r\netag: \"abc\"\r\ncontent-length: 13\r\nconnection: close\r\n\r\n{\"id\":\"lily\"}"]).await;
        let (state, generation) = signed_in(&url, "lily-token");
        let (_app, answer, body) = page_request(
            state,
            serde_json::json!({
                "id": "r1", "siteUrl": url, "generation": generation, "method": "POST", "url": format!("{url}/api/v2/posts"),
                "headers": [["Content-Type", "application/json"], ["Accept-Language", "ru"], ["Authorization", "Bearer of-the-page"], ["Cookie", "memberSession=9"], ["X-Forwarded-For", "10.0.0.1"]],
                "body": b"{\"text\":\"Hi\"}".to_vec(),
            }),
        )
        .await;

        let sent = seen.lock().unwrap().join("").to_ascii_lowercase();
        assert!(sent.starts_with("post /api/v2/posts http/1.1"), "{sent}");
        assert!(sent.contains("authorization: bearer lily-token"), "the session's token: {sent}");
        assert!(!sent.contains("of-the-page") && !sent.contains("cookie") && !sent.contains("x-forwarded-for"), "nothing of the page's: {sent}");
        assert!(sent.contains("content-type: application/json") && sent.contains("accept-language: ru"));
        assert!(sent.ends_with("{\"text\":\"hi\"}"), "{sent}");

        let head = answer.unwrap();
        assert_eq!(head["status"], 200);
        let headers: Vec<String> = head["headers"].as_array().unwrap().iter().map(|h| h[0].as_str().unwrap().to_string()).collect();
        assert!(headers.contains(&"etag".to_string()) && headers.contains(&"content-type".to_string()), "{headers:?}");
        assert!(!headers.contains(&"set-cookie".to_string()), "no cookies for the page");
        let data: Vec<u8> = body.iter().filter(|m| m[0] == 0).flat_map(|m| m[1..].to_vec()).collect();
        assert_eq!(String::from_utf8(data).unwrap(), "{\"id\":\"lily\"}");
        assert_eq!(body.last().unwrap(), &vec![1u8], "the body ends");
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn a_refused_request_renews_the_session_before_the_page_hears_of_it() {
        let (url, seen) = site(vec![
            "HTTP/1.1 401 Unauthorized\r\ncontent-type: application/problem+json\r\ncontent-length: 2\r\nconnection: close\r\n\r\n{}",
            "HTTP/1.1 200 OK\r\ncontent-type: application/json\r\ncontent-length: 83\r\nconnection: close\r\n\r\n{\"access_token\":\"new\",\"refresh_token\":\"r2\",\"expires_in\":3600,\"token_type\":\"Bearer\"}",
        ])
        .await;
        let (state, generation) = signed_in(&url, "old");
        let (app, answer, _body) = page_request(
            state,
            serde_json::json!({ "id": "r1", "siteUrl": url, "generation": generation, "method": "GET", "url": format!("{url}/api/v2/me") }),
        )
        .await;
        assert_eq!(answer.unwrap()["status"], 401, "the page gets the 401 itself");

        let seen = seen.lock().unwrap().clone();
        assert_eq!(seen.len(), 2, "the request, then the renewal");
        assert!(seen[0].to_ascii_lowercase().contains("authorization: bearer old"));
        assert!(seen[1].starts_with("POST /token "), "{}", seen[1]);
        assert!(seen[1].contains("refresh-1"));
        let state = app.state::<AuthState>();
        assert_eq!(token_for(&state, &url, generation).await.unwrap().as_deref(), Some("new"), "the next request has the new token");
        assert!(!state.info().unwrap().needs_sign_in);
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn a_request_that_is_not_the_sessions_api_is_never_sent() {
        let (url, seen) = site(vec!["HTTP/1.1 200 OK\r\ncontent-length: 0\r\n\r\n"]).await;
        let failure = |answer: Result<serde_json::Value, serde_json::Value>| answer.unwrap_err()["code"].as_str().unwrap().to_string();
        let ask = |request: serde_json::Value| {
            let (state, _) = signed_in(&url, "lily-token");
            page_request(state, request)
        };
        let generation = signed_in(&url, "x").1;

        for (what, request) in [
            (
                "another path of the site",
                serde_json::json!({ "id": "a", "siteUrl": url, "generation": generation, "method": "GET", "url": format!("{url}/member.php") }),
            ),
            (
                "out of the API by ..",
                serde_json::json!({ "id": "b", "siteUrl": url, "generation": generation, "method": "GET", "url": format!("{url}/api/v2/../../member.php") }),
            ),
            (
                "another host",
                serde_json::json!({ "id": "c", "siteUrl": url, "generation": generation, "method": "GET", "url": "http://localhost:9/api/v2/me" }),
            ),
            (
                "a method the API has not",
                serde_json::json!({ "id": "d", "siteUrl": url, "generation": generation, "method": "TRACE", "url": format!("{url}/api/v2/me") }),
            ),
        ] {
            assert_eq!(failure(ask(request).await.1), "invalid_request", "{what}");
        }
        for (what, request) in [
            (
                "another sign-in",
                serde_json::json!({ "id": "e", "siteUrl": url, "generation": generation + 1, "method": "GET", "url": format!("{url}/api/v2/me") }),
            ),
            (
                "another site",
                serde_json::json!({ "id": "f", "siteUrl": "https://other.example", "generation": generation, "method": "GET", "url": "https://other.example/api/v2/me" }),
            ),
        ] {
            assert_eq!(failure(ask(request).await.1), "session_over", "{what}");
        }
        assert!(seen.lock().unwrap().is_empty(), "nothing reached the site");
    }
}
