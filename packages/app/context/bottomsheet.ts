import type { ReactNode } from 'react';
import { create } from 'zustand';

/** Bottom sheet request: `false`/`null` closes; an object opens it (see MenuBottomSheet / layout). */
export type BottomSheetData = {
    content?: ReactNode;
    snapPoints?: (string | number)[];
    showClose?: boolean;
    [key: string]: unknown;
} | false | null;

type BottomSheetStore = {
    bottomSheetData: BottomSheetData;
    setBottomSheetData: (data: BottomSheetData) => void;
};

export const useBottomSheetStore = create<BottomSheetStore>()((set) => ({
    bottomSheetData: null, // Initial state
    setBottomSheetData: (data) => set({ bottomSheetData: data }),
}));

export const useBottomSheetData = () => {
    const bottomSheetData = useBottomSheetStore((state) => state.bottomSheetData);
    const setBottomSheetData = useBottomSheetStore((state) => state.setBottomSheetData);

    return { bottomSheetData, setBottomSheetData };
};