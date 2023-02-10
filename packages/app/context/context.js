import { createContext, useState } from "react";

export const GlobalsData = createContext(null);

export default function Context({ children }) {
    const [globals, setGlobals] = useState();

    return (
        <GlobalsData.Provider value={{ globals, setGlobals }}>
            {children}
        </GlobalsData.Provider>
    );
}