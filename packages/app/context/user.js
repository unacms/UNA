/*import { createContext, useState, useContext, useMemo } from 'react';

const CurrentUserContext = createContext(null);

export function CurrentUserProvider ({ children }) {
    const [currentUser, setCurrentUser] = useState(null);

    const contextValue = useMemo(() => ({
        currentUser,
        setCurrentUser
    }), [currentUser, setCurrentUser]);

    return (
        <CurrentUserContext.Provider value={contextValue}>{children}</CurrentUserContext.Provider>
    );
}

export function useCurrentUser() {
    return useContext(CurrentUserContext);
}*/


import { createContext, useState, useContext, useMemo } from 'react';
import { create } from 'zustand';
import { isObjectsEqual } from 'app/lib/util'
const CurrentUserContext = createContext(null);

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
        };
        // Only update if the objects are not deeply equal
        if (!isObjectsEqual(currentUser, updatedUser)) {
            set(() => ({ currentUser: updatedUser }));
        }
    },
}));

// Optionally, you can define a custom hook to access and update the currentUser state
export const useCurrentUser = () => {
    const currentUser = useCurrentUserStore((state) => state.currentUser);
    const setCurrentUser = useCurrentUserStore((state) => state.setCurrentUser);

    return { currentUser, setCurrentUser };
};