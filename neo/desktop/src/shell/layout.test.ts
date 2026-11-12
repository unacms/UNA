import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { DETAIL_MIN, detailFadesIn, LIST_MAX, LIST_MIN, listMax, panesMode } from './layout';

describe('the detail aside', () => {
    it('goes beside the content from 760px of panes, over it below', () => {
        expect(panesMode(LIST_MIN + DETAIL_MIN)).toBe('three');
        expect(panesMode(LIST_MIN + DETAIL_MIN - 1)).toBe('cover');
        // not measured yet (the first frame): beside, as a wide window has it
        expect(panesMode(null)).toBe('three');
    });

    it('keeps at least its smallest width beside a remembered list width, in a 760 to 1000px panes area', () => {
        for (const panes of [760, 800, 880, 1000]) {
            const list = Math.min(LIST_MAX, listMax(panes));
            expect(list).toBeGreaterThanOrEqual(LIST_MIN);
            expect(panes - list, `${panes}px`).toBeGreaterThanOrEqual(DETAIL_MIN);
        }
        expect(listMax(1400)).toBe(LIST_MAX);
    });

    it('fades in only in a window that is shown and focused: WebKit holds the fade at opacity 0 in a hidden or background one', () => {
        expect(detailFadesIn({ visibilityState: 'visible', hasFocus: () => true })).toBe(true);
        expect(detailFadesIn({ visibilityState: 'visible', hasFocus: () => false })).toBe(false);
        expect(detailFadesIn({ visibilityState: 'hidden', hasFocus: () => true })).toBe(false);
    });

    it('fades the detail in only where the window let it start (data-enter), never on every detail shown', () => {
        const css = readFileSync('src/styles.css', 'utf8');
        const rules = [...css.matchAll(/([^{}]*\.pane-slot-detail[^{}]*)\{[^}]*animation:\s*(aside-in|cover-in)/g)].map((m) => m[1]!.trim());
        expect(rules.length).toBe(2);
        for (const selector of rules) expect(selector).toContain('[data-enter]');
    });
});
