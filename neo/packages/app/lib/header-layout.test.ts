import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HEADER_LAYOUT_DEFAULT, resolveHeaderLayout } from './header-layout.ts';

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
