import { Platform } from 'react-native';
import emitter from 'app/context/emitter';
import { appSetting } from 'app/lib/util';
import { useBottomSheetStore } from 'app/context/bottomsheet';

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

export function getTabKeyFromPathname(pathname) {
    const match = String(pathname || '').match(/\/(tab\d+)(?:\/|$)/);
    return match ? `/${match[1]}` : '/tab0';
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
    if (!tabHistoryState.byTab[tabKey]) {
        const root = getTabRootUrl(tabKey, currentUser);
        tabHistoryState.byTab[tabKey] = [root];
        if (initialUrl && initialUrl !== root) {
            tabHistoryState.byTab[tabKey].push(initialUrl);
        }
    }
}

export function pushTabHistory(tabKey, url, currentUser) {
    if (!tabKey || !url) {
        return;
    }
    ensureTabHistory(tabKey, currentUser);
    const stack = tabHistoryState.byTab[tabKey];
    if (stack[stack.length - 1] !== url) {
        stack.push(url);
    }
}

export function canGoBackInTab(tabKey) {
    const stack = tabHistoryState.byTab[tabKey];
    if (!stack || stack.length <= 1) return false;
    for (let i = stack.length - 2; i >= 0; i--) {
        if (!isTabHistoryExcluded(stack[i])) return true;
    }
    return false;
}

export function popTabHistory(tabKey, currentUser) {
    ensureTabHistory(tabKey, currentUser);
    const stack = tabHistoryState.byTab[tabKey];
    if (stack.length > 1) {
        stack.pop();
    }
    while (stack.length > 1 && isTabHistoryExcluded(stack[stack.length - 1])) {
        stack.pop();
    }
    return stack[stack.length - 1];
}

export function getTabRoot(tabKey, currentUser) {
    return getTabRootUrl(tabKey, currentUser);
}

/** Swap in-tab URL to the previous history entry (cached feed, etc.) — no stack pop. */
export function navigateBackInTab(router, tabKey, currentUser) {
    if (!router || !tabKey) {
        return;
    }

    const normalizedTabKey = getTabKeyFromPathname(tabKey);
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
            params: { url: targetUrl, name: `tab${tabIndex}` },
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
    if (!tabKey) return;
    const rootUrl = getTabRoot(tabKey, currentUser);
    tabHistoryState.byTab[tabKey] = [rootUrl];
    if (initialUrl && initialUrl !== rootUrl) {
        tabHistoryState.byTab[tabKey].push(initialUrl);
    }
}
