import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPageCoverShown } from './page-cover.ts';

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
