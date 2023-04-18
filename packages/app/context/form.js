import { createContext, useState } from 'react';

export const FormContext = createContext({});

export default function FormContextProvider({ children }) {
    const [formContextData, setFormContextData] = useState();

    return (
        <FormContext.Provider value={{ formContextData, setFormContextData }}>{children}</FormContext.Provider>
    );
}