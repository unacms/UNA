import AsyncStorage from '@react-native-async-storage/async-storage';
import { isWeb } from './layout';

/**
 * Two storage primitives, both JSON, both namespaced so a schema change can
 * bump the version instead of silently misreading old values:
 *
 * - persisted*: survives restarts. Web localStorage, native AsyncStorage (async).
 * - sessionCache*: this tab / this app run. Web sessionStorage, native memory (sync).
 *
 * Components never touch these directly — read preferences through the stores
 * in app/context (layout-settings, prefs) so server and first client render
 * always agree (hydration happens after mount).
 */

const PERSISTED_PREFIX = 'neo:v1:';
const SESSION_PREFIX = 'neo:session:v1:';

const parse = (raw: string | null | undefined): any => {
    if (raw == null) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

const hasWebStorage = (name: 'localStorage' | 'sessionStorage') => isWeb && typeof window !== 'undefined' && !!window[name];

export async function persistedGet(key: string): Promise<any> {
    const fullKey = PERSISTED_PREFIX + key;
    if (isWeb) {
        return hasWebStorage('localStorage') ? parse(window.localStorage.getItem(fullKey)) : null;
    }
    return parse(await AsyncStorage.getItem(fullKey));
}

export async function persistedSet(key: string, value: unknown): Promise<void> {
    const fullKey = PERSISTED_PREFIX + key;
    const raw = JSON.stringify(value);
    try {
        if (isWeb) {
            if (hasWebStorage('localStorage')) window.localStorage.setItem(fullKey, raw);
        } else {
            await AsyncStorage.setItem(fullKey, raw);
        }
    } catch {
        // Quota exceeded / storage disabled: the preference simply does not persist.
    }
}

const sessionMemory = new Map<string, unknown>();

export function sessionCacheGet(key: string): any {
    const fullKey = SESSION_PREFIX + key;
    if (hasWebStorage('sessionStorage')) return parse(window.sessionStorage.getItem(fullKey));
    return sessionMemory.has(fullKey) ? sessionMemory.get(fullKey) : null;
}

export function sessionCacheSet(key: string, value: unknown): void {
    const fullKey = SESSION_PREFIX + key;
    if (hasWebStorage('sessionStorage')) {
        try {
            window.sessionStorage.setItem(fullKey, JSON.stringify(value));
        } catch {
            // Quota exceeded: a cache miss later is fine.
        }
        return;
    }
    sessionMemory.set(fullKey, value);
}

/** Drop everything session-scoped (ours only — never `sessionStorage.clear()`). */
export function storageClear() {
    sessionMemory.clear();
    if (!hasWebStorage('sessionStorage')) return;
    const storage = window.sessionStorage;
    for (let i = storage.length - 1; i >= 0; i--) {
        const k = storage.key(i);
        if (k && k.startsWith(SESSION_PREFIX)) storage.removeItem(k);
    }
}
