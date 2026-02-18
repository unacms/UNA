// packages/app/context/menu-data.js
import { create } from 'zustand';
import { getDataForMenu } from 'app/lib/util';
import { useEffect, useCallback } from 'react';

export const useMenuDataStore = create((set, get) => ({
    menus: {},

    fetchMenu: (object, force = false) => {
        const key = typeof object === 'string' ? object : JSON.stringify(object);
        const existing = get().menus[key];
        if (existing?.fetched && !force) return;

        set((state) => ({
            menus: { ...state.menus, [key]: { data: force ? existing?.data ?? false : false, fetched: true } },
        }));

        getDataForMenu({ object, params: null }, (data) => {
            set((state) => ({
                menus: { ...state.menus, [key]: { data, fetched: true } },
            }));
        });
    },
}));

export const useMenuData = (object) => {
    const key = typeof object === 'string' ? object : JSON.stringify(object);
    const data = useMenuDataStore((state) => state.menus[key]?.data ?? false);
    const fetchMenu = useMenuDataStore((state) => state.fetchMenu);

    useEffect(() => {
        if (object) fetchMenu(object);
    }, [object, fetchMenu]);

    const refetch = useCallback(() => {
        if (object) fetchMenu(object, true);
    }, [object, fetchMenu]);

    return { menuData: data, refetch };
};