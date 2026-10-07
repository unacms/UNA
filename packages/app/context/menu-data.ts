// packages/app/context/menu-data.js
import { create } from 'zustand';
import { getDataForMenu } from 'app/lib/util';
import { useEffect, useCallback } from 'react';

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

export const useMenuData = (object: MenuObject | null | undefined) => {
    const key = typeof object === 'string' ? object : JSON.stringify(object);
    const data = useMenuDataStore((state) => state.menus[key]?.data ?? false);
    const isLoading = useMenuDataStore((state) => state.menus[key]?.loading ?? false);
    const isFetched = useMenuDataStore((state) => state.menus[key]?.fetched ?? false);
    const fetchMenu = useMenuDataStore((state) => state.fetchMenu);

    useEffect(() => {
        if (object) fetchMenu(object);
    }, [object, fetchMenu]);

    const refetch = useCallback(() => {
        if (object) fetchMenu(object, true);
    }, [object, fetchMenu]);

    return { menuData: data, isFetched, isLoading, refetch };
};