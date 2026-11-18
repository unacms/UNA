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

/** The width of a row of tabs `gap` apart. */
export function navbarRowWidth(widths: number[], gap: number): number {
    return widths.reduce((sum, width) => sum + width, 0) + gap * Math.max(0, widths.length - 1);
}

/**
 * Where the row of tabs (`total` wide) starts in the bar (`available` wide), from the bar's left edge, for the main
 * menu's place in the header (UNA's Designer > Settings > Header): next to the logo (`start`), next to the toolbar
 * (`end`), or in the middle (`center`). In the middle it is centred on the header, `centre` px from the bar's left edge,
 * as far as the bar leaves room: the logo and the toolbar are not as wide, so the bar itself is off-centre. Without
 * `centre` it is centred in the bar, as CSS centres it (a row wider than the bar overflows evenly on both sides).
 */
export function navbarRowStart(align: string, available: number, total: number, centre?: number | null): number {
    const free = available - total;
    if (align === 'start') return 0;
    if (align === 'end') return free;
    if (typeof centre !== 'number' || !Number.isFinite(centre) || free <= 0) return free / 2;
    return Math.min(Math.max(centre - total / 2, 0), free);
}

/**
 * Where tab `index` sits in the bar, whose tabs (`widths`, `gap` apart) start `start` px from its left edge (centred in
 * its `available` width when not given): its left edge from the bar's and its width.
 */
export function navbarTabBox(widths: number[], index: number, available: number, gap: number, start?: number): { x: number; width: number } {
    let x = typeof start === 'number' ? start : (available - navbarRowWidth(widths, gap)) / 2;
    for (let i = 0; i < index; i++) x += (widths[i] ?? 0) + gap;
    return { x, width: widths[index] ?? 0 };
}
