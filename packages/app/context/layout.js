import { create } from 'zustand';
import { useCallback } from 'react';

export const useLayoutDataStore = create((set) => ({
    layoutData: null, 
    setLayoutData: (value) => {
        set({ layoutData: value });
    },
}));

export const useSetLayoutData = () => {
    return useCallback(
        (value) => useLayoutDataStore.getState().setLayoutData(value),
        []
    );
};
export const useLayoutData = () => {
    const layoutData = useLayoutDataStore((state) => state.layoutData);
    const setLayoutData = useSetLayoutData();
    return { layoutData, setLayoutData };
};