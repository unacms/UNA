import { create } from 'zustand';
import { useCallback, useEffect } from 'react';
import { asyncStorageGet, asyncStorageSet } from 'app/lib/util';
import { appSetting } from 'app/lib/util'

const STORAGE_KEY = 'layout-settings';

const DEFAULT_LAYOUT_SETTINGS = appSetting('layout', 'defaults')

export const useLayoutSettingsStore = create((set, get) => ({
    layoutSettings: DEFAULT_LAYOUT_SETTINGS,
    hydrated: false,

    setLayoutSettings: async (value) => {
        await asyncStorageSet(STORAGE_KEY, JSON.stringify(value));
        set({ layoutSettings: value });
    },

    updateLayoutSettings: async (partial) => {
        const current = get().layoutSettings || {};
        const updated = { ...current, ...partial };
        await asyncStorageSet(STORAGE_KEY, JSON.stringify(updated));
        set({ layoutSettings: updated });
    },

    hydrate: async () => {
        try {
            const raw = await asyncStorageGet(STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : DEFAULT_LAYOUT_SETTINGS;
            set({ layoutSettings: parsed, hydrated: true });
        } catch (e) {
            console.error('Hydratation error layoutSettings:', e);
            set({ layoutSettings: DEFAULT_LAYOUT_SETTINGS, hydrated: true });
        }
    },
}));

export const useLayoutSettings = () => {
    const layoutSettings = useLayoutSettingsStore((state) => state.layoutSettings);
    const hydrated = useLayoutSettingsStore((state) => state.hydrated);
    const setLayoutSettings = useCallback(
        async (value) => {
            await useLayoutSettingsStore.getState().setLayoutSettings(value);
        },
        []
    );

    const updateLayoutSettings = useCallback(
        async (partial) => {
            await useLayoutSettingsStore.getState().updateLayoutSettings(partial);
        },
        []
    );

    useEffect(() => {
        if (!hydrated) {
            useLayoutSettingsStore.getState().hydrate();
        }
    }, [hydrated]);

    const { density, name: layoutName } = layoutSettings ?? {};

    return { layoutSettings, setLayoutSettings, updateLayoutSettings, hydrated, density, layoutName };
};
