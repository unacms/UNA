import { Stack } from 'expo-router';
import { isAndroid, isNativeTabsEnabled } from 'app/lib/util';
import { useTheme, useThemeName } from 'app/design/theme';

const NativeTabPressSync = isNativeTabsEnabled()
    ? require('./native-tab-press-sync').default
    : null;

/**
 * Native stack inside one bottom tab: the tab root (`index`) with pages pushed
 * over it (`page?url=`), so iOS gets the interactive edge swipe back and
 * Android its system back, with the previous page still mounted underneath.
 * The app draws its own floating header, so the native bar stays hidden.
 *
 * This layout is the tab navigator's screen, so the tab's `tabPress`
 * listener (re-tap, external links, notification clear) lives here — inside
 * a stack page `useNavigation()` is the stack's, which never sees tab presses.
 */
export function TabStackLayout({ tabKey }) {
    const { colors } = useTheme();
    // Android: the native stack sets the status bar icons for each screen it
    // shows, light by default — white on the light theme. Follow the theme.
    const statusBarStyle = useThemeName() === 'dark' ? 'light' : 'dark';
    return (
        <>
            {NativeTabPressSync ? <NativeTabPressSync tabKey={tabKey} /> : null}
            <Stack
                screenOptions={{
                    headerShown: false,
                    gestureEnabled: true,
                    contentStyle: { backgroundColor: colors.background },
                    ...(isAndroid ? { statusBarStyle } : null),
                }}
            />
        </>
    );
}
