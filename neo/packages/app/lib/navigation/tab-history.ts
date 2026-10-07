import { Platform } from 'react-native';
import { usePathname } from 'app/lib/hooks/router';
import emitter, { EVENTS } from 'app/context/emitter';
import { appSetting } from 'app/lib/util';
import { useBottomSheetStore } from 'app/context/bottomsheet';
import { getSelectedTabKey, getTabKeyFromPathname, parseTabKey, setSelectedTabKey } from 'app/lib/navigation/tab-path';

export { getTabKeyFromPathname, parseTabKey } from 'app/lib/navigation/tab-path';

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
    emitter.emit(EVENTS.link, { action: 'pressed' });
    emitter.emit(EVENTS.dynamicMenu, { action: 'hide' });
    emitter.emit(EVENTS.editor, { action: 'blur' });
    return hadBottomSheet;
}

/** In-tab Expo Router href. Always includes `name` so later lookups stay valid. */
export function nativeTabHref(url: string | null | undefined, tabPath = '/tab0', extraParams?: Record<string, unknown>) {
    const normalized = String(tabPath || '/tab0');
    const key = getTabKeyFromPathname(normalized.startsWith('/') ? normalized : `/${normalized}`);
    const name = key.replace(/^\//, '') || 'tab0';
    return {
        pathname: `/${name}`,
        params: { url, name, ...(extraParams || {}) },
    };
}

/**
 * In-tab link on native: a page pushed onto the tab's stack (`/tab0/page?url=`),
 * or the tab root itself when `url` is that tab's root page — navigating there
 * pops back to it instead of stacking a second copy.
 */
export function nativeTabPageHref(url: string | null | undefined, tabPath = '/tab0', currentUser?: unknown) {
    const key = getTabKeyFromPathname(tabPath);
    // The root check needs the session (logged-in and guest tab lists differ).
    const isRoot = currentUser !== undefined
        && tabHistoryPath(url) === tabHistoryPath(getTabRootUrl(key, currentUser));
    if (!url || isRoot) {
        return { pathname: key };
    }
    return { pathname: `${key}/page`, params: { url } };
}

/** Pages pushed onto each tab's stack and still mounted (page.tsx screens). */
const pushedScreensByTab = new Map<string, number>();

/** Called by a pushed page while mounted; returns its cleanup. */
export function registerPushedScreen(tabKey: string | null | undefined) {
    const key = parseTabKey(tabKey);
    if (!key) return () => {};
    pushedScreensByTab.set(key, (pushedScreensByTab.get(key) ?? 0) + 1);
    return () => {
        pushedScreensByTab.set(key, Math.max(0, (pushedScreensByTab.get(key) ?? 1) - 1));
    };
}

/** True while the tab has pages pushed over its root. */
export function hasPushedScreens(tabKey: string | null | undefined) {
    const key = parseTabKey(tabKey);
    return !!key && (pushedScreensByTab.get(key) ?? 0) > 0;
}

type TabHistoryState = {
    /** Back stack of in-tab URLs per tab key (`/tab0`…). */
    byTab: Record<string, string[]>;
    lastUrlByTab: Record<string, string | undefined>;
    skipTabInfer: boolean;
    skipTabInferPath: string | null;
};

const tabHistoryState: TabHistoryState = {
    byTab: {},
    lastUrlByTab: {},
    skipTabInfer: false,
    // Path the latest tab press already applied skip for. Survives Strict
    // remount after consume(), so we do not re-infer that navigation.
    skipTabInferPath: null,
};

function getTabIndex(tabKey: string | null | undefined = '/tab0') {
    const match = String(tabKey).match(/^\/tab(\d+)$/);
    return match ? Number(match[1]) : 0;
}

function getTabRootUrl(tabKey: string | null | undefined, currentUser: unknown) {
    const tabListKey = currentUser ? 'menu_tabbar_logged' : 'menu_tabbar_non_logged';
    const tabList = appSetting('menu_items', tabListKey) || [];
    const tab = tabList[getTabIndex(tabKey)];
    if (!tab) {
        return '/home';
    }
    if (tab.url === '{profile}') {
        return (currentUser as { url?: string } | null)?.url || '/home';
    }
    return tab.url || '/home';
}

function tabHistoryPath(url: string | null | undefined) {
    if (!url) return '';
    const path = String(url).split('?')[0]!;
    return (path === '/' || path === '') ? '/home' : path;
}

export function isTabHistoryExcluded(url: string | null | undefined) {
    if (!url) return true;
    const path = tabHistoryPath(url);
    const rules = appSetting('native', 'tab_history_exclude') || [];
    return rules.some((rule: string | { prefix?: string; regex?: string }) => {
        if (typeof rule === 'string') return url === rule || path === rule || url.startsWith(rule) || path.startsWith(rule);
        if (rule?.prefix) return url.startsWith(rule.prefix) || path.startsWith(rule.prefix);
        if (rule?.regex) { try { return new RegExp(rule.regex).test(path); } catch { return false; } }
        return false;
    });
}

export function ensureTabHistory(tabKey: string | null | undefined, currentUser: unknown, initialUrl?: string) {
    const key = parseTabKey(tabKey);
    if (!key) return;
    if (!tabHistoryState.byTab[key]) {
        const root = getTabRootUrl(key, currentUser);
        tabHistoryState.byTab[key] = [root];
        tabHistoryState.lastUrlByTab[key] = root;
        if (initialUrl && initialUrl !== root) {
            tabHistoryState.byTab[key].push(initialUrl);
            tabHistoryState.lastUrlByTab[key] = initialUrl;
        }
    }
}

export function pushTabHistory(tabKey: string | null | undefined, url: string | null | undefined, currentUser: unknown) {
    if (!url) return;
    const key = parseTabKey(tabKey);
    if (!key) return;
    ensureTabHistory(key, currentUser);
    const stack = tabHistoryState.byTab[key]!; // ensureTabHistory() above guarantees it
    if (stack[stack.length - 1] !== url) {
        stack.push(url);
    }
    tabHistoryState.lastUrlByTab[key] = stack[stack.length - 1];
}

/** Same page, different submenu (conductor tabs) — do not create a back entry. */
export function replaceTabHistory(tabKey: string | null | undefined, url: string | null | undefined, currentUser: unknown) {
    if (!url) return;
    const key = parseTabKey(tabKey);
    if (!key) return;
    ensureTabHistory(key, currentUser);
    const stack = tabHistoryState.byTab[key]!; // ensureTabHistory() above guarantees it
    if (!stack.length) {
        stack.push(url);
        tabHistoryState.lastUrlByTab[key] = url;
        return;
    }
    stack[stack.length - 1] = url;
    tabHistoryState.lastUrlByTab[key] = url;
}

export function applyTabHistory(tabKey: string | null | undefined, url: string | null | undefined, currentUser: unknown, mode?: 'push' | 'replace' | 'reset') {
    if (mode === 'reset') {
        resetTabHistory(tabKey, currentUser);
        return;
    }
    if (mode === 'replace') {
        replaceTabHistory(tabKey, url, currentUser);
        return;
    }
    pushTabHistory(tabKey, url, currentUser);
}

export function rememberSelectedTab(tabKey: string | null | undefined, options?: { fromPress?: boolean }) {
    const key = parseTabKey(tabKey);
    if (key) {
        setSelectedTabKey(key);
        if (options?.fromPress) {
            tabHistoryState.skipTabInfer = true;
            tabHistoryState.skipTabInferPath = null;
        }
    }
}

/** Read-only. Safe during render. */
export function shouldSkipTabInfer(pathname: string | null | undefined) {
    if (tabHistoryState.skipTabInfer) return true;
    if (!pathname) return false;
    return tabHistoryState.skipTabInferPath === pathname;
}

/**
 * Honor a tab-press skip for this pathname. Mutates — call from an effect.
 * The same path keeps returning true after consume so Strict remount
 * does not infer a different tab for that navigation.
 */
export function consumeSkipTabInfer(pathname: string | null | undefined) {
    if (pathname && tabHistoryState.skipTabInferPath === pathname) {
        return true;
    }
    const skip = tabHistoryState.skipTabInfer;
    tabHistoryState.skipTabInfer = false;
    if (skip && pathname) {
        tabHistoryState.skipTabInferPath = pathname;
    }
    return skip;
}

export function getSelectedTab() {
    return getSelectedTabKey();
}

export function isSelectedTab(tabKey: string | null | undefined) {
    const key = parseTabKey(tabKey);
    return !!key && getSelectedTabKey() === key;
}

/** Last in-tab page for restore. Does not change the native back stack. */
export function rememberTabLastUrl(tabKey: string | null | undefined, url: string | null | undefined) {
    if (!url || isTabHistoryExcluded(url)) return;
    const key = parseTabKey(tabKey);
    if (!key) return;
    tabHistoryState.lastUrlByTab[key] = url;
}

export function peekTabLastUrl(tabKey: string | null | undefined) {
    const key = parseTabKey(tabKey);
    if (!key) return undefined;
    if (tabHistoryState.lastUrlByTab[key]) {
        return tabHistoryState.lastUrlByTab[key];
    }
    const stack = tabHistoryState.byTab[key]!; // ensureTabHistory() above guarantees it
    return stack?.[stack.length - 1];
}

export function isAtTabRoot(tabKey: string | null | undefined, currentUser: unknown) {
    const key = parseTabKey(tabKey);
    if (!key) return true;
    const root = tabHistoryPath(getTabRootUrl(key, currentUser));
    const last = tabHistoryPath(peekTabLastUrl(key));
    return !last || last === root;
}

/** Inactive tab → last page in that tab; active tab → its root. */
export function resolveTabBarHref(tabKey: string | null | undefined, rootUrl: string | null | undefined) {
    const root = rootUrl || '/home';
    if (isSelectedTab(tabKey)) return root;
    return peekTabLastUrl(tabKey) || root;
}

export function canGoBackInTab(tabKey: string | null | undefined) {
    const key = parseTabKey(tabKey);
    const stack = key ? tabHistoryState.byTab[key] : null;
    if (!stack || stack.length <= 1) return false;
    for (let i = stack.length - 2; i >= 0; i--) {
        if (!isTabHistoryExcluded(stack[i])) return true;
    }
    return false;
}

export function popTabHistory(tabKey: string | null | undefined, currentUser: unknown) {
    const key = parseTabKey(tabKey);
    if (!key) return undefined;
    ensureTabHistory(key, currentUser);
    const stack = tabHistoryState.byTab[key]!; // ensureTabHistory() above guarantees it
    if (stack.length > 1) {
        stack.pop();
    }
    while (stack.length > 1 && isTabHistoryExcluded(stack[stack.length - 1])) {
        stack.pop();
    }
    tabHistoryState.lastUrlByTab[key] = stack[stack.length - 1];
    return stack[stack.length - 1];
}

export function getTabRoot(tabKey: string | null | undefined, currentUser: unknown) {
    const key = parseTabKey(tabKey);
    if (!key) return '/home';
    return getTabRootUrl(key, currentUser);
}

function replaceInTab(router: any, tabKey: string | null | undefined, targetUrl: string, tabHist: string) {
    const hadOverlay = dismissNavigationOverlays();
    const tabIndex = getTabIndex(tabKey);

    const navigate = () => {
        router.replace({
            pathname: tabKey,
            params: { url: targetUrl, name: `tab${tabIndex}`, tabHist },
        });
    };

    if (hadOverlay && OVERLAY_DISMISS_MS > 0) {
        setTimeout(navigate, OVERLAY_DISMISS_MS);
    } else {
        navigate();
    }
}

/** Swap in-tab URL to the previous history entry (cached feed, etc.) — one stack pop. */
export function navigateBackInTab(router: any, tabKey: string | null | undefined, currentUser: unknown) {
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

    rememberTabLastUrl(normalizedTabKey, targetUrl);
    replaceInTab(router, normalizedTabKey, targetUrl, 'push');
}

/** Consecutive tap of the active tab: jump to that tab's root, not one page back. */
export function navigateToTabRoot(router: any, tabKey: string | null | undefined, currentUser: unknown) {
    const normalizedTabKey = parseTabKey(tabKey);
    if (!router || !normalizedTabKey) {
        return;
    }

    const targetUrl = getTabRoot(normalizedTabKey, currentUser);
    if (!targetUrl) {
        return;
    }

    resetTabHistory(normalizedTabKey, currentUser);
    replaceInTab(router, normalizedTabKey, targetUrl, 'reset');
}

export function resetAllTabHistory() {
    tabHistoryState.byTab = {};
    setSelectedTabKey(null);
    tabHistoryState.lastUrlByTab = {};
    tabHistoryState.skipTabInfer = false;
    tabHistoryState.skipTabInferPath = null;
}

export function resetTabHistory(tabKey: string | null | undefined, currentUser: unknown, initialUrl?: string) {
    const key = parseTabKey(tabKey);
    if (!key) return;
    const rootUrl = getTabRootUrl(key, currentUser);
    tabHistoryState.byTab[key] = [rootUrl];
    tabHistoryState.lastUrlByTab[key] = rootUrl;
    if (initialUrl && initialUrl !== rootUrl) {
        tabHistoryState.byTab[key].push(initialUrl);
        tabHistoryState.lastUrlByTab[key] = initialUrl;
    }
}
