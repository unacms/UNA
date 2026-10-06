const path = require('path');
const withFonts = require('expo-font/app.plugin').default;
const { fontChoice, FONT_ROLES } = require('app/design/fonts/font-choice');
const families = require('app/design/fonts/font-families');

const FAMILIES_DIR = path.dirname(require.resolve('app/design/fonts/font-families'));

/** Custom family keys that any role uses on `platform`. */
function familiesFor(platform) {
    const keys = FONT_ROLES.map((role) => fontChoice(role, platform)).filter((key) => key !== 'system');
    return [...new Set(keys)];
}

/** [{ weight, path }] for a family's static files (absolute paths). */
function fontDefinitions(key) {
    return Object.entries(families[key].native).map(([weight, file]) => ({
        weight: Number(weight),
        path: path.join(FAMILIES_DIR, file),
    }));
}

/**
 * Embed the custom fonts that customization/config/fonts.js selects for iOS
 * and Android (expo-font's config plugin), and nothing for 'system'.
 *
 * - iOS: the files go into the app bundle and UIAppFonts. iOS groups them by
 *   the family name inside the files, and React Native picks the face by
 *   fontWeight.
 * - Android: an XML font family per custom family, registered with React
 *   Native's ReactFontManager under the family `name`, so fontWeight selects
 *   the file too.
 *
 * Changing the font config needs a prebuild and a native rebuild.
 */
module.exports = function withAppFonts(config) {
    const iosFonts = familiesFor('ios').flatMap((key) => fontDefinitions(key).map((def) => def.path));
    const androidFonts = familiesFor('android').map((key) => ({
        fontFamily: families[key].name,
        fontDefinitions: fontDefinitions(key),
    }));
    if (!iosFonts.length && !androidFonts.length) return config;
    return withFonts(config, {
        ios: { fonts: iosFonts },
        android: { fonts: androidFonts },
    });
};
