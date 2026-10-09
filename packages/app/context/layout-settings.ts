'use client';
import { create } from 'zustand';
import { useCallback, useEffect } from 'react';
import { persistedGet, persistedSet } from 'app/lib/util/storage';
import { appSetting } from 'app/lib/util'
import { Appearance, Platform } from 'react-native'
import * as RNLocalize from "react-native-localize";
import { fetcher } from 'app/lib/fetcher'
import { changeI18nLanguage } from 'app/lib/i18n-resources'
import emitter, { EVENTS } from 'app/context/emitter';
import { clearAllPageCache } from 'app/lib/cache/clear-page-cache';

const STORAGE_KEY = 'layout-settings';
const LANG_MODE_COOKIE = 'neo_lang';
const LANG_CODE_COOKIE = 'neo_lang_code';
// Settings use the historical misspelling; keep this key aligned with settings/layout.js.
const AVAILABLE_LANGS_SETTING_KEY = 'avaliable_langs';

/** User layout preferences, persisted locally (defaults from `layout.defaults` setting). */
export type LayoutSettings = {
    /** `light` / `dark` / `auto`. */
    theme?: 'light' | 'dark' | 'auto' | string;
    /** Layout variant name. */
    name?: string;
    density?: string;
    /** Language code or `auto` (device language). */
    lang?: string;
    [key: string]: unknown;
};

const DEFAULT_LAYOUT_SETTINGS: LayoutSettings = appSetting('layout', 'defaults')

const normalizeLangCode = (value: unknown) => String(value || '')
    .toLowerCase()
    .split(/[-_]/)[0];

const getDefaultLangCode = (): string => {
    const langs = appSetting('layout', AVAILABLE_LANGS_SETTING_KEY);
    const supportedLangs = Array.isArray(langs)
        ? langs.filter((lang: string) => lang && lang !== 'auto')
        : [];
    const fallback = supportedLangs[0] || 'en';

    try {
        const localeCodes: string[] = Platform.OS === 'web'
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

/**
 * Device language for `auto`, read once: every `useLayoutSettings` consumer
 * resolves it on each render, and the locale lookup (Intl / RNLocalize) is not
 * free. Not cached during SSR, where there is no device.
 */
let deviceLangCode: string | null = null;
const getDeviceLangCode = (): string => {
    if (Platform.OS === 'web' && typeof window === 'undefined') return getDefaultLangCode();
    if (deviceLangCode === null) deviceLangCode = getDefaultLangCode();
    return deviceLangCode;
};

const resolveLangCode = (value: string | undefined): string => value && value != 'auto' ? value : getDeviceLangCode();

const getCookieValue = (name: string): string => {
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

const setCookieValue = (name: string, value: string | undefined) => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.cookie = `${name}=${encodeURIComponent(value || '')}; path=/; max-age=31536000; SameSite=Lax`;
};

const syncLanguageCookies = (mode: string | undefined, langCode: string) => {
    setCookieValue(LANG_MODE_COOKIE, mode || 'auto');
    setCookieValue(LANG_CODE_COOKIE, langCode);
};

const syncRemoteLang = async (langCode: string) => {
    await fetcher(
        '/api.php?r=system/get_page_by_request/TemplServicePages&params[]=home&lang=' +
        encodeURIComponent(langCode)
    );
};

const syncAutoLangCookies = (langCode: string) => {
    if (Platform.OS !== 'web') return;
    const currentCookieLang = decodeCookieValue(getCookieValue(LANG_CODE_COOKIE));
    if (currentCookieLang === langCode) return;

    syncLanguageCookies('auto', langCode);
};

type LayoutSettingsStore = {
    layoutSettings: LayoutSettings;
    hydrated: boolean;
    setLayoutSettings: (value: LayoutSettings) => Promise<void>;
    updateLayoutSettings: (partial: Partial<LayoutSettings>) => Promise<void>;
    /** Load persisted settings, apply the language, sync language cookies (web). */
    hydrate: () => Promise<void>;
};

export const useLayoutSettingsStore = create<LayoutSettingsStore>()((set, get) => ({
    layoutSettings: DEFAULT_LAYOUT_SETTINGS,
    hydrated: false,

    setLayoutSettings: async (value) => {
        await persistedSet(STORAGE_KEY, value);
        set({ layoutSettings: value });
    },

    updateLayoutSettings: async (partial) => {
        const current = get().layoutSettings || {};
        const updated = { ...current, ...partial };
        await persistedSet(STORAGE_KEY, updated);
        set({ layoutSettings: updated });
    },

    hydrate: async () => {
        try {
            const stored = await persistedGet(STORAGE_KEY);
            const parsed: LayoutSettings = stored && typeof stored === 'object' ? stored : DEFAULT_LAYOUT_SETTINGS;
            const resolvedLangCode = resolveLangCode(parsed?.lang);
            await changeI18nLanguage(resolvedLangCode);
            set({ layoutSettings: parsed, hydrated: true });
            if (parsed?.lang === 'auto') {
                syncAutoLangCookies(resolvedLangCode);
            } else {
                syncLanguageCookies(parsed?.lang, resolvedLangCode);
            }
        } catch (e) {
            console.error('Hydratation error layoutSettings:', e);
            const fallbackLangCode = resolveLangCode(DEFAULT_LAYOUT_SETTINGS?.lang);
            await changeI18nLanguage(fallbackLangCode);
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
        async (value: any) => {
            await useLayoutSettingsStore.getState().setLayoutSettings(value);
        },
        []
    );

    const updateLayoutSettings = useCallback(
        async (partial: Partial<LayoutSettings>) => {
            await useLayoutSettingsStore.getState().updateLayoutSettings(partial);
        },
        []
    );

    const setThemeName = useCallback(
        async (value: any) => {
            if (!isWeb) {
                const nativeValue = value == 'auto' ? null : value;
                Appearance.setColorScheme(nativeValue);
            }
            await useLayoutSettingsStore.getState().updateLayoutSettings({ theme: value });
        }, [isWeb]
    );

    const setLayoutName = useCallback(
        async (value: any) => {
            await useLayoutSettingsStore.getState().updateLayoutSettings({ name: value });
        }, []
    );

    const setDensity = useCallback(
        async (value: any) => {
            await useLayoutSettingsStore.getState().updateLayoutSettings({ density: value });
        }, []
    );

    const setLang = useCallback(
        async (value: any) => {
            const v2 = resolveLangCode(value);
            await changeI18nLanguage(v2)
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
                emitter.emit(EVENTS.page, { action: 'reload' });
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
