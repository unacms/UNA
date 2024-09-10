import { createContext, useState, useContext, useMemo } from 'react';
import { create } from 'zustand';
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
export const useCurrentUserStore = create((set) => ({
    currentUser: null, // Initial state
    setCurrentUser: (data) => set({ currentUser: data }),
}));


export const useCurrentUser = () => {
    const currentUser = useCurrentUserStore((state) => state.currentUser);
    const setCurrentUser = useCurrentUserStore((state) => state.setCurrentUser);

    return { currentUser, setCurrentUser };
};*/