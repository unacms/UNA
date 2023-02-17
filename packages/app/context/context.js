/*
 * TODO: Was used for GLOBAL context and isn't used now.
 * Remove if won't be used anymore.
 */

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