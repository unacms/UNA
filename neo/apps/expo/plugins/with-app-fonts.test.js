// Run with `node --test apps/expo/plugins/with-app-fonts.test.js` from the NEO root.
//
// The family names native code asks for (font-choice.js) and the files this plugin
// embeds must agree, for core's families and for a fork's own (`families` in
// customization/config/fonts.js). Each test passes its config explicitly, so the
// result doesn't depend on what a fork has in its customization folder.
const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const NEO = path.resolve(__dirname, '../../..');
const CONFIG = require.resolve('app/customization/config/fonts');
const CHOICE = require.resolve('app/design/fonts/font-choice');
const PLUGIN = require.resolve('./with-app-fonts');
const EXPO_FONT = require.resolve('expo-font/app.plugin');
const DEFAULT_CONFIG = require('app/design/fonts/font-config');

function stub(file, exports) {
    require.cache[file] = { id: file, filename: file, loaded: true, exports };
}

/** font-choice and the plugin loaded against `config`, and the options the plugin gave expo-font (null if it embedded nothing). */
function load(config) {
    for (const file of [CHOICE, PLUGIN]) delete require.cache[file];
    stub(CONFIG, config);
    let fontOptions = null;
    stub(EXPO_FONT, {
        default: (expoConfig, options) => {
            fontOptions = options;
            return expoConfig;
        },
    });
    const choice = require(CHOICE);
    require(PLUGIN)({});
    return { choice, fontOptions };
}

const rel = (file) => path.relative(NEO, file);
const iosFiles = (options) => options.ios.fonts.map(rel);
const androidFamilies = (options) =>
    options.android.fonts.map(({ fontFamily, fontDefinitions }) => ({
        fontFamily,
        files: fontDefinitions.map(({ weight, path: file }) => `${weight} ${rel(file)}`),
    }));

const INTER_FILES = ['Regular', 'Medium', 'SemiBold', 'Bold'].map((face) => `packages/app/design/fonts/inter/Inter-${face}.ttf`);
const BRAND = {
    name: 'Brand',
    native: { 400: 'design/fonts/brand/Brand-Regular.ttf', 700: 'design/fonts/brand/Brand-Bold.ttf' },
};
const BRAND_FILES = ['packages/app/customization/design/fonts/brand/Brand-Regular.ttf', 'packages/app/customization/design/fonts/brand/Brand-Bold.ttf'];

test.after(() => {
    for (const file of [CONFIG, CHOICE, PLUGIN, EXPO_FONT]) delete require.cache[file];
});

test('the default config uses core Inter on iOS and Android', () => {
    const { choice, fontOptions } = load(DEFAULT_CONFIG);
    for (const role of ['main', 'title']) {
        assert.equal(choice.nativeFontFamily(role, 'ios'), 'Inter');
        assert.equal(choice.nativeFontFamily(role, 'android'), 'Inter');
    }
    assert.deepEqual(Object.keys(choice.customFamilies), []);
    assert.deepEqual(iosFiles(fontOptions), INTER_FILES);
    assert.deepEqual(androidFamilies(fontOptions), [
        { fontFamily: 'Inter', files: [400, 500, 600, 700].map((weight, i) => `${weight} ${INTER_FILES[i]}`) },
    ]);
});

test('a fork family is named by its `name` and embedded from the customization folder', () => {
    const { choice, fontOptions } = load({
        families: { brand: BRAND },
        main: { ios: 'brand', android: 'brand' },
        title: { ios: 'brand', android: 'brand' },
    });
    assert.equal(choice.nativeFontFamily('main', 'ios'), 'Brand');
    assert.equal(choice.nativeFontFamily('title', 'android'), 'Brand');
    assert.deepEqual(iosFiles(fontOptions), BRAND_FILES);
    assert.deepEqual(androidFamilies(fontOptions), [
        { fontFamily: 'Brand', files: [`400 ${BRAND_FILES[0]}`, `700 ${BRAND_FILES[1]}`] },
    ]);
});

test('a fork family named like a core one replaces it', () => {
    const { choice, fontOptions } = load({
        families: { inter: { name: 'Inter Display', native: { 400: 'design/fonts/inter/InterDisplay-Regular.ttf' } } },
        main: { ios: 'inter', android: 'inter' },
        title: { ios: 'inter', android: 'inter' },
    });
    assert.equal(choice.nativeFontFamily('main', 'ios'), 'Inter Display');
    assert.deepEqual(iosFiles(fontOptions), ['packages/app/customization/design/fonts/inter/InterDisplay-Regular.ttf']);
    assert.deepEqual(androidFamilies(fontOptions), [
        { fontFamily: 'Inter Display', files: ['400 packages/app/customization/design/fonts/inter/InterDisplay-Regular.ttf'] },
    ]);
});

test('iOS and Android embed only the families each one selects', () => {
    const { choice, fontOptions } = load({
        families: { brand: BRAND },
        main: { ios: 'brand', android: 'inter' },
        title: { ios: 'system', android: 'inter' },
    });
    assert.equal(choice.nativeFontFamily('main', 'ios'), 'Brand');
    assert.equal(choice.nativeFontFamily('title', 'ios'), 'System');
    assert.equal(choice.nativeFontFamily('main', 'android'), 'Inter');
    assert.equal(choice.nativeFontFamily('title', 'android'), 'Inter');
    assert.deepEqual(iosFiles(fontOptions), BRAND_FILES);
    assert.deepEqual(androidFamilies(fontOptions).map((family) => family.fontFamily), ['Inter']);
});

test('an unknown family falls back to the system font and embeds nothing', (t) => {
    const warn = t.mock.method(console, 'warn', () => {});
    const { choice, fontOptions } = load({
        main: { ios: 'missing', android: 'missing' },
        title: { ios: 'system', android: 'system' },
    });
    assert.equal(choice.nativeFontFamily('main', 'ios'), 'System');
    assert.equal(choice.nativeFontFamily('main', 'android'), 'sans-serif');
    assert.equal(fontOptions, null);
    assert.ok(warn.mock.callCount() > 0);
});
