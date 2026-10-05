'use client';
import { create } from 'zustand';
import { useEffect } from 'react';
import { persistedGet, persistedSet, sessionCacheGet, sessionCacheSet } from 'app/lib/util/storage';

/**
 * Small user preferences that are not part of layout-settings (theme/lang/…).
 *
 * `persisted` survives restarts (localStorage / AsyncStorage); `session` lives
 * for the tab / app run. Both start at the defaults on the server and on the
 * first client render and are hydrated after mount, so there is never a
 * hydration mismatch and no component reads web storage during render.
 */

const PERSISTED_KEY = 'prefs';
const SESSION_KEY = 'prefs';

export type PersistedPrefs = {
    feedType: string | null;
    panelSizes: Record<string, number[]>;
};

export type SessionPrefs = {
    expandedItems: (string | number)[];
};

type PrefsStore = {
    persisted: PersistedPrefs;
    session: SessionPrefs;
    hydrated: boolean;
    hydrate: () => Promise<void>;
    setPersisted: (partial: Partial<PersistedPrefs>) => void;
    resetSession: () => void;
    setSession: (partial: Partial<SessionPrefs>) => void;
};

const PERSISTED_DEFAULTS: PersistedPrefs = {
    /** Home feed mode; `null` → appSetting('feed', 'default_feed'). */
    feedType: null,
    /** Resizable panel sizes: { [`${panelGroupId}-${breakpoint}`]: sizes[] }. */
    panelSizes: {},
};

const SESSION_DEFAULTS: SessionPrefs = {
    /** Ids of "show more" blocks the user expanded. */
    expandedItems: [],
};

export const usePrefsStore = create<PrefsStore>()((set, get) => ({
    persisted: PERSISTED_DEFAULTS,
    session: SESSION_DEFAULTS,
    hydrated: false,

    hydrate: async () => {
        if (get().hydrated) return;
        const session = { ...SESSION_DEFAULTS, ...(sessionCacheGet(SESSION_KEY) || {}) };
        const persisted = { ...PERSISTED_DEFAULTS, ...((await persistedGet(PERSISTED_KEY)) || {}) };
        set({ persisted, session, hydrated: true });
    },

    setPersisted: (partial) => {
        const persisted = { ...get().persisted, ...partial };
        set({ persisted });
        persistedSet(PERSISTED_KEY, persisted);
    },

    /** Forget session-scoped prefs (sign-out / account switch). */
    resetSession: () => {
        set({ session: SESSION_DEFAULTS });
        sessionCacheSet(SESSION_KEY, SESSION_DEFAULTS);
    },

    setSession: (partial) => {
        const session = { ...get().session, ...partial };
        set({ session });
        sessionCacheSet(SESSION_KEY, session);
    },
}));

const useHydratePrefs = () => {
    const hydrated = usePrefsStore((s) => s.hydrated);
    useEffect(() => {
        if (!hydrated) usePrefsStore.getState().hydrate();
    }, [hydrated]);
};

/** Persisted preference by key (see PERSISTED_DEFAULTS). */
export function usePref<K extends keyof PersistedPrefs>(key: K): PersistedPrefs[K] {
    useHydratePrefs();
    return usePrefsStore((s) => s.persisted[key]);
}

/** Session-scoped preference by key (see SESSION_DEFAULTS). */
export function useSessionPref<K extends keyof SessionPrefs>(key: K): SessionPrefs[K] {
    useHydratePrefs();
    return usePrefsStore((s) => s.session[key]);
}

export const setPref = <K extends keyof PersistedPrefs>(key: K, value: PersistedPrefs[K]) => usePrefsStore.getState().setPersisted({ [key]: value });
export const setSessionPref = <K extends keyof SessionPrefs>(key: K, value: SessionPrefs[K]) => usePrefsStore.getState().setSession({ [key]: value });
