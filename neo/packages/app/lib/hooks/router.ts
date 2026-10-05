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
import { getTabKeyFromPathname } from 'app/lib/navigation/tab-path';
import type { NavigationLike, RouterLike, SafeAreaInsets } from './router.types';

type TabRouteOverride = { pathname?: string; isFocused?: boolean } | null;

export function usePathname(): string {
    const override = useContext(TabRouteOverrideContext) as TabRouteOverride;
    const pathname = usePathnameImpl();
    return override?.pathname ?? pathname;
}

/** Current bottom-tab path (`/tab0`…). Prefers the screen chrome key — NativeTabs has no `name` param. */
export function useCurrentTabPath(): string {
    const chromeKey = useTabChromeKey();
    const pathname = usePathname();
    if (isTabScopedChromeKey(chromeKey)) return chromeKey;
    return getTabKeyFromPathname(pathname);
}

export function useIsFocused(): boolean {
    const override = useContext(TabRouteOverrideContext) as TabRouteOverride;
    const focused = useIsFocusedImpl();
    if (override && typeof override.isFocused === 'boolean') {
        return override.isFocused;
    }
    return focused;
}

export function useFocusEffect(effect: () => void | (() => void)): void {
    const override = useContext(TabRouteOverrideContext) as TabRouteOverride;
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

const EMPTY_INSETS: SafeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };

export function getWindowSafeAreaInsets(): SafeAreaInsets {
    return initialWindowMetrics?.insets ?? EMPTY_INSETS;
}

/**
 * Chrome insets that stay put when the keyboard opens or a nested
 * SafeAreaProvider (NativeTabs) reports top=0 / bottom=keyboard.
 */
export function useStableSafeAreaInsets(): SafeAreaInsets {
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

export function goBack(navigation: NavigationLike, router: RouterLike, callback?: () => void): void {
    if (callback) {
        callback();
        return;
    }

    const canPopStack =
        (navigation?.getState?.()?.index ?? 0) > 0 ||
        navigation?.canGoBack?.();

    if (canPopStack) {
        if (navigation?.canGoBack?.()) {
            navigation.goBack?.();
        } else {
            router.back?.();
        }
    }
}

/** Native: open `url` inside a tab by replacing the tab route (`?url=…`). */
export function redirectTo(router: RouterLike, url: string, tabname = '/tab0'): void {
    const normalizedUrl = url?.startsWith('/') ? url : `/${url}`;

    router.replace({
        pathname: tabname,
        params: { url: normalizedUrl, refresh: Date.now() }
    })
}
