/**
 * Custom font families that font-config.js can pick per platform.
 * Plain CommonJS data: read by apps/expo/app.config.js (Node, native build)
 * as well as by the app bundles.
 *
 * - `name`: the family name native code asks for. It must match the family
 *   name inside the font files (iOS groups faces by it and picks one by
 *   fontWeight; Android gets an XML font family under this name).
 * - `native`: one static file per weight, relative to this folder. Variable
 *   fonts don't work here: iOS and Android can't select a weight from them.
 * - Web loads the family through next/font: add an instance per role to
 *   `webFontFamilies` in fonts-web.web.ts under the same key.
 *
 * Adding a family: drop its static files next to this file, add an entry
 * here and in fonts-web.web.ts, then select it in customization/config/fonts.js.
 */
module.exports = {
    inter: {
        name: 'Inter',
        native: {
            400: 'inter/Inter-Regular.ttf',
            500: 'inter/Inter-Medium.ttf',
            600: 'inter/Inter-SemiBold.ttf',
            700: 'inter/Inter-Bold.ttf',
        },
    },
};
