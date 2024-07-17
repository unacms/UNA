import { createContext, useState, useMemo, useCallback, useContext } from 'react';

export const CardData = createContext({});

export default function CardDataContext({ children }) {
    const [cardData, setCardDataIn] = useState({hidden: false});

    const setCardData = useCallback((value) => {
        setCardDataIn(value);
    }, []);


    const contextValue = useMemo(() => ({
        cardData,
        setCardData
    }), [cardData, setCardData]);

    return (
        <CardData.Provider value={contextValue}>{children}</CardData.Provider>
    );
}


export function useCardData() {
    return useContext(CardData);
}