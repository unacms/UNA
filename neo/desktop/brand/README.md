# The app's brand

Everything a client project changes to ship the desktop app under its own name is in this
folder. The rest of the app reads it; nothing else holds the name, the identifier or the icons.

| File | What it is |
|---|---|
| `brand.json` | `name` (the menu bar, the tray, window titles, notifications, texts such as "Sign in – UNA"), `identifier` (the bundle identifier, also the keychain service the sign-ins are kept under), `scheme` (the app's links, `una://open?path=...`), `description` (the bundle's short description), `issuesUrl` (Help > Report an Issue), `updatesUrl` (the `latest.json` the app looks for new versions at, https), `updatesPubkey` (the public key update packages are signed with) |
| `icons/` | The bundle's icons (`32x32.png`, `128x128.png`, `128x128@2x.png`, `icon.icns`, `icon.ico`, and the store sizes), and `tray-template@2x.png`, the tray's mark in black on transparency (macOS draws it in the menu bar's colour) |
| `AppIcon.icon` | The Icon Composer file the macOS icons are compiled from (optional) |
| `icons/Assets.car` | macOS's icon catalog, compiled from `AppIcon.icon`: macOS 26 shows its light, dark, clear and tinted versions. Optional: without it macOS shows `icon.icns`, the same in every mode |
| `app-icon.png` | The icon on the sign-in screen and the splash |

## Changing it

1. Edit `brand.json` and replace the icons (same file names and sizes): from `neo/desktop`,
   `yarn tauri icon <a 1024px png> -o brand/icons` makes the bundle's set here. Draw
   `tray-template@2x.png` and `app-icon.png` yourself. For macOS: save your Icon Composer file
   as `AppIcon.icon` here and run `sh brand/compile-icon.sh` on a Mac with Xcode 26 (it writes
   `icons/Assets.car` and `icons/icon.icns`), or delete `AppIcon.icon` and `icons/Assets.car`,
   which are UNA's, to ship your `icon.icns` alone.
2. From `neo/desktop`: `node brand/apply.mjs`. It writes the values into `src-tauri/tauri.conf.json`
   and `index.html`, which Tauri and Vite read as they are, and writes or removes
   `src-tauri/Info.plist` (the catalog's icon name) as `icons/Assets.car` is there or not.
3. Rebuild. `src/lib/brand.test.ts` and the Rust test `brand::tests` fail while `tauri.conf.json`
   and `brand.json` disagree, and `brand.mjs` refuses a value a build cannot ship (an identifier
   that is not a reverse domain name, a scheme that is not one, an issues address that is not https).

## Updates

UNA's `updatesUrl` and `updatesPubkey` are UNA's: an app with them would take UNA's app as its
update, so `brand.mjs` refuses UNA's address with another identifier. For your own:

1. From `neo/desktop`: `yarn tauri signer generate -w ~/.tauri/<your-app>.key`. Keep the private
   key and its password outside the repository (a password manager); losing them means your
   installed apps can never update again.
2. Put the text of `<your-app>.key.pub` in `updatesPubkey`, and the address you will serve
   `latest.json` from in `updatesUrl` (any https address; the updater fills `{{target}}`, `{{arch}}`
   and `{{current_version}}` in it, if you want a server to answer per system).
3. Set the release secrets `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
   (the README's Releases section), and publish `latest.json` where `updatesUrl` says. With
   GitHub releases, `.github/workflows/desktop-update-feed.yml` does it: point `updatesUrl` at
   `https://github.com/<owner>/<repo>/releases/download/desktop-latest/latest.json`.

## What changes with it

- **A new identifier is a new app** for the system: its own settings, keychain entries, data
  folder and login item. People who had the old one sign in again.
- **A new update key** reaches only apps installed after it: the ones out there take only
  packages signed with the key they were built with.
- **A new scheme** changes the app's links; links made with the old one no longer open it.
- **Texts in every language** take the name as `{{app}}` ("Open {{app}}"), so the language files
  need no change. "UNA network" and "UNA API v2" stay: they name the platform the app connects
  to, not the app.
