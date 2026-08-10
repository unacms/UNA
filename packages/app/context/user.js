import { create } from 'zustand';
import { Platform } from 'react-native';
import { isObjectsEqual } from 'app/lib/util'
import { useShallow } from 'zustand/react/shallow';

/**
 * Web: page JSON from the server is enough to render guest UI before Zustand is seeded.
 * Logged-in pages still wait for currentUser (seeded on the client from data.user).
 */
export function isWebAuthReady(pageData, currentUser) {
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
export function seedCurrentUserFromPageData(pageData) {
    if (Platform.OS !== 'web' || pageData == null || typeof window === 'undefined') {
        return;
    }
    if (useCurrentUserStore.getState().currentUser !== null) {
        return;
    }
    useCurrentUserStore.getState().setCurrentUser(pageData.user ? pageData.user : false);
}

export const useCurrentUserStore = create((set, get) => ({
    currentUser: null, // Initial state

    // Setter function with deep comparison check using lodash's isEqual
    setCurrentUser: (userUpdate) => {
        const currentUser = get().currentUser;

        if (!userUpdate) {
            set({ currentUser: userUpdate });
            return;
        }

        const hasCounters = userUpdate.counters != null;
        const nextNotifications = hasCounters
            ? (userUpdate.counters.bx_notifications ?? 0)
            : (userUpdate.notifications ?? currentUser?.notifications ?? 0);

        const updatedUser = {
            ...currentUser, // Copy the current user object
            ...userUpdate,  // Merge the updates (e.g., notifications)
            notifications: nextNotifications,
        };
        // Only update if the objects are not deeply equal
        if (!isObjectsEqual(currentUser, updatedUser)) {
            set(() => ({ currentUser: updatedUser }));
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