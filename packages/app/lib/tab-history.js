import { Platform } from 'react-native';
import { usePathname } from 'app/lib/hooks/router';
import emitter from 'app/context/emitter';
import { appSetting } from 'app/lib/util';
import { useBottomSheetStore } from 'app/context/bottomsheet';
import { getTabKeyFromPathname, parseTabKey } from 'app/lib/tab-path';

export { getTabKeyFromPathname, parseTabKey } from 'app/lib/tab-path';

export function useTabKey() {
    const pathname = usePathname();
    return getTabKeyFromPathname(pathname);
}

const OVERLAY_DISMISS_MS = Platform.OS === 'web' ? 0 : 120;

export function dismissNavigationOverlays() {
    const hadBottomSheet = !!useBottomSheetStore.getState().bottomSheetData;
    if (hadBottomSheet) {
        useBottomSheetStore.getState().setBottomSheetData(null);
    }
    emitter.emit('link', { action: 'pressed' });
    emitter.emit('dynamic_menu', { action: 'hide' });
    emitter.emit('editor', { action: 'blur' });
    return hadBottomSheet;
}

/** In-tab Expo Router href. Always includes `name` so later lookups stay valid. */
export function nativeTabHref(url, tabPath = '/tab0', extraParams) {
    const normalized = String(tabPath || '/tab0');
    const key = getTabKeyFromPathname(normalized.startsWith('/') ? normalized : `/${normalized}`);
    const name = key.replace(/^\//, '') || 'tab0';
    return {
        pathname: `/${name}`,
        params: { url, name, ...(extraParams || {}) },
    };
}

const tabHistoryState = {
    byTab: {},
};

function getTabIndex(tabKey = '/tab0') {
    const match = String(tabKey).match(/^\/tab(\d+)$/);
    return match ? Number(match[1]) : 0;
}

function getTabRootUrl(tabKey, currentUser) {
    const tabListKey = currentUser ? 'menu_tabbar_logged' : 'menu_tabbar_non_logged';
    const tabList = appSetting('menu_items', tabListKey) || [];
    const tab = tabList[getTabIndex(tabKey)];
    if (!tab) {
        return '/home';
    }
    if (tab.url === '{profile}') {
        return currentUser?.url || '/home';
    }
    return tab.url || '/home';
}

function tabHistoryPath(url) {
    if (!url) return '';
    const path = String(url).split('?')[0];
    return (path === '/' || path === '') ? '/home' : path;
}

export function isTabHistoryExcluded(url) {
    if (!url) return true;
    const path = tabHistoryPath(url);
    const rules = appSetting('native', 'tab_history_exclude') || [];
    return rules.some((rule) => {
        if (typeof rule === 'string') return url === rule || path === rule || url.startsWith(rule) || path.startsWith(rule);
        if (rule?.prefix) return url.startsWith(rule.prefix) || path.startsWith(rule.prefix);
        if (rule?.regex) { try { return new RegExp(rule.regex).test(path); } catch { return false; } }
        return false;
    });
}

export function ensureTabHistory(tabKey, currentUser, initialUrl) {
    const key = parseTabKey(tabKey);
    if (!key) return;
    if (!tabHistoryState.byTab[key]) {
        const root = getTabRootUrl(key, currentUser);
        tabHistoryState.byTab[key] = [root];
        if (initialUrl && initialUrl !== root) {
            tabHistoryState.byTab[key].push(initialUrl);
        }
    }
}

export function pushTabHistory(tabKey, url, currentUser) {
    if (!url) return;
    const key = parseTabKey(tabKey);
    if (!key) return;
    ensureTabHistory(key, currentUser);
    const stack = tabHistoryState.byTab[key];
    if (stack[stack.length - 1] !== url) {
        stack.push(url);
    }
}

/** Same page, different submenu (conductor tabs) — do not create a back entry. */
export function replaceTabHistory(tabKey, url, currentUser) {
    if (!url) return;
    const key = parseTabKey(tabKey);
    if (!key) return;
    ensureTabHistory(key, currentUser);
    const stack = tabHistoryState.byTab[key];
    if (!stack.length) {
        stack.push(url);
        return;
    }
    stack[stack.length - 1] = url;
}

export function applyTabHistory(tabKey, url, currentUser, mode) {
    if (mode === 'replace') {
        replaceTabHistory(tabKey, url, currentUser);
        return;
    }
    pushTabHistory(tabKey, url, currentUser);
}

export function canGoBackInTab(tabKey) {
    const key = parseTabKey(tabKey);
    const stack = key ? tabHistoryState.byTab[key] : null;
    if (!stack || stack.length <= 1) return false;
    for (let i = stack.length - 2; i >= 0; i--) {
        if (!isTabHistoryExcluded(stack[i])) return true;
    }
    return false;
}

export function popTabHistory(tabKey, currentUser) {
    const key = parseTabKey(tabKey);
    if (!key) return undefined;
    ensureTabHistory(key, currentUser);
    const stack = tabHistoryState.byTab[key];
    if (stack.length > 1) {
        stack.pop();
    }
    while (stack.length > 1 && isTabHistoryExcluded(stack[stack.length - 1])) {
        stack.pop();
    }
    return stack[stack.length - 1];
}

export function getTabRoot(tabKey, currentUser) {
    const key = parseTabKey(tabKey);
    if (!key) return '/home';
    return getTabRootUrl(key, currentUser);
}

/** Swap in-tab URL to the previous history entry (cached feed, etc.) — no stack pop. */
export function navigateBackInTab(router, tabKey, currentUser) {
    const normalizedTabKey = parseTabKey(tabKey);
    if (!router || !normalizedTabKey) {
        return;
    }

    const targetUrl = canGoBackInTab(normalizedTabKey)
        ? popTabHistory(normalizedTabKey, currentUser)
        : getTabRoot(normalizedTabKey, currentUser);

    if (!targetUrl) {
        return;
    }

    const hadOverlay = dismissNavigationOverlays();
    const tabIndex = getTabIndex(normalizedTabKey);

    const navigate = () => {
        router.replace({
            pathname: normalizedTabKey,
            params: { url: targetUrl, name: `tab${tabIndex}`, tabHist: 'push' },
        });
    };

    if (hadOverlay && OVERLAY_DISMISS_MS > 0) {
        setTimeout(navigate, OVERLAY_DISMISS_MS);
    } else {
        navigate();
    }
}

export function resetAllTabHistory() {
    tabHistoryState.byTab = {};
}

export function resetTabHistory(tabKey, currentUser, initialUrl) {
    const key = parseTabKey(tabKey);
    if (!key) return;
    const rootUrl = getTabRootUrl(key, currentUser);
    tabHistoryState.byTab[key] = [rootUrl];
    if (initialUrl && initialUrl !== rootUrl) {
        tabHistoryState.byTab[key].push(initialUrl);
    }
}
