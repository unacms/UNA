import { createContext, useState } from 'react';

export const PageData = createContext({});

export default function PageDataContext({ children }) {
    const [pageData, setPageData] = useState();

    return (
        <PageData.Provider value={{ pageData, setPageData }}>{children}</PageData.Provider>
    );
}