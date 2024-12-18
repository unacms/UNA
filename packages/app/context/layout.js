import { create } from 'zustand';

export const useLayoutDataStore = create((set) => ({
    layoutData: null, 
    setLayoutData: (value) => {
        set({ layoutData: value });
    },
}));

export const useLayoutData = () => {
    const layoutData = useLayoutDataStore((state) => state.layoutData);
    const setLayoutData = useLayoutDataStore((state) => state.setLayoutData);

    return { layoutData, setLayoutData };
};