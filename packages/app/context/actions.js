import { createContext, useState, useMemo, useContext, useCallback } from 'react';

const ActionsData = createContext({});

export default function ActionsDataContext({ children }) {
    const [actionsData, setActionsDataIn] = useState();

    const setActionsData = useCallback((value) => {
        setActionsDataIn(value);
    }, []);

    const contextValue = useMemo(() => ({
        actionsData,
        setActionsData
    }), [actionsData, setActionsData]);

    return (
        <ActionsData.Provider value={contextValue}>{children}</ActionsData.Provider>
    );
}

export function useActionsData() {
    return useContext(ActionsData);
}