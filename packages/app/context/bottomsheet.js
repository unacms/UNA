import { createContext, useState, useMemo, useCallback, useContext } from 'react';

const BottomSheetData = createContext({});

export default function BottomSheetDataContext({ children }) {
    const [bottomSheetData, setBottomSheetDataIn] = useState();

    const setBottomSheetData = useCallback((value) => {
        setBottomSheetDataIn(value);
    }, []);

    const contextValue = useMemo(() => ({
        bottomSheetData,
        setBottomSheetData
    }), [bottomSheetData, setBottomSheetData]);

    return (
        <BottomSheetData.Provider value={contextValue}>{children}</BottomSheetData.Provider>
    );
}

export function useBottomSheetData() {
    return useContext(BottomSheetData);
}