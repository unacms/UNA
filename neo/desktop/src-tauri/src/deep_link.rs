//! `una://` links (tauri-plugin-deep-link): `una://open?path=/home/post/12`, with `site=` naming
//! the network when there are several. The link that started the app and the ones that come
//! while it runs (on Windows and Linux a second instance, which single-instance forwards here)
//! are kept until the main window takes them (`take_deep_links`); a `deep-link` event tells it
//! that one came. The page reads them with its route parser (src/lib/deep-link.ts) and opens
//! only a route it knows, of a network signed in to; a link never does anything but show a
//! place. Here a link is only checked for the scheme and its length.

use std::sync::Mutex;

use tauri::{AppHandle, Emitter, Manager, Runtime, State};
use url::Url;

pub const SCHEME: &str = crate::brand::SCHEME;
/// The event that tells the main window links are waiting.
pub const DEEP_LINK_EVENT: &str = "deep-link";
const MAX_LENGTH: usize = 2048;
/// Links kept until the page takes them; older ones go first.
const MAX_WAITING: usize = 8;

#[derive(Default)]
pub struct DeepLinks(Mutex<Vec<String>>);

impl DeepLinks {
    /// Keep the links of this scheme, not one twice in a row, at most MAX_WAITING.
    pub(crate) fn add<'a>(&self, urls: impl IntoIterator<Item = &'a Url>) -> bool {
        let mut waiting = self.0.lock().unwrap_or_else(|e| e.into_inner());
        let mut added = false;
        for url in urls {
            let Some(link) = accept(url) else {
                log::warn!("deep link refused: not a {SCHEME}:// link of up to {MAX_LENGTH} characters");
                continue;
            };
            if waiting.last() != Some(&link) {
                waiting.push(link);
                added = true;
            }
        }
        let extra = waiting.len().saturating_sub(MAX_WAITING);
        waiting.drain(..extra);
        added
    }

    fn take(&self) -> Vec<String> {
        std::mem::take(&mut *self.0.lock().unwrap_or_else(|e| e.into_inner()))
    }
}

pub(crate) fn accept(url: &Url) -> Option<String> {
    let link = url.as_str();
    (url.scheme() == SCHEME && link.len() <= MAX_LENGTH).then(|| link.to_string())
}

/// The links waiting for the page, taken.
#[tauri::command]
pub fn take_deep_links(state: State<'_, DeepLinks>) -> Vec<String> {
    state.take()
}

/// Listen for links: the one the app was started with and those that come later.
#[cfg(desktop)]
pub fn listen<R: Runtime>(app: &tauri::App<R>) {
    use tauri_plugin_deep_link::DeepLinkExt;

    // macOS registers the scheme from the bundle; Linux, and Windows in development, here
    #[cfg(any(target_os = "linux", all(windows, debug_assertions)))]
    if let Err(e) = app.deep_link().register_all() {
        log::warn!("deep links: {e}");
    }

    if let Ok(Some(urls)) = app.deep_link().get_current() {
        app.state::<DeepLinks>().add(urls.iter());
    }

    let handle = app.handle().clone();
    app.deep_link().on_open_url(move |event| {
        let urls = event.urls();
        if handle.state::<DeepLinks>().add(urls.iter()) {
            opened(&handle);
        }
    });
}

/// A link came while the app runs: the window comes forward and the page takes it.
#[cfg(desktop)]
fn opened<R: Runtime>(app: &AppHandle<R>) {
    crate::tray::show_main(app);
    if let Err(e) = app.emit_to("main", DEEP_LINK_EVENT, ()) {
        log::error!("deep link event: {e}");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn url(s: &str) -> Url {
        Url::parse(s).unwrap()
    }

    #[test]
    fn only_una_links_of_a_sane_length_wait() {
        let links = DeepLinks::default();
        assert!(links.add([&url("una://open?path=/home/post/12")]));
        assert!(!links.add([&url("una://open?path=/home/post/12")]), "the same link twice in a row once");
        assert!(!links.add([&url("https://evil.example/")]));
        assert!(!links.add([&url("file:///etc/passwd")]));
        let long = format!("una://open?path=/{}", "a".repeat(MAX_LENGTH));
        assert!(!links.add([&url(&long)]), "too long");
        assert_eq!(links.take(), ["una://open?path=/home/post/12"]);
        assert!(links.take().is_empty(), "taken once");
    }

    #[test]
    fn older_links_go_first() {
        let links = DeepLinks::default();
        let many: Vec<Url> = (0..12).map(|i| url(&format!("una://open?path=/home/post/{i}"))).collect();
        links.add(many.iter());
        let waiting = links.take();
        assert_eq!(waiting.len(), MAX_WAITING);
        assert_eq!(waiting.last().map(String::as_str), Some("una://open?path=/home/post/11"));
    }
}
