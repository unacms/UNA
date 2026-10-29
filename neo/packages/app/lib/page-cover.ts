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
