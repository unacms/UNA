import test from 'node:test';
import assert from 'node:assert/strict';
import { isHiddenOn, withoutHiddenOn } from './hidden-on.ts';

test('nothing hidden keeps what shows', () => {
    assert.equal(withoutHiddenOn(true, false, false), true);
    assert.equal(withoutHiddenOn(true, [], true), true);
    assert.deepEqual(withoutHiddenOn(['tablet', 'desktop'], undefined, false), ['tablet', 'desktop']);
});

test('screen sizes come out', () => {
    assert.deepEqual(withoutHiddenOn(true, ['phone'], false), ['tablet', 'desktop']);
    assert.deepEqual(withoutHiddenOn(true, ['phone', 'tablet'], false), ['desktop']);
    assert.equal(withoutHiddenOn(true, ['phone', 'tablet', 'desktop'], false), false);
    assert.deepEqual(withoutHiddenOn(['mobile', 'desktop'], ['desktop'], false), ['mobile']);
});

test('off stays off', () => {
    assert.equal(withoutHiddenOn(false, ['phone'], false), false);
});

test('the mobile app counts in the apps only', () => {
    assert.equal(withoutHiddenOn(true, ['mobile-app'], true), false);
    assert.equal(withoutHiddenOn(true, ['mobile-app'], false), true);
    assert.deepEqual(withoutHiddenOn(true, ['phone', 'mobile-app'], false), ['tablet', 'desktop']);
});

test('a menu item is hidden on its screen sizes', () => {
    assert.equal(isHiddenOn(['phone', 'tablet'], 'phone', false), true);
    assert.equal(isHiddenOn(['phone', 'tablet'], 'desktop', false), false);
    assert.equal(isHiddenOn(false, 'phone', true), false);
    assert.equal(isHiddenOn(undefined, 'desktop', false), false);
});

test('a menu item hidden on the mobile app is hidden in the apps only', () => {
    assert.equal(isHiddenOn(['mobile-app'], 'phone', true), true);
    assert.equal(isHiddenOn(['mobile-app'], 'tablet', true), true);
    assert.equal(isHiddenOn(['mobile-app'], 'phone', false), false);
    assert.equal(isHiddenOn(['desktop', 'mobile-app'], 'desktop', false), true);
});
