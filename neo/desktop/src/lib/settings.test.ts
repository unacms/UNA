import { describe, expect, it, vi } from 'vitest';

import { chooseAppLanguage, defaultSettings, localStorageSettingsBackend, tauriSettingsBackend, type SettingKey, type SettingsBackend, settingValue, SettingsStore } from './settings';

function memory(initial: Partial<Record<SettingKey, unknown>> = {}): SettingsBackend & { data: Map<SettingKey, unknown> } {
    const data = new Map<SettingKey, unknown>(Object.entries(initial) as [SettingKey, unknown][]);
    return {
        data,
        get: async (k) => data.get(k),
        set: async (k, v) => {
            data.set(k, v);
        },
    };
}

const defaults = defaultSettings({ mac: true, windows: false });

describe('settings', () => {
    it('defaults: keys on, OS notifications on, close to tray where people expect it', () => {
        expect(defaults).toEqual({ theme: 'system', singleKeyShortcuts: true, osNotifications: true, closeToTray: true, sendWithCmdEnter: false, language: 'system', checkForUpdates: true });
        expect(defaultSettings({ mac: false, windows: true }).closeToTray).toBe(true);
        expect(defaultSettings({ mac: false, windows: false }).closeToTray).toBe(false);
    });

    it('loads what was kept and leaves the rest at its default', async () => {
        const store = new SettingsStore(memory({ singleKeyShortcuts: false, theme: 'dark', osNotifications: 'nope' }), defaults);
        const s = await store.load();
        expect(s).toEqual({ ...defaults, singleKeyShortcuts: false, theme: 'dark' });
        expect(store.current).toBe(s);
    });

    it('keeps a change, so the next start has it', async () => {
        const backend = memory();
        const store = new SettingsStore(backend, defaults);
        await store.load();
        const seen = vi.fn();
        store.subscribe(seen);
        await store.set('closeToTray', false);
        await store.set('closeToTray', false);
        expect(seen).toHaveBeenCalledTimes(1);
        expect(backend.data.get('closeToTray')).toBe(false);

        const next = new SettingsStore(backend, defaults);
        expect((await next.load()).closeToTray).toBe(false);
    });

    it('applies a change at once even when it could not be kept, and says so', async () => {
        const store = new SettingsStore({ get: async () => undefined, set: async () => Promise.reject(new Error('disk full')) }, defaults);
        await expect(store.set('singleKeyShortcuts', false)).rejects.toThrow('disk full');
        expect(store.current.singleKeyShortcuts).toBe(false);
    });

    it('takes only values of the right kind', () => {
        expect(settingValue('theme', 'light')).toBe('light');
        expect(settingValue('theme', 'purple')).toBeUndefined();
        expect(settingValue('osNotifications', false)).toBe(false);
        expect(settingValue('osNotifications', 0)).toBeUndefined();
    });

    it('in the app reads Rust\'s settings once and changes one key with set_setting', async () => {
        const calls: [string, unknown][] = [];
        const call = vi.fn(async (cmd: string, args?: unknown) => {
            calls.push([cmd, args]);
            return (cmd === 'get_settings' ? { theme: 'dark', closeToTray: false } : undefined) as never;
        });
        const backend = tauriSettingsBackend(call as never);
        expect(await backend.get('theme')).toBe('dark');
        expect(await backend.get('closeToTray')).toBe(false);
        expect(await backend.get('osNotifications')).toBeUndefined();
        await backend.set('osNotifications', false);
        expect(calls).toEqual([
            ['get_settings', undefined],
            ['set_setting', { key: 'osNotifications', value: false }],
        ]);
    });

    it('keeps the language: the system\'s, or one the app has', async () => {
        expect(settingValue('language', 'ru')).toBe('ru');
        expect(settingValue('language', 'system')).toBe('system');
        expect(settingValue('language', 'xx')).toBeUndefined();
        expect(settingValue('language', true)).toBeUndefined();
        const store = new SettingsStore(memory({ language: 'ru' }), defaults);
        expect((await store.load()).language).toBe('ru');
        const other = new SettingsStore(memory({ language: 'klingon' }), defaults);
        expect((await other.load()).language).toBe('system');
    });

    it('lasts in localStorage outside the app', async () => {
        localStorage.clear();
        const a = new SettingsStore(localStorageSettingsBackend('test:'), defaults);
        await a.set('osNotifications', false);
        const b = new SettingsStore(localStorageSettingsBackend('test:'), defaults);
        expect((await b.load()).osNotifications).toBe(false);
        localStorage.clear();
    });

    it('keeps no value that is not one of the setting: nothing changes and nothing is written', async () => {
        localStorage.clear();
        const backend = memory();
        const store = new SettingsStore(backend, defaults);
        await expect(store.set('language', 'klingon')).rejects.toThrow(TypeError);
        await expect(store.set('theme', '<img>' as never)).rejects.toThrow(TypeError);
        await expect(store.set('osNotifications', 'yes' as never)).rejects.toThrow(TypeError);
        expect(store.current).toEqual(defaults);
        expect(backend.data.size).toBe(0);

        const local = localStorageSettingsBackend('test:');
        await expect(local.set('language', '{"a":1}')).rejects.toThrow(TypeError);
        await expect(local.set('nope' as never, true)).rejects.toThrow(TypeError);
        expect(localStorage.length).toBe(0);
        await local.set('language', 'ru');
        await local.set('theme', 'dark');
        await local.set('closeToTray', false);
        expect(localStorage.getItem('test:language')).toBe('"ru"');
        expect(localStorage.getItem('test:theme')).toBe('"dark"');
        expect(localStorage.getItem('test:closeToTray')).toBe('false');
        localStorage.clear();
    });

    it('chooses a language the app has, and refuses any other', async () => {
        localStorage.clear();
        const backend = memory();
        const store = new SettingsStore(backend, defaults);
        await expect(chooseAppLanguage('klingon', store)).rejects.toThrow(TypeError);
        expect(backend.data.size).toBe(0);
        expect(localStorage.length).toBe(0);
        expect(store.current.language).toBe('system');
    });
});
