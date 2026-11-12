//! Native pop-up menus for the page (the network and profile menus, a resize handle's menu):
//! NSMenu on macOS, a Win32 menu on Windows, a GTK menu on Linux.
//!
//! The page sends the items (text, enabled, checked, a key shown next to it) and where to open
//! the menu; Rust builds and opens it. The page gets no menu permission of its own (no
//! `core:menu:*`, which would let it replace the app menu), only this command. A chosen item comes
//! back as the `menu-popup` event to the window that opened the menu, with the page's token and
//! the item's index; the item ids carry the window's label (from Rust, never from the page), so
//! no state is kept and no other window hears it.

use serde::{Deserialize, Serialize};
use tauri::menu::{CheckMenuItemBuilder, IsMenuItem, MenuBuilder, MenuItemBuilder, PredefinedMenuItem};
use tauri::{AppHandle, Emitter, LogicalPosition, Runtime, WebviewWindow};

/// The event a chosen item sends to the window that opened the menu.
pub const POPUP_EVENT: &str = "menu-popup";

const PREFIX: &str = "popup";
const SEP: char = '\u{1f}';
const MAX_ENTRIES: usize = 60;
const MAX_TEXT: usize = 200;

#[derive(Deserialize, Debug)]
#[serde(tag = "kind", rename_all = "lowercase")]
pub enum Entry {
    Item {
        text: String,
        #[serde(default = "yes")]
        enabled: bool,
        /// Some: a check item (checked or not)
        checked: Option<bool>,
        /// Tauri accelerator syntax; shown next to the text (modifier shortcuts only)
        accelerator: Option<String>,
    },
    Separator,
}

fn yes() -> bool {
    true
}

#[derive(Serialize, Clone, Debug, PartialEq)]
pub struct Chosen {
    pub token: u32,
    pub index: usize,
}

/// The id of an item: `popup␟<window label>␟<token>␟<index>`.
pub(crate) fn item_id(label: &str, token: u32, index: usize) -> String {
    format!("{PREFIX}{SEP}{label}{SEP}{token}{SEP}{index}")
}

/// The window and the item a menu event names, when it is one of these menus' items.
pub(crate) fn parse_id(id: &str) -> Option<(&str, Chosen)> {
    let mut parts = id.split(SEP);
    if parts.next()? != PREFIX {
        return None;
    }
    let label = parts.next()?;
    let token = parts.next()?.parse().ok()?;
    let index = parts.next()?.parse().ok()?;
    if parts.next().is_some() || label.is_empty() {
        return None;
    }
    Some((label, Chosen { token, index }))
}

/// The items are fit to show: not too many, short texts.
pub(crate) fn check_entries(entries: &[Entry]) -> Result<(), String> {
    if entries.is_empty() || entries.len() > MAX_ENTRIES {
        return Err("a menu has 1 to 60 items".into());
    }
    for e in entries {
        if let Entry::Item { text, .. } = e {
            if text.is_empty() || text.chars().count() > MAX_TEXT {
                return Err("a menu item's text is 1 to 200 characters".into());
            }
        }
    }
    Ok(())
}

/// A text as a native menu shows it as written. Menus take `&` for a mnemonic (macOS drops it,
/// Windows underlines the next letter, GTK turns it into `_`), and the texts here are names
/// people chose ("Arts & Crafts", "R&D"): `&&` is a plain `&` on every platform.
pub(crate) fn menu_text(text: &str) -> String {
    text.replace('&', "&&")
}

/// Send a chosen item to the window that opened the menu (menu.rs forwards every menu event here first).
pub fn forward<R: Runtime>(app: &AppHandle<R>, id: &str) -> bool {
    let Some((label, chosen)) = parse_id(id) else { return false };
    if let Err(e) = app.emit_to(label, POPUP_EVENT, chosen) {
        log::error!("pop-up menu: {e}");
    }
    true
}

