import { useEffect } from 'react';
import { create } from 'zustand';
import { appSetting, filterHiddenOn, findIconFromRemote, getDataForMenu, normalizeMenuItemHref, screenTierOf, strToObj } from 'app/lib/util';
import { useMeasureStore } from 'app/context/measure';
import { persistedGet, persistedSet } from 'app/lib/util/storage';

/**
 * Tab bar items (web bottom bar, native tabs and their More menu).
 *
 * `menu_items.menu_tabbar_logged` / `menu_tabbar_non_logged` pin them. Unset,
 * they come from UNA's tab bar menu (`menu_items.objects.tabbar`), whose item
 * visibility decides what guests and members see.
 *
 * Each viewer keeps the first list shown to them for the whole app run: tab
 * pages and their history belong to the tab they opened in, so a label must
 * not change under them. That list is the viewer's copy saved on the device
 * by the previous run, else UNA's answer, else (UNA silent for a while, as on
 * a first run offline) a minimal built-in set. UNA's answer always refreshes
 * the saved copy, so a changed menu shows from the next run.
 */

export type TabBarItem = {
    key: string;
    title: string;
    /** Page url; `{profile}` is the viewer's own profile (drawn as the avatar). */
    url: string;
    name?: string;
    icon?: string;
    /** Counter shown on the tab: `friends`, `messenger` or `notifications`. */
    badge?: string;
    animated?: boolean;
    [key: string]: unknown;
};

type TabBarContext = 'logged' | 'guest';

const SETTING_KEYS: Record<TabBarContext, string> = {
    logged: 'menu_tabbar_logged',
    guest: 'menu_tabbar_non_logged',
};

const FALLBACK: Record<TabBarContext, TabBarItem[]> = {
    logged: [
        { key: '/tab0', title: 'Home', url: '/home', icon: 'House', animated: true },
        { key: '/tab1', title: 'Profile', url: '{profile}', icon: 'User' },
    ],
    guest: [
        { key: '/tab0', title: 'Home', url: '/home', icon: 'House', animated: true },
        { key: '/tab1', title: 'Log In', url: '/login', icon: 'UserRound' },
    ],
};

/** How long a viewer without a saved copy waits for UNA before the built-in set. */
const FALLBACK_AFTER_MS = 5000;

const GUEST_KEY = 'guest';

const contextOf = (currentUser: any): TabBarContext => (currentUser?.id ? 'logged' : 'guest');

const viewerKeyOf = (currentUser: any) => (currentUser?.id ? `user-${currentUser.id}` : GUEST_KEY);

const storageKey = (viewerKey: string) => `tabbar-menu-${viewerKey}`;

function staticTabList(context: TabBarContext): TabBarItem[] | null {
    const list = appSetting('menu_items', SETTING_KEYS[context]);
    return Array.isArray(list) && list.length ? list : null;
}

const parseConfig = (config: unknown): Record<string, any> | null => {
    if (!config) return null;
    if (typeof config === 'object') return config as Record<string, any>;
    return typeof config === 'string' ? strToObj(config) : null;
};

/**
 * UNA menu items → tab bar items. The `profile` item (or `{"profile": true}`
 * in its App config) is the viewer's profile; `{"badge": "friends"}` in the
 * App config puts a counter on the tab.
 */
export function tabBarItemsFromMenu(items: unknown): TabBarItem[] {
    const out: TabBarItem[] = [];
    (Array.isArray(items) ? items : []).forEach((item: any) => {
        if (!item) return;
        const config = parseConfig(item.config);
        const url = item.name === 'profile' || config?.profile ? '{profile}' : normalizeMenuItemHref(item.link);
        if (!url) return;
        out.push({
            key: `/tab${out.length}`,
            name: item.name,
            title: item.title || '',
            url,
            icon: findIconFromRemote(item.icon) || 'Circle',
            ...(config?.badge ? { badge: config.badge } : {}),
            animated: true,
        });
    });
    return out;
}

type TabBarMenuStore = {
    /** Lists by viewer (`user-<id>` / `guest`), set once per app run. */
    lists: Record<string, TabBarItem[]>;
    /** The member whose list the logged-in context uses. */
    loggedKey: string | null;
};

const useTabBarMenuStore = create<TabBarMenuStore>()(() => ({ lists: {}, loggedKey: null }));

/** Show `list` to the viewer unless they already have one this run. */
const showOnce = (viewerKey: string, list: TabBarItem[]) =>
    useTabBarMenuStore.setState((state) => (state.lists[viewerKey]
        ? state
        : { lists: { ...state.lists, [viewerKey]: list } }));

/** One load per viewer per app run: the menu depends on who is signed in. */
const loads = new Map<string, Promise<void>>();

function loadTabBarMenu(context: TabBarContext, viewerKey: string): Promise<void> {
    if (context === 'logged') useTabBarMenuStore.setState({ loggedKey: viewerKey });
    if (staticTabList(context)) return Promise.resolve();
    const existing = loads.get(viewerKey);
    if (existing) return existing;

    const timer = setTimeout(() => showOnce(viewerKey, FALLBACK[context]), FALLBACK_AFTER_MS);
    const promise = (async () => {
        try {
            const cached = await persistedGet(storageKey(viewerKey));
            if (Array.isArray(cached) && cached.length) {
                clearTimeout(timer);
                showOnce(viewerKey, cached);
            }
        } catch {
            // No saved copy: wait for UNA.
        }
        try {
            const data = await getDataForMenu({ object: appSetting('menu_items', 'objects', 'tabbar'), params: null });
            // Screen tier at load: the list stays for the run, keys follow positions.
            const tier = screenTierOf(useMeasureStore.getState().windowWidth);
            const list = tabBarItemsFromMenu(filterHiddenOn(data?.items, tier));
            if (list.length) {
                showOnce(viewerKey, list);
                persistedSet(storageKey(viewerKey), list).catch(() => {});
            }
        } catch {
            // Offline or UNA refused: the saved copy or the built-in set stays.
        }
        clearTimeout(timer);
        showOnce(viewerKey, FALLBACK[context]);
    })();
    loads.set(viewerKey, promise);
    return promise;
}

function listFor(context: TabBarContext, viewerKey: string | null): TabBarItem[] {
    return staticTabList(context)
        ?? (viewerKey ? useTabBarMenuStore.getState().lists[viewerKey] : undefined)
        ?? FALLBACK[context];
}

/**
 * Tab list for guests or members, read synchronously (navigation helpers).
 * Members: the list of the member signed in last.
 */
export function getTabListFor(logged: boolean): TabBarItem[] {
    return logged
        ? listFor('logged', useTabBarMenuStore.getState().loggedKey)
        : listFor('guest', GUEST_KEY);
}

/** Tab list for this viewer, read synchronously. */
export function getTabListForUser(currentUser: any): TabBarItem[] {
    return listFor(contextOf(currentUser), viewerKeyOf(currentUser));
}

/**
 * Tab list for this viewer; re-renders once their list is known. `ready` is
 * false until then (the web bar draws placeholders, native tabs wait). Server
 * and first client render agree: both start without the list.
 */
export function useTabList(currentUser: any): { tabList: TabBarItem[]; ready: boolean } {
    const context = contextOf(currentUser);
    const viewerKey = viewerKeyOf(currentUser);
    const pinned = staticTabList(context);
    const own = useTabBarMenuStore((state) => state.lists[viewerKey]);

    useEffect(() => {
        if (!pinned) void loadTabBarMenu(context, viewerKey);
    }, [pinned, context, viewerKey]);

    return { tabList: pinned ?? own ?? FALLBACK[context], ready: !!pinned || !!own };
}
