//! The app's brand, from ../brand/brand.json (build.rs passes it in at compile time): what a
//! client project changes to ship its own app. The page reads the same file (src/lib/brand.ts),
//! and brand/apply.mjs writes it into tauri.conf.json.

/// The app's name, as the menu bar, the tray and notifications say it.
pub const NAME: &str = env!("BRAND_NAME");
/// The bundle identifier, which is also the keychain service the sign-ins are kept under.
pub const IDENTIFIER: &str = env!("BRAND_IDENTIFIER");
/// The scheme of the app's links (`una://open?path=...`).
pub const SCHEME: &str = env!("BRAND_SCHEME");

#[cfg(test)]
mod tests {
    #[test]
    fn the_brand_is_the_files() {
        let text = std::fs::read_to_string(concat!(env!("CARGO_MANIFEST_DIR"), "/../brand/brand.json")).unwrap();
        let brand: serde_json::Value = serde_json::from_str(&text).unwrap();
        assert_eq!(brand["name"], super::NAME);
        assert_eq!(brand["identifier"], super::IDENTIFIER);
        assert_eq!(brand["scheme"], super::SCHEME);
        let config: serde_json::Value = serde_json::from_str(include_str!("../tauri.conf.json")).unwrap();
        assert_eq!(config["identifier"], super::IDENTIFIER, "run node brand/apply.mjs");
        assert_eq!(config["productName"], super::NAME, "run node brand/apply.mjs");
        assert_eq!(config["plugins"]["deep-link"]["desktop"]["schemes"][0], super::SCHEME, "run node brand/apply.mjs");
    }
}
