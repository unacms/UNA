import { create } from 'zustand';
import { Platform } from 'react-native';
import { isObjectsEqual } from 'app/lib/util'
import { useShallow } from 'zustand/react/shallow';

/**
 * Signed-in profile as UNA returns it in page data (`data.user`). Only the fields the
 * app reads are listed; UNA may send more (hence the index signature).
 */
export type CurrentUser = {
    id: number | string;
    display_name?: string;
    url?: string;
    avatar?: string;
    confirmed?: boolean | number;
    hash?: string;
    /** Unread notifications; kept in sync with `counters.bx_notifications`. */
    notifications?: number;
    notificationsTs?: number | string;
    counters?: { bx_notifications?: number; [module: string]: number | undefined };
    /** Account settings (module-specific; mutated in place by some screens). */
    settings?: Record<string, any>;
    /** Account menu from UNA. */
    menu?: { items: any[] };
    membership?: number | string;
    membership_name?: string;
    membership_icon?: string;
    membership_icon_url?: string;
    /** Active context (e.g. organization) id when acting on behalf of another profile. */
    current_context?: number | string;
    informer?: any[];
    operator?: boolean | number;
    moderator?: boolean | number;
    /** HTTP-like status of the user's page (503 = maintenance). */
    page_status?: number;
    badges?: any;
    profiles_count?: number;
    profiles_limit?: number;
    [key: string]: any;
};

/** `null`: not known yet (before seeding); `false`: guest; object: signed in. */
export type CurrentUserState = CurrentUser | false | null;

type CurrentUserStore = {
    currentUser: CurrentUserState;
    /** Merge a partial user into the current one (skipped when deep-equal); falsy sets guest/unknown. */
    setCurrentUser: (userUpdate: Partial<CurrentUser> | false | null) => void;
};

/**
 * Web: page JSON from the server is enough to render guest UI before Zustand is seeded.
 * Logged-in pages still wait for currentUser (seeded on the client from data.user).
 */
export function isWebAuthReady(pageData: { user?: unknown } | null | undefined, currentUser: CurrentUserState): boolean {
    if (currentUser !== null) {
        return true;
    }
    if (Platform.OS !== 'web' || pageData == null) {
        return false;
    }
    return !pageData.user;
}

/**
 * Web-only: seed the global store from page props (call from useLayoutEffect in Root).
 * No-op on native (tabs bootstrap keeps currentUser === null).
 */
export function seedCurrentUserFromPageData(pageData: { user?: CurrentUser | null } | null | undefined): void {
    if (Platform.OS !== 'web' || pageData == null || typeof window === 'undefined') {
        return;
    }
    if (useCurrentUserStore.getState().currentUser !== null) {
        return;
    }
    useCurrentUserStore.getState().setCurrentUser(pageData.user ? pageData.user : false);
}

export const useCurrentUserStore = create<CurrentUserStore>()((set, get) => ({
    currentUser: null, // Initial state

    // Setter function with deep comparison check using lodash's isEqual
    setCurrentUser: (userUpdate) => {
        const currentUser = get().currentUser;

        if (!userUpdate) {
            set({ currentUser: userUpdate as false | null });
            return;
        }

        const hasCounters = userUpdate.counters != null;
        const nextNotifications = hasCounters
            ? (userUpdate.counters!.bx_notifications ?? 0)
            : (userUpdate.notifications ?? (currentUser || undefined)?.notifications ?? 0);

        const updatedUser = {
            ...currentUser, // Copy the current user object
            ...userUpdate,  // Merge the updates (e.g., notifications)
            notifications: nextNotifications,
        };
        // Only update if the objects are not deeply equal
        if (!isObjectsEqual(currentUser, updatedUser)) {
            set(() => ({ currentUser: updatedUser as CurrentUser }));
        }
    },
}));

export const useCurrentUser = () => {
    const currentUser = useCurrentUserStore((state) => state.currentUser);
    const setCurrentUser = useCurrentUserStore((state) => state.setCurrentUser);

    return { currentUser, setCurrentUser };
};

export const useCurrentUserNoCounters = () => {
    return useCurrentUserStore(
        useShallow((state) => {
            const u = state.currentUser;
            if (!u) return u; 
            const { counters, notifications, ...brief } = u;
            return brief;
        })
    );
};