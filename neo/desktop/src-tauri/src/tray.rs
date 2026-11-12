//! The tray (menu bar) icon: Open, New Post and Quit, with the unread count. On macOS the icon
//! is a template image (brand/icons/tray-template@2x.png: the mark in black on transparency), which
//! the system tints for light and dark menu bars, the highlighted state and Increase Contrast;
//! a template is one colour, so it gets no dot: the count is its title (text next to it).
//! Windows and Linux trays show colour icons: the app icon, with a red dot while something is
//! unread, and the count in the tooltip and the menu (Linux shows no tooltips, and reports no
//! clicks on the icon itself: the menu is the way in there).
//!
//! Closing the main window hides it on macOS and Windows while the app keeps running here
//! (close_to_tray), so notifications and the badge keep coming; Quit in this menu, the app
//! menu or Cmd+Q ends the app.

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;

use tauri::image::Image;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager, Runtime};

use crate::badge;
use crate::i18n::{tr, tr_vars, trn};

const TRAY_ID: &str = "main";
const OPEN: &str = "tray-open";
const NEW_POST: &str = "tray-new-post";
const QUIT: &str = "tray-quit";

/// The menu's first row says how many are unread; it is a label, not a command.
pub struct TrayState<R: Runtime> {
    status: Mutex<Option<MenuItem<R>>>,
    count: Mutex<u32>,
}

/// Set when the app is quitting, so closing the window then is not taken for "hide it".
static QUITTING: AtomicBool = AtomicBool::new(false);

/// Set while the app started at login with --hidden (autostart) and nobody opened the window yet.
static HIDDEN: AtomicBool = AtomicBool::new(false);

/// The flag the autostart entry starts the app with (lib.rs): the window stays closed.
pub const HIDDEN_FLAG: &str = "--hidden";

/// Whether these arguments start the app with its window closed.
pub(crate) fn starts_hidden<S: AsRef<str>>(args: impl IntoIterator<Item = S>) -> bool {
    args.into_iter().any(|a| a.as_ref() == HIDDEN_FLAG)
}

pub fn set_hidden(hidden: bool) {
    HIDDEN.store(hidden, Ordering::SeqCst);
}

pub fn is_hidden() -> bool {
    HIDDEN.load(Ordering::SeqCst)
}

/// Whether closing the main window hides it instead of ending the app: the setting (Settings,
/// settings.rs), by default on macOS (the app stays in the Dock) and Windows (in the tray), not
/// on Linux, where a tray may not exist.
pub fn close_to_tray<R: Runtime>(app: &AppHandle<R>) -> bool {
    !QUITTING.load(Ordering::SeqCst) && crate::settings::close_to_tray(app)
}

/// The page has drawn: show the main window, unless the app started hidden at login.
/// `even_hidden`: show it then too. The page asks for that when the keychain could not be read
/// (app.tsx): the sign-in alert and Try again must be seen, and the sync waits for a good read,
/// so a closed window would leave the app silent with nothing in the tray to say why.
#[tauri::command]
pub fn page_ready<R: Runtime>(app: AppHandle<R>, even_hidden: Option<bool>) {
    if shows_window(is_hidden(), even_hidden.unwrap_or(false)) {
        show_main(&app);
    }
}

/// Whether page_ready shows the main window.
pub(crate) fn shows_window(hidden: bool, even_hidden: bool) -> bool {
    !hidden || even_hidden
}

pub fn quit<R: Runtime>(app: &AppHandle<R>) {
    QUITTING.store(true, Ordering::SeqCst);
    app.exit(0);
}

/// The app is ending for another reason (Cmd+Q, the app menu's Quit, the system).
pub fn mark_quitting() {
    QUITTING.store(true, Ordering::SeqCst);
}

/// Bring the main window back: shown, not minimized, focused (no longer hidden from a start at login).
pub fn show_main<R: Runtime>(app: &AppHandle<R>) {
    set_hidden(false);
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

pub(crate) fn status_text(count: u32) -> String {
    match count {
        0 => tr("No unread notifications or messages"),
        n => trn(n.into(), "{{count}} unread", "{{count}} unread"),
    }
}

pub(crate) fn tooltip_text(count: u32) -> String {
    if count == 0 {
        crate::brand::NAME.into()
    } else {
        format!("{} – {}", crate::brand::NAME, status_text(count))
    }
}

/// The tray's menu in the language in use, and its first row, which says the count.
fn menu<R: Runtime>(app: &AppHandle<R>, count: u32) -> tauri::Result<(Menu<R>, MenuItem<R>)> {
    let status = MenuItem::with_id(app, "tray-status", status_text(count), false, None::<&str>)?;
    let menu = Menu::with_items(
        app,
        &[
            &status,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, OPEN, tr_vars("Open {{app}}", &[("app", crate::brand::NAME)]), true, None::<&str>)?,
            &MenuItem::with_id(app, NEW_POST, tr("New Post"), true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, QUIT, tr_vars("Quit {{app}}", &[("app", crate::brand::NAME)]), true, None::<&str>)?,
        ],
    )?;
    Ok((menu, status))
}

/// The language changed (settings.rs): the tray's menu and tooltip again, in it.
pub fn retitle<R: Runtime>(app: &AppHandle<R>) {
    let (Some(tray), Some(state)) = (app.tray_by_id(TRAY_ID), app.try_state::<TrayState<R>>()) else { return };
    let count = *state.count.lock().unwrap_or_else(|e| e.into_inner());
    match menu(app, count) {
        Ok((menu, status)) => {
            if let Err(e) = tray.set_menu(Some(menu)) {
                log::error!("tray menu: {e}");
                return;
            }
            *state.status.lock().unwrap_or_else(|e| e.into_inner()) = Some(status);
            let _ = tray.set_tooltip(Some(tooltip_text(count)));
        }
        Err(e) => log::error!("tray menu: {e}"),
    }
}

pub fn build<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    let (menu, status) = menu(app, 0)?;
    app.manage(TrayState::<R> { status: Mutex::new(Some(status)), count: Mutex::new(0) });

    let mut builder = TrayIconBuilder::with_id(TRAY_ID)
        .tooltip(tooltip_text(0))
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id().as_ref() {
            OPEN => show_main(app),
            NEW_POST => {
                show_main(app);
                // the same command as File > New Post (menu.rs, commands.json)
                if let Err(e) = app.emit_to("main", crate::menu::MENU_EVENT, "new-post") {
                    log::error!("tray new post: {e}");
                }
            }
            QUIT => quit(app),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
                show_main(tray.app_handle());
            }
        });
    match icon_style() {
        IconStyle::Template => builder = builder.icon(template_icon()).icon_as_template(true),
        IconStyle::ColourWithDot => {
            if let Some(icon) = app.default_window_icon() {
                builder = builder.icon(icon.clone());
            }
        }
    }
    builder.build(app)?;
    Ok(())
}

/// The unread count on the tray: dot, title (macOS), tooltip and the menu's first row.
pub fn show_count<R: Runtime>(app: &AppHandle<R>, count: u32) {
    let Some(tray) = app.tray_by_id(TRAY_ID) else { return };
    if let Some(state) = app.try_state::<TrayState<R>>() {
        let mut last = state.count.lock().unwrap_or_else(|e| e.into_inner());
        if *last == count {
            return;
        }
        let had_dot = *last > 0;
        *last = count;
        if let Some(status) = state.status.lock().unwrap_or_else(|e| e.into_inner()).as_ref() {
            let _ = status.set_text(status_text(count));
        }
        if had_dot != (count > 0) {
            set_icon(app, &tray, count > 0);
        }
    }
    let _ = tray.set_tooltip(Some(tooltip_text(count)));
    #[cfg(target_os = "macos")]
    let _ = tray.set_title(if count > 0 { Some(badge::short_label(count)) } else { None });
}

/// How the tray draws unread: a template image and its title (macOS), or a colour icon with a dot.
#[derive(Debug, PartialEq)]
pub(crate) enum IconStyle {
    Template,
    ColourWithDot,
}

