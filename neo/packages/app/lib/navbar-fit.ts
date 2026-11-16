/**
 * How many of the header bar's tabs stay in the bar, the rest going into More, as UNA's main menu decides it
 * (inc/js/classes/BxDolMenuMoreAuto.js, `_compute`). No app imports, so
 * `node --test packages/app/lib/navbar-fit.test.ts` runs it from the NEO root.
 */
export type NavbarFitInput = {
    /** Each tab's natural width (px), in the bar's order. */
    widths: number[];
    /** The bar's width (px). 0 or less: not measured yet, every tab stays. */
    available: number;
    /** Space between tabs (px). */
    gap: number;
    /** More's width (px). */
    more: number;
    /** The first this many tabs never go into More: the menu's "Persistent items" in Studio (`persistent`). */
    persistent?: number;
    /** More shows anyway (it has items of its own: the site menu's groups, the launcher's apps). */
    moreAlways?: boolean;
};

const EPSILON = 0.5;

/**
 * Every tab when all of them fit (beside More, when More shows anyway). Otherwise the persistent tabs, then the
 * next ones in order while they fit beside More; from the first that doesn't, the rest go into More.
 */
export function navbarTabsThatFit({ widths, available, gap, more, persistent = 0, moreAlways = false }: NavbarFitInput): number {
    const count = widths.length;
    if (available <= 0 || count === 0) return count;

    const all = widths.reduce((sum, width) => sum + width, 0) + gap * Math.max(0, count - 1);
    const withMore = moreAlways ? gap + more : 0;
    if (all + withMore <= available + EPSILON) return count;

    const kept = Math.max(0, Math.floor(persistent));
    let used = more;
    let fit = 0;
    for (let i = 0; i < count; i++) {
        const share = (widths[i] ?? 0) + gap;
        if (i >= kept && used + share > available + EPSILON) break;
        used += share;
        fit++;
    }
    return fit;
}
