import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

// @ts-expect-error a plain ES module of brand/ (no types)
import { BUNDLE_ICONS, ICON_CATALOG, UNA_UPDATES_URL, brandedConfig, brandedIndex, brandedInfoPlist, isUpdatesPubkey, readBrand } from '../../brand/brand.mjs';
import { APP_NAME, APP_SCHEME, ISSUES_URL } from './brand';
import { DEEP_LINK_SCHEME, deepLinkFor } from './deep-link';
import { t } from './i18n';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');
const brand = readBrand(read('brand/brand.json'));
const iconCatalog = existsSync(join(root, 'brand', ICON_CATALOG));
const readOrNull = (path: string) => (existsSync(join(root, path)) ? read(path) : null);

describe('the brand', () => {
    it('is what the page says its name, links and issues address are', () => {
        expect(APP_NAME).toBe(brand.name);
        expect(APP_SCHEME).toBe(`${brand.scheme}:`);
        expect(DEEP_LINK_SCHEME).toBe(APP_SCHEME);
        expect(ISSUES_URL).toBe(brand.issuesUrl);
    });

    it('is in tauri.conf.json and index.html as brand/apply.mjs writes it', () => {
        const config = JSON.parse(read('src-tauri/tauri.conf.json'));
        expect(brandedConfig(config, brand, iconCatalog), 'run node brand/apply.mjs').toEqual(config);
        expect(readOrNull('src-tauri/Info.plist'), 'run node brand/apply.mjs').toBe(brandedInfoPlist(iconCatalog));
        expect(config.identifier).toBe(brand.identifier);
        expect(config.plugins['deep-link'].desktop.schemes).toEqual([brand.scheme]);
        const html = read('index.html');
        expect(brandedIndex(html, brand), 'run node brand/apply.mjs').toBe(html);
    });

    it('has every icon the bundle takes, and the tray and app icons', () => {
        for (const icon of [...BUNDLE_ICONS, 'icons/tray-template@2x.png', 'app-icon.png']) expect(() => read(`brand/${icon}`), icon).not.toThrow();
    });

    it('says texts with the app in them in its name', () => {
        expect(t('Sign in – {{app}}', { app: APP_NAME })).toBe(`Sign in – ${brand.name}`);
    });

    it('makes links of its scheme', () => {
        expect(deepLinkFor('/home/post/12')).toMatch(new RegExp(`^${brand.scheme}://open\\?`));
    });

    it('stops at a value a build cannot ship', () => {
        const good = read('brand/brand.json');
        const with_ = (patch: object) => JSON.stringify({ ...JSON.parse(good), ...patch });
        expect(() => readBrand(with_({ name: '' }))).toThrow('name is missing');
        expect(() => readBrand(with_({ identifier: 'my app' }))).toThrow('reverse domain name');
        expect(() => readBrand(with_({ scheme: 'My App' }))).toThrow('scheme is lower-case');
        expect(() => readBrand(with_({ scheme: 'https' }))).toThrow('scheme https is taken');
        expect(() => readBrand(with_({ issuesUrl: 'http://x.example' }))).toThrow('https address');
        expect(() => readBrand(with_({ updatesUrl: 'http://updates.example/latest.json' }))).toThrow('updatesUrl is an https address');
        expect(() => readBrand(with_({ updatesPubkey: '' }))).toThrow('updatesPubkey is missing');
        expect(() => readBrand(with_({ updatesPubkey: 'not a key' }))).toThrow('updatesPubkey is the public key');
        expect(() => readBrand(with_({ updatesPubkey: Buffer.from('untrusted comment: x\nRWnope\n').toString('base64') }))).toThrow('updatesPubkey is the public key');
        // another app on UNA's updates would be replaced by UNA's at its first update
        expect(() => readBrand(with_({ name: 'Gardeners', identifier: 'org.gardeners.app', scheme: 'gardeners' }))).toThrow("updatesUrl is UNA's");
        expect(readBrand(with_({ name: 'Gardeners', identifier: 'org.gardeners.app', scheme: 'gardeners', updatesUrl: 'https://gardeners.example/desktop/latest.json' })).name).toBe('Gardeners');
    });

    it('takes the update key `tauri signer generate` writes', () => {
        expect(isUpdatesPubkey(brand.updatesPubkey)).toBe(true);
        expect(brand.updatesUrl).toBe(UNA_UPDATES_URL);
        const config = JSON.parse(read('src-tauri/tauri.conf.json'));
        expect(config.plugins.updater).toMatchObject({ endpoints: [brand.updatesUrl], pubkey: brand.updatesPubkey, requireSignedVersion: true });
    });

    it('carries a client project’s values into the config', () => {
        const config = JSON.parse(read('src-tauri/tauri.conf.json'));
        const theirs = brandedConfig(config, {
            name: 'Gardeners',
            identifier: 'org.gardeners.app',
            scheme: 'gardeners',
            description: 'Gardeners app',
            issuesUrl: 'https://gardeners.example/help',
            updatesUrl: 'https://gardeners.example/desktop/latest.json',
            updatesPubkey: 'their-key',
        });
        expect(theirs.plugins.updater).toEqual({ ...config.plugins.updater, endpoints: ['https://gardeners.example/desktop/latest.json'], pubkey: 'their-key' });
        expect([theirs.productName, theirs.identifier, theirs.app.windows[0].title, theirs.plugins['deep-link'].desktop.schemes[0], theirs.bundle.shortDescription]).toEqual([
            'Gardeners',
            'org.gardeners.app',
            'Gardeners',
            'gardeners',
            'Gardeners app',
        ]);
        expect(theirs.app.security).toEqual(config.app.security);
        expect(brandedIndex('<title>UNA</title>', { name: 'A & <B>' })).toBe('<title>A &amp; &lt;B></title>');
    });

    it('ships macOS’s icon catalog only while there is one', () => {
        const config = JSON.parse(read('src-tauri/tauri.conf.json'));
        const withCatalog = brandedConfig(config, brand, true);
        expect(withCatalog.bundle.macOS.files['Resources/Assets.car']).toBe(`../brand/${ICON_CATALOG}`);
        expect(brandedInfoPlist(true)).toContain('<key>CFBundleIconName</key>');
        const without = brandedConfig(config, brand, false);
        expect(without.bundle.macOS.files).toBeUndefined();
        expect(without.bundle.macOS.hardenedRuntime).toBe(config.bundle.macOS.hardenedRuntime);
        expect(brandedInfoPlist(false)).toBeNull();
    });
});
