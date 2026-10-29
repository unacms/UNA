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
 * customization/config/fonts.js can also add its own families next to these:
 *
 *   families: {
 *       brand: {
 *           name: 'Brand',   // the family name inside the files
 *           native: {        // static files, relative to packages/app/customization/
 *               400: 'design/fonts/brand/Brand-Regular.ttf',
 *               700: 'design/fonts/brand/Brand-Bold.ttf',
 *           },
 *       },
 *   },
 *   main: { ios: 'brand', android: 'brand' },
 *
 * They are for iOS and Android; on web the project loads its font in
 * customization/design/fonts/fonts-web.js, which replaces the core web fonts.
 *
 * This is a build setting: iOS and Android embed the selected fonts in the
 * app binary, so changing ios/android needs a native rebuild (prebuild +
 * run:ios / run:android). Web picks it up on the next build or dev reload.
 */
module.exports = {
    main: { web: 'inter', ios: 'inter', android: 'inter' },
    title: { web: 'inter', ios: 'inter', android: 'inter' },
};
