//! The words the native side says, in the person's language: the menu bar, the tray, file
//! dialogs, the page a browser shows after sign-in, and the reasons Rust gives the page.
//!
//! The same files as the page's (src/lib/i18n.ts): one JSON object per language in src/locales,
//! keyed by the English text, with `_one`, `_few`, `_many`, `_other` keys for texts with a count.
//! English has no file. src/locales/locales.test.ts reads this folder's `tr("...")`, `tr_vars("...",`
//! and `trn(n, "...", "...")` calls too, so a text written here is missing from no language.
//! The first argument is a literal for that reason; `tr_command` is for the labels of
//! commands.json, which that test reads from the file.
//!
//! The language is the setting (settings.rs LANGUAGE) or the system's first language the app
//! has, as on the page. It is read before the menu is built, and again when the setting changes.

use std::collections::HashMap;
use std::sync::{OnceLock, RwLock};

use tauri::{AppHandle, Runtime};

/// A language's file. Add one: a line here and in src/lib/i18n.ts (`the_languages_are_the_files`
/// fails until both sides know it).
const FILES: &[(&str, &str)] = &[
    ("de", include_str!("../../src/locales/de.json")),
    ("es", include_str!("../../src/locales/es.json")),
    ("fr", include_str!("../../src/locales/fr.json")),
    ("ru", include_str!("../../src/locales/ru.json")),
];

fn catalog(language: &str) -> Option<&'static HashMap<String, String>> {
    static CATALOGS: OnceLock<HashMap<&'static str, HashMap<String, String>>> = OnceLock::new();
    CATALOGS.get_or_init(|| FILES.iter().map(|(language, json)| (*language, serde_json::from_str(json).unwrap_or_default())).collect()).get(language)
}

fn current() -> &'static RwLock<String> {
    static CURRENT: OnceLock<RwLock<String>> = OnceLock::new();
    CURRENT.get_or_init(|| RwLock::new("en".into()))
}

/// The language in use ("en", "ru", ...).
pub fn language() -> String {
    current().read().unwrap_or_else(|e| e.into_inner()).clone()
}

/// The language for a choice ("system", a language, or nothing kept) and the system's languages
/// in the person's order ("ru-RU", "en-US"): the page's `resolveLanguage`.
pub fn resolve(choice: Option<&str>, system: &[String]) -> String {
    let has = |language: &str| language == "en" || FILES.iter().any(|(l, _)| *l == language);
    if let Some(chosen) = choice.filter(|c| *c != "system" && has(c)) {
        return chosen.to_string();
    }
    system
        .iter()
        .map(|tag| tag.to_lowercase())
        .filter_map(|tag| tag.split(['-', '_']).next().map(str::to_string))
        .find(|base| has(base))
        .unwrap_or_else(|| "en".into())
}

/// Use the language the settings and the system give. True when it changed.
pub fn apply<R: Runtime>(app: &AppHandle<R>) -> bool {
    use tauri::Manager;
    // before setup the settings are not managed yet (the menu is built first): read the file
    let kept = match app.try_state::<crate::settings::SettingsState>() {
        Some(state) => state.get(crate::settings::LANGUAGE),
        None => crate::settings::SettingsState::at(app).get(crate::settings::LANGUAGE),
    };
    let system: Vec<String> = sys_locale::get_locales().collect();
    let next = resolve(kept.as_ref().and_then(|v| v.as_str()), &system);
    let mut now = current().write().unwrap_or_else(|e| e.into_inner());
    let changed = *now != next;
    *now = next;
    changed
}

/// The count form a language uses for `n` things: CLDR's rules for whole numbers, for the
/// languages there are files for. Any other language: English's.
pub(crate) fn plural_form(language: &str, n: u64) -> &'static str {
    match language {
        "ru" | "uk" | "be" => match (n % 10, n % 100) {
            (1, r) if r != 11 => "one",
            (2..=4, r) if !(12..=14).contains(&r) => "few",
            _ => "many",
        },
        "fr" if n <= 1 => "one",
        "fr" | "es" | "it" | "pt" if n != 0 && n.is_multiple_of(1_000_000) => "many",
        _ if n == 1 => "one",
        _ => "other",
    }
}

fn fill(text: &str, vars: &[(&str, &str)]) -> String {
    vars.iter().fold(text.to_string(), |text, (name, value)| text.replace(&format!("{{{{{name}}}}}"), value))
}

pub(crate) fn tr_in(language: &str, text: &str) -> String {
    catalog(language).and_then(|c| c.get(text)).cloned().unwrap_or_else(|| text.to_string())
}

