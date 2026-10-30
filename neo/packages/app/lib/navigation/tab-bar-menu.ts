import { useEffect } from 'react';
import { create } from 'zustand';
import { appSetting, findIconFromRemote, getDataForMenu, normalizeMenuItemHref, strToObj } from 'app/lib/util';
import { persistedGet, persistedSet } from 'app/lib/util/storage';

/**
 * Tab bar items (web bottom bar, native tabs and their More menu).
 *
 * `menu_items.menu_tabbar_logged` / `menu_tabbar_non_logged` pin them. Unset,
 * they come from UNA's tab bar menu (`menu_items.objects.tabbar`), whose item
 * visibility decides what guests and members see. The last answer is kept on
 * the device, so a cold start draws the tabs at once; until the very first
 * answer a minimal built-in set keeps the bar from being empty.
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

const storageKey = (context: TabBarContext) => `tabbar-menu-${context}`;

const contextOf = (currentUser: any): TabBarContext => (currentUser?.id ? 'logged' : 'guest');

const sessionKeyOf = (currentUser: any) => (currentUser?.id ? `user-${currentUser.id}` : 'guest');

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
    lists: Partial<Record<TabBarContext, TabBarItem[]>>;
    /** The load finished, menu or not: the built-in set is final for now. */
    settled: Partial<Record<TabBarContext, boolean>>;
};

const useTabBarMenuStore = create<TabBarMenuStore>()(() => ({ lists: {}, settled: {} }));

const setList = (context: TabBarContext, list: TabBarItem[]) =>
    useTabBarMenuStore.setState((state) => ({ lists: { ...state.lists, [context]: list } }));

/** One load per viewer per app run: the menu depends on who is signed in. */
const loads = new Map<string, Promise<void>>();

function loadTabBarMenu(context: TabBarContext, sessionKey: string): Promise<void> {
    if (staticTabList(context)) return Promise.resolve();
    const existing = loads.get(sessionKey);
    if (existing) return existing;

    const promise = (async () => {
        try {
            const cached = await persistedGet(storageKey(context));
            if (Array.isArray(cached) && cached.length && !useTabBarMenuStore.getState().lists[context]) {
                setList(context, cached);
            }
        } catch {
            // No cache: the built-in set stays until UNA answers.
        }
        try {
            const data = await getDataForMenu({ object: appSetting('menu_items', 'objects', 'tabbar'), params: null });
            const list = tabBarItemsFromMenu(data?.items);
            if (list.length) {
                setList(context, list);
                persistedSet(storageKey(context), list).catch(() => {});
            }
        } catch {
            // Offline or UNA refused: keep the cached or built-in tabs.
        }
        useTabBarMenuStore.setState((state) => ({ settled: { ...state.settled, [context]: true } }));
    })();
    loads.set(sessionKey, promise);
    return promise;
}

/** Tab list for guests or members, read synchronously (navigation helpers). */
export function getTabListFor(logged: boolean): TabBarItem[] {
    const context: TabBarContext = logged ? 'logged' : 'guest';
    return staticTabList(context) ?? useTabBarMenuStore.getState().lists[context] ?? FALLBACK[context];
}

/** Tab list for this viewer, read synchronously. */
export function getTabListForUser(currentUser: any): TabBarItem[] {
    return getTabListFor(contextOf(currentUser) === 'logged');
}

/**
 * Tab list for this viewer; re-renders when UNA's menu arrives. `ready` is
 * false while the menu is still loading (the web bar draws placeholders); a
 * site without the menu, or a failed request, settles on the built-in set.
 * Server and first client render agree: both start without the menu.
 */
export function useTabList(currentUser: any): { tabList: TabBarItem[]; ready: boolean } {
    const context = contextOf(currentUser);
    const sessionKey = sessionKeyOf(currentUser);
    const pinned = staticTabList(context);
    const remote = useTabBarMenuStore((state) => state.lists[context]);
    const settled = useTabBarMenuStore((state) => !!state.settled[context]);

    useEffect(() => {
        if (!pinned) loadTabBarMenu(context, sessionKey);
    }, [pinned, context, sessionKey]);

    return { tabList: pinned ?? remote ?? FALLBACK[context], ready: !!pinned || !!remote || settled };
}