pub(crate) fn icon_style() -> IconStyle {
    if cfg!(target_os = "macos") {
        IconStyle::Template
    } else {
        IconStyle::ColourWithDot
    }
}

/// The menu bar's template image, 36 px for 18 pt (tray-icon sizes it to 18 pt high).
pub(crate) fn template_icon() -> Image<'static> {
    tauri::include_image!("../brand/icons/tray-template@2x.png")
}

/// The icon for an unread state: the template as it is (never a dot), else the app icon with a dot.
fn icon_for<R: Runtime>(app: &AppHandle<R>, dot: bool) -> Option<Image<'static>> {
    if icon_style() == IconStyle::Template {
        return Some(template_icon());
    }
    let icon = app.default_window_icon()?;
    Some(if dot { Image::new_owned(badge::with_dot(icon.rgba(), icon.width(), icon.height()), icon.width(), icon.height()) } else { icon.clone().to_owned() })
}

fn set_icon<R: Runtime>(app: &AppHandle<R>, tray: &TrayIcon<R>, dot: bool) {
    // a template keeps its look: the title says the count
    if icon_style() == IconStyle::Template {
        return;
    }
    let Some(image) = icon_for(app, dot) else { return };
    if let Err(e) = tray.set_icon(Some(image)) {
        log::debug!("tray icon: {e}");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn texts_say_how_many_are_unread() {
        assert_eq!(status_text(0), "No unread notifications or messages");
        assert_eq!(status_text(1), "1 unread");
        assert_eq!(status_text(12), "12 unread");
        assert_eq!(tooltip_text(0), "UNA");
        assert_eq!(tooltip_text(3), "UNA – 3 unread");
    }

    #[test]
    fn closing_hides_where_people_expect_it() {
        assert_eq!(crate::settings::CLOSE_TO_TRAY_DEFAULT, cfg!(any(target_os = "macos", windows)));
        let app = tauri::test::mock_builder()
            .plugin(tauri_plugin_store::Builder::new().build())
            .build(tauri::test::mock_context(tauri::test::noop_assets()))
            .unwrap();
        assert_eq!(close_to_tray(app.handle()), crate::settings::CLOSE_TO_TRAY_DEFAULT, "no settings file open: the default");
    }

    #[test]
    fn the_menu_bar_icon_is_a_template_without_a_dot_on_macos() {
        let icon = template_icon();
        assert_eq!((icon.width(), icon.height()), (36, 36), "18 pt at 2x");
        // one colour (black) on transparency, so the system can tint it
        assert!(icon.rgba().chunks(4).all(|p| p[0] == 0 && p[1] == 0 && p[2] == 0));
        assert!(icon.rgba().chunks(4).any(|p| p[3] == 255), "the mark is drawn");
        assert!(icon.rgba().chunks(4).any(|p| p[3] == 0), "no plate");
        if cfg!(target_os = "macos") {
            assert_eq!(icon_style(), IconStyle::Template);
            let app = tauri::test::mock_builder().build(tauri::test::mock_context(tauri::test::noop_assets())).unwrap();
            // with something unread the icon is still the plain template: with_dot never draws into it
            let unread = icon_for(app.handle(), true).unwrap();
            assert_eq!(unread.rgba(), icon.rgba());
        } else {
            assert_eq!(icon_style(), IconStyle::ColourWithDot);
        }
    }

    #[test]
    fn a_start_at_login_keeps_the_window_closed() {
        assert!(starts_hidden(["una-desktop", "--hidden"]));
        assert!(!starts_hidden(["una-desktop"]));
        assert!(!starts_hidden(["una-desktop", "una://open?path=/home"]), "a link opens the window");
    }

    #[test]
    fn a_hidden_start_shows_the_window_only_when_the_page_asks() {
        assert!(shows_window(false, false));
        assert!(!shows_window(true, false), "started at login: stays closed");
        assert!(shows_window(true, true), "the keychain could not be read: the alert must be seen");
    }
}
