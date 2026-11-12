//! The native menu bar (macOS) and the menu events the web view handles.
//!
//! The app's own items come from `src/lib/commands.json`, which the web view's shortcut module
//! reads too, so a shortcut is defined once. On macOS the menu's accelerators take those keys
//! before the web view sees them; on Windows and Linux the app sets no menu bar and the web view
//! handles the same keys itself (WebView2 and WebKitGTK copy and paste without a menu).

use std::collections::HashSet;

use serde::Deserialize;
use tauri::{AppHandle, Emitter, Runtime};

use crate::i18n::tr;
// the menu bar is the macOS one
#[cfg(target_os = "macos")]
use crate::i18n::{tr_command, tr_vars};

/// The event the web view listens to; the payload is a command id.
pub const MENU_EVENT: &str = "menu";

const TABLE: &str = include_str!("../../src/lib/commands.json");

#[derive(Deserialize)]
struct Table {
    commands: Vec<Command>,
}

#[derive(Deserialize, Clone, Debug)]
#[cfg_attr(not(target_os = "macos"), allow(dead_code))]
pub(crate) struct Command {
    pub id: String,
    pub label: String,
    pub menu: Option<String>,
    pub section: Option<u32>,
    pub accelerator: Option<String>,
}

pub(crate) fn commands() -> Vec<Command> {
    serde_json::from_str::<Table>(TABLE).expect("src/lib/commands.json is valid").commands
}

/// The commands of one submenu, in table order. The Window menu's networks are not among them:
/// show_networks puts in one item per network signed in to.
#[cfg_attr(not(target_os = "macos"), allow(dead_code))]
pub(crate) fn submenu_items(menu: &str) -> Vec<Command> {
    commands().into_iter().filter(|c| c.menu.as_deref() == Some(menu) && !c.id.starts_with("switch-network-")).collect()
}

/// Commands with keys and no menu item: the page handles their keys on every platform, since no
/// menu takes them first (Cmd+1 to 9, the tabs: nine items would crowd the Window menu).
#[cfg(test)]
pub(crate) const PAGE_KEYS_PREFIX: &str = "select-tab-";

#[cfg(target_os = "macos")]
fn with_items<'m, R: Runtime>(
    mut builder: tauri::menu::SubmenuBuilder<'m, R, AppHandle<R>>,
    app: &'m AppHandle<R>,
    menu: &str,
) -> tauri::Result<tauri::menu::SubmenuBuilder<'m, R, AppHandle<R>>> {
    use tauri::menu::MenuItemBuilder;

    let mut section = None;
    for c in submenu_items(menu) {
        if section.is_some() && section != c.section {
            builder = builder.separator();
        }
        section = c.section;
        let mut item = MenuItemBuilder::with_id(c.id.as_str(), tr_command(&c.label));
        if let Some(accelerator) = &c.accelerator {
            item = item.accelerator(accelerator);
        }
        builder = builder.item(&item.build(app)?);
    }
    Ok(builder)
}

