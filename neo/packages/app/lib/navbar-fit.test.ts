import { test } from 'node:test';
import assert from 'node:assert/strict';
import { navbarTabBox, navbarTabsThatFit } from './navbar-fit.ts';

// The header at 1440px: Home, People, Posts, Orgs, Albums, Market (as both clients measure them), 8px apart, More 44px.
const TABS = [104, 111, 101, 96, 116, 112];
const base = { widths: TABS, gap: 8, more: 44 };
const ALL = TABS.reduce((sum, width) => sum + width, 0) + 8 * (TABS.length - 1);

test('every tab stays when all of them fit, and More goes', () => {
    assert.equal(navbarTabsThatFit({ ...base, available: ALL }), 6);
    assert.equal(navbarTabsThatFit({ ...base, available: 2000 }), 6);
});

test('a More that shows anyway needs its own room', () => {
    assert.equal(navbarTabsThatFit({ ...base, available: ALL, moreAlways: true }), 5);
    assert.equal(navbarTabsThatFit({ ...base, available: ALL + 8 + 44, moreAlways: true }), 6);
});

test('the tabs that fit beside More stay, in order, the rest go into More', () => {
    // 44 More + Home 112 + People 119 + Posts 109 + Orgs 104 = 488 (each with its 8px)
    assert.equal(navbarTabsThatFit({ ...base, available: 488 }), 4);
    assert.equal(navbarTabsThatFit({ ...base, available: 487 }), 3);
});

test('once a tab goes into More, the ones after it go too, however narrow', () => {
    assert.equal(navbarTabsThatFit({ widths: [100, 300, 40], gap: 8, more: 44, available: 300 }), 1);
});

test('persistent tabs stay even when they do not fit', () => {
    assert.equal(navbarTabsThatFit({ ...base, available: 200, persistent: 3 }), 3);
    assert.equal(navbarTabsThatFit({ ...base, available: 488, persistent: 2 }), 4);
    assert.equal(navbarTabsThatFit({ ...base, available: 100, persistent: 0 }), 0);
});

test('an unmeasured bar keeps every tab', () => {
    assert.equal(navbarTabsThatFit({ ...base, available: 0 }), 6);
    assert.equal(navbarTabsThatFit({ ...base, widths: [], available: 500 }), 0);
});

test('a tab sits where the centred row puts it', () => {
    // 100 + 8 + 50 + 8 + 44 = 210 in a 300px bar: the row starts at 45
    assert.deepEqual(navbarTabBox([100, 50, 44], 0, 300, 8), { x: 45, width: 100 });
    assert.deepEqual(navbarTabBox([100, 50, 44], 2, 300, 8), { x: 211, width: 44 });
    // a row wider than the bar overflows evenly on both sides
    assert.deepEqual(navbarTabBox([200, 200], 0, 300, 8), { x: -54, width: 200 });
});