/// Open a menu at (x, y), in CSS pixels from the web view's top-left corner.
#[tauri::command]
pub fn popup_menu<R: Runtime>(app: AppHandle<R>, window: WebviewWindow<R>, token: u32, entries: Vec<Entry>, x: f64, y: f64) -> Result<(), String> {
    check_entries(&entries)?;
    let label = window.label().to_string();
    let mut items: Vec<Box<dyn IsMenuItem<R>>> = Vec::with_capacity(entries.len());
    for (index, entry) in entries.iter().enumerate() {
        let id = item_id(&label, token, index);
        let item: Box<dyn IsMenuItem<R>> = match entry {
            Entry::Separator => Box::new(PredefinedMenuItem::separator(&app).map_err(|e| e.to_string())?),
            Entry::Item { text, enabled, checked: Some(checked), accelerator } => {
                let text = menu_text(text);
                let build = |accelerator: Option<&String>| {
                    let mut b = CheckMenuItemBuilder::with_id(id.clone(), &text).enabled(*enabled).checked(*checked);
                    if let Some(a) = accelerator {
                        b = b.accelerator(a);
                    }
                    b.build(&app)
                };
                // a key the menu can't show is left out, not the item
                Box::new(build(accelerator.as_ref()).or_else(|_| build(None)).map_err(|e| e.to_string())?)
            }
            Entry::Item { text, enabled, checked: None, accelerator } => {
                let text = menu_text(text);
                let build = |accelerator: Option<&String>| {
                    let mut b = MenuItemBuilder::with_id(id.clone(), &text).enabled(*enabled);
                    if let Some(a) = accelerator {
                        b = b.accelerator(a);
                    }
                    b.build(&app)
                };
                Box::new(build(accelerator.as_ref()).or_else(|_| build(None)).map_err(|e| e.to_string())?)
            }
        };
        items.push(item);
    }
    let refs: Vec<&dyn IsMenuItem<R>> = items.iter().map(|i| i.as_ref()).collect();
    let menu = MenuBuilder::new(&app).items(&refs).build().map_err(|e| e.to_string())?;
    window.popup_menu_at(&menu, LogicalPosition::new(x.max(0.0), y.max(0.0))).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_chosen_item_names_its_window_token_and_index() {
        let id = item_id("main", 7, 3);
        assert_eq!(parse_id(&id), Some(("main", Chosen { token: 7, index: 3 })));
        let win = crate::windows::label_for("/home/post/1");
        assert_eq!(parse_id(&item_id(&win, 1, 0)).map(|(l, _)| l.to_string()), Some(win));
        // the app's own menu items are not these
        assert_eq!(parse_id("new-post"), None);
        assert_eq!(parse_id("popup"), None);
        assert_eq!(parse_id(&format!("popup{SEP}{SEP}1{SEP}2")), None, "no label");
        assert_eq!(parse_id(&format!("popup{SEP}main{SEP}x{SEP}2")), None);
        assert_eq!(parse_id(&format!("{}{SEP}9", item_id("main", 1, 2))), None, "nothing after the index");
    }

    #[test]
    fn entries_come_from_the_page_as_items_and_separators() {
        let entries: Vec<Entry> = serde_json::from_value(serde_json::json!([
            { "kind": "item", "text": "Gardeners", "checked": true, "accelerator": "Cmd+Ctrl+1" },
            { "kind": "separator" },
            { "kind": "item", "text": "Add Network…" },
            { "kind": "item", "text": "Later", "enabled": false }
        ]))
        .unwrap();
        assert!(matches!(&entries[0], Entry::Item { checked: Some(true), accelerator: Some(_), enabled: true, .. }));
        assert!(matches!(&entries[1], Entry::Separator));
        assert!(matches!(&entries[2], Entry::Item { checked: None, enabled: true, .. }));
        assert!(matches!(&entries[3], Entry::Item { enabled: false, .. }));
        assert!(check_entries(&entries).is_ok());
    }

    #[test]
    fn names_with_an_ampersand_keep_it() {
        assert_eq!(menu_text("Arts & Crafts"), "Arts && Crafts");
        assert_eq!(menu_text("R&D – Lily"), "R&&D – Lily");
        assert_eq!(menu_text("&&"), "&&&&");
        assert_eq!(menu_text("Gardeners"), "Gardeners");
    }

    #[test]
    fn macos_shows_the_escaped_text_as_written() {
        // muda 0.20's strip_mnemonic for NSMenu titles (platform_impl/macos/util.rs, private):
        // a single & goes, && is one &
        let shown = |s: &str| {
            let mut out = String::new();
            let mut chars = s.chars().peekable();
            while let Some(c) = chars.next() {
                match c {
                    '&' if chars.peek() == Some(&'&') => {
                        chars.next();
                        out.push('&');
                    }
                    '&' => {}
                    _ => out.push(c),
                }
            }
            out
        };
        assert_eq!(shown("Arts & Crafts"), "Arts  Crafts", "unescaped, the & is lost");
        assert_eq!(shown(&menu_text("Arts & Crafts")), "Arts & Crafts");
        assert_eq!(shown(&menu_text("R&&D")), "R&&D");
    }

    #[test]
    fn menus_stay_small() {
        assert!(check_entries(&[]).is_err());
        let item = |text: String| Entry::Item { text, enabled: true, checked: None, accelerator: None };
        assert!(check_entries(&[item(String::new())]).is_err());
        assert!(check_entries(&[item("x".repeat(201))]).is_err());
        assert!(check_entries(&[item("x".repeat(200))]).is_ok());
        assert!(check_entries(&(0..61).map(|_| Entry::Separator).collect::<Vec<_>>()).is_err());
    }
}
