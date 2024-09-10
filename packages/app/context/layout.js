/*import { createContext, useState, useMemo, useCallback, useContext } from 'react';

const LayoutData = createContext({});

export default function LayoutDataContext({ children }) {
    const [layoutData, setLayoutDataIn] = useState();

    const setLayoutData = useCallback((value) => {
       // console.log("setLayoutData", value)
        setLayoutDataIn(value);
    }, []);

    const contextValue = useMemo(() => ({
        layoutData,
        setLayoutData
    }), [layoutData, setLayoutData]);

    return (
        <LayoutData.Provider value={contextValue}>{children}</LayoutData.Provider>
    );
}

export function useLayoutData() {
    return useContext(LayoutData);
}*/

import { create } from 'zustand';

export const useLayoutDataStore = create((set) => ({
    layoutData: null, 
    setLayoutData: (value) => {
        set({ layoutData: value });
    },
}));

// Optionally, create a custom hook to access layoutData and setLayoutData
export const useLayoutData = () => {
    const layoutData = useLayoutDataStore((state) => state.layoutData);
    const setLayoutData = useLayoutDataStore((state) => state.setLayoutData);

    return { layoutData, setLayoutData };
};