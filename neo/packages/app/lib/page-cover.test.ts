import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPageCoverShown, isPageCoverHiddenOn } from './page-cover.ts';

test('disabled or missing', () => {
    assert.equal(isPageCoverShown(0, false), false);
    assert.equal(isPageCoverShown(0, true), false);
    assert.equal(isPageCoverShown(undefined, true), false);
    assert.equal(isPageCoverShown('', false), false);
});

test('enabled for all', () => {
    assert.equal(isPageCoverShown(1, false), true);
    assert.equal(isPageCoverShown('1', true), true);
});

test('visitors only', () => {
    assert.equal(isPageCoverShown(2, false), true);
    assert.equal(isPageCoverShown(2, true), false);
});

test('members only', () => {
    assert.equal(isPageCoverShown(3, false), false);
    assert.equal(isPageCoverShown(3, true), true);
});

test('set in code as a boolean', () => {
    assert.equal(isPageCoverShown(true, false), true);
    assert.equal(isPageCoverShown(false, true), false);
});

test('hidden on a screen size', () => {
    assert.equal(isPageCoverHiddenOn(['phone'], 'phone', false), true);
    assert.equal(isPageCoverHiddenOn(['phone'], 'desktop', false), false);
    assert.equal(isPageCoverHiddenOn([], 'phone', false), false);
    assert.equal(isPageCoverHiddenOn(undefined, 'phone', true), false, 'an older UNA sends nothing');
});

test('the apps are the mobile app too', () => {
    assert.equal(isPageCoverHiddenOn(['mobile-app'], 'phone', true), true);
    assert.equal(isPageCoverHiddenOn(['mobile-app'], 'phone', false), false, 'not on the web');
    assert.equal(isPageCoverHiddenOn(['tablet'], 'tablet', true), true);
});
