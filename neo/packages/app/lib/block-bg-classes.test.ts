/// <reference types="node" />
// Run with `node --test packages/app/lib/block-bg-classes.test.ts` from the NEO root (Node 24 strips the types).
import assert from 'node:assert/strict';
import test from 'node:test';
import { buildBlockBgClasses, roundedTiersFromClasses } from './block-bg-classes.ts';

// The default theme (settings/theme/elements.js u-block-bg, responsive-classes `bg` off).
const theme = {
    on: ' bg-card/60 shadow-block-outline dark:shadow-block-outline-deep ',
    off: 'bg-transparent shadow-none dark:shadow-none',
};

test('a background on every tier is the theme fill', () => {
    assert.equal(buildBlockBgClasses(true, theme), 'bg-card/60 shadow-block-outline dark:shadow-block-outline-deep');
});

test('a background from tablet up starts transparent on phones', () => {
    assert.equal(
        buildBlockBgClasses(['tablet', 'desktop'], theme),
        'bg-transparent shadow-none dark:shadow-none sm:bg-card/60 sm:shadow-block-outline sm:dark:shadow-block-outline-deep',
    );
});

test('a background that turns off on desktop clears the fill and outline there', () => {
    assert.equal(
        buildBlockBgClasses(['mobile', 'tablet'], theme),
        'bg-card/60 shadow-block-outline dark:shadow-block-outline-deep lg:bg-transparent lg:shadow-none lg:dark:shadow-none',
    );
});

test('no background, no classes', () => {
    assert.equal(buildBlockBgClasses(false, theme), '');
});

test('a square block on phones gets the fill without the outline there', () => {
    assert.equal(
        buildBlockBgClasses(true, theme, ['tablet', 'desktop']),
        'bg-card/60 shadow-none dark:shadow-none sm:bg-card/60 sm:shadow-block-outline sm:dark:shadow-block-outline-deep',
    );
});

test('a block rounded everywhere keeps its outline everywhere', () => {
    assert.equal(buildBlockBgClasses(true, theme, true), 'bg-card/60 shadow-block-outline dark:shadow-block-outline-deep');
});

test('a block square everywhere has no outline anywhere', () => {
    assert.equal(buildBlockBgClasses(true, theme, []), 'bg-card/60 shadow-none dark:shadow-none');
});

test('a background from tablet up, rounded only on desktop, gets the outline on desktop', () => {
    assert.equal(
        buildBlockBgClasses(['tablet', 'desktop'], theme, ['desktop']),
        'bg-transparent shadow-none dark:shadow-none sm:bg-card/60 sm:shadow-none sm:dark:shadow-none lg:bg-card/60 lg:shadow-block-outline lg:dark:shadow-block-outline-deep',
    );
});

test('the tiers a corner class rounds', () => {
    assert.deepEqual(roundedTiersFromClasses('sm:rounded-2xl'), ['tablet', 'desktop']);
    assert.deepEqual(roundedTiersFromClasses('rounded-2xl'), ['mobile', 'tablet', 'desktop']);
    assert.deepEqual(roundedTiersFromClasses('rounded-none lg:rounded-2xl'), ['desktop']);
    assert.deepEqual(roundedTiersFromClasses(''), []);
});
