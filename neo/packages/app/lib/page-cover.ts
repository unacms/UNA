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
 * Whether the page's cover, and the page title that follows it, is hidden on this screen size:
 * `cover_hidden_on` (Studio → Pages → page → Cover hidden on: phone, tablet, desktop, mobile-app).
 * The native apps count as the mobile app as well as their screen size, as UNA's mobile app does.
 */
export function isPageCoverHiddenOn(hiddenOn: unknown, tier: string, isApp: boolean): boolean {
    if (!Array.isArray(hiddenOn)) return false;
    return hiddenOn.includes(tier) || (isApp && hiddenOn.includes('mobile-app'));
}
