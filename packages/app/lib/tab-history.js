import { appSetting } from 'app/lib/util';

const tabHistoryState = {
    byTab: {},
};

function logTabHistory(action, tabKey, payload = {}) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
        const stack = tabHistoryState.byTab[tabKey] || [];
        console.log('[tab-history]', action, {
            tabKey,
            stackLength: stack.length,
            top: stack[stack.length - 1],
            ...payload,
        });
    }
}

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

export function ensureTabHistory(tabKey, currentUser, initialUrl) {
    if (!tabHistoryState.byTab[tabKey]) {
        const root = getTabRootUrl(tabKey, currentUser);
        tabHistoryState.byTab[tabKey] = [root];
        if (initialUrl && initialUrl !== root) {
            tabHistoryState.byTab[tabKey].push(initialUrl);
        }
        logTabHistory('ensure', tabKey, { initialUrl, root });
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
        logTabHistory('push', tabKey, { url });
    }
}

export function canGoBackInTab(tabKey) {
    return (tabHistoryState.byTab[tabKey]?.length || 0) > 1;
}

export function popTabHistory(tabKey, currentUser) {
    ensureTabHistory(tabKey, currentUser);
    const stack = tabHistoryState.byTab[tabKey];
    if (stack.length > 1) {
        const removed = stack.pop();
        logTabHistory('pop', tabKey, { removed });
    }
    return stack[stack.length - 1];
}

export function getTabRoot(tabKey, currentUser) {
    return getTabRootUrl(tabKey, currentUser);
}

export function navigateBackInTab(router, tabKey, currentUser) {
    if (!router || !tabKey) {
        return;
    }

    if (canGoBackInTab(tabKey)) {
        const prevUrl = popTabHistory(tabKey, currentUser);
        router.replace({
            pathname: tabKey,
            params: { url: prevUrl, refresh: Date.now() },
        });
        return;
    }

    const rootUrl = getTabRoot(tabKey, currentUser);
    router.replace({
        pathname: tabKey,
        params: { url: rootUrl, refresh: Date.now() },
    });
}

export function resetTabHistory(tabKey, currentUser, initialUrl) {
    if (!tabKey) return;
    const rootUrl = getTabRoot(tabKey, currentUser);
    tabHistoryState.byTab[tabKey] = [rootUrl];
    if (initialUrl && initialUrl !== rootUrl) {
        tabHistoryState.byTab[tabKey].push(initialUrl);
    }
    logTabHistory('reset', tabKey, { rootUrl, initialUrl });
}
