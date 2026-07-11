'use client';
import { create } from 'zustand';
import { useCallback, useEffect } from 'react';
import { asyncStorageGet, asyncStorageSet } from 'app/lib/util';
import { appSetting } from 'app/lib/util'
import { Appearance, Platform } from 'react-native'
import * as RNLocalize from "react-native-localize";
import { fetcher } from 'app/lib/fetcher'
import i18n from 'i18next'
import emitter from 'app/context/emitter';
import { clearAllPageCache } from 'app/lib/tab-page-cache';

const STORAGE_KEY = 'layout-settings';
const LANG_MODE_COOKIE = 'neo_lang';
const LANG_CODE_COOKIE = 'neo_lang_code';
// Settings use the historical misspelling; keep this key aligned with settings/layout.js.
const AVAILABLE_LANGS_SETTING_KEY = 'avaliable_langs';

const DEFAULT_LAYOUT_SETTINGS = appSetting('layout', 'defaults')

const normalizeLangCode = (value) => String(value || '')
    .toLowerCase()
    .split(/[-_]/)[0];

const getDefaultLangCode = () => {
    const langs = appSetting('layout', AVAILABLE_LANGS_SETTING_KEY);
    const supportedLangs = Array.isArray(langs)
        ? langs.filter((lang) => lang && lang !== 'auto')
        : [];
    const fallback = supportedLangs[0] || 'en';

    try {
        const localeCodes = Platform.OS === 'web'
            ? (typeof navigator !== 'undefined'
                ? [
                    typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().locale : '',
                    ...(navigator.languages || []),
                    navigator.language,
                ].filter(Boolean)
                : [])
            : RNLocalize.getLocales().map((locale) => locale.languageTag || locale.languageCode);

        const matchedLang = localeCodes
            .map(normalizeLangCode)
            .find((langCode) => supportedLangs.includes(langCode));

        return matchedLang || fallback;
    } catch (e) {
        console.warn('Failed to get locales:', e);
        return fallback;
    }
};

const resolveLangCode = (value) => value && value != 'auto' ? value : getDefaultLangCode();

const getCookieValue = (name) => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return '';
    return document.cookie
        .split('; ')
        .find((row) => row.startsWith(name + '='))
        ?.split('=')
        .slice(1)
        .join('=') || '';
};

const decodeCookieValue = (value = '') => {
    try {
        return decodeURIComponent(value);
    } catch {
        return '';
    }
};

const setCookieValue = (name, value) => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.cookie = `${name}=${encodeURIComponent(value || '')}; path=/; max-age=31536000; SameSite=Lax`;
};

const syncLanguageCookies = (mode, langCode) => {
    setCookieValue(LANG_MODE_COOKIE, mode || 'auto');
    setCookieValue(LANG_CODE_COOKIE, langCode);
};

const syncRemoteLang = async (langCode) => {
    await fetcher(
        '/api.php?r=system/get_page_by_request/TemplServicePages&params[]=home&lang=' +
        encodeURIComponent(langCode)
    );
};

const syncAutoLangCookies = (langCode) => {
    if (Platform.OS !== 'web') return;
    const currentCookieLang = decodeCookieValue(getCookieValue(LANG_CODE_COOKIE));
    if (currentCookieLang === langCode) return;

    syncLanguageCookies('auto', langCode);
};

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
            const resolvedLangCode = resolveLangCode(parsed?.lang);
            await i18n.changeLanguage(resolvedLangCode);
            set({ layoutSettings: parsed, hydrated: true });
            if (parsed?.lang === 'auto') {
                syncAutoLangCookies(resolvedLangCode);
            } else {
                syncLanguageCookies(parsed?.lang, resolvedLangCode);
            }
        } catch (e) {
            console.error('Hydratation error layoutSettings:', e);
            const fallbackLangCode = resolveLangCode(DEFAULT_LAYOUT_SETTINGS?.lang);
            await i18n.changeLanguage(fallbackLangCode);
            syncLanguageCookies(DEFAULT_LAYOUT_SETTINGS?.lang, fallbackLangCode);
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
                const nativeValue = value == 'auto' ? null : value;
                Appearance.setColorScheme(nativeValue);
            }
            await useLayoutSettingsStore.getState().updateLayoutSettings({ theme: value });
        }, [isWeb]
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

    const setLang = useCallback(
        async (value) => {
            const v2 = resolveLangCode(value);
            await i18n.changeLanguage(v2)
            await useLayoutSettingsStore.getState().updateLayoutSettings({ lang: value });
            syncLanguageCookies(value, v2);

            try {
                await syncRemoteLang(v2)
            } catch (e) {
                console.warn('Failed to update remote language:', e);
            }

            if (isWeb && typeof window !== 'undefined') {
                window.location.reload();
            } else {
                clearAllPageCache();
                emitter.emit('page', { action: 'reload' });
            }
        }, [isWeb]
    );

    useEffect(() => {
        if (!hydrated) {
            useLayoutSettingsStore.getState().hydrate();
        }
    }, [hydrated]);

    const { density, name: layoutName, theme: themeName, lang } = layoutSettings ?? {};
    const langCode = resolveLangCode(lang);

    return { layoutSettings, setLayoutSettings, updateLayoutSettings, hydrated, density, layoutName, themeName, setThemeName, setLayoutName, setDensity, setLang, lang, langCode };
};
