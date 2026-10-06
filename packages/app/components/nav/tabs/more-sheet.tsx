import type { NativeMoreSheetProps } from 'app/components/nav/tabs/more-sheet.types';

/** Web keeps the JS `DropdownMenu` popup for More; iOS and Android have native sheets. */
export const hasNativeMoreSheet = false;

export function NativeMoreSheet(_props: NativeMoreSheetProps) {
    return null;
}
