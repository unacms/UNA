'use client';
import { create } from 'zustand';
import { useCallback, useEffect } from 'react';
import { asyncStorageGet, asyncStorageSet } from 'app/lib/util';
import { appSetting } from 'app/lib/util'
import { Appearance, Platform } from 'react-native'
//import * as RNLocalize from "react-native-localize";
import { fetcher } from 'app/lib/fetcher'
import i18n from 'i18next'

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
    const isWeb = Platform.OS == 'web'
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

    const setThemeName = useCallback(
        async (value) => {
            if (!isWeb) {
                if (value == 'auto') value = null
                Appearance.setColorScheme(value)
            }
            await useLayoutSettingsStore.getState().updateLayoutSettings({ theme: value });
        }, []
    );

    const setLayoutName = useCallback(
        async (value) => {
            await useLayoutSettingsStore.getState().updateLayoutSettings({ name: value });
        }, []
    );

    const setDensity = useCallback(
        async (value) => {
            await useLayoutSettingsStore.getState().updateLayoutSettings({ density: value });
        }, []
    );

    const getDefaultLangCode = () => {
        const langs = appSetting('layout', 'avaliable_langs');
        try {
            // todo need fix for server
            //const locales = navigator && typeof navigator !== 'undefined' ? RNLocalize.getLocales() : [];
            //const langCode = locales?.[0]?.languageCode;
            //return langs.includes(langCode) ? langCode : 'en';
            return 'en';
        } catch (e) {
            console.warn('Failed to get locales:', e);
            return 'en';
        }
    };

    const setLang = useCallback(
        async (value) => {
            let v2 = value;
            if (value == 'auto') {
                v2 = getDefaultLangCode();
            }
            i18n.changeLanguage(v2)
            await fetcher(
                '/api.php?r=system/get_page_by_request/TemplServicePages&params[]=home&lang=' +
                v2
            )
            await useLayoutSettingsStore.getState().updateLayoutSettings({ lang: value });
        }, []
    );

    useEffect(() => {
        if (!hydrated) {
            useLayoutSettingsStore.getState().hydrate();
        }
    }, [hydrated]);

    const { density, name: layoutName, theme: themeName, lang } = layoutSettings ?? {};
    const langCode = lang != 'auto' ? lang : getDefaultLangCode();

    return { layoutSettings, setLayoutSettings, updateLayoutSettings, hydrated, density, layoutName, themeName, setThemeName, setLayoutName, setDensity, setLang, lang, langCode };
};
