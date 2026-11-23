import { test } from 'node:test';
import assert from 'node:assert/strict';
import { navbarBoxWidth, navbarRowStart, navbarRowWidth, navbarTabBox, navbarTabPadding, navbarTabsThatFit, navbarUnfittedTabSide } from './navbar-fit.ts';

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

test('the row starts where the main menu is placed in the header', () => {
    // a 210px row in a 300px bar
    assert.equal(navbarRowWidth([100, 50, 44], 8), 210);
    assert.equal(navbarRowStart('start', 300, 210), 0);
    assert.equal(navbarRowStart('end', 300, 210), 90);
    assert.equal(navbarRowStart('center', 300, 210), 45);
});

test("the bar is as wide as all its tabs, with More's room when More shows anyway", () => {
    assert.equal(navbarBoxWidth({ ...base }), ALL);
    assert.equal(navbarBoxWidth({ ...base, moreAlways: true }), ALL + 8 + 44);
    assert.equal(navbarBoxWidth({ widths: [], gap: 8, more: 44, moreAlways: true }), 0);
    // in a bar that wide every tab fits, with or without More
    assert.equal(navbarTabsThatFit({ ...base, available: navbarBoxWidth({ ...base }) }), 6);
    assert.equal(navbarTabsThatFit({ ...base, moreAlways: true, available: navbarBoxWidth({ ...base, moreAlways: true }) }), 6);
});

// What the wrapping row shows on its first line: a tab takes its width plus More's room, less the room it takes back.
function firstLine(widths: number[], available: number, moreAlways: boolean): number {
    const reserve = 8 + 44;
    let used = 0;
    let fit = 0;
    for (let i = 0; i < widths.length; i++) {
        const side = navbarUnfittedTabSide(i, widths.length, moreAlways);
        const box = (widths[i] ?? 0) + (side.reserve ? reserve : 0) - (side.takeBack ? reserve : 0);
        if (used + (i ? 8 : 0) + box > available) break;
        used += (i ? 8 : 0) + box;
        fit++;
    }
    return fit;
}

test('the unfitted row breaks where the fit puts More', () => {
    for (const moreAlways of [false, true]) {
        for (let available = 60; available <= ALL + 120; available += 7) {
            assert.equal(
                firstLine(TABS, available, moreAlways),
                navbarTabsThatFit({ ...base, available, moreAlways }),
                `available ${available}, moreAlways ${moreAlways}`,
            );
        }
    }
});

test('a tab sits where its row starts', () => {
    assert.deepEqual(navbarTabBox([100, 50, 44], 1, 300, 8, 0), { x: 108, width: 50 });
    assert.deepEqual(navbarTabBox([100, 50, 44], 0, 300, 8, 90), { x: 90, width: 100 });
});

test('a tab is padded by what it shows: icon and label, label alone, icon alone', () => {
    assert.equal(navbarTabPadding(true, true), 'ps-3 pe-4');
    assert.equal(navbarTabPadding(false, true), 'px-4');
    assert.equal(navbarTabPadding(true, false), 'px-2.5');
});
