import type { ReactNode } from 'react';
import { create } from 'zustand';

/** A menu row in a bottom sheet (a DropdownMenu item). */
export type BottomSheetMenuItem = {
    id?: string | number;
    type?: 'group_header' | 'separator' | string;
    title?: unknown;
    icon?: string;
    selected?: boolean;
    [key: string]: unknown;
};

/**
 * A menu's rows as data, next to the `content` that renders them, so a native sheet can draw
 * them itself (iOS). `onPress` closes the sheet and runs the row's action.
 */
export type BottomSheetMenu = {
    items: BottomSheetMenuItem[];
    onPress: (item: any, event?: unknown) => void;
};

/** Bottom sheet request: `false`/`null` closes; an object opens it (see MenuBottomSheet / layout). */
export type BottomSheetData = {
    content?: ReactNode;
    snapPoints?: (string | number)[];
    showClose?: boolean;
    menu?: BottomSheetMenu;
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