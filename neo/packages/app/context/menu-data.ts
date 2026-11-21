// packages/app/context/menu-data.js
import { create } from 'zustand';
import { filterHiddenOn, getDataForMenu, isWeb } from 'app/lib/util';
import { useScreenTier } from 'app/context/measure';
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { isMenuOf, menuToRemember, rememberedMenuData, rememberedMenuKey, shouldForgetMenu } from 'app/lib/menu-remember';
import { persistedGetSync, persistedRemove, persistedSet } from 'app/lib/util/storage';

/** Menu object id (string) or a UNA menu request object. */
export type MenuObject = string | Record<string, unknown>;

type MenuEntry = {
    /** Menu payload, or `false` while missing / after a failed first load. */
    data: any;
    fetched: boolean;
    loading: boolean;
    promise: Promise<any> | null;
    error?: unknown;
};

type MenuDataStore = {
    menus: Record<string, MenuEntry>;
    /** Counts the times the menus were dropped for another viewer (`setMenuViewer`): loaded menus then load again. */
    epoch: number;
    /** Load (or reuse) a menu; `force` refetches. Resolves to the data or `false`. */
    fetchMenu: (object: MenuObject, force?: boolean) => Promise<any>;
};

/**
 * Menus the web server fetched with the page (guests only, see apps/next/lib/una-shared-data),
 * keyed by menu object. Server and first client render read them from here, so both draw the
 * same menu; `seedMenuData` puts them in the store on the client, so nothing fetches them again.
 */
export const InitialMenusContext = createContext<Record<string, any> | null>(null);

export const useMenuDataStore = create<MenuDataStore>()((set, get) => ({
    menus: {},
    epoch: 0,

    fetchMenu: async (object, force = false) => {
        const key = typeof object === 'string' ? object : JSON.stringify(object);
        const existing = get().menus[key];
        if (existing?.data && !force) return existing.data;
        if (existing?.promise && !force) return existing.promise;

        // A reply that arrives after the viewer changed is the previous viewer's menu: it is not stored.
        const epoch = get().epoch;
        const promise: Promise<any> = getDataForMenu({ object, params: null }, (data: any) => data)
            .then((data: any) => {
                if (get().epoch !== epoch) return data;
                set((state) => ({
                    menus: {
                        ...state.menus,
                        [key]: { data, fetched: true, loading: false, promise: null },
                    },
                }));
                return data;
            })
            .catch((error: unknown) => {
                if (get().epoch !== epoch) return false;
                set((state) => ({
                    menus: {
                        ...state.menus,
                        [key]: {
                            data: existing?.data ?? false,
                            fetched: true,
                            loading: false,
                            promise: null,
                            error,
                        },
                    },
                }));
                return existing?.data ?? false;
            });

        set((state) => ({
            menus: {
                ...state.menus,
                [key]: {
                    data: existing?.data ?? false,
                    fetched: Boolean(existing?.data),
                    loading: true,
                    promise,
                    error: null,
                },
            },
        }));

        return promise;
    },
}));

/** Client only: store menus the server sent with the page. Menus already loaded stay. */
export function seedMenuData(menus: Record<string, any> | null | undefined): void {
    if (!menus || typeof window === 'undefined') return;
    const current = useMenuDataStore.getState().menus;
    const missing = Object.keys(menus).filter((key) => menus[key] && !current[key]?.data);
    if (!missing.length) return;
    useMenuDataStore.setState((state) => {
        const next = { ...state.menus };
        missing.forEach((key) => {
            next[key] = { data: menus[key], fetched: true, loading: false, promise: null };
        });
        return { menus: next };
    });
}

let menuViewer: string | null = null;

/**
 * Native apps: who the loaded menus are for (`user-<id>`, `guest`). UNA answers a menu for the session's viewer, so
 * when the viewer changes (signing in or out, switching the profile) the loaded menus are dropped and the mounted
 * ones load again. The first viewer of the app run drops nothing.
 */
export function setMenuViewer(viewer: string): void {
    const previous = menuViewer;
    menuViewer = viewer;
    if (previous === null || previous === viewer) return;
    useMenuDataStore.setState((state) => ({ menus: {}, epoch: state.epoch + 1 }));
}

/** A loaded (or server-sent) menu's data, read outside React; null when there is none yet. */
export function getLoadedMenuData(object: string): any {
    return useMenuDataStore.getState().menus[object]?.data || null;
}

/** Whose each loaded menu is: the viewer it was first seen with (`isMenuOf`, lib/menu-remember.ts). */
const menuOwners = new WeakMap<object, string>();

export type MenuDataOptions = {
    /**
     * Web: keep the member's copy of this menu on the device and draw it at once on the next visit, until UNA answers
     * (`menuViewerKey(currentUser)`, lib/menu-remember.ts). For menus only the client draws for a member, such as the
     * header's: a copy is read in the first render, which the server's HTML must not differ from.
     */
    rememberFor?: string | null;
};

export const useMenuData = (object: MenuObject | null | undefined, options: MenuDataOptions = {}) => {
    const key = typeof object === 'string' ? object : JSON.stringify(object);
    const initial = useContext(InitialMenusContext);
    const seeded = object && typeof object === 'string' ? initial?.[object] : undefined;
    const loaded = useMenuDataStore((state) => state.menus[key]?.data ?? false);
    const viewer = isWeb && object && typeof object === 'string' ? options.rememberFor ?? null : null;
    // The member's copy from the last visit: shown until UNA answers, then replaced.
    const remembered = useMemo(
        () => (viewer ? rememberedMenuData(persistedGetSync(rememberedMenuKey(key)), viewer) : null),
        [key, viewer]
    );
    const data = loaded || seeded || remembered || false;
    const isLoading = useMenuDataStore((state) => state.menus[key]?.loading ?? false);
    const isFetched = useMenuDataStore((state) => state.menus[key]?.fetched ?? false) || !!seeded;
    const fetchMenu = useMenuDataStore((state) => state.fetchMenu);
    const epoch = useMenuDataStore((state) => state.epoch);
    const tier = useScreenTier();

    useEffect(() => {
        if (object) fetchMenu(object);
    }, [object, fetchMenu, epoch]);

    // UNA's answer replaces the copy; someone else's copy goes (another member, or the member signed out). Only a menu
    // that arrived for this viewer is kept: one loaded before the viewer changed without a page load (a visitor's,
    // which the server may have sent with the page, or the previous profile's) stays the other viewer's.
    useEffect(() => {
        if (!viewer) return;
        const storageKey = rememberedMenuKey(key);
        const own = loaded && loaded !== seeded && isMenuOf(menuOwners, loaded, viewer);
        const copy = own ? menuToRemember(viewer, loaded) : null;
        if (copy) void persistedSet(storageKey, copy);
        else if (shouldForgetMenu(persistedGetSync(storageKey), viewer)) void persistedRemove(storageKey);
    }, [viewer, key, loaded, seeded]);

    const refetch = useCallback(() => {
        if (object) fetchMenu(object, true);
    }, [object, fetchMenu]);

    // Items UNA hides on this screen tier never reach the menus.
    const menuData = data?.items ? { ...data, items: filterHiddenOn(data.items, tier) } : data;

    return { menuData, isFetched, isLoading, refetch };
};
