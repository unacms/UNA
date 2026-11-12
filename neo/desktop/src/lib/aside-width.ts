/**
 * The width of a page's side column (the site's side blocks beside a feed, a profile's panel):
 * one width for every page, which its divider changes (features/page-blocks/page-blocks.tsx),
 * remembered on this computer. Every page with side blocks follows a change at once.
 */
import { useSyncExternalStore } from 'react';

import { readStored, writeStored } from './storage';

export const ASIDE_DEFAULT = 320;
export const ASIDE_MIN = 240;
export const ASIDE_MAX = 560;
/** The main column keeps at least this much beside the side column. */
export const ASIDE_MAIN_MIN = 400;
const KEY = 'una-desktop-aside-width';

function read(): number {
    // nothing kept reads as 0, which is the default too
    const v = Number(readStored(KEY));
    return Number.isFinite(v) && v > 0 ? Math.min(Math.max(v, ASIDE_MIN), ASIDE_MAX) : ASIDE_DEFAULT;
}

let width = read();
const listeners = new Set<() => void>();

export function setAsideWidth(next: number): void {
    width = Math.round(Math.min(Math.max(next, ASIDE_MIN), ASIDE_MAX));
    writeStored(KEY, width === ASIDE_DEFAULT ? null : String(width));
    for (const l of listeners) l();
}

export function useAsideWidth(): number {
    return useSyncExternalStore(
        (l) => {
            listeners.add(l);
            return () => listeners.delete(l);
        },
        () => width,
    );
}

/**
 * The widest the side column may be in a page `pageWidth` px wide: what leaves the main column
 * ASIDE_MAIN_MIN beside it, its gap and the page's padding (`chrome`), within ASIDE_MAX.
 */
export function asideMax(pageWidth: number | null, chrome: number): number {
    if (pageWidth === null) return ASIDE_MAX;
    return Math.max(ASIDE_MIN, Math.min(ASIDE_MAX, pageWidth - chrome - ASIDE_MAIN_MIN));
}

/** Tests: forget the width. */
export function resetAsideWidth(): void {
    width = read();
}
