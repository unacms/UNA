/**
 * The layout breakpoint for a window, the way CSS picks it. Tailwind's `sm:` / `lg:` are media queries, and a media
 * query measures the viewport with its scrollbar; the window width the apps measure (`useWindowDimensions`) is without
 * it. With a classic 15px scrollbar a 1030px window is `lg` for CSS and 1015px, below `lg`, for the measured width, so
 * what the code picks by tier (the header's logo or the page title) disagreed with what classes pick (the site menu,
 * the section's tab row) for those 15px. Where the browser can answer the same media queries, they decide; elsewhere
 * (native, SSR) the width does.
 */
export type MediaMatcher = (minWidth: number) => boolean;

/** Largest of `values` (px) the window reaches; 0 below the smallest. */
export function breakpointFor(width: number, values: readonly number[], matches?: MediaMatcher | null): number {
    const desc = [...values].sort((a, b) => b - a);
    for (const value of desc) {
        if (matches ? matches(value) : width >= value) return value;
    }
    return 0;
}

/** The browser's media queries, or null where there are none (native, SSR). */
export function getMediaMatcher(): MediaMatcher | null {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
    return (minWidth) => window.matchMedia(`(min-width: ${minWidth}px)`).matches;
}
