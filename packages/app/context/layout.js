import { createContext, useState } from 'react';

export const LayoutData = createContext({});

export default function LayoutDataContext({ children }) {
    const [layoutData, setLayoutData] = useState();

    return (
        <LayoutData.Provider value={{ layoutData, setLayoutData }}>{children}</LayoutData.Provider>
    );
}