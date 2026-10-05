import type { NativeMoreSheetProps } from 'app/components/nav/tabs/more-sheet.types';

/** Android / web keep the JS `DropdownMenu` popup for More; iOS has a native sheet. */
export const hasNativeMoreSheet = false;

export function NativeMoreSheet(_props: NativeMoreSheetProps) {
    return null;
}
