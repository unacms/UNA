/**
 * Whether a UNA page shows its cover to this viewer: `sys_objects_page.cover`, sent as the page's
 * `cover` (Studio → Pages → page → Cover). No app imports, so
 * `node --test packages/app/lib/page-cover.test.ts` runs it from the NEO root.
 *
 * 0 disabled, 1 enabled for all, 2 for visitors only, 3 for members only. UNA sends a
 * boolean when a page sets its cover in code (`setPageCover`).
 */
export function isPageCoverShown(cover: unknown, isMember: boolean): boolean {
    if (typeof cover === 'boolean') return cover;
    switch (Number(cover)) {
        case 1:
            return true;
        case 2:
            return !isMember;
        case 3:
            return isMember;
        default:
            return false;
    }
}

/**
 * Whether the page's cover is hidden on this screen size (its title has its own, isPageTitleHiddenOn):
 * `cover_hidden_on` (Studio → Pages → page → Cover hidden on: phone, tablet, desktop, mobile-app).
 * The native apps count as the mobile app as well as their screen size, as UNA's mobile app does.
 */
export function isPageCoverHiddenOn(hiddenOn: unknown, tier: string, isApp: boolean): boolean {
    if (!Array.isArray(hiddenOn)) return false;
    return hiddenOn.includes(tier) || (isApp && hiddenOn.includes('mobile-app'));
}

/** The page fields the title settings come in (UNA's page JSON). */
export type PageTitleSettings = {
    cover?: unknown;
    cover_hidden_on?: unknown;
    title_show?: unknown;
    title_hidden_on?: unknown;
} | null | undefined;

/**
 * Whether a UNA page shows its title to this viewer, with or without its cover: `title_show`
 * (Studio → Pages → page → Title), the same values as `cover`. An older UNA sends none: its
 * title follows the cover.
 */
export function isPageTitleShown(page: PageTitleSettings, isMember: boolean): boolean {
    const mode = page?.title_show ?? page?.cover;
    return isPageCoverShown(mode, isMember);
}

/**
 * Whether the page's title is hidden on this screen size: `title_hidden_on` (Studio → Pages → page →
 * Title hidden on). An older UNA sends none: the title follows the cover's `cover_hidden_on`.
 */
export function isPageTitleHiddenOn(page: PageTitleSettings, tier: string, isApp: boolean): boolean {
    const hiddenOn = page?.title_hidden_on ?? page?.cover_hidden_on;
    return isPageCoverHiddenOn(hiddenOn, tier, isApp);
}

/** Both: the page's title shows to this viewer on this screen size (in the apps when `isApp`). */
export function isPageTitleOn(page: PageTitleSettings, isMember: boolean, tier: string, isApp: boolean): boolean {
    return isPageTitleShown(page, isMember) && !isPageTitleHiddenOn(page, tier, isApp);
}
