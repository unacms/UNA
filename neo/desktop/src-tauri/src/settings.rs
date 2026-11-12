//! The app's settings (Settings, src/lib/settings.ts), kept here in Rust: whether new
//! notifications show as OS notifications (sync.rs), whether closing the window keeps the app
//! running (tray.rs), the theme and single-key shortcuts. The page reads them with get_settings
//! (every window: a window of its own follows the theme and the keys too) and changes them with
//! set_setting, which only the main window is granted (capabilities/default.json).
//!
//! They are not a store of the store plugin: its permissions reach every store that is open, so
//! a window of its own, which may write drafts.json, could then rewrite these too. The file is
//! the one the store plugin kept them in before (settings.json in the app data folder, a JSON
//! object), so settings made with an earlier version stay.

use std::path::PathBuf;
use std::sync::Mutex;

use serde_json::{Map, Value};
use tauri::{AppHandle, Manager, Runtime, State};

/// The file in the app data folder.
pub const SETTINGS_FILE: &str = "settings.json";
pub const THEME: &str = "theme";
pub const SINGLE_KEY_SHORTCUTS: &str = "singleKeyShortcuts";
pub const OS_NOTIFICATIONS: &str = "osNotifications";
pub const CLOSE_TO_TRAY: &str = "closeToTray";
/// Enter adds a line in a message and only Cmd+Enter (Ctrl+Enter) sends; the page acts on it.
pub const SEND_WITH_CMD_ENTER: &str = "sendWithCmdEnter";
/// The language of the app's own words, or "system" (src/lib/i18n.ts).
pub const LANGUAGE: &str = "language";
/// Look for a new version at start and once a day (src/lib/updates.ts; updater.rs checks).
pub const CHECK_FOR_UPDATES: &str = "checkForUpdates";

/// The settings there are, the page's keys (src/lib/settings.ts).
const KEYS: [&str; 7] = [THEME, SINGLE_KEY_SHORTCUTS, OS_NOTIFICATIONS, CLOSE_TO_TRAY, SEND_WITH_CMD_ENTER, LANGUAGE, CHECK_FOR_UPDATES];

/// Whether a value is one the setting takes: a theme name, a language code or "system", or on
/// and off for the others. Which languages there are is the page's to know.
fn valid(key: &str, value: &Value) -> bool {
    match key {
        THEME => matches!(value.as_str(), Some("system" | "light" | "dark")),
        LANGUAGE => value.as_str().is_some_and(|s| s == "system" || ((2..=3).contains(&s.len()) && s.bytes().all(|b| b.is_ascii_lowercase()))),
        SINGLE_KEY_SHORTCUTS | OS_NOTIFICATIONS | CLOSE_TO_TRAY | SEND_WITH_CMD_ENTER | CHECK_FOR_UPDATES => value.is_boolean(),
        _ => false,
    }
}

/// Only known keys with valid values, whatever the file holds.
fn known(values: Map<String, Value>) -> Map<String, Value> {
    values.into_iter().filter(|(k, v)| KEYS.contains(&k.as_str()) && valid(k, v)).collect()
}

pub struct SettingsState {
    /// None when there is no app data folder: settings last until the app quits.
    path: Option<PathBuf>,
    values: Mutex<Map<String, Value>>,
}

impl SettingsState {
    pub fn load(path: Option<PathBuf>) -> Self {
        let values = path
            .as_ref()
            .and_then(|p| std::fs::read_to_string(p).ok())
            .and_then(|s| serde_json::from_str::<Map<String, Value>>(&s).ok())
            .map(known)
            .unwrap_or_default();
        Self { path, values: Mutex::new(values) }
    }

    /// Where the settings of this app are kept: settings.json in its app data folder.
    pub fn at<R: Runtime>(app: &AppHandle<R>) -> Self {
        Self::load(app.path().app_data_dir().ok().map(|d| d.join(SETTINGS_FILE)))
    }

    fn lock(&self) -> std::sync::MutexGuard<'_, Map<String, Value>> {
        self.values.lock().unwrap_or_else(|e| e.into_inner())
    }

    pub fn all(&self) -> Map<String, Value> {
        self.lock().clone()
    }

    pub fn get(&self, key: &str) -> Option<Value> {
        self.lock().get(key).cloned()
    }

    /// Change one setting and keep it (written to a new file that then replaces the old one).
    pub fn set(&self, key: &str, value: Value) -> Result<(), String> {
        if !KEYS.contains(&key) {
            return Err(format!("There is no setting {key}"));
        }
        if !valid(key, &value) {
            return Err(format!("Not a value of {key}"));
        }
        let mut values = self.lock();
        values.insert(key.to_string(), value);
        let Some(path) = &self.path else { return Ok(()) };
        let json = serde_json::to_string_pretty(&*values).map_err(|e| e.to_string())?;
        if let Some(dir) = path.parent() {
            std::fs::create_dir_all(dir).map_err(|e| format!("Could not keep the setting: {e}"))?;
        }
        let tmp = path.with_extension("json.tmp");
        std::fs::write(&tmp, json).and_then(|()| std::fs::rename(&tmp, path)).map_err(|e| format!("Could not keep the setting: {e}"))
    }
}

