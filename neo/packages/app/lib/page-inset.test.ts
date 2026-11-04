import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sidePaddingTiers } from './page-inset.ts';

test('padding on every tier', () => {
    assert.equal(sidePaddingTiers(' p-4 '), true);
    assert.equal(sidePaddingTiers('px-4 py-2'), true);
});

test('no side padding', () => {
    assert.equal(sidePaddingTiers(''), false);
    assert.equal(sidePaddingTiers('py-4'), false);
    assert.equal(sidePaddingTiers('p-0'), false);
});

test('padding from a breakpoint up', () => {
    assert.deepEqual(sidePaddingTiers('sm:p-4'), ['tablet', 'desktop']);
    assert.deepEqual(sidePaddingTiers('p-0 lg:px-6'), ['desktop']);
});

test('padding turned off from a breakpoint up', () => {
    assert.deepEqual(sidePaddingTiers('px-4 lg:px-0'), ['mobile', 'tablet']);
});

test('other variants are ignored', () => {
    assert.equal(sidePaddingTiers('dark:p-0 md:p-0 p-4'), true);
    assert.deepEqual(sidePaddingTiers('sm:dark:p-4 lg:p-4'), ['desktop']);
});
