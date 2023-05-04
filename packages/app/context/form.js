import { createContext, useState } from 'react';

export const FormExContext = createContext({});

export default function FormExContextProvider({ children }) {
    const [formExContextData, setFormExContextData] = useState();

    return (
        <FormExContext.Provider value={{ formExContextData, setFormExContextData }}>{children}</FormExContext.Provider>
    );
}