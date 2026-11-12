//! A conversation, post, discussion, video, photo, album, file, task, poll, Posts module post, profile, group, space or event in a window of its own (Cmd+Enter or Cmd+click in the
//! main window). The page asks with a route (src/lib/router.ts routeToPath); the window loads
//! the same page with the route in its URL's fragment (src/main.tsx) and shows only that
//! detail. These windows get the reduced capability `secondary` (capabilities/secondary.json):
//! they may read and reply, but not sign in or out, open windows or touch the tray.

use tauri::{AppHandle, Manager, Runtime, Theme, WebviewUrl, WebviewWindowBuilder};

use crate::i18n::{tr, tr_vars};

/// Labels of the windows this opens; capabilities/secondary.json matches them (`win-*`).
pub const LABEL_PREFIX: &str = "win-";

/// The details that open in a window of their own.
const KINDS: &[&str] =
    &["conversation", "post", "discussion", "video", "photo", "album", "file", "task", "poll", "article", "profile", "group", "space", "event"];

/// A route the page may open in a window: a detail of one of KINDS, as routeToPath writes it
/// ("/messages/conversation/7", "/home/post/12?feed=hot", "/search/profile/8?q=lily+smith"),
/// short and of URL-safe characters: the path of letters, digits and `/-_.%`, the query also of
/// what URLSearchParams writes there (`=&`, `+` for a space, `*`).
pub fn check_route(route: &str) -> Result<(), String> {
    let refuse = || {
        Err(tr("Only a conversation, post, discussion, video, photo, album, file, task, poll, Posts module post, profile, group, space or event opens in a window of its own"))
    };
    if route.len() > 300 || !route.starts_with('/') || route.starts_with("//") || route.contains("..") {
        return refuse();
    }
    let (path, query) = route.split_once('?').unwrap_or((route, ""));
    if !path.bytes().all(|b| b.is_ascii_alphanumeric() || b"/-_%.".contains(&b))
        || !query.bytes().all(|b| b.is_ascii_alphanumeric() || b"-_%.=&+*".contains(&b))
    {
        return refuse();
    }
    let parts: Vec<&str> = path.trim_matches('/').split('/').collect();
    match parts.as_slice() {
        [section, kind, id, ..] if !section.is_empty() && KINDS.contains(kind) && !id.is_empty() && parts.len() <= 4 => Ok(()),
        _ => refuse(),
    }
}

/// One window per route: opening the same route again brings its window forward.
pub fn label_for(route: &str) -> String {
    // FNV-1a: stable across runs, and a label holds only letters, digits and '-'
    let mut hash: u64 = 0xcbf2_9ce4_8422_2325;
    for b in route.bytes() {
        hash ^= u64::from(b);
        hash = hash.wrapping_mul(0x0000_0100_0000_01b3);
    }
    format!("{LABEL_PREFIX}{hash:016x}")
}

/// The page's address in a window: the route in the fragment, so no server ever sees it.
pub fn window_url(route: &str) -> String {
    let encoded: String = url::form_urlencoded::byte_serialize(route.as_bytes()).collect();
    format!("index.html#window={encoded}")
}

/// The window-state plugin keeps one size for all these windows, not one entry per route.
pub fn state_label(label: &str) -> &str {
    if label.starts_with(LABEL_PREFIX) {
        "secondary"
    } else {
        label
    }
}

/// Close every window of its own: what they show belongs to a session that is over (sign-out,
/// or another sign-in: auth.rs). destroy, not close: a close is handed to a page that listens for
/// it (a form with unsaved changes asks before its window goes: native.ts guardWindowClose), and
/// its answer could keep a window of an ended session open.
pub fn close_all<R: Runtime>(app: &AppHandle<R>) {
    for (label, window) in app.webview_windows() {
        if label.starts_with(LABEL_PREFIX) {
            if let Err(e) = window.destroy() {
                log::warn!("closing {label}: {e}");
            }
        }
    }
}

