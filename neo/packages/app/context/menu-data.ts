// packages/app/context/menu-data.js
import { create } from 'zustand';
import { filterHiddenOn, getDataForMenu } from 'app/lib/util';
import { useScreenTier } from 'app/context/measure';
import { createContext, useCallback, useContext, useEffect } from 'react';

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

    fetchMenu: async (object, force = false) => {
        const key = typeof object === 'string' ? object : JSON.stringify(object);
        const existing = get().menus[key];
        if (existing?.data && !force) return existing.data;
        if (existing?.promise && !force) return existing.promise;

        const promise: Promise<any> = getDataForMenu({ object, params: null }, (data: any) => data)
            .then((data: any) => {
                set((state) => ({
                    menus: {
                        ...state.menus,
                        [key]: { data, fetched: true, loading: false, promise: null },
                    },
                }));
                return data;
            })
            .catch((error: unknown) => {
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

/** A loaded (or server-sent) menu's data, read outside React; null when there is none yet. */
export function getLoadedMenuData(object: string): any {
    return useMenuDataStore.getState().menus[object]?.data || null;
}

export const useMenuData = (object: MenuObject | null | undefined) => {
    const key = typeof object === 'string' ? object : JSON.stringify(object);
    const initial = useContext(InitialMenusContext);
    const seeded = object && typeof object === 'string' ? initial?.[object] : undefined;
    const data = useMenuDataStore((state) => state.menus[key]?.data ?? false) || seeded || false;
    const isLoading = useMenuDataStore((state) => state.menus[key]?.loading ?? false);
    const isFetched = useMenuDataStore((state) => state.menus[key]?.fetched ?? false) || !!seeded;
    const fetchMenu = useMenuDataStore((state) => state.fetchMenu);
    const tier = useScreenTier();

    useEffect(() => {
        if (object) fetchMenu(object);
    }, [object, fetchMenu]);

    const refetch = useCallback(() => {
        if (object) fetchMenu(object, true);
    }, [object, fetchMenu]);

    // Items UNA hides on this screen tier never reach the menus.
    const menuData = data?.items ? { ...data, items: filterHiddenOn(data.items, tier) } : data;

    return { menuData, isFetched, isLoading, refetch };
};