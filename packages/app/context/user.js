import { createContext, useState, useContext, useMemo } from 'react';

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
}

/*
import { createContext, useState, useContext, useMemo } from 'react';
import { create } from 'zustand';
import { compare_objects } from 'app/lib/util'
const CurrentUserContext = createContext(null);

export const useCurrentUserStore = create((set, get) => ({
    currentUser: null, // Initial state

    // Setter function with deep comparison check using lodash's isEqual
    setCurrentUser: (newUser) => {
        const currentUser = get().currentUser;

        // Only update if the objects are not deeply equal
        if (!compare_objects(currentUser, newUser)) {
            set(() => ({ currentUser: newUser }));
        }
    },
}));

// Optionally, you can define a custom hook to access and update the currentUser state
export const useCurrentUser = () => {
    const currentUser = useCurrentUserStore((state) => state.currentUser);
    const setCurrentUser = useCurrentUserStore((state) => state.setCurrentUser);

    return { currentUser, setCurrentUser };
};*/