import { createContext, useState, useMemo, useCallback, useContext, type ReactNode } from 'react';

/** Card-level UI state shared by a card and its parts (e.g. `hidden` after a delete). */
export type CardDataValue = { hidden?: boolean; [key: string]: unknown };

type CardDataContextValue = {
    cardData?: CardDataValue;
    setCardData?: (value: CardDataValue) => void;
};

export const CardData = createContext<CardDataContextValue>({});

export default function CardDataContext({ children }: { children?: ReactNode }) {
    const [cardData, setCardDataIn] = useState<CardDataValue>({hidden: false});

    const setCardData = useCallback((value: CardDataValue) => {
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
