import { appSetting } from 'app/lib/util';

/** Shared by JS RouterTabs and NativeTabs. */

export function getTabList(currentUser) {
    return currentUser?.id
        ? appSetting('menu_items', 'menu_tabbar_logged')
        : appSetting('menu_items', 'menu_tabbar_non_logged');
}

export function getTabsSessionKey(currentUser) {
    return currentUser?.id
        ? `user-${currentUser.id}-${currentUser.confirmed}`
        : 'user-guest';
}

export function resolveTabUrl(tab, currentUser) {
    return tab.url === '{profile}' ? currentUser?.url : tab.url;
}

export function isDashboardTab(tab, currentUser) {
    const tabUrl = resolveTabUrl(tab, currentUser);
    return tabUrl === appSetting('dashboard', 'url') || tab.icon === 'dashboard';
}

export function isExternalTabUrl(tabUrl) {
    return !!(tabUrl && (tabUrl.startsWith('http://') || tabUrl.startsWith('https://')));
}
