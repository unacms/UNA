import { createContext, useState } from 'react';

export const BottomSheetData = createContext({});

export default function BottomSheetDataContext({ children }) {
    const [bottomSheetData, setBottomSheetData] = useState();

    return (
        <BottomSheetData.Provider value={{ bottomSheetData, setBottomSheetData }}>{children}</BottomSheetData.Provider>
    );
}