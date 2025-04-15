import { create } from 'zustand';
import { useCallback } from 'react';

export const useLayoutDataStore = create((set) => ({
    layoutData: null, 
    setLayoutData: (value) => {
        set({ layoutData: value });
    },
}));

export const useLayoutData = () => {
    const layoutData = useLayoutDataStore((state) => state.layoutData);
    const setLayoutData = useCallback(
        (value) => useLayoutDataStore.getState().setLayoutData(value),
        []
    );

    return { layoutData, setLayoutData };
};