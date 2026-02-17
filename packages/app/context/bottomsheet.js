import { create } from 'zustand';

export const useBottomSheetStore = create((set) => ({
    bottomSheetData: null, // Initial state
    setBottomSheetData: (data) => set({ bottomSheetData: data }),
}));

export const useBottomSheetData = () => {
    const bottomSheetData = useBottomSheetStore((state) => state.bottomSheetData);
    const setBottomSheetData = useBottomSheetStore((state) => state.setBottomSheetData);

    return { bottomSheetData, setBottomSheetData };
};