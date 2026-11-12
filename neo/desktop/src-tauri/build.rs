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
    "api_availability",
    "api_check",
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

/// Windows, MSVC: the application manifest (windows-app-manifest.xml, Tauri's default: Common
/// Controls 6) goes into everything the linker makes, not only the app. Tauri's build script puts
/// it in a resource file that only binaries link, so the unit tests' executable had none, got
/// comctl32 5, which has no TaskDialogIndirect (the dialogs import it), and Windows refused to
/// start it: STATUS_ENTRYPOINT_NOT_FOUND. An executable takes one manifest, so Tauri's is left out.
fn windows_attributes() -> tauri_build::WindowsAttributes {
    let env = |name: &str| std::env::var(name).unwrap_or_default();
    if env("CARGO_CFG_TARGET_OS") != "windows" || env("CARGO_CFG_TARGET_ENV") != "msvc" {
        return tauri_build::WindowsAttributes::new();
    }
    let manifest = std::path::Path::new(&env("CARGO_MANIFEST_DIR")).join("windows-app-manifest.xml");
    assert!(manifest.is_file(), "windows-app-manifest.xml is next to Cargo.toml");
    println!("cargo:rerun-if-changed={}", manifest.display());
    println!("cargo:rustc-link-arg=/MANIFEST:EMBED");
    println!("cargo:rustc-link-arg=/MANIFESTINPUT:{}", manifest.display());
    tauri_build::WindowsAttributes::new_without_app_manifest()
}

fn main() {
    brand();
    let attributes = tauri_build::Attributes::new().windows_attributes(windows_attributes()).app_manifest(tauri_build::AppManifest::new().commands(COMMANDS));
    tauri_build::try_build(attributes).expect("failed to run the Tauri build script");
}
