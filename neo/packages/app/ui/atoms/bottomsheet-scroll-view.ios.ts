import { ScrollView } from 'react-native';
import { BottomSheetScrollView as GorhomBottomSheetScrollView } from '@gorhom/bottom-sheet';
import { appSetting } from 'app/lib/util';

/**
 * iOS presents bottom sheets natively (`theme.expo_ui.bottom_sheet`, bottomsheet-native.ios.tsx),
 * where content scrolls in a plain ScrollView; @gorhom's needs its own sheet around it.
 */
export const BottomSheetScrollView = (
    appSetting('theme', 'expo_ui', 'bottom_sheet') ? ScrollView : GorhomBottomSheetScrollView
) as typeof GorhomBottomSheetScrollView;
