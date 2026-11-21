/**
 * A member's menu kept on the device between visits, so a page that loads again draws it at once instead of
 * placeholders, and refreshes it when UNA answers (context/menu-data.ts, `useMenuData(object, { rememberFor })`).
 * One copy per menu, for one viewer: UNA answers a menu for the session's viewer, so another member's copy is never
 * shown, and it is dropped when the viewer changes or signs out.
 * No app imports, so `node --test packages/app/lib/menu-remember.test.ts` runs it from the NEO root.
 */
export type RememberedMenu = { viewer: string; data: unknown };

/** The viewer for whom nothing is kept: a visitor's menus come with the page from the server. */
export const MENU_VIEWER_GUEST = 'guest';

/** Who the menus are for: `user-<id>` for a member, `guest` for a visitor, null while the viewer is not known. */
export function menuViewerKey(currentUser: unknown): string | null {
    if (currentUser === false) return MENU_VIEWER_GUEST;
    const id = currentUser && typeof currentUser === 'object' ? (currentUser as { id?: unknown }).id : null;
    return typeof id === 'number' || (typeof id === 'string' && id !== '') ? `user-${id}` : null;
}

/** The storage key of a menu's copy. */
export function rememberedMenuKey(object: string): string {
    return `menu-${object}`;
}

function isRemembered(stored: unknown): stored is RememberedMenu {
    return !!stored && typeof stored === 'object'
        && typeof (stored as RememberedMenu).viewer === 'string'
        && !!(stored as RememberedMenu).data && typeof (stored as RememberedMenu).data === 'object';
}

/** The menu to draw from what storage holds: the viewer's own copy, else null. */
export function rememberedMenuData(stored: unknown, viewer: string | null): unknown {
    if (!viewer || viewer === MENU_VIEWER_GUEST || !isRemembered(stored)) return null;
    return stored.viewer === viewer ? stored.data : null;
}

/** What to keep once UNA answered: the member's menu; null for a visitor, an unknown viewer or an empty answer. */
export function menuToRemember(viewer: string | null, data: unknown): RememberedMenu | null {
    if (!viewer || viewer === MENU_VIEWER_GUEST || !data || typeof data !== 'object') return null;
    return { viewer, data };
}

/** Whether what storage holds must go: it is someone else's (a visitor has none), or not a copy at all. */
export function shouldForgetMenu(stored: unknown, viewer: string | null): boolean {
    if (stored == null || !viewer) return false;
    return !isRemembered(stored) || stored.viewer !== viewer;
}

/**
 * Whose menu `data` is: the viewer it was first seen with. UNA answers a menu for the session's viewer, and the
 * loaded menus outlive a change of viewer without a page load (signing in from a visitor's page, switching the
 * profile), so a menu already loaded when the viewer changes is the previous viewer's, never the new one's: it is
 * not kept for them. `owners` holds what was seen (one WeakMap per app run).
 */
export function isMenuOf(owners: WeakMap<object, string>, data: unknown, viewer: string | null): boolean {
    if (!viewer || !data || typeof data !== 'object') return false;
    const owner = owners.get(data);
    if (owner === undefined) {
        owners.set(data, viewer);
        return true;
    }
    return owner === viewer;
}