/// App, File, Edit, View, Window and Help. Edit holds the predefined items: without them a
/// custom macOS menu breaks Cmd+C, Cmd+V and Cmd+A in the web view.
#[cfg(target_os = "macos")]
pub fn build<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<tauri::menu::Menu<R>> {
    use tauri::menu::{MenuBuilder, SubmenuBuilder, HELP_SUBMENU_ID, WINDOW_SUBMENU_ID};

    // the language first: the menu is built before setup
    crate::i18n::apply(app);
    let name = app.package_info().name.clone();
    let named = [("name", name.as_str())];
    // the items macOS gives every app: named here, since the system does not translate a custom menu
    let app_menu = with_items(SubmenuBuilder::new(app, &name).about_with_text(tr_vars("About {{name}}", &named), None).separator(), app, "app")?
        .separator()
        .services_with_text(tr("Services"))
        .separator()
        .hide_with_text(tr_vars("Hide {{name}}", &named))
        .hide_others_with_text(tr("Hide Others"))
        .show_all_with_text(tr("Show All"))
        .separator()
        .quit_with_text(tr_vars("Quit {{name}}", &named))
        .build()?;
    // Close Window (Cmd+Shift+W) is the app's own item: Cmd+W closes a tab (forward_events)
    let file = with_items(SubmenuBuilder::new(app, tr("File")), app, "file")?.build()?;
    let edit = SubmenuBuilder::new(app, tr("Edit"))
        .undo_with_text(tr("Undo"))
        .redo_with_text(tr("Redo"))
        .separator()
        .cut_with_text(tr("Cut"))
        .copy_with_text(tr("Copy"))
        .paste_with_text(tr("Paste"))
        .select_all_with_text(tr("Select All"))
        .build()?;
    let view = with_items(SubmenuBuilder::new(app, tr("View")), app, "view")?.separator().fullscreen_with_text(tr("Toggle Full Screen")).build()?;
    // these ids make Tauri register them as the Window and Help menus of NSApp (window list, help search)
    // the networks signed in to (Cmd+Ctrl+1 to 9) go after these WINDOW_FIXED_ITEMS (show_networks)
    // the tabs' items first (Show Previous Tab, Show Next Tab), then the window's own
    let window = with_items(SubmenuBuilder::with_id(app, WINDOW_SUBMENU_ID, tr("Window")), app, "window")?
        .separator()
        .minimize_with_text(tr("Minimize"))
        .maximize_with_text(tr("Zoom"))
        .separator()
        .bring_all_to_front_with_text(tr("Bring All to Front"))
        .build()?;
    let help = with_items(SubmenuBuilder::with_id(app, HELP_SUBMENU_ID, tr("Help")), app, "help")?.build()?;

    MenuBuilder::new(app).items(&[&app_menu, &file, &edit, &view, &window, &help]).build()
}

/// The language changed (settings.rs): the menu bar again, in it, with the networks' items. The
/// page loads again next and says what its window can do (set_nav_state, set_sidebar_shown).
pub fn retitle<R: Runtime>(app: &AppHandle<R>) {
    #[cfg(target_os = "macos")]
    {
        use tauri::Manager;
        match build(app).and_then(|menu| app.set_menu(menu)) {
            Ok(_) => {
                if let Some(state) = app.try_state::<crate::auth::AuthState>() {
                    crate::auth::sessions_changed(app, &state);
                }
            }
            Err(e) => log::error!("menu: {e}"),
        }
    }
    #[cfg(not(target_os = "macos"))]
    let _ = app;
}

/// The menu command that switches to the n-th network (1 to 9), as commands.json names it.
pub(crate) fn network_command(n: usize) -> String {
    format!("switch-network-{n}")
}

/// The Window menu's own items before the networks: the tabs' items and a separator, then
/// Minimize, Zoom, a separator, Bring All to Front.
#[cfg_attr(not(target_os = "macos"), allow(dead_code))]
pub(crate) fn window_fixed_items() -> usize {
    submenu_items("window").len() + 1 + 4
}

/// The Window menu's network items: one per network signed in to (no placeholders for the
/// rest), each with its command id, its text as the menu shows it (`&` kept: popup.rs menu_text)
/// and its Cmd+Ctrl key from commands.json.
#[cfg_attr(not(target_os = "macos"), allow(dead_code))]
pub(crate) fn network_items(sessions: &[crate::auth::SessionSummary]) -> Vec<(String, String, Option<String>)> {
    let table = commands();
    sessions
        .iter()
        .take(crate::auth::MAX_SESSIONS)
        .enumerate()
        .map(|(i, s)| {
            let id = network_command(i + 1);
            let accelerator = table.iter().find(|c| c.id == id).and_then(|c| c.accelerator.clone());
            (id, crate::popup::menu_text(&s.label()), accelerator)
        })
        .collect()
}

/// One of the app's own items of the menu bar, by its command id.
#[cfg(target_os = "macos")]
fn find_item<R: Runtime>(app: &AppHandle<R>, id: &str) -> Option<tauri::menu::MenuItem<R>> {
    let menu = app.menu()?;
    for kind in menu.items().ok()? {
        if let Some(submenu) = kind.as_submenu() {
            if let Some(item) = submenu.get(id).and_then(|k| k.as_menuitem().cloned()) {
                return Some(item);
            }
        }
    }
    None
}

