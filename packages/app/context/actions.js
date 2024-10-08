//import { createContext, useState, useMemo, useContext, useCallback } from 'react';
import { create } from 'zustand';
/*const ActionsData = createContext({});

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
}*/

export const useActionsDataStore = create((set) => ({
    actionsData: null, // Initial state
    setActionsData: (data) => set({ actionsData: data }),
}));

export const useActionsData = () => {
    const actionsData = useActionsDataStore((state) => state.actionsData);
    const setActionsData = useActionsDataStore((state) => state.setActionsData);

    return { actionsData, setActionsData };
};