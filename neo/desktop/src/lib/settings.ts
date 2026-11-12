/**
 * The app's settings (Settings, Cmd+,): this computer's, for every network. In the app Rust
 * keeps them (src-tauri/src/settings.rs) and acts on some (osNotifications, closeToTray): the
 * page reads them with get_settings and changes them with set_setting, which only the main
 * window may call, so a window of its own reads them and changes none. In a plain browser,
 * localStorage. The theme is also kept in localStorage (theme.ts), which is read before the
 * first paint.
 */
import { invoke } from '@tauri-apps/api/core';
import { useSyncExternalStore } from 'react';

import { chooseLanguage, isLanguageChoice, type LanguageChoice, savedLanguage } from './i18n';
import { inApp } from './native';
import { readStoredJson, writeStoredJson } from './storage';
import { applyTheme, isTheme, savedTheme, type Theme } from './theme';

export type Settings = {
    theme: Theme;
    /** Shortcuts of one character key (j, k, ?, …); WCAG 2.1.4 wants them switchable off. */
    singleKeyShortcuts: boolean;
    /** New notifications as OS notifications while the window has no focus (Rust: 'osNotifications'). */
    osNotifications: boolean;
    /** Closing the window keeps the app running in the Dock or tray (Rust: 'closeToTray'). */
    closeToTray: boolean;
    /** In a message, Enter adds a line and only Cmd+Enter (Ctrl+Enter) sends (Settings > Keyboard). */
    sendWithCmdEnter: boolean;
    /** The language of the app's own words, or the system's (lib/i18n.ts; Rust: 'language'). */
    language: LanguageChoice;
    /** Look for a new version at start and once a day (Settings > About; lib/updates.ts). */
    checkForUpdates: boolean;
};

export type SettingKey = keyof Settings;

const KEYS: readonly SettingKey[] = ['theme', 'singleKeyShortcuts', 'osNotifications', 'closeToTray', 'sendWithCmdEnter', 'language', 'checkForUpdates'];

/** The defaults: close to tray where people expect it (macOS, Windows), as Rust's default. */
export function defaultSettings(os: { mac: boolean; windows: boolean }): Settings {
    return { theme: 'system', singleKeyShortcuts: true, osNotifications: true, closeToTray: os.mac || os.windows, sendWithCmdEnter: false, language: 'system', checkForUpdates: true };
}

/** A stored value of a setting, or undefined when it is not one (missing, of another type). */
export function settingValue<K extends SettingKey>(key: K, value: unknown): Settings[K] | undefined {
    if (key === 'theme') return (isTheme(value) ? value : undefined) as Settings[K] | undefined;
    if (key === 'language') return (isLanguageChoice(value) ? value : undefined) as Settings[K] | undefined;
    return (typeof value === 'boolean' ? value : undefined) as Settings[K] | undefined;
}

/** Where settings are kept: one key each. */
export interface SettingsBackend {
    get(key: SettingKey): Promise<unknown>;
    set(key: SettingKey, value: unknown): Promise<void>;
}

/** Rust's settings (settings.rs): read once, changed one key at a time. */
export function tauriSettingsBackend(call: typeof invoke = invoke): SettingsBackend {
    let loaded: Promise<Record<string, unknown>> | null = null;
    const all = (): Promise<Record<string, unknown>> => {
        if (!loaded) {
            const reading = call<Record<string, unknown>>('get_settings');
            reading.catch(() => {
                if (loaded === reading) loaded = null;
            });
            loaded = reading;
        }
        return loaded;
    };
    return {
        get: async (key) => (await all())[key],
        set: (key, value) => call<void>('set_setting', { key, value }),
    };
}

/** localStorage, for the app in a plain browser tab. */
export function localStorageSettingsBackend(prefix = 'una-setting:'): SettingsBackend {
    return {
        get: async (key) => readStoredJson(prefix + key),
        // with nowhere to keep it, a setting lasts until the page goes
        set: async (key, value) => writeStoredJson(prefix + key, value),
    };
}

type Listener = () => void;

/** The settings in memory, loaded from a backend and written back on each change. */
export class SettingsStore {
    private value: Settings;
    private listeners = new Set<Listener>();
    private loaded: Promise<Settings> | null = null;

    constructor(
        private readonly backend: SettingsBackend,
        defaults: Settings,
    ) {
        this.value = defaults;
    }

    get current(): Settings {
        return this.value;
    }

    /** Read what was kept; settings that were never set stay at their defaults. */
    load(): Promise<Settings> {
        if (!this.loaded) {
            this.loaded = (async () => {
                const next = { ...this.value };
                for (const key of KEYS) {
                    try {
                        const v = settingValue(key, await this.backend.get(key));
                        if (v !== undefined) (next as Record<SettingKey, unknown>)[key] = v;
                    } catch (e) {
                        console.error('settings', key, e);
                    }
                }
                this.replace(next);
                return next;
            })();
        }
        return this.loaded;
    }

    /** Change one setting: at once here, then kept. Rejects when it could not be kept. */
    async set<K extends SettingKey>(key: K, value: Settings[K]): Promise<void> {
        if (this.value[key] === value) return;
        this.replace({ ...this.value, [key]: value });
        await this.backend.set(key, value);
    }

    subscribe(listener: Listener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private replace(next: Settings) {
        this.value = next;
        for (const l of this.listeners) l();
    }
}

const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent;

/** This app's settings. */
export const appSettings = new SettingsStore(inApp ? tauriSettingsBackend() : localStorageSettingsBackend(), {
    ...defaultSettings({ mac: /\bMac/.test(ua), windows: /\bWindows/.test(ua) }),
    theme: savedTheme(),
    language: savedLanguage(),
});

/**
 * Load the settings, and use the theme kept there (it may differ from the copy theme.ts read
 * before the first paint, when another window changed it). The same for the language, which
 * takes loading the window again (lib/i18n.ts).
 */
export async function loadSettings(store: SettingsStore = appSettings): Promise<Settings> {
    const settings = await store.load();
    if (settings.theme !== savedTheme()) applyTheme(settings.theme);
    if (settings.language !== savedLanguage()) chooseLanguage(settings.language);
    return settings;
}

/** Choose a theme: on the page and the window now, kept in both places. */
export function chooseTheme(theme: Theme, store: SettingsStore = appSettings): Promise<void> {
    applyTheme(theme);
    return store.set('theme', theme);
}

/** Choose the language of the app's words: kept in both places, then the window loads again in it. */
export async function chooseAppLanguage(language: LanguageChoice, store: SettingsStore = appSettings): Promise<void> {
    await store.set('language', language);
    chooseLanguage(language);
}

/** The current settings, kept current. */
export function useSettings(store: SettingsStore = appSettings): Settings {
    return useSyncExternalStore(
        (listener) => store.subscribe(listener),
        () => store.current,
    );
}
