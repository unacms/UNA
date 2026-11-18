/**
 * The desktop header's width and where its main menu sits, as UNA's Designer sets them per page layout and audience
 * (Designer > Settings > Header) and sends them, resolved for the viewer, with each page (`header` of the page JSON, `BxDolTemplate::getHeaderLayout`).
 * No app imports, so `node --test packages/app/lib/header-layout.test.ts` runs it from the NEO root.
 */
export type HeaderWidth = 'page' | 'full';
export type HeaderAlign = 'start' | 'center' | 'end';
export type HeaderLayout = { width: HeaderWidth; align: HeaderAlign };

const WIDTHS: readonly HeaderWidth[] = ['page', 'full'];
const ALIGNS: readonly HeaderAlign[] = ['start', 'center', 'end'];

/** The page's layout: UNA's Application layout has a sidebar, the page's left column (`app/ui/molecules/sidebar/app-sidebar`). */
export type PageLayout = 'standard' | 'application';

const LAYOUTS: readonly PageLayout[] = ['standard', 'application'];

/**
 * The page's layout as UNA resolves it for the viewer (`header.layout` of the page JSON): the app's own setting wins
 * (`layout.page_layout`, null follows UNA), then the page's, then the one the previous page had, so a page whose data
 * has none yet keeps the shell as it is. Standard when nothing says otherwise.
 */
export function resolvePageLayout(fromUna: unknown, override?: unknown, previous?: PageLayout | null): PageLayout {
    const una = fromUna && typeof fromUna === 'object' ? (fromUna as { layout?: unknown }) : {};
    return pick(LAYOUTS, override, una.layout, previous) ?? 'standard';
}

/** The header before UNA sent one: full width, the tabs in the middle. */
export const HEADER_LAYOUT_DEFAULT: HeaderLayout = { width: 'full', align: 'center' };

function pick<T extends string>(allowed: readonly T[], ...values: unknown[]): T | undefined {
    return values.find((value): value is T => typeof value === 'string' && (allowed as readonly string[]).includes(value));
}

/**
 * The header to draw: the app's own setting wins (`layout.header.width` / `align`, null follows UNA), then the page's
 * from UNA, then the one the previous page had (a page whose data has none yet keeps the header as it is), then the
 * default. Unknown values are skipped.
 */
export function resolveHeaderLayout(fromUna: unknown, override?: { width?: unknown; align?: unknown } | null, previous?: HeaderLayout | null): HeaderLayout {
    const una = fromUna && typeof fromUna === 'object' ? (fromUna as { width?: unknown; align?: unknown }) : {};
    return {
        width: pick(WIDTHS, override?.width, una.width, previous?.width) ?? HEADER_LAYOUT_DEFAULT.width,
        align: pick(ALIGNS, override?.align, una.align, previous?.align) ?? HEADER_LAYOUT_DEFAULT.align,
    };
}

/**
 * The page's content width as a CSS `max-width`: the app's own setting wins (`layout.page_width`, null follows UNA:
 * a CSS length, or 'full'), then the page's from UNA (`page_width`: pixels, or 'full'), then the previous page's.
 * 'full' is `none`. null when there is none, so the theme's 1440px stays (`--container-8xl`, design/styles/global.css).
 */
export function resolvePageWidth(fromUna: unknown, override?: unknown, previous?: string | null): string | null {
    for (const value of [override, fromUna]) {
        if (value === 'full') return 'none';
        if (typeof value === 'number' && Number.isFinite(value) && value > 0) return `${Math.round(value)}px`;
        if (typeof value === 'string' && /^\d+$/.test(value) && Number(value) > 0) return `${Number(value)}px`;
        if (value === override && typeof value === 'string' && /^\d+(\.\d+)?(px|rem|em|vw|%)$/.test(value)) return value;
    }
    return previous ?? null;
}
