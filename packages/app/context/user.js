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