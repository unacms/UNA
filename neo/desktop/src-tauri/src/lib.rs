mod api;
mod auth;
mod availability;
mod badge;
mod brand;
mod deep_link;
mod download;
mod i18n;
mod material;
mod media;
mod menu;
mod popup;
mod realtime;
mod settings;
mod sync;
mod tray;
mod updater;
mod upload;
mod windows;

use std::time::Duration;

use tauri::{window::Color, DragDropEvent, Emitter, Manager, RunEvent, Theme, WebviewWindow, WindowEvent};

/// The app's config and ACL, built once (a second generate_context! would embed Info.plist twice).
pub(crate) fn context<R: tauri::Runtime>() -> tauri::Context<R> {
    tauri::generate_context!()
}

/// How long the main window may stay hidden waiting for the web view's first paint. The web
/// view shows it itself (src/app.tsx); this keeps a crashed page from leaving an invisible app.
const SHOW_FALLBACK: Duration = Duration::from_secs(3);

/// Lasting drafts, in the app data folder; the same name as DRAFTS_FILE in src/lib/drafts.ts.
const DRAFTS_FILE: &str = "drafts.json";

/// The window's own background, behind the page. With a material (material.rs) it is clear, so
/// the material shows (WebView2 lets Mica through only at alpha exactly 0). Without one it is
/// NEO's neutral-100 or neutral-950, the page's `--bg-window` (tokens.css), so a transparent
/// window never shows through and there is no white flash.
pub(crate) fn background(theme: Theme, material: material::Material) -> Color {
    match (material, theme) {
        (material::Material::Sidebar | material::Material::Mica, _) => Color(0, 0, 0, 0),
        (material::Material::None, Theme::Dark) => Color(10, 10, 12, 255),
        (material::Material::None, _) => Color(244, 244, 245, 255),
    }
}

fn paint_background<R: tauri::Runtime>(window: &WebviewWindow<R>, theme: Theme, material: material::Material) {
    if let Err(e) = window.set_background_color(Some(background(theme, material))) {
        log::warn!("background colour: {e}");
    }
}

/// The material a window has: the main window this OS build's, windows of their own none (opaque).
fn material_of(label: &str) -> material::Material {
    if label == "main" {
        material::for_this_os()
    } else {
        material::Material::None
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    #[cfg(desktop)]
    {
        use tauri_plugin_window_state::StateFlags;

        // must be the first plugin: a second launch focuses the running window instead, and
        // hands a una:// link it was started with to the deep-link plugin (deep_link.rs)
        builder = builder
            .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| tray::show_main(app)))
            .plugin(tauri_plugin_deep_link::init())
            // Start at login (Settings): with --hidden, so the window stays closed (tray.rs)
            .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, Some(vec![tray::HIDDEN_FLAG])))
            // not VISIBLE: restoring it would show the window before the first paint
            .plugin(
                tauri_plugin_window_state::Builder::default()
                    .with_state_flags(StateFlags::all() & !StateFlags::VISIBLE)
                    // windows of their own (windows.rs) share one saved size, not one per route
                    .map_label(windows::state_label)
                    .build(),
            );
    }

    // macOS always has a menu bar: give it the app's commands. Windows and Linux get none;
    // the web view handles the same shortcuts there (src/lib/shortcuts.ts).
    #[cfg(target_os = "macos")]
    {
        builder = builder.menu(menu::build);
    }

    builder
        // pictures of a local http site, which WebKit blocks as mixed content on the page (media.rs)
        .register_asynchronous_uri_scheme_protocol(media::SCHEME, media::handle)
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        // Copy Link: a native menu's click carries no user activation into the page, which
        // navigator.clipboard needs; the page writes text only (write-text, no reads)
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        // new versions: the page asks Rust to check and to install (updater.rs), never the plugin
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_log::Builder::new().level(log::LevelFilter::Info).build())
        // the keychain is read later, once the page asks for the session with its window shown
        // (auth.rs ensure_loaded): a keychain prompt now would leave the app without a window
        .manage(auth::AuthState::pending())
        .manage(upload::UploadState::default())
        .manage(api::ApiCalls::default())
        .manage(sync::SyncState::default())
        .manage(deep_link::DeepLinks::default())
        .manage(menu::NavStates::default())
        .manage(updater::UpdaterState::default())
        .manage(realtime::RealtimeState::default())
        .setup(|app| {
            // started at login: the window stays closed until the tray, the Dock or a link opens it
            tray::set_hidden(tray::starts_hidden(std::env::args()));

            // the settings (settings.rs): Rust's own, not a store the store plugin's permissions reach
            app.manage(settings::SettingsState::at(app.handle()));

            // the drafts file (src/lib/drafts.ts), opened here: the page may only reach a store
            // that is already open (store:allow-get-store), never name a path itself (load)
            if let Err(e) = tauri_plugin_store::StoreBuilder::new(app, DRAFTS_FILE).disable_auto_save().build() {
                log::error!("drafts: {e}");
            }

            menu::forward_events(app.handle());

            // the tray, the badge and OS notifications, kept current from here while the
            // window is hidden too (sync.rs)
            #[cfg(desktop)]
            if let Err(e) = tray::build(app.handle()) {
                log::error!("tray: {e}");
            }
            // a site's API turned off, or answering again (availability.rs): every window hears
            // it, and the poll and the sockets look again as soon as it is back
            let handle = app.handle().clone();
            app.state::<auth::AuthState>().availability.listen(move |site, code| {
                if let Err(e) = handle.emit(availability::EVENT, serde_json::json!({ "site": site, "code": code })) {
                    log::error!("api availability event: {e}");
                }
                if code.is_none() {
                    handle.state::<sync::SyncState>().wake();
                    handle.state::<realtime::RealtimeState>().wake();
                }
            });
            sync::listen_for_clicks(app.handle());
            sync::start(app.handle().clone());
            // live events from the network's sockets server, when it has one (realtime.rs)
            realtime::start(app.handle().clone());
            #[cfg(desktop)]
            deep_link::listen(app);

            if let Some(window) = app.get_webview_window("main") {
                // the material first, then the background it needs (clear over a material, else opaque)
                let material = material::apply(&window);
                paint_background(&window, window.theme().unwrap_or(Theme::Light), material);
                tauri::async_runtime::spawn(async move {
                    tokio::time::sleep(SHOW_FALLBACK).await;
                    if !tray::is_hidden() && !window.is_visible().unwrap_or(true) {
                        log::warn!("the page did not show the window in time; showing it");
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                });
            }
            Ok(())
        })
        .on_window_event(|window, event| match event {
            // macOS and Windows: closing the window hides it, the app keeps running in the
            // Dock or tray with its badge and notifications; Quit ends it (tray.rs)
            WindowEvent::CloseRequested { api, .. } if window.label() == "main" && tray::close_to_tray(window.app_handle()) => {
                api.prevent_close();
                let _ = window.hide();
            }
            // back to the window: what changed meanwhile, now
            WindowEvent::Focused(true) => {
                window.app_handle().state::<sync::SyncState>().wake();
                // the menu's Back and Forward go to this window: they show its history
                menu::window_focused(window.app_handle(), window.label());
            }
            WindowEvent::Destroyed => {
                window.app_handle().state::<menu::NavStates>().forget(window.label());
                window.app_handle().state::<realtime::RealtimeState>().forget(window.label());
            }
            WindowEvent::ThemeChanged(theme) => {
                if let Some(webview) = window.app_handle().get_webview_window(window.label()) {
                    paint_background(&webview, *theme, material_of(window.label()));
                }
            }
            // files dropped on the window may be uploaded (upload.rs, stage_dropped)
            WindowEvent::DragDrop(DragDropEvent::Drop { paths, .. }) => {
                window.app_handle().state::<upload::UploadState>().record_drop(paths);
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            auth::get_session,
            auth::discover_site,
            auth::sign_in,
            auth::cancel_sign_in,
            api::api_request,
            api::api_abort,
            availability::api_availability,
            availability::api_check,
            auth::sign_out,
            auth::token_refused,
            auth::list_sessions,
            auth::switch_session,
            auth::name_network,
            tray::page_ready,
            menu::set_nav_state,
            menu::set_sidebar_shown,
            material::window_material,
            popup::popup_menu,
            settings::get_settings,
            settings::set_setting,
            deep_link::take_deep_links,
            download::save_download,
            upload::pick_files,
            upload::stage_dropped,
            upload::stage_bytes,
            upload::release_file,
            upload::cancel_upload,
            upload::upload_file,
            sync::sync_now,
            realtime::realtime_watch,
            updater::check_update,
            updater::install_update,
            windows::open_window
        ])
        .build(context())
        .expect("error while building the UNA desktop app")
        .run(|app, event| match event {
            RunEvent::ExitRequested { .. } => tray::mark_quitting(),
            // a click on the Dock icon while the window is hidden
            #[cfg(target_os = "macos")]
            RunEvent::Reopen { has_visible_windows: false, .. } => tray::show_main(app),
            _ => {
                let _ = app;
            }
        });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn background_matches_the_page_in_both_themes() {
        use material::Material;
        assert_eq!(background(Theme::Light, Material::None), Color(244, 244, 245, 255));
        assert_eq!(background(Theme::Dark, Material::None), Color(10, 10, 12, 255));
        // over a material the window is clear in both themes, or the material can't show
        for theme in [Theme::Light, Theme::Dark] {
            assert_eq!(background(theme, Material::Sidebar), Color(0, 0, 0, 0));
            assert_eq!(background(theme, Material::Mica), Color(0, 0, 0, 0));
        }
    }

    #[test]
    fn only_the_main_window_has_a_material() {
        assert_eq!(material_of("main"), material::for_this_os());
        assert_eq!(material_of(&windows::label_for("/home/post/1")), material::Material::None);
    }
}
