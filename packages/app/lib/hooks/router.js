export { 
    useLocalSearchParams,
    useRouter,
    useNavigation,
    useGlobalSearchParams,
    Link,
    Stack,
    Redirect,
    Tabs,
} from 'expo-router';

export { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useContext, useEffect, useRef } from 'react';
import {
    useFocusEffect as useFocusEffectImpl,
    usePathname as usePathnameImpl,
} from 'expo-router';
import { useIsFocused as useIsFocusedImpl } from 'expo-router/react-navigation';
import { useSafeAreaInsets as useSafeAreaInsetsImpl, initialWindowMetrics } from 'react-native-safe-area-context';
import { TabRouteOverrideContext } from 'app/context/tab-route-override';
import { isTabScopedChromeKey, useTabChromeKey } from 'app/context/tab-chrome';
import { getTabKeyFromPathname } from 'app/lib/tab-history';

export function usePathname() {
    const override = useContext(TabRouteOverrideContext);
    const pathname = usePathnameImpl();
    return override?.pathname ?? pathname;
}

/** Current bottom-tab path (`/tab0`…). Prefers the screen chrome key — NativeTabs has no `name` param. */
export function useCurrentTabPath() {
    const chromeKey = useTabChromeKey();
    const pathname = usePathname();
    if (isTabScopedChromeKey(chromeKey)) return chromeKey;
    return getTabKeyFromPathname(pathname);
}

export function useIsFocused() {
    const override = useContext(TabRouteOverrideContext);
    const focused = useIsFocusedImpl();
    if (override && typeof override.isFocused === 'boolean') {
        return override.isFocused;
    }
    return focused;
}

export function useFocusEffect(effect) {
    const override = useContext(TabRouteOverrideContext);
    const hasOverride = !!override;
    useFocusEffectImpl(useCallback(() => {
        if (hasOverride) return undefined;
        return effect();
    }, [effect, hasOverride]));

    useEffect(() => {
        if (!override?.isFocused) return undefined;
        return effect();
    }, [effect, override?.isFocused]);
}

const EMPTY_INSETS = { top: 0, right: 0, bottom: 0, left: 0 };

export function getWindowSafeAreaInsets() {
    return initialWindowMetrics?.insets ?? EMPTY_INSETS;
}

/**
 * Chrome insets that stay put when the keyboard opens or a nested
 * SafeAreaProvider (NativeTabs) reports top=0 / bottom=keyboard.
 */
export function useStableSafeAreaInsets() {
    const insets = useSafeAreaInsetsImpl();
    const win = getWindowSafeAreaInsets();
    const chromeRef = useRef({
        top: Math.max(insets.top, win.top),
        bottom: win.bottom || (insets.bottom > 0 && insets.bottom < 80 ? insets.bottom : 0),
    });
    const chrome = chromeRef.current;
    if (insets.top > chrome.top) chrome.top = insets.top;
    if (win.top > chrome.top) chrome.top = win.top;
    if (win.bottom > chrome.bottom) chrome.bottom = win.bottom;
    if (insets.bottom > 0 && insets.bottom < 80 && insets.bottom > chrome.bottom) {
        chrome.bottom = insets.bottom;
    }
    return {
        top: chrome.top,
        right: Math.max(insets.right, win.right),
        left: Math.max(insets.left, win.left),
        bottom: chrome.bottom,
    };
}

export function goBack(navigation, router, callback) {
    if (callback) {
        callback();
        return;
    }

    const canPopStack =
        navigation?.getState?.()?.index > 0 ||
        navigation?.canGoBack?.();

    if (canPopStack) {
        if (navigation?.canGoBack?.()) {
            navigation.goBack();
        } else {
            router.back();
        }
    }
}

export function redirectTo(router, url, tabname = '/tab0') {
    const normalizedUrl = url?.startsWith('/') ? url : `/${url}`;

    router.replace({
        pathname: tabname,
        params: { url: normalizedUrl, refresh: Date.now() }
    })
}