/// Open a route in a window of its own, or bring forward the one that shows it. Async: a
/// window made in a synchronous command deadlocks on Windows.
#[tauri::command]
pub async fn open_window<R: Runtime>(app: AppHandle<R>, route: String) -> Result<(), String> {
    check_route(&route)?;
    let label = label_for(&route);
    if let Some(window) = app.get_webview_window(&label) {
        let _ = window.unminimize();
        let _ = window.show();
        return window.set_focus().map_err(|e| e.to_string());
    }

    let theme = app.get_webview_window("main").and_then(|w| w.theme().ok()).unwrap_or(Theme::Light);
    let builder = WebviewWindowBuilder::new(&app, &label, WebviewUrl::App(window_url(&route).into()))
        .title(crate::brand::NAME)
        .inner_size(720.0, 820.0)
        .min_inner_size(420.0, 480.0)
        .background_color(crate::background(theme, crate::material::Material::None))
        // named after what it shows (the page sets document.title: shell/pane.tsx), so the
        // title bar, macOS tabs, the Window menu and VoiceOver's window list tell them apart
        .on_document_title_changed(|window, title| {
            let _ = window.set_title(&title);
        });
    // macOS: these windows can be tabs of one another, as in other Mac apps
    #[cfg(target_os = "macos")]
    let builder = builder.tabbing_identifier(crate::brand::SCHEME);
    builder.build().map(|_| ()).map_err(|e| tr_vars("Could not open a window: {{reason}}", &[("reason", &e.to_string())]))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn details_open_in_windows() {
        for route in [
            "/messages/conversation/7",
            "/home/post/12",
            "/discussions/discussion/15",
            "/discussions/discussion/15/comment-99-in-55?feed=new",
            "/home/post/12?feed=hot",
            "/notifications/post/12/comment-99-in-55",
            "/home/profile/8/friends",
            "/groups/group/67?group=67",
            "/spaces/space/725?space=725",
            "/spaces/space/725/spaces",
            "/events/event/821?event=821",
            "/media/video/31",
            "/media/video/31?feed=videos",
            "/media/photo/42?feed=photos",
            "/media/album/18?feed=albums",
            "/groups/photo/42?group=67",
            "/tasks/task/12",
            "/tasks/task/12?feed=completed",
            "/spaces/task/12?space=725&tab=tasks",
            "/groups/poll/9?group=67&tab=polls",
            "/media/file/12?feed=files",
            "/spaces/file/12?space=725&tab=files",
            "/profile/poll/9?id=10&tab=polls",
            "/posts/article/38",
            "/posts/article/38?feed=mine",
            "/home/article/38",
            "/spaces/article/38?space=725&tab=articles",
            "/profile/article/38?id=10&tab=articles",
            "/events/event/821/attendees?feed=past",
            "/search/post/12?q=a+b",
            "/search/profile/8?q=lily+smith&type=people",
            "/search/post/12?q=caf%C3%A9*",
        ] {
            assert!(check_route(route).is_ok(), "{route}");
        }
    }

    #[test]
    fn nothing_else_opens_a_window() {
        for route in [
            "",
            "/home",
            "/messages/new-message/8",
            "/discussions/new-discussion",
            "/discussions/new-discussion/67",
            "/spaces",
            "/spaces/spaces/725",
            "/events",
            "/events?feed=past",
            "/events/events/821",
            "/media",
            "/media/new-video",
            "/media/videos/31",
            "/media/new-photos",
            "/media/new-album/67",
            "/media/photos/42",
            "/media/albums/18",
            "/media/files/12",
            "/media/new-files",
            "/media/new-files/67",
            "/tasks",
            "/tasks/tasks/12",
            "/groups/polls/9",
            "/posts/articles/38",
            "/posts/new-article",
            "/home/friend-requests",
            "//evil.example/conversation/1",
            "https://evil.example/home/post/1",
            "/home/post/",
            "/home/post/1/a/b",
            "/home/post/1#x",
            "/home/post/<script>",
            "/home/../post/1",
            "/home/post+1/2",
            "/home/post/1*",
            "/search/post/12?q=a b",
            "/search/post/12?q=<x>",
            &format!("/home/post/{}", "1".repeat(300)),
        ] {
            assert!(check_route(route).is_err(), "{route}");
        }
    }

    #[test]
    fn one_window_per_route() {
        let a = label_for("/messages/conversation/7");
        assert_eq!(a, label_for("/messages/conversation/7"));
        assert_ne!(a, label_for("/messages/conversation/8"));
        assert!(a.starts_with(LABEL_PREFIX));
        assert!(a.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-'));
    }

    #[test]
    fn the_route_rides_in_the_fragment() {
        assert_eq!(window_url("/home/post/12?feed=hot"), "index.html#window=%2Fhome%2Fpost%2F12%3Ffeed%3Dhot");
    }

    /// open_window as the given window asks for it, through the app's real ACL (build.rs and
    /// capabilities/*.json): Err with the refusal's words.
    fn ask_open_window(label: &str, route: &str) -> Result<serde_json::Value, serde_json::Value> {
        let app = tauri::test::mock_builder().invoke_handler(tauri::generate_handler![open_window]).build(crate::context()).unwrap();
        let webview = tauri::WebviewWindowBuilder::new(&app, label, Default::default()).build().unwrap();
        let url = if cfg!(windows) { "http://tauri.localhost" } else { "tauri://localhost" };
        tauri::test::get_ipc_response(
            &webview,
            tauri::webview::InvokeRequest {
                cmd: "open_window".into(),
                callback: tauri::ipc::CallbackFn(0),
                error: tauri::ipc::CallbackFn(1),
                url: url.parse().unwrap(),
                body: tauri::ipc::InvokeBody::Json(serde_json::json!({ "route": route })),
                headers: Default::default(),
                invoke_key: tauri::test::INVOKE_KEY.to_string(),
            },
        )
        .map(|b| b.deserialize::<serde_json::Value>().unwrap())
    }

    #[test]
    fn only_the_main_window_opens_windows() {
        // the main window reaches the command, which then refuses a route that is no detail
        let main = ask_open_window("main", "/home").unwrap_err();
        assert!(main.as_str().is_some_and(|s| s.starts_with("Only a conversation")), "{main}");
        // a window of its own never reaches it (capabilities/secondary.json does not grant it)
        let secondary = ask_open_window(&label_for("/home/post/1"), "/home").unwrap_err();
        assert!(secondary.as_str().is_some_and(|s| s.contains("not allowed")), "{secondary}");
    }

    /// set_setting as the given window asks for it, through the app's real ACL.
    fn ask_set_setting(label: &str) -> Result<serde_json::Value, serde_json::Value> {
        let app = tauri::test::mock_builder()
            .manage(crate::settings::SettingsState::load(None))
            .invoke_handler(tauri::generate_handler![crate::settings::get_settings, crate::settings::set_setting])
            .build(crate::context())
            .unwrap();
        let webview = tauri::WebviewWindowBuilder::new(&app, label, Default::default()).build().unwrap();
        let url = if cfg!(windows) { "http://tauri.localhost" } else { "tauri://localhost" };
        tauri::test::get_ipc_response(
            &webview,
            tauri::webview::InvokeRequest {
                cmd: "set_setting".into(),
                callback: tauri::ipc::CallbackFn(0),
                error: tauri::ipc::CallbackFn(1),
                url: url.parse().unwrap(),
                body: tauri::ipc::InvokeBody::Json(serde_json::json!({ "key": "osNotifications", "value": false })),
                headers: Default::default(),
                invoke_key: tauri::test::INVOKE_KEY.to_string(),
            },
        )
        .map(|b| b.deserialize::<serde_json::Value>().unwrap())
    }

    #[test]
    fn only_the_main_window_changes_settings() {
        assert!(ask_set_setting("main").is_ok());
        let secondary = ask_set_setting(&label_for("/home/post/1")).unwrap_err();
        assert!(secondary.as_str().is_some_and(|s| s.contains("not allowed")), "{secondary}");
    }

    #[test]
    fn a_window_of_its_own_gets_less_than_the_main_one() {
        let caps: serde_json::Value = serde_json::from_str(include_str!("../capabilities/secondary.json")).unwrap();
        assert_eq!(caps["windows"], serde_json::json!([format!("{LABEL_PREFIX}*")]));
        let granted: Vec<String> = caps["permissions"]
            .as_array()
            .unwrap()
            .iter()
            .map(|p| p.as_str().map(str::to_string).unwrap_or_else(|| p["identifier"].as_str().unwrap().to_string()))
            .collect();
        for refused in [
            "allow-open-window",
            "allow-sign-in",
            "allow-sign-out",
            "allow-discover-site",
            "allow-cancel-sign-in",
            "allow-list-sessions",
            "allow-switch-session",
            "allow-name-network",
            "allow-page-ready",
            "allow-set-setting",
            "allow-take-deep-links",
            "autostart:allow-enable",
            "autostart:allow-disable",
            "autostart:allow-is-enabled",
            "core:window:allow-start-dragging",
            "core:window:allow-show",
            "core:window:allow-set-focus",
            "notification:default",
            "window-state:default",
            "store:allow-load",
            "dialog:allow-open",
            "dialog:allow-save",
        ] {
            assert!(!granted.iter().any(|g| g == refused), "{refused}");
        }
        // a post's More and context menus (popup.rs answers the window by its own label)
        for needed in ["allow-popup-menu", "clipboard-manager:allow-write-text", "core:event:allow-listen"] {
            assert!(granted.iter().any(|g| g == needed), "{needed}");
        }
        assert!(!granted.iter().any(|g| g == "clipboard-manager:allow-read-text"), "never a clipboard read");
        assert!(!granted.iter().any(|g| g.starts_with("http:")), "the site's capability names these windows at sign-in (auth.rs)");
        // core:default would bring emit (menu commands to the main window), the tray and the menu
        for g in &granted {
            assert!(
                g != "core:default"
                    && !g.starts_with("core:tray")
                    && !g.starts_with("core:menu")
                    && !g.starts_with("core:event:allow-emit")
                    && g != "core:event:default",
                "{g}"
            );
        }
    }

    #[test]
    fn the_main_window_gets_no_tray_menu_or_emit_either() {
        let caps: serde_json::Value = serde_json::from_str(include_str!("../capabilities/default.json")).unwrap();
        for g in caps["permissions"].as_array().unwrap().iter().filter_map(|p| p.as_str()) {
            assert!(
                g != "core:default"
                    && !g.starts_with("core:tray")
                    && !g.starts_with("core:menu")
                    && !g.starts_with("core:event:allow-emit")
                    && g != "core:event:default",
                "{g}"
            );
        }
    }

    #[test]
    fn windows_share_one_saved_size() {
        assert_eq!(state_label(&label_for("/home/post/1")), "secondary");
        assert_eq!(state_label("main"), "main");
    }
}
