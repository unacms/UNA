//import { createContext, useState, useMemo, useCallback, useContext } from 'react';
import { create } from 'zustand';
//const BottomSheetData = createContext({});
/*
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
}*/
/*
export function useBottomSheetData() {
    return useContext(BottomSheetData);
}*/

export const useBottomSheetStore = create((set) => ({
    bottomSheetData: null, // Initial state
    setBottomSheetData: (data) => set({ bottomSheetData: data }),
}));

export const useBottomSheetData = () => {
    const bottomSheetData = useBottomSheetStore((state) => state.bottomSheetData);
    const setBottomSheetData = useBottomSheetStore((state) => state.setBottomSheetData);

    return { bottomSheetData, setBottomSheetData };
};