import { test } from 'node:test';
import assert from 'node:assert/strict';
import { breakpointFor, getMediaMatcher } from './media-breakpoint.ts';

const BREAKPOINTS = [1536, 1280, 1024, 768, 640];
/** A browser whose viewport is `viewport` wide, scrollbar included. */
const browser = (viewport: number) => (minWidth: number) => viewport >= minWidth;

test('without media queries the measured width decides', () => {
    assert.equal(breakpointFor(1024, BREAKPOINTS), 1024);
    assert.equal(breakpointFor(1023, BREAKPOINTS), 768);
    assert.equal(breakpointFor(639, BREAKPOINTS), 0);
    assert.equal(breakpointFor(2000, BREAKPOINTS), 1536);
    assert.equal(breakpointFor(700, [640, 1024, 768]), 640, 'any order');
});

test('with a scrollbar the media queries decide, as for CSS', () => {
    // a 1030px window with a 15px scrollbar: the content is 1015px wide, CSS is at lg
    assert.equal(breakpointFor(1015, BREAKPOINTS, browser(1030)), 1024);
    assert.equal(breakpointFor(1015, BREAKPOINTS), 768, 'the width alone is a tier behind');
    assert.equal(breakpointFor(1008, BREAKPOINTS, browser(1023)), 768);
    assert.equal(breakpointFor(630, BREAKPOINTS, browser(645)), 640);
    assert.equal(breakpointFor(600, BREAKPOINTS, browser(615)), 0);
});

test('no media queries outside a browser', () => {
    assert.equal(getMediaMatcher(), null);
});
