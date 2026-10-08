import { appSetting } from 'app/lib/util';
import { useNativeTokenColor } from 'app/design/controls/neo-button/native-style-colors';

/**
 * Tab bar colors from `theme.native_tabs` (JS tabs and NativeTabs): the
 * selected tab's ink and indicator (the toggled look of selected glass
 * buttons) and the badge fill. Hex or `bg-*` / `text-*` tokens.
 */
export function useTabBarColors(colors) {
    const selected = appSetting('theme', 'native_tabs', 'selected');
    const selectedInk = useNativeTokenColor(selected?.foreground) || colors.primary;
    const selectedIndicator = useNativeTokenColor(selected?.indicator) || colors.primaryBg;
    const badgeBackground = useNativeTokenColor(appSetting('theme', 'native_tabs', 'badgeBackground') || 'bg-destructive');
    return { selectedInk, selectedIndicator, badgeBackground };
}
