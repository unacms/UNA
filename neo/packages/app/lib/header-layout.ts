/**
 * The desktop header's width and where its main menu sits, as UNA's Designer sets them per page layout (Designer >
 * Settings > Header) and sends them with each page (`header` of the page JSON, `BxDolTemplate::getHeaderLayout`).
 * No app imports, so `node --test packages/app/lib/header-layout.test.ts` runs it from the NEO root.
 */
export type HeaderWidth = 'page' | 'full';
export type HeaderAlign = 'start' | 'center' | 'end';
export type HeaderLayout = { width: HeaderWidth; align: HeaderAlign };

const WIDTHS: readonly HeaderWidth[] = ['page', 'full'];
const ALIGNS: readonly HeaderAlign[] = ['start', 'center', 'end'];

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
