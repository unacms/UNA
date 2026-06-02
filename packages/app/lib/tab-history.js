import { appSetting } from 'app/lib/util';

const tabHistoryState = {
    byTab: {},
};

function logTabHistory(action, tabKey, payload = {}) {
   /* if (typeof __DEV__ !== 'undefined' && __DEV__) {
        const stack = tabHistoryState.byTab[tabKey] || [];
        console.log('[tab-history]', action, {
            tabKey,
            stackLength: stack.length,
            top: stack[stack.length - 1],
            ...payload,
        });
    }*/
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
        const removed = stack.pop();
        logTabHistory('pop', tabKey, { removed });
    }
    while (stack.length > 1 && isTabHistoryExcluded(stack[stack.length - 1])) {
        stack.pop();
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
            params: { url: prevUrl },
        });
        return;
    }

    const rootUrl = getTabRoot(tabKey, currentUser);
    router.replace({
        pathname: tabKey,
        params: { url: rootUrl },
    });
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
    logTabHistory('reset', tabKey, { rootUrl, initialUrl });
}
