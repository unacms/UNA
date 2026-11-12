/// The app's own commands, so each capability grants only those its windows need: the main
/// window all of them (capabilities/default.json), a window of its own (windows.rs) what reading
/// and replying takes (capabilities/secondary.json).
const COMMANDS: &[&str] = &[
    "get_session",
    "discover_site",
    "sign_in",
    "cancel_sign_in",
    "api_request",
    "api_abort",
    "sign_out",
    "token_refused",
    "list_sessions",
    "switch_session",
    "name_network",
    "page_ready",
    "set_nav_state",
    "set_sidebar_shown",
    "window_material",
    "popup_menu",
    "get_settings",
    "set_setting",
    "take_deep_links",
    "pick_files",
    "stage_dropped",
    "stage_bytes",
    "release_file",
    "cancel_upload",
    "upload_file",
    "save_download",
    "sync_now",
    "realtime_watch",
    "check_update",
    "install_update",
    "open_window",
];

/// The brand (../brand/brand.json) as compile-time values of the shell (src/brand.rs).
fn brand() {
    println!("cargo:rerun-if-changed=../brand/brand.json");
    let text = std::fs::read_to_string("../brand/brand.json").expect("brand/brand.json");
    let brand: serde_json::Value = serde_json::from_str(&text).expect("brand/brand.json is JSON");
    for (key, var) in [("name", "BRAND_NAME"), ("identifier", "BRAND_IDENTIFIER"), ("scheme", "BRAND_SCHEME"), ("issuesUrl", "BRAND_ISSUES_URL")] {
        let value = brand[key].as_str().filter(|v| !v.trim().is_empty()).unwrap_or_else(|| panic!("brand/brand.json has no {key}"));
        assert!(!value.contains(['\n', '\r']), "brand/brand.json: {key} is one line");
        println!("cargo:rustc-env={var}={value}");
    }
}

fn main() {
    brand();
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(tauri_build::AppManifest::new().commands(COMMANDS)))
        .expect("failed to run the Tauri build script");
}
