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

const PERSISTED_DEFAULTS = {
    /** Home feed mode; `null` → appSetting('feed', 'default_feed'). */
    feedType: null,
    /** Resizable panel sizes: { [`${panelGroupId}-${breakpoint}`]: sizes[] }. */
    panelSizes: {},
};

const SESSION_DEFAULTS = {
    /** Ids of "show more" blocks the user expanded. */
    expandedItems: [],
};

export const usePrefsStore = create((set, get) => ({
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
export function usePref(key) {
    useHydratePrefs();
    return usePrefsStore((s) => s.persisted[key]);
}

/** Session-scoped preference by key (see SESSION_DEFAULTS). */
export function useSessionPref(key) {
    useHydratePrefs();
    return usePrefsStore((s) => s.session[key]);
}

export const setPref = (key, value) => usePrefsStore.getState().setPersisted({ [key]: value });
export const setSessionPref = (key, value) => usePrefsStore.getState().setSession({ [key]: value });
