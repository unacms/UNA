/**
 * Stub for @gorhom/bottom-sheet on web
 * 
 * This file provides empty/noop exports to prevent crashes if any code
 * accidentally imports @gorhom/bottom-sheet on web. All components should use
 * .web.js versions that don't import this library.
 */

import { View, ScrollView } from 'react-native';

// Noop function
const noop = () => {};

// Mock BottomSheetModal
export const BottomSheetModal = () => {
    return null;
};

// Mock BottomSheet
export const BottomSheet = () => {
    return null;
};

// Mock BottomSheetModalProvider - just render children
export const BottomSheetModalProvider = ({ children }) => children;

// Mock BottomSheetBackdrop
export const BottomSheetBackdrop = () => null;

// Mock BottomSheetScrollView - use regular ScrollView
export const BottomSheetScrollView = ScrollView;

// Mock BottomSheetFlatList
export const BottomSheetFlatList = View;

// Mock BottomSheetSectionList
export const BottomSheetSectionList = View;

// Mock BottomSheetView
export const BottomSheetView = View;

// Mock BottomSheetFooter
export const BottomSheetFooter = ({ children }) => children;

// Mock BottomSheetHandle
export const BottomSheetHandle = View;

// Mock BottomSheetTextInput
export const BottomSheetTextInput = View;

// Hooks
export const useBottomSheet = () => ({
    snapToIndex: noop,
    snapToPosition: noop,
    expand: noop,
    collapse: noop,
    close: noop,
    forceClose: noop,
});

export const useBottomSheetModal = () => ({
    dismiss: noop,
    dismissAll: noop,
    present: noop,
});

export const useBottomSheetDynamicSnapPoints = () => ({
    animatedSnapPoints: { value: [] },
    animatedHandleHeight: { value: 0 },
    animatedContentHeight: { value: 0 },
    handleContentLayout: noop,
});

export const useBottomSheetSpringConfigs = () => ({});
export const useBottomSheetTimingConfigs = () => ({});
export const useBottomSheetInternal = () => ({});

// Default export
export default BottomSheet;