pub(crate) fn trn_in(language: &str, count: u64, one: &str, other: &str) -> String {
    let english = if count == 1 { one } else { other };
    let said = catalog(language).and_then(|c| c.get(&format!("{one}_{}", plural_form(language, count)))).map_or(english, String::as_str);
    fill(said, &[("count", &count.to_string())])
}

/// `text` in the person's language; `text` is the English, a literal.
pub fn tr(text: &str) -> String {
    tr_in(&language(), text)
}

/// The same with `{{name}}` parts put in.
pub fn tr_vars(text: &str, vars: &[(&str, &str)]) -> String {
    fill(&tr(text), vars)
}

/// A text with a count, in the form the language uses for it; `{{count}}` is the number.
pub fn trn(count: u64, one: &str, other: &str) -> String {
    trn_in(&language(), count, one, other)
}

/// A label or help text of commands.json (the macOS menu bar says them).
#[cfg_attr(not(target_os = "macos"), allow(dead_code))]
pub fn tr_command(text: &str) -> String {
    tr(text)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn system(tags: &[&str]) -> Vec<String> {
        tags.iter().map(|t| t.to_string()).collect()
    }

    #[test]
    fn the_language_is_the_choice_or_the_systems_first_one_there_is() {
        assert_eq!(resolve(Some("ru"), &system(&["en-US"])), "ru");
        assert_eq!(resolve(Some("en"), &system(&["ru-RU"])), "en");
        assert_eq!(resolve(Some("system"), &system(&["ru-RU", "en-US"])), "ru");
        assert_eq!(resolve(None, &system(&["ja-JP", "ru_RU"])), "ru");
        assert_eq!(resolve(None, &system(&["ja-JP"])), "en");
        assert_eq!(resolve(None, &[]), "en");
        // a choice the app has no words for (a file removed since) is the system's
        assert_eq!(resolve(Some("xx"), &system(&["en-GB"])), "en");
    }

    #[test]
    fn english_is_the_text_itself() {
        assert_eq!(language(), "en", "tests run in English");
        assert_eq!(tr("No such text anywhere"), "No such text anywhere");
        assert_eq!(tr_vars("Quit {{name}}", &[("name", "UNA")]), "Quit UNA");
        assert_eq!(trn(1, "{{count}} thing", "{{count}} things"), "1 thing");
        assert_eq!(trn(0, "{{count}} thing", "{{count}} things"), "0 things");
        assert_eq!(trn(12, "{{count}} thing", "{{count}} things"), "12 things");
    }

    #[test]
    fn a_language_without_the_text_says_it_in_english() {
        assert_eq!(tr_in("ru", "No such text anywhere"), "No such text anywhere");
        assert_eq!(trn_in("ru", 5, "{{count}} such thing", "{{count}} such things"), "5 such things");
        assert_eq!(tr_in("xx", "Quit"), "Quit");
    }

    #[test]
    fn counts_take_the_form_the_language_has_for_them() {
        let forms = |language: &str, counts: &[u64]| counts.iter().map(|n| plural_form(language, *n)).collect::<Vec<_>>();
        assert_eq!(forms("en", &[0, 1, 2, 21]), ["other", "one", "other", "other"]);
        assert_eq!(forms("de", &[0, 1, 2]), ["other", "one", "other"]);
        assert_eq!(
            forms("ru", &[1, 2, 4, 5, 11, 12, 14, 21, 22, 25, 101, 111, 0]),
            ["one", "few", "few", "many", "many", "many", "many", "one", "few", "many", "one", "many", "many"]
        );
        assert_eq!(forms("fr", &[0, 1, 2, 1_000_000]), ["one", "one", "other", "many"]);
        assert_eq!(forms("es", &[0, 1, 2, 1_000_000]), ["other", "one", "other", "many"]);
    }

    #[test]
    fn the_languages_are_the_files() {
        let dir = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../src/locales");
        let mut files: Vec<String> = std::fs::read_dir(dir)
            .unwrap()
            .filter_map(|e| e.ok()?.file_name().into_string().ok())
            .filter_map(|name| name.strip_suffix(".json").map(str::to_string))
            .collect();
        files.sort();
        let mut known: Vec<String> = FILES.iter().map(|(l, _)| l.to_string()).collect();
        known.sort();
        assert_eq!(known, files, "src-tauri/src/i18n.rs FILES and src/locales/*.json");
        for (language, json) in FILES {
            assert!(serde_json::from_str::<HashMap<String, String>>(json).is_ok(), "{language}.json is an object of texts");
        }
    }
}
