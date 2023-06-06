import { createContext, useState, useContext } from 'react';

export const CurrentUserContext = createContext(null);

export function CurrentUserProvider ({ children }) {
    const [currentUser, setCurrentUser] = useState(-1);
    return (
        <CurrentUserContext.Provider value={{ currentUser, setCurrentUser }}>{children}</CurrentUserContext.Provider>
    );
}

export function useCurrentUser() {
    return useContext(CurrentUserContext);
}