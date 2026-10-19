/// <reference types="node" />
// Run with `node --test packages/app/lib/block-bg-classes.test.ts` from the NEO root (Node 24 strips the types).
import assert from 'node:assert/strict';
import test from 'node:test';
import { buildBlockBgClasses } from './block-bg-classes.ts';

// The default theme (settings/theme/elements.js u-block-bg / u-block-bg-solid, responsive-classes `bg` off).
const theme = {
    on: ' bg-card/60 shadow-block-outline dark:shadow-block-outline-deep ',
    solidFill: 'bg-card',
    off: 'bg-transparent shadow-none dark:shadow-none',
};

test('without solid, a background on every tier is the theme fill', () => {
    assert.equal(buildBlockBgClasses(true, false, theme), 'bg-card/60 shadow-block-outline dark:shadow-block-outline-deep');
});

test('without solid, a background from tablet up is what the bg preset gave', () => {
    assert.equal(
        buildBlockBgClasses(['tablet', 'desktop'], false, theme),
        'bg-transparent shadow-none dark:shadow-none sm:bg-card/60 sm:shadow-block-outline sm:dark:shadow-block-outline-deep',
    );
});

test('solid on phones turns translucent from tablet up', () => {
    assert.equal(
        buildBlockBgClasses(true, ['mobile'], theme),
        'bg-card shadow-block-outline dark:shadow-block-outline-deep sm:bg-card/60 sm:shadow-block-outline sm:dark:shadow-block-outline-deep',
    );
});

test('solid everywhere swaps only the fill', () => {
    assert.equal(buildBlockBgClasses(true, true, theme), 'bg-card shadow-block-outline dark:shadow-block-outline-deep');
});

test('a background that turns off on desktop clears the fill and outline there', () => {
    assert.equal(
        buildBlockBgClasses(['mobile', 'tablet'], ['mobile'], theme),
        'bg-card shadow-block-outline dark:shadow-block-outline-deep sm:bg-card/60 sm:shadow-block-outline sm:dark:shadow-block-outline-deep lg:bg-transparent lg:shadow-none lg:dark:shadow-none',
    );
});

test('solid on a tier without background has no effect', () => {
    assert.equal(
        buildBlockBgClasses(['tablet', 'desktop'], ['mobile'], theme),
        buildBlockBgClasses(['tablet', 'desktop'], false, theme),
    );
});

test('no background, no classes', () => {
    assert.equal(buildBlockBgClasses(false, ['mobile'], theme), '');
});