/// The settings kept (those never set are left out: the page has their defaults).
#[tauri::command]
pub fn get_settings(state: State<'_, SettingsState>) -> Map<String, Value> {
    state.all()
}

/// Change a setting (the main window only).
#[tauri::command]
pub fn set_setting<R: Runtime>(app: AppHandle<R>, state: State<'_, SettingsState>, key: String, value: Value) -> Result<(), String> {
    state.set(&key, value)?;
    // the menu bar and the tray say their words in the new language; the page loads itself again in it
    if key == LANGUAGE && crate::i18n::apply(&app) {
        crate::menu::retitle(&app);
        crate::tray::retitle(&app);
    }
    Ok(())
}

/// A setting that is on or off; anything else (not set yet, not a boolean) is its default.
pub(crate) fn flag_value(value: Option<&Value>, default: bool) -> bool {
    value.and_then(Value::as_bool).unwrap_or(default)
}

fn flag<R: Runtime>(app: &AppHandle<R>, key: &str, default: bool) -> bool {
    let value = app.try_state::<SettingsState>().and_then(|s| s.get(key));
    flag_value(value.as_ref(), default)
}

/// Closing the main window hides it by default on macOS (the app stays in the Dock) and Windows
/// (in the tray), as people expect there; not on Linux, where a tray may not exist.
pub const CLOSE_TO_TRAY_DEFAULT: bool = cfg!(any(target_os = "macos", windows));

/// New notifications show as OS notifications while the window has no focus (on by default).
pub fn os_notifications<R: Runtime>(app: &AppHandle<R>) -> bool {
    flag(app, OS_NOTIFICATIONS, true)
}

/// Closing the main window hides it instead of ending the app.
pub fn close_to_tray<R: Runtime>(app: &AppHandle<R>) -> bool {
    flag(app, CLOSE_TO_TRAY, CLOSE_TO_TRAY_DEFAULT)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn a_flag_is_its_default_until_set() {
        assert!(flag_value(None, true));
        assert!(!flag_value(None, false));
        assert!(!flag_value(Some(&json!(false)), true));
        assert!(flag_value(Some(&json!(true)), false));
        assert!(flag_value(Some(&json!("off")), true), "not a boolean: the default");
    }

    #[test]
    fn keys_are_the_pages() {
        let page = include_str!("../../src/lib/settings.ts");
        for key in KEYS {
            assert!(page.contains(&format!("'{key}'")), "src/lib/settings.ts names {key}");
        }
    }

    fn temp_file() -> PathBuf {
        let mut bytes = [0u8; 8];
        rand::RngCore::fill_bytes(&mut rand::thread_rng(), &mut bytes);
        let name: String = bytes.iter().map(|b| format!("{b:02x}")).collect();
        std::env::temp_dir().join(format!("una-settings-{name}")).join(SETTINGS_FILE)
    }

    #[test]
    fn the_language_is_a_code_or_the_systems() {
        let state = SettingsState::load(None);
        state.set(LANGUAGE, json!("ru")).unwrap();
        assert_eq!(state.get(LANGUAGE), Some(json!("ru")));
        state.set(LANGUAGE, json!("system")).unwrap();
        assert!(state.set(LANGUAGE, json!("Russian")).is_err(), "not a language code");
        assert!(state.set(LANGUAGE, json!("../x")).is_err(), "not a language code");
        assert!(state.set(LANGUAGE, json!(true)).is_err(), "not a language code");
        assert_eq!(state.get(LANGUAGE), Some(json!("system")));
    }

    #[test]
    fn settings_are_kept_and_only_known_values_taken() {
        let path = temp_file();
        let state = SettingsState::load(Some(path.clone()));
        assert!(state.all().is_empty(), "nothing set yet");
        state.set(OS_NOTIFICATIONS, json!(false)).unwrap();
        state.set(THEME, json!("dark")).unwrap();
        assert!(state.set(THEME, json!("pink")).is_err(), "not a theme");
        assert!(state.set(CLOSE_TO_TRAY, json!("yes")).is_err(), "not on or off");
        assert!(state.set("anything", json!(true)).is_err(), "not a setting");

        let again = SettingsState::load(Some(path.clone()));
        assert_eq!(again.get(OS_NOTIFICATIONS), Some(json!(false)));
        assert_eq!(again.get(THEME), Some(json!("dark")));
        assert_eq!(again.all().len(), 2);
        let _ = std::fs::remove_dir_all(path.parent().unwrap());
    }

    #[test]
    fn the_store_plugins_file_of_an_earlier_version_is_read() {
        let path = temp_file();
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();
        std::fs::write(&path, r#"{"closeToTray":false,"theme":"light","junk":1,"singleKeyShortcuts":"x"}"#).unwrap();
        let state = SettingsState::load(Some(path.clone()));
        assert_eq!(state.all(), json!({ "closeToTray": false, "theme": "light" }).as_object().unwrap().clone());
        let _ = std::fs::remove_dir_all(path.parent().unwrap());
    }
}
