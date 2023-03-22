import { createContext, useState, useContext } from 'react';

const CurrentUserContext = createContext(null);

export function CurrentUserProvider ({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    return (
        <CurrentUserContext.Provider value={{ currentUser, setCurrentUser }}>{children}</CurrentUserContext.Provider>
    );
}

export function useCurrentUser() {
    return useContext(CurrentUserContext);
}