/// <reference types="node" />
// Run with `node --test packages/app/lib/block-bg-classes.test.ts` from the NEO root (Node 24 strips the types).
import assert from 'node:assert/strict';
import test from 'node:test';
import { buildBlockBgClasses } from './block-bg-classes.ts';

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
