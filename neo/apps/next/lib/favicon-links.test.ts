// Run with `node --test apps/next/lib/favicon-links.test.ts` from the NEO root (Node 24 strips the types).
import assert from 'node:assert/strict';
import test from 'node:test';
import { faviconLinks } from './favicon-links.ts';

const PNG = '/logo192.png';
const LIGHT = '(prefers-color-scheme: light)';
const DARK = '(prefers-color-scheme: dark)';

test('nothing uploaded: the build icons, light and dark', () => {
    for (const icons of [undefined, null, {}, { fav: '', svg: '', dark: '' }]) {
        assert.deepEqual(faviconLinks(icons, '/', PNG), [
            { url: PNG, type: 'image/png', sizes: '192x192' },
            { url: '/favicon.svg', type: 'image/svg+xml', media: LIGHT },
            { url: '/favicon-dark.svg', type: 'image/svg+xml', media: DARK },
        ]);
    }
});

test('a client project reads its own build files', () => {
    assert.equal(faviconLinks(undefined, '/static/', '/static/logo192.png')[2]?.url, '/static/favicon-dark.svg');
});

test('an uploaded SVG and its dark twin', () => {
    const icons = { fav: '', svg: 'https://una.example/s/sys_images/a.svg', dark: 'https://una.example/s/sys_images/b.png' };
    assert.deepEqual(faviconLinks(icons, '/', PNG), [
        { url: icons.svg, type: 'image/svg+xml', media: LIGHT },
        { url: icons.dark, type: 'image/png', media: DARK },
    ]);
});

test('an uploaded SVG without a dark one shows on every tab', () => {
    const icons = { svg: 'https://una.example/s/sys_images/a.svg' };
    assert.deepEqual(faviconLinks(icons, '/', PNG), [{ url: icons.svg, type: 'image/svg+xml' }]);
});

test('favicon.ico and SVG uploaded: the ico first for browsers without SVG icons', () => {
    const icons = { fav: 'https://una.example/s/sys_files/f.ico', svg: 'https://una.example/s/sys_images/a.svg', dark: 'https://una.example/s/sys_images/d.svg' };
    assert.deepEqual(faviconLinks(icons, '/', PNG), [
        { url: icons.fav, type: 'image/x-icon', sizes: 'any' },
        { url: icons.svg, type: 'image/svg+xml', media: LIGHT },
        { url: icons.dark, type: 'image/svg+xml', media: DARK },
    ]);
});

test('only favicon.ico uploaded', () => {
    const icons = { fav: 'https://una.example/s/sys_files/f.ico' };
    assert.deepEqual(faviconLinks(icons, '/', PNG), [{ url: icons.fav, type: 'image/x-icon' }]);
});

test('only a dark icon uploaded: over the build light icon', () => {
    const icons = { dark: 'https://una.example/s/sys_images/d.svg' };
    assert.deepEqual(faviconLinks(icons, '/', PNG).slice(1), [
        { url: '/favicon.svg', type: 'image/svg+xml', media: LIGHT },
        { url: icons.dark, type: 'image/svg+xml', media: DARK },
    ]);
});

test('anything but an http(s) URL is ignored', () => {
    assert.equal(faviconLinks({ svg: 'javascript:alert(1)', dark: 42 }, '/', PNG)[1]?.url, '/favicon.svg');
});
