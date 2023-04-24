import { createContext, useState } from 'react';

export const ActionsData = createContext({});

export default function ActionsDataContext({ children }) {
    const [actionsData, setActionsData] = useState();

    return (
        <ActionsData.Provider value={{ actionsData, setActionsData }}>{children}</ActionsData.Provider>
    );
}