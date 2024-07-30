import { createContext, useState, useMemo, useCallback, useContext } from 'react';

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
}