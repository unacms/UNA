/**
 * Which font each role (main, title) uses on a platform, from
 * customization/config/fonts.js. CommonJS without Node or RN imports: the
 * native build (apps/expo/plugins/with-app-fonts.js) and the app bundles both
 * use it.
 */
const config = require('../../customization/config/fonts');
const families = require('./font-families');

const FONT_ROLES = ['main', 'title'];

/** Family key for `role` on `platform` ('web' | 'ios' | 'android'), or 'system'. */
function fontChoice(role, platform) {
    const key = config?.[role]?.[platform];
    if (!key || key === 'system') return 'system';
    if (!families[key]) {
        console.warn(`Font '${key}' (${role}, ${platform}) is not in font-families.js; using the system font.`);
        return 'system';
    }
    return key;
}

/**
 * React Native fontFamily for `role` on iOS / Android: the custom family's
 * name, or the platform UI font. 'System' is SF Pro on iOS; on Android,
 * 'sans-serif' is the device default (Roboto, or the maker's own font).
 */
function nativeFontFamily(role, platform) {
    const key = fontChoice(role, platform);
    if (key !== 'system') return families[key].name;
    return platform === 'android' ? 'sans-serif' : 'System';
}

module.exports = { FONT_ROLES, fontChoice, nativeFontFamily };
