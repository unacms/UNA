// packages/app/context/menu-data.js
import { create } from 'zustand';
import { getDataForMenu } from 'app/lib/util';
import { useEffect, useCallback } from 'react';

export const useMenuDataStore = create((set, get) => ({
    menus: {},

    fetchMenu: async (object, force = false) => {
        const key = typeof object === 'string' ? object : JSON.stringify(object);
        const existing = get().menus[key];
        if (existing?.data && !force) return existing.data;
        if (existing?.promise && !force) return existing.promise;

        const promise = getDataForMenu({ object, params: null }, (data) => data)
            .then((data) => {
                set((state) => ({
                    menus: {
                        ...state.menus,
                        [key]: { data, fetched: true, loading: false, promise: null },
                    },
                }));
                return data;
            })
            .catch((error) => {
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

export const useMenuData = (object) => {
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