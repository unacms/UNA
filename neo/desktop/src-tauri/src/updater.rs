//! New versions of the app (Settings > About, the app menu's Check for Updates…, and a check at
//! start that Settings can turn off: src/lib/updates.ts).
//!
//! The updater plugin reads the address and the public key from tauri.conf.json, where
//! brand/apply.mjs writes brand.json's `updatesUrl` and `updatesPubkey`: a client project's app
//! asks its own address and takes only packages signed with its own key. The page gets no
//! permission of the plugin's: it asks here whether there is a new version (`check_update`),
//! and to install the one it was told of (`install_update`), which only the main window may.
//! Nothing is downloaded or installed without that second call, which the page makes only when
//! the person chose Install and Restart; the app then starts again in the new version.
//!
//! The package is checked against the key before it is installed (the plugin refuses one that
//! does not verify), and the signature must name the version announced
//! (`requireSignedVersion` in tauri.conf.json), so a doctored `latest.json` cannot pair a new
//! version number with an older release.

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::time::{Duration, Instant};

use serde::Serialize;
use tauri::ipc::Channel;
use tauri::{AppHandle, Runtime, State};
use tauri_plugin_updater::{Error, Update, UpdaterExt};

use crate::i18n::{tr, tr_vars};

/// How long a check may take before it gives up.
const CHECK_TIMEOUT: Duration = Duration::from_secs(30);
/// Release notes longer than this are cut: the page shows them as plain text in a dialog.
const MAX_NOTES: usize = 20_000;
/// The page hears of the download's progress at most this often.
const PROGRESS_EVERY: Duration = Duration::from_millis(100);

/// A new version, as the page shows it.
#[derive(Serialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInfo {
    pub version: String,
    pub current_version: String,
    /// What is new, as the release says it (plain text; the page draws no HTML from it).
    pub notes: Option<String>,
    /// When it was released (RFC 3339).
    pub date: Option<String>,
}

/// What an install says while it goes: the download's size, how much has come, and then that it
/// is installing (the app starts again next; on Windows the installer closes it).
#[derive(Serialize, Clone, Debug, PartialEq)]
#[serde(tag = "event", rename_all = "camelCase")]
pub enum InstallEvent {
    #[serde(rename_all = "camelCase")]
    Started {
        total: Option<u64>,
    },
    #[serde(rename_all = "camelCase")]
    Progress {
        downloaded: u64,
    },
    Installing,
}

/// The update the last check found, kept for `install_update`: the page names no address.
#[derive(Default)]
pub struct UpdaterState {
    found: Mutex<Option<Update>>,
    installing: AtomicBool,
}

impl UpdaterState {
    fn lock(&self) -> std::sync::MutexGuard<'_, Option<Update>> {
        self.found.lock().unwrap_or_else(|e| e.into_inner())
    }
}

fn notes_of(body: Option<&str>) -> Option<String> {
    let body = body?.trim();
    if body.is_empty() {
        return None;
    }
    if body.chars().count() <= MAX_NOTES {
        return Some(body.to_string());
    }
    Some(format!("{}…", body.chars().take(MAX_NOTES).collect::<String>().trim_end()))
}

fn info_of(update: &Update) -> UpdateInfo {
    UpdateInfo {
        version: update.version.clone(),
        current_version: update.current_version.clone(),
        notes: notes_of(update.body.as_deref()),
        date: update.date.and_then(|d| d.format(&time::format_description::well_known::Rfc3339).ok()),
    }
}

/// What the page says when a check or an install failed, in the person's language.
fn reason(error: &Error) -> String {
    match error {
        Error::Reqwest(_) | Error::Network(_) => tr("The update server could not be reached"),
        Error::Minisign(_) | Error::Base64(_) | Error::SignatureUtf8(_) | Error::SignedVersionMismatch { .. } | Error::MissingSignedVersion => {
            tr("The new version is not signed by the app’s publisher, so it was not installed")
        }
        Error::Serialization(_) | Error::Semver(_) | Error::ReleaseNotFound => tr("The update server sent something that is not an update"),
        Error::UnsupportedOs | Error::UnsupportedArch => tr("This system gets no updates from the app"),
        Error::AuthenticationFailed | Error::DebInstallFailed | Error::PackageInstallFailed => {
            tr("The new version could not be installed: permission was not given")
        }
        other => tr_vars("The new version could not be installed: {{reason}}", &[("reason", &other.to_string())]),
    }
}

/// Whether a check that the person did not ask for may go out: never from a development build,
/// whose version is not a release's (it would offer to replace itself with one).
fn automatic_allowed(automatic: bool) -> bool {
    !(automatic && cfg!(debug_assertions))
}

/// Ask the update address whether there is a newer version. `automatic`: the check at start or a
/// later one the app made by itself, not one the person asked for.
#[tauri::command]
pub async fn check_update<R: Runtime>(app: AppHandle<R>, state: State<'_, UpdaterState>, automatic: bool) -> Result<Option<UpdateInfo>, String> {
    if !automatic_allowed(automatic) {
        return Ok(None);
    }
    if state.installing.load(Ordering::SeqCst) {
        return Ok(state.lock().as_ref().map(info_of));
    }
    let updater = app.updater_builder().timeout(CHECK_TIMEOUT).build().map_err(|e| reason(&e))?;
    match updater.check().await {
        Ok(found) => {
            let info = found.as_ref().map(info_of);
            *state.lock() = found;
            Ok(info)
        }
        // a release for the other systems only: nothing for this one yet
        Err(Error::TargetNotFound(_) | Error::TargetsNotFound(_)) => {
            *state.lock() = None;
            Ok(None)
        }
        Err(e) => {
            log::warn!("update check: {e}");
            Err(reason(&e))
        }
    }
}

/// Throttles the download's progress messages.
struct Progress {
    downloaded: u64,
    last: Option<Instant>,
}

impl Progress {
    /// Count a chunk; the bytes so far when the page should hear of them.
    fn add(&mut self, chunk: usize, now: Instant) -> Option<u64> {
        self.downloaded += chunk as u64;
        if self.last.is_some_and(|last| now.duration_since(last) < PROGRESS_EVERY) {
            return None;
        }
        self.last = Some(now);
        Some(self.downloaded)
    }
}

/// Download, check and install the version the last check found, then start the app again in
/// it. Only when the person chose to: the page calls this from Install and Restart.
#[tauri::command]
pub async fn install_update<R: Runtime>(
    app: AppHandle<R>,
    state: State<'_, UpdaterState>,
    version: String,
    on_event: Channel<InstallEvent>,
) -> Result<(), String> {
    let update = state.lock().clone().filter(|u| u.version == version).ok_or_else(|| tr("Check for updates again: the version found is no longer there"))?;
    if state.installing.swap(true, Ordering::SeqCst) {
        return Err(tr("The new version is being installed already"));
    }
    let mut started = false;
    let mut progress = Progress { downloaded: 0, last: None };
    let result = update
        .download(
            |chunk, total| {
                if !started {
                    started = true;
                    let _ = on_event.send(InstallEvent::Started { total });
                }
                if let Some(downloaded) = progress.add(chunk, Instant::now()) {
                    let _ = on_event.send(InstallEvent::Progress { downloaded });
                }
            },
            || {},
        )
        .await
        .and_then(|bytes| {
            let _ = on_event.send(InstallEvent::Installing);
            // Windows: the installer takes over and ends the app here; it starts it again itself
            crate::tray::mark_quitting();
            update.install(bytes)
        });
    if let Err(e) = result {
        state.installing.store(false, Ordering::SeqCst);
        log::error!("update install: {e}");
        return Err(reason(&e));
    }
    log::info!("updated to {}; starting again", update.version);
    crate::tray::mark_quitting();
    app.restart()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn notes_are_plain_trimmed_and_bounded() {
        assert_eq!(notes_of(None), None);
        assert_eq!(notes_of(Some("  \n ")), None);
        assert_eq!(notes_of(Some("\n- Faster feed\n")).as_deref(), Some("- Faster feed"));
        let long = "é".repeat(MAX_NOTES + 10);
        let cut = notes_of(Some(&long)).unwrap();
        assert_eq!(cut.chars().count(), MAX_NOTES + 1, "cut on a character, with an ellipsis");
        assert!(cut.ends_with('…'));
    }

    #[test]
    fn progress_is_said_at_most_every_tenth_of_a_second() {
        let start = Instant::now();
        let mut p = Progress { downloaded: 0, last: None };
        assert_eq!(p.add(10, start), Some(10), "the first chunk at once");
        assert_eq!(p.add(10, start + Duration::from_millis(50)), None);
        assert_eq!(p.add(10, start + Duration::from_millis(120)), Some(30), "the bytes so far, none lost");
    }

    #[test]
    fn a_development_build_checks_only_when_asked() {
        assert!(automatic_allowed(false));
        assert_eq!(automatic_allowed(true), !cfg!(debug_assertions));
    }

    #[test]
    fn events_are_what_the_page_reads() {
        let json = |e: InstallEvent| serde_json::to_value(e).unwrap();
        assert_eq!(json(InstallEvent::Started { total: Some(5) }), serde_json::json!({ "event": "started", "total": 5 }));
        assert_eq!(json(InstallEvent::Progress { downloaded: 3 }), serde_json::json!({ "event": "progress", "downloaded": 3 }));
        assert_eq!(json(InstallEvent::Installing), serde_json::json!({ "event": "installing" }));
        let page = include_str!("../../src/lib/updates.ts");
        for name in ["'started'", "'progress'", "'installing'", "currentVersion", "check_update", "install_update"] {
            assert!(page.contains(name), "src/lib/updates.ts reads {name}");
        }
    }

    #[test]
    fn reasons_say_what_went_wrong() {
        assert_eq!(reason(&Error::Network("x".into())), "The update server could not be reached");
        assert_eq!(reason(&Error::MissingSignedVersion), "The new version is not signed by the app’s publisher, so it was not installed");
        assert_eq!(reason(&Error::ReleaseNotFound), "The update server sent something that is not an update");
    }

    #[test]
    fn the_config_takes_signed_versions_only_from_the_brands_address() {
        let config: serde_json::Value = serde_json::from_str(include_str!("../tauri.conf.json")).unwrap();
        let brand: serde_json::Value = serde_json::from_str(include_str!("../../brand/brand.json")).unwrap();
        let updater = &config["plugins"]["updater"];
        assert_eq!(updater["endpoints"], serde_json::json!([brand["updatesUrl"]]), "run node brand/apply.mjs");
        assert_eq!(updater["pubkey"], brand["updatesPubkey"], "run node brand/apply.mjs");
        assert_eq!(updater["requireSignedVersion"], true);
        assert_ne!(updater["dangerousInsecureTransportProtocol"], true);
        assert_ne!(updater["allowDowngrades"], true);
    }
}
