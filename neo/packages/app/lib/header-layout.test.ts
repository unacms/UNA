import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HEADER_LAYOUT_DEFAULT, resolveHeaderLayout, resolvePageWidth } from './header-layout.ts';

test('UNA decides when the app has no setting of its own', () => {
    assert.deepEqual(resolveHeaderLayout({ layout: 'standard', width: 'page', align: 'start' }, { width: null, align: null }), { width: 'page', align: 'start' });
});

test("the app's setting wins over UNA's, each on its own", () => {
    assert.deepEqual(resolveHeaderLayout({ width: 'page', align: 'start' }, { align: 'end' }), { width: 'page', align: 'end' });
    assert.deepEqual(resolveHeaderLayout({ width: 'page', align: 'start' }, { width: 'full' }), { width: 'full', align: 'start' });
});

test('a page without a header keeps the previous one, else the default', () => {
    assert.deepEqual(resolveHeaderLayout(undefined, null, { width: 'page', align: 'end' }), { width: 'page', align: 'end' });
    assert.deepEqual(resolveHeaderLayout(undefined, null, null), HEADER_LAYOUT_DEFAULT);
    assert.deepEqual(resolveHeaderLayout('', undefined), HEADER_LAYOUT_DEFAULT);
});

test('unknown values are skipped', () => {
    assert.deepEqual(resolveHeaderLayout({ width: 'wide', align: 'middle' }, { width: 'huge' }), HEADER_LAYOUT_DEFAULT);
    assert.deepEqual(resolveHeaderLayout({ width: 'page', align: 'center' }, { align: 'left' }), { width: 'page', align: 'center' });
});

test('the page width is UNA\'s unless the app sets one', () => {
    assert.equal(resolvePageWidth(1280, null), '1280px');
    assert.equal(resolvePageWidth('full', null), 'none');
    assert.equal(resolvePageWidth(1280, 'full'), 'none');
    assert.equal(resolvePageWidth(1280, '88rem'), '88rem');
    assert.equal(resolvePageWidth('full', 1024), '1024px');
});

test('a page without a width keeps the previous one, and odd values are skipped', () => {
    assert.equal(resolvePageWidth(undefined, null, '1280px'), '1280px');
    assert.equal(resolvePageWidth(undefined, null), null);
    assert.equal(resolvePageWidth('wide', 'calc(1px)'), null);
    assert.equal(resolvePageWidth(-5, '1280px; color: red'), null);
    assert.equal(resolvePageWidth('88rem', null), null, 'UNA sends pixels or full, not lengths');
});