/// The Window menu lists the networks signed in to, after a separator, and nothing for the
/// unused keys (muda has no hidden items, so the section is built again each time the list
/// changes). macOS adds its window list after them.
#[cfg(target_os = "macos")]
pub fn show_networks<R: Runtime>(app: &AppHandle<R>, sessions: &[crate::auth::SessionSummary]) {
    use tauri::menu::{MenuItemBuilder, PredefinedMenuItem, WINDOW_SUBMENU_ID};

    let Some(menu) = app.menu() else { return };
    let Some(window) = menu.get(WINDOW_SUBMENU_ID).and_then(|k| k.as_submenu().cloned()) else { return };
    let result = (|| -> tauri::Result<()> {
        let fixed = window_fixed_items();
        while window.items()?.len() > fixed {
            window.remove_at(fixed)?;
        }
        let items = network_items(sessions);
        if items.is_empty() {
            return Ok(());
        }
        window.insert(&PredefinedMenuItem::separator(app)?, fixed)?;
        for (i, (id, text, accelerator)) in items.iter().enumerate() {
            let mut b = MenuItemBuilder::with_id(id.as_str(), text);
            if let Some(a) = accelerator {
                b = b.accelerator(a);
            }
            window.insert(&b.build(app)?, fixed + 1 + i)?;
        }
        Ok(())
    })();
    if let Err(e) = result {
        log::error!("window menu networks: {e}");
    }
}

/// What the menu shows for a window while it has focus, as its page reports it: whether it can go
/// back and forward (the menu's Back and Forward go to the focused window, `target`), and whether
/// what it shows can open in a window of its own (Open in New Window: the main window's open
/// conversation, post, discussion, video, photo, album, file, task, poll, Posts module post, profile, group, space or event; never in a window of its own).
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub(crate) struct NavState {
    pub back: bool,
    pub forward: bool,
    pub open_in_window: bool,
}

#[derive(Default)]
pub struct NavStates(std::sync::Mutex<std::collections::HashMap<String, NavState>>);

impl NavStates {
    fn lock(&self) -> std::sync::MutexGuard<'_, std::collections::HashMap<String, NavState>> {
        self.0.lock().unwrap_or_else(|e| e.into_inner())
    }

    pub(crate) fn set(&self, label: &str, state: NavState) {
        self.lock().insert(label.to_string(), state);
    }

    /// A window's state; a window that never said is at its start (nothing to go back to).
    pub(crate) fn of(&self, label: &str) -> NavState {
        self.lock().get(label).copied().unwrap_or_default()
    }

    pub(crate) fn forget(&self, label: &str) {
        self.lock().remove(label);
    }
}

/// Turn Back, Forward and Open in New Window on or off.
fn show_nav<R: Runtime>(app: &AppHandle<R>, state: NavState) {
    #[cfg(target_os = "macos")]
    for (id, enabled) in [("back", state.back), ("forward", state.forward), ("open-in-window", state.open_in_window)] {
        if let Some(item) = find_item(app, id) {
            let _ = item.set_enabled(enabled);
        }
    }
    #[cfg(not(target_os = "macos"))]
    let _ = (app, state);
}

/// A window got focus: Back, Forward and Open in New Window show its state.
pub fn window_focused<R: Runtime>(app: &AppHandle<R>, label: &str) {
    use tauri::Manager;
    if let Some(states) = app.try_state::<NavStates>() {
        show_nav(app, states.of(label));
    }
}

/// What the window calling says of itself: whether it can go back and forward, and whether what it
/// shows can open in a window of its own (only the main window opens windows: windows.rs). The menu
/// shows it while that window has focus. The main window also says whether Cmd+N adds a task there
/// (`new_task`: a context's Tasks tab with an add field), which File > New Post is named after
/// whichever window has focus, since the command always goes to the main window (`target`).
#[tauri::command]
pub fn set_nav_state<R: Runtime>(
    app: AppHandle<R>,
    window: tauri::Window<R>,
    states: tauri::State<'_, NavStates>,
    back: bool,
    forward: bool,
    open_in_window: Option<bool>,
    new_task: Option<bool>,
) {
    let state = NavState { back, forward, open_in_window: window.label() == "main" && open_in_window.unwrap_or(false) };
    states.set(window.label(), state);
    // the window just opened may not have focus yet: it shows its state when it gets it
    if window.is_focused().unwrap_or(false) {
        show_nav(&app, state);
    }
    if window.label() == "main" {
        show_new_label(&app, new_task.unwrap_or(false));
    }
}

/// What File > New Post (Cmd+N) says: New Task where it adds a task to the list shown.
// the menu with this item is the macOS one
#[cfg_attr(not(target_os = "macos"), allow(dead_code))]
pub(crate) fn new_label(task: bool) -> String {
    if task {
        tr("New Task")
    } else {
        tr("New Post")
    }
}

fn show_new_label<R: Runtime>(app: &AppHandle<R>, task: bool) {
    #[cfg(target_os = "macos")]
    if let Some(item) = find_item(app, "new-post") {
        let _ = item.set_text(new_label(task));
    }
    #[cfg(not(target_os = "macos"))]
    let _ = (app, task);
}

/// What the sidebar item of the View menu says: what choosing it does.
// the menu with this item is the macOS one
#[cfg_attr(not(target_os = "macos"), allow(dead_code))]
pub(crate) fn sidebar_label(shown: bool) -> String {
    if shown {
        tr("Show Icons Only")
    } else {
        tr("Show Sidebar Names")
    }
}

/// What the View menu's Hide Sidebar item says: what choosing it does.
// the menu with this item is the macOS one
#[cfg_attr(not(target_os = "macos"), allow(dead_code))]
pub(crate) fn hide_label(hidden: bool) -> String {
    if hidden {
        tr("Show Sidebar")
    } else {
        tr("Hide Sidebar")
    }
}

/// The main window's sidebar shows its names (`shown`) or icons only, and is there or hidden
/// (`hidden`, Cmd+Ctrl+S): the View menu's items say what Cmd+\ and Cmd+Ctrl+S do next.
#[tauri::command]
pub fn set_sidebar_shown<R: Runtime>(app: AppHandle<R>, shown: bool, hidden: Option<bool>) {
    #[cfg(target_os = "macos")]
    {
        if let Some(item) = find_item(&app, "toggle-sidebar") {
            let _ = item.set_text(sidebar_label(shown));
        }
        if let Some(item) = find_item(&app, "hide-sidebar") {
            let _ = item.set_text(hide_label(hidden.unwrap_or(false)));
        }
    }
    #[cfg(not(target_os = "macos"))]
    let _ = (app, shown, hidden);
}

/// The commands a window of its own handles itself (src/secondary.tsx SECONDARY_COMMANDS).
const WINDOW_COMMANDS: &[&str] = &["back", "forward", "refresh"];

/// Which web view a menu command goes to: Back, Forward and Refresh to the window of its own
/// they were pressed in (Cmd+R refreshes that conversation, not the main window behind it);
/// everything else to the main window, brought forward first when another one has focus.
#[derive(Debug, PartialEq)]
pub(crate) enum Target<'a> {
    Window(&'a str),
    Main {
        bring_forward: bool,
    },
    /// Close this window: Close Window (Cmd+Shift+W), and Close Tab (Cmd+W) in a window of
    /// its own, which has no tabs.
    Close(&'a str),
    /// Nothing to do: Open in New Window from a window that already is one.
    Nowhere,
}

pub(crate) fn target<'a>(id: &str, focused: Option<&'a str>) -> Target<'a> {
    match focused {
        Some(label) if id == "close-window" => Target::Close(label),
        Some(label) if label.starts_with(crate::windows::LABEL_PREFIX) && id == "close-tab" => Target::Close(label),
        None if id == "close-window" => Target::Nowhere,
        Some(label) if label.starts_with(crate::windows::LABEL_PREFIX) && id == "open-in-window" => Target::Nowhere,
        Some(label) if label.starts_with(crate::windows::LABEL_PREFIX) && WINDOW_COMMANDS.contains(&id) => Target::Window(label),
        Some(label) if label != "main" => Target::Main { bring_forward: true },
        _ => Target::Main { bring_forward: false },
    }
}

/// Commands whose accelerator a focused text field may take for itself: ⌘K is the Command
/// Palette, and in the rich editor (src/components/rich-editor) it adds a link. macOS gives a
/// menu's key equivalent to the menu before the web view sees the key, so the page is told the
/// command came from the keys (`<id>@key`) and decides (src/lib/command-bus.ts).
pub const FIELD_KEYS: [&str; 1] = ["command-palette"];

/// The suffix of a menu event's payload for a command chosen by its key equivalent.
pub const BY_KEY: &str = "@key";

/// Whether the menu item being handled was chosen with its key equivalent (the event AppKit is
/// handling is a key press), not with the mouse.
#[cfg(target_os = "macos")]
fn key_equivalent() -> bool {
    use objc2::MainThreadMarker;
    use objc2_app_kit::{NSApplication, NSEventType};
    let Some(mtm) = MainThreadMarker::new() else { return false };
    NSApplication::sharedApplication(mtm).currentEvent().is_some_and(|e| e.r#type() == NSEventType::KeyDown)
}

#[cfg(not(target_os = "macos"))]
fn key_equivalent() -> bool {
    // elsewhere the web view handles accelerators itself (shortcuts.ts): the menu sends clicks
    false
}

/// What a menu event carries for a command: its id, with BY_KEY for one a text field may take.
pub(crate) fn payload(id: &str, by_key: bool) -> String {
    if by_key && FIELD_KEYS.contains(&id) {
        format!("{id}{BY_KEY}")
    } else {
        id.to_string()
    }
}

/// Send clicks on the app's own items (and their accelerators) to the web view they are for;
/// predefined items act natively.
pub fn forward_events<R: Runtime>(app: &AppHandle<R>) {
    use tauri::Manager;

    let ids: HashSet<String> = commands().into_iter().map(|c| c.id).collect();
    app.on_menu_event(move |app, event| {
        let id = event.id().0.as_str();
        // an item of a page's pop-up menu goes back to that page (popup.rs)
        if crate::popup::forward(app, id) {
            return;
        }
        if !ids.contains(id) {
            return;
        }
        let focused = app.webview_windows().into_iter().find(|(_, w)| w.is_focused().unwrap_or(false)).map(|(label, _)| label);
        let message = payload(id, FIELD_KEYS.contains(&id) && key_equivalent());
        let result = match target(id, focused.as_deref()) {
            Target::Window(label) => app.emit_to(label, MENU_EVENT, message),
            Target::Main { bring_forward } => {
                if bring_forward {
                    crate::tray::show_main(app);
                }
                app.emit_to("main", MENU_EVENT, message)
            }
            // the main window's close hides it where the app stays (lib.rs CloseRequested)
            Target::Close(label) => match app.get_webview_window(label) {
                Some(w) => w.close(),
                None => Ok(()),
            },
            Target::Nowhere => Ok(()),
        };
        if let Err(e) = result {
            log::error!("menu event {id}: {e}");
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::str::FromStr;

    #[test]
    fn a_field_key_says_it_came_from_the_keys() {
        assert_eq!(payload("command-palette", true), "command-palette@key");
        assert_eq!(payload("command-palette", false), "command-palette", "chosen with the mouse");
        assert_eq!(payload("new-post", true), "new-post", "no field takes it");
        for id in FIELD_KEYS {
            assert!(commands().iter().any(|c| c.id == id), "{id} is a command");
        }
    }

    #[test]
    fn table_parses_with_unique_ids() {
        let all = commands();
        assert!(!all.is_empty());
        let ids: HashSet<_> = all.iter().map(|c| c.id.as_str()).collect();
        assert_eq!(ids.len(), all.len(), "command ids are unique");
    }

    #[test]
    fn menu_items_go_in_known_submenus_with_labels() {
        for c in commands() {
            if let Some(menu) = &c.menu {
                assert!(["app", "file", "view", "window", "help"].contains(&menu.as_str()), "{}: unknown menu {menu}", c.id);
                assert!(!c.label.is_empty(), "{}: menu items need a label", c.id);
            }
        }
        assert!(submenu_items("file").iter().any(|c| c.id == "new-post"));
        assert!(submenu_items("view").iter().any(|c| c.id == "go-home"));
    }

    #[test]
    fn each_network_has_its_item_and_keys() {
        for n in 1..=crate::auth::MAX_SESSIONS {
            let id = network_command(n);
            let c = commands().into_iter().find(|c| c.id == id).unwrap_or_else(|| panic!("{id} is in commands.json"));
            assert_eq!(c.menu.as_deref(), Some("window"));
            assert_eq!(c.accelerator.as_deref(), Some(format!("Cmd+Ctrl+{n}").as_str()));
        }
        assert!(submenu_items("app").iter().any(|c| c.id == "open-settings" && c.accelerator.as_deref() == Some("CmdOrCtrl+,")));
        assert!(submenu_items("file").iter().any(|c| c.id == "open-in-window" && c.accelerator.as_deref() == Some("CmdOrCtrl+Shift+O")));
        assert!(submenu_items("view").iter().any(|c| c.id == "toggle-sidebar" && c.accelerator.as_deref() == Some("CmdOrCtrl+\\")));
        assert!(submenu_items("view").iter().any(|c| c.id == "go-home" && c.accelerator.as_deref() == Some("CmdOrCtrl+Alt+1")), "Cmd+1 is the first tab");
    }

    #[test]
    fn tabs_have_their_items_and_keys() {
        let file: Vec<_> = submenu_items("file").into_iter().map(|c| (c.id, c.accelerator)).collect();
        for (id, keys) in [("new-tab", "CmdOrCtrl+T"), ("close-tab", "CmdOrCtrl+W"), ("reopen-tab", "CmdOrCtrl+Shift+T"), ("close-window", "CmdOrCtrl+Shift+W")]
        {
            assert!(file.contains(&(id.to_string(), Some(keys.to_string()))), "{id} is in File with {keys}");
        }
        let window: Vec<_> = submenu_items("window").into_iter().map(|c| c.id).collect();
        assert_eq!(window, vec!["previous-tab".to_string(), "next-tab".to_string()], "the networks are not built in");
        assert_eq!(window_fixed_items(), 2 + 1 + 4);
        for n in 1..=9 {
            let id = format!("{PAGE_KEYS_PREFIX}{n}");
            let c = commands().into_iter().find(|c| c.id == id).unwrap_or_else(|| panic!("{id}"));
            assert_eq!(c.accelerator.as_deref(), Some(format!("CmdOrCtrl+{n}").as_str()));
            assert!(c.menu.is_none(), "{id} is the page's: no menu takes Cmd+{n} first");
        }
    }

    #[test]
    fn close_tab_closes_a_window_of_its_own() {
        let win = crate::windows::label_for("/messages/conversation/7");
        assert_eq!(target("close-tab", Some(&win)), Target::Close(&win));
        assert_eq!(target("close-tab", Some("main")), Target::Main { bring_forward: false }, "the main window closes its tab");
        assert_eq!(target("close-window", Some("main")), Target::Close("main"));
        assert_eq!(target("close-window", Some(&win)), Target::Close(&win));
        assert_eq!(target("close-window", None), Target::Nowhere);
    }

    #[test]
    fn the_hide_item_says_what_it_does_next() {
        assert_eq!(hide_label(false), "Hide Sidebar");
        assert_eq!(hide_label(true), "Show Sidebar");
        let c = commands().into_iter().find(|c| c.id == "hide-sidebar").unwrap();
        assert_eq!(c.label, hide_label(false));
    }

    #[test]
    fn new_post_says_new_task_where_it_adds_one() {
        assert_eq!(new_label(false), "New Post");
        assert_eq!(new_label(true), "New Task");
        // the table's label is the one shown until the page says otherwise
        let c = commands().into_iter().find(|c| c.id == "new-post").unwrap();
        assert_eq!(c.label, new_label(false));
    }

    #[test]
    fn the_sidebar_item_says_what_it_does_next() {
        assert_eq!(sidebar_label(true), "Show Icons Only");
        assert_eq!(sidebar_label(false), "Show Sidebar Names");
        // until the page says (it does as it mounts), the table's neutral label
        let c = commands().into_iter().find(|c| c.id == "toggle-sidebar").unwrap();
        assert_eq!(c.label, "Toggle Sidebar");
    }

    #[test]
    fn pop_up_items_are_not_app_commands() {
        let id = crate::popup::item_id("main", 1, 0);
        assert!(!commands().iter().any(|c| c.id == id));
        assert!(crate::popup::parse_id(&id).is_some());
    }

    #[test]
    fn network_items_name_who_is_signed_in() {
        let sessions: Vec<crate::auth::SessionSummary> = serde_json::from_value(serde_json::json!([
            { "key": "https://a.example|3", "siteUrl": "https://a.example", "siteName": "Gardeners", "accountName": "Lily", "active": true }
        ]))
        .unwrap();
        assert_eq!(network_items(&sessions), vec![("switch-network-1".to_string(), "Gardeners – Lily".to_string(), Some("Cmd+Ctrl+1".to_string()))]);
        // no placeholders for the keys no network has
        assert!(network_items(&[]).is_empty());
        let two: Vec<crate::auth::SessionSummary> = serde_json::from_value(serde_json::json!([
            { "key": "https://a.example|3", "siteUrl": "https://a.example", "siteName": "Arts & Crafts", "accountName": "Lily", "active": true },
            { "key": "http://desktop.localhost:8090|1", "siteUrl": "http://desktop.localhost:8090", "siteName": "", "accountName": "", "active": false }
        ]))
        .unwrap();
        let items = network_items(&two);
        assert_eq!(items.len(), 2);
        assert_eq!(items[0].1, "Arts && Crafts – Lily", "the & stays an &");
        assert_eq!(items[1], ("switch-network-2".to_string(), "desktop.localhost".to_string(), Some("Cmd+Ctrl+2".to_string())));
    }

    #[test]
    fn each_window_has_its_own_back_and_forward() {
        let states = NavStates::default();
        let win = crate::windows::label_for("/home/post/1");
        assert_eq!(states.of("main"), NavState::default(), "nothing to go back to at first");
        let main = NavState { back: true, forward: false, open_in_window: true };
        let own = NavState { back: false, forward: true, open_in_window: false };
        states.set("main", main);
        states.set(&win, own);
        assert_eq!(states.of("main"), main);
        assert_eq!(states.of(&win), own, "a window of its own keeps its own");
        states.forget(&win);
        assert_eq!(states.of(&win), NavState::default());
    }

    #[test]
    fn commands_go_to_the_window_they_are_for() {
        let win = crate::windows::label_for("/messages/conversation/7");
        assert_eq!(target("refresh", Some(&win)), Target::Window(&win));
        assert_eq!(target("back", Some(&win)), Target::Window(&win));
        assert_eq!(target("new-post", Some(&win)), Target::Main { bring_forward: true });
        assert_eq!(target("go-search", Some(&win)), Target::Main { bring_forward: true });
        assert_eq!(target("refresh", Some("main")), Target::Main { bring_forward: false });
        assert_eq!(target("refresh", None), Target::Main { bring_forward: false });
        // the main window's open detail goes in a window of its own; a window of its own has nothing to open
        assert_eq!(target("open-in-window", Some("main")), Target::Main { bring_forward: false });
        assert_eq!(target("open-in-window", Some(&win)), Target::Nowhere);
        assert_eq!(target("open-settings", Some(&win)), Target::Main { bring_forward: true }, "Cmd+, from any window");
        for id in WINDOW_COMMANDS {
            assert!(commands().iter().any(|c| c.id == *id && c.menu.is_some()), "{id} is a menu command");
        }
    }

    #[test]
    fn accelerators_parse_and_do_not_clash() {
        let mut seen = HashSet::new();
        for c in commands() {
            let Some(accelerator) = &c.accelerator else { continue };
            let parsed = muda::accelerator::Accelerator::from_str(accelerator).unwrap_or_else(|e| panic!("{}: {accelerator}: {e}", c.id));
            assert!(seen.insert(parsed.id()), "{}: {accelerator} is used twice", c.id);
            // on macOS the menu takes its keys first; the tabs' Cmd+1 to 9 are the page's
            assert!(c.menu.is_some() || c.id.starts_with(PAGE_KEYS_PREFIX), "{}: an accelerator only works from the menu on macOS", c.id);
        }
    }
}
