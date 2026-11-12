//! The window material: the macOS sidebar vibrancy, Windows 11 Mica, or none (Windows 10, Linux).
//!
//! The material is drawn behind the whole web view (the window is transparent:
//! tauri.conf.json), so the page paints everything that is not the sidebar opaque
//! (styles.css `.panes`). `set_effects` runs on the main thread and drops window-vibrancy's
//! result (tauri 2.12.5 window/mod.rs: `let _ = crate::vibrancy::set_window_effects(..)`), so
//! the platform and the OS build decide what the page is told, never that result.

use tauri::window::{Effect, EffectState, EffectsBuilder};
use tauri::{Runtime, WebviewWindow};

#[derive(Clone, Copy, PartialEq, Eq, Debug, serde::Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Material {
    #[cfg_attr(not(target_os = "macos"), allow(dead_code))]
    Sidebar,
    #[cfg_attr(not(windows), allow(dead_code))]
    Mica,
    None,
}

/// What this OS build gets. A pure function: `window_material` and `apply` both call it, so the
/// page never hears of a material that was not applied.
pub fn for_this_os() -> Material {
    #[cfg(target_os = "macos")]
    return Material::Sidebar;
    // Mica needs Windows 11 (build 22000)
    #[cfg(windows)]
    if windows_version::OsVersion::current().build >= 22000 {
        return Material::Mica;
    }
    #[allow(unreachable_code)]
    Material::None
}

/// Put this OS build's material behind the window; the caller then paints the window's
/// background for it (lib.rs `paint_background`).
pub fn apply<R: Runtime>(window: &WebviewWindow<R>) -> Material {
    let material = for_this_os();
    let effects = match material {
        // AppKit draws it solid under Reduce Transparency and greys it while the window is inactive
        Material::Sidebar => Some(EffectsBuilder::new().effect(Effect::Sidebar).state(EffectState::FollowsWindowActiveState).build()),
        // Effect::Mica (not MicaDark or MicaLight) follows the window's dark mode, which the
        // page's setTheme sets, so a theme other than the system's matches
        Material::Mica => Some(EffectsBuilder::new().effect(Effect::Mica).build()),
        Material::None => None,
    };
    if let Some(effects) = effects {
        if let Err(e) = window.set_effects(effects) {
            log::warn!("window material: {e}");
        }
    }
    material
}

/// The material the page draws its sidebar over (`data-material` on the page's root).
#[tauri::command]
pub fn window_material() -> Material {
    for_this_os()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_page_hears_what_this_os_gets() {
        let m = window_material();
        assert_eq!(m, for_this_os());
        #[cfg(target_os = "macos")]
        assert_eq!(m, Material::Sidebar);
        #[cfg(target_os = "linux")]
        assert_eq!(m, Material::None);
        assert_eq!(serde_json::to_value(Material::Sidebar).unwrap(), "sidebar");
        assert_eq!(serde_json::to_value(Material::Mica).unwrap(), "mica");
        assert_eq!(serde_json::to_value(Material::None).unwrap(), "none");
    }
}
