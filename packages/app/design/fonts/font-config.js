/**
 * Default font per role and platform. Projects override it in
 * customization/config/fonts.js.
 *
 * Each value is either:
 *   - 'system': the platform's own UI font: SF Pro on iOS, the device's
 *     sans-serif on Android (Roboto, or the maker's font), and the OS UI font
 *     stack on web (SF on Apple, Segoe UI on Windows, Roboto on Android);
 *   - a key of font-families.js (e.g. 'inter'): that font, loaded on that
 *     platform.
 *
 * This is a build setting: iOS and Android embed the selected fonts in the
 * app binary, so changing ios/android needs a native rebuild (prebuild +
 * run:ios / run:android). Web picks it up on the next build or dev reload.
 */
module.exports = {
    main: { web: 'inter', ios: 'inter', android: 'inter' },
    title: { web: 'inter', ios: 'inter', android: 'inter' },
};
