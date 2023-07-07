import { createContext, useState } from 'react';

export const CardData = createContext({});

export default function CardDataContext({ children }) {
    const [cardData, setCardData] = useState({hidden: false});

    return (
        <CardData.Provider value={{ cardData, setCardData }}>{children}</CardData.Provider>
    );
}