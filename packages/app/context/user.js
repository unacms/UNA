import { create } from 'zustand';
import { isObjectsEqual } from 'app/lib/util'
import { useShallow } from 'zustand/react/shallow';
export const useCurrentUserStore = create((set, get) => ({
    currentUser: null, // Initial state

    // Setter function with deep comparison check using lodash's isEqual
    setCurrentUser: (userUpdate) => {
        const currentUser = get().currentUser;

        if (!userUpdate) {
            set({ currentUser: userUpdate });
            return;
        }

        const updatedUser = {
            ...currentUser, // Copy the current user object
            ...userUpdate,  // Merge the updates (e.g., notifications)
            notifications: userUpdate.counters?.bx_notifications ?? 0, 
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