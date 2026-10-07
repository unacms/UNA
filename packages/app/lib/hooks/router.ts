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
import { getSelectedTabKey, getTabKeyFromPathname } from 'app/lib/navigation/tab-path';
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
    // A pushed page's key is `/tab0/page#…`: the tab is its first segment.
    if (isTabScopedChromeKey(chromeKey)) return getTabKeyFromPathname(chromeKey);
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

/**
 * App path for a redirect target. The API can answer a page request with a
 * redirect to its own absolute request URL (`https://api…/path?r=system/
 * get_page_by_request…`); the page is its path.
 */
function toAppPath(url: string): string {
    const absolute = /^https?:\/\/[^/]+(\/[^?#]*)?(\?[^#]*)?/i.exec(url || '');
    if (absolute) {
        const path = absolute[1] || '/';
        const query = absolute[2] || '';
        return /[?&]r=system(%2F|\/)get_page/i.test(query) ? path : path + query;
    }
    return url?.startsWith('/') ? url : `/${url}`;
}

/**
 * Native: open `url` in place of the current page. In the focused tab that is
 * the screen on top of its stack (tab root or a pushed page), so its params
 * change and nothing is pushed; another tab gets its root replaced.
 */
export function redirectTo(router: RouterLike, url: string, tabname = getSelectedTabKey() || '/tab0'): void {
    const normalizedUrl = toAppPath(url);
    const params = { url: normalizedUrl, refresh: Date.now() };

    if (router.setParams && getTabKeyFromPathname(tabname) === getSelectedTabKey()) {
        router.setParams(params);
        return;
    }
    router.replace({ pathname: getTabKeyFromPathname(tabname), params });
}
