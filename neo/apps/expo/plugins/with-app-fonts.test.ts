/// <reference types="node" />
// Run with `node --test apps/expo/plugins/with-app-fonts.test.ts` from the NEO root (Node 24 strips the types).
//
// The family names native code asks for (font-choice.js) and the files this plugin
// embeds must agree, for core's families and for a fork's own (`families` in
// customization/config/fonts.js). Each test passes its config explicitly, so the
// result doesn't depend on what a fork has in its customization folder.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';

type Platform = 'web' | 'ios' | 'android';
type FontFamily = { name: string; native: Record<number, string> };
type FontConfig = {
    families?: Record<string, FontFamily>;
    main?: Partial<Record<Platform, string>>;
    title?: Partial<Record<Platform, string>>;
};
type FontChoice = {
    customFamilies: Record<string, FontFamily>;
    fontChoice: (role: string, platform: Platform) => string;
    nativeFontFamily: (role: string, platform: Platform) => string;
};
type FontDefinition = { weight: number; path: string };
type FontOptions = {
    ios: { fonts: string[] };
    android: { fonts: { fontFamily: string; fontDefinitions: FontDefinition[] }[] };
};

// font-choice.js and the plugin are CommonJS; stubs go into the same module cache they load from.
const cjsRequire = createRequire(import.meta.url);
const NEO = path.resolve(path.dirname(cjsRequire.resolve('./with-app-fonts')), '../../..');
const CONFIG = cjsRequire.resolve('app/customization/config/fonts');
const CHOICE = cjsRequire.resolve('app/design/fonts/font-choice');
const PLUGIN = cjsRequire.resolve('./with-app-fonts');
const EXPO_FONT = cjsRequire.resolve('expo-font/app.plugin');
const DEFAULT_CONFIG = cjsRequire('app/design/fonts/font-config') as FontConfig;

function stub(file: string, exports: unknown) {
    cjsRequire.cache[file] = { id: file, filename: file, loaded: true, exports } as unknown as NodeModule;
}

/** font-choice and the plugin loaded against `config`, and the options the plugin gave expo-font (null if it embedded nothing). */
function load(config: FontConfig): { choice: FontChoice; fontOptions: FontOptions | null } {
    for (const file of [CHOICE, PLUGIN]) delete cjsRequire.cache[file];
    stub(CONFIG, config);
    let fontOptions: FontOptions | null = null;
    stub(EXPO_FONT, {
        default: (expoConfig: object, options: FontOptions) => {
            fontOptions = options;
            return expoConfig;
        },
    });
    const choice = cjsRequire(CHOICE) as FontChoice;
    (cjsRequire(PLUGIN) as (config: object) => object)({});
    return { choice, fontOptions };
}

/** The options, failing the test when the plugin embedded nothing. */
function embedded(fontOptions: FontOptions | null): FontOptions {
    assert.ok(fontOptions, 'expected the plugin to embed fonts');
    return fontOptions;
}

const rel = (file: string) => path.relative(NEO, file);
const iosFiles = (options: FontOptions) => options.ios.fonts.map(rel);
const androidFamilies = (options: FontOptions) =>
    options.android.fonts.map(({ fontFamily, fontDefinitions }) => ({
        fontFamily,
        files: fontDefinitions.map(({ weight, path: file }) => `${weight} ${rel(file)}`),
    }));

const INTER_FILES = ['Regular', 'Medium', 'SemiBold', 'Bold'].map((face) => `packages/app/design/fonts/inter/Inter-${face}.ttf`);
const BRAND: FontFamily = {
    name: 'Brand',
    native: { 400: 'design/fonts/brand/Brand-Regular.ttf', 700: 'design/fonts/brand/Brand-Bold.ttf' },
};
const BRAND_FILES = ['packages/app/customization/design/fonts/brand/Brand-Regular.ttf', 'packages/app/customization/design/fonts/brand/Brand-Bold.ttf'];

test.after(() => {
    for (const file of [CONFIG, CHOICE, PLUGIN, EXPO_FONT]) delete cjsRequire.cache[file];
});

test('the default config uses the system font everywhere and embeds nothing', () => {
    const { choice, fontOptions } = load(DEFAULT_CONFIG);
    for (const role of ['main', 'title']) {
        assert.equal(choice.fontChoice(role, 'web'), 'system');
        assert.equal(choice.nativeFontFamily(role, 'ios'), 'System');
        assert.equal(choice.nativeFontFamily(role, 'android'), 'sans-serif');
    }
    assert.deepEqual(Object.keys(choice.customFamilies), []);
    assert.equal(fontOptions, null);
});

test('core Inter is embedded from design/fonts when selected', () => {
    const { choice, fontOptions } = load({
        main: { ios: 'inter', android: 'inter' },
        title: { ios: 'inter', android: 'inter' },
    });
    for (const role of ['main', 'title']) {
        assert.equal(choice.nativeFontFamily(role, 'ios'), 'Inter');
        assert.equal(choice.nativeFontFamily(role, 'android'), 'Inter');
    }
    const options = embedded(fontOptions);
    assert.deepEqual(iosFiles(options), INTER_FILES);
    assert.deepEqual(androidFamilies(options), [
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
    const options = embedded(fontOptions);
    assert.deepEqual(iosFiles(options), BRAND_FILES);
    assert.deepEqual(androidFamilies(options), [
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
    const options = embedded(fontOptions);
    assert.deepEqual(iosFiles(options), ['packages/app/customization/design/fonts/inter/InterDisplay-Regular.ttf']);
    assert.deepEqual(androidFamilies(options), [
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
    const options = embedded(fontOptions);
    assert.deepEqual(iosFiles(options), BRAND_FILES);
    assert.deepEqual(androidFamilies(options).map((family) => family.fontFamily), ['Inter']);
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
