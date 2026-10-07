import { createElement } from 'react';
import { Platform } from 'react-native';
import { View } from 'app/design/view';
import { androidTabBarHeight, appSetting, isNativeTabsEnabled, isTabBarLabelsEnabled } from 'app/lib/util';
import { getWindowSafeAreaInsets } from 'app/lib/hooks/router';

/** Shared by JS RouterTabs and NativeTabs. */

/** Max tab-bar slots (`tab0`…`tab4`). Extra menu items go into More. */
export const TAB_BAR_VISIBLE_LIMIT = 5;

export const MORE_TAB_ICON = 'ChevronsUpDown';

export function getTabList(currentUser) {
    return currentUser?.id
        ? appSetting('menu_items', 'menu_tabbar_logged')
        : appSetting('menu_items', 'menu_tabbar_non_logged');
}

/**
 * Collapse 6+ tab-bar items into 4 tabs + a trailing More tab.
 * Web footer, JS RouterTabs, and expo-router NativeTabs.
 */
export function shouldCollapseTabBar(tabList) {
    return (tabList?.length || 0) > TAB_BAR_VISIBLE_LIMIT;
}

export function splitTabBarItems(tabList = []) {
    if (!shouldCollapseTabBar(tabList)) {
        return {
            visible: tabList,
            overflow: [],
            moreTabIndex: -1,
        };
    }
    const moreTabIndex = TAB_BAR_VISIBLE_LIMIT - 1;
    return {
        visible: tabList.slice(0, moreTabIndex),
        overflow: tabList.slice(moreTabIndex),
        moreTabIndex,
    };
}

/**
 * NativeTabs showing a More tab. Its menu (iOS sheet / popup) hosts the
 * operator agent, so pages skip the floating Agent button. Tabs show by the
 * same rule as the bar itself (tabs/index.js `isShowTabs`).
 */
export function hasNativeTabsMoreMenu(currentUser) {
    if (!isNativeTabsEnabled()) return false;
    const showsTabs = !!((currentUser && currentUser.confirmed) || appSetting('native', 'show_tabs_non_logged'));
    return showsTabs && splitTabBarItems(getTabList(currentUser) || []).overflow.length > 0;
}

// Keep in sync with TAB_BAR_RESERVE in app/components/nav/tab-slide.js (and
// post.js, messenger/parts/common.js) — the iOS NativeTabs bar floats over the screen.
const NATIVE_TAB_BAR_RESERVE = 56;

/**
 * Bottom space a NativeTabs screen leaves so its last content scrolls clear of
 * the tab bar, which is drawn over the page (iOS floats it, Android paints it
 * over). 0 on web, with JS tabs (the screen ends above the bar) and while the
 * bar is hidden. Window insets, not `insets`: NativeTabs can report the
 * keyboard height as the bottom inset (as in post.js).
 */
export function getNativeTabBarOverlayInset(currentUser) {
    if (Platform.OS === 'web' || !isNativeTabsEnabled()) return 0;
    const showsTabs = !!((currentUser && currentUser.confirmed) || appSetting('native', 'show_tabs_non_logged'));
    if (!showsTabs) return 0;
    const bar = Platform.OS === 'android'
        ? androidTabBarHeight(areTabBarLabelsHidden(getTabList(currentUser) || []))
        : NATIVE_TAB_BAR_RESERVE;
    return bar + (getWindowSafeAreaInsets().bottom || 0);
}

/** Map a menu / transpile_urls index onto the Expo route (`tab0`…`tab4`). */
export function mapMenuIndexToTabRoute(index, tabList) {
    const { overflow, moreTabIndex } = splitTabBarItems(tabList);
    if (overflow.length > 0 && index >= moreTabIndex) {
        return moreTabIndex;
    }
    return index;
}

/** Tab url → route index list, including `transpile_urls`. Overflow urls land on the More tab. */
export function buildTabUrlIndex(tabList = []) {
    const additional = appSetting('menu_items', 'transpile_urls') || [];
    const baseLinks = tabList.map((item, index) => ({
        url: item.url,
        index: mapMenuIndexToTabRoute(index, tabList),
    }));
    const extra = additional.map((item) => ({
        ...item,
        index: mapMenuIndexToTabRoute(item.index, tabList),
    }));
    return [...baseLinks, ...extra];
}

/** Tab route (`/tabN`) whose url (or transpile_urls entry) occurs in `url`; null when none matches. */
export function findTabPathForUrl(url, tabList = []) {
    if (!url) return null;
    const item = buildTabUrlIndex(tabList).find((link) => url.includes(link.url));
    return item ? `/tab${item.index}` : null;
}

export function getTabsSessionKey(currentUser) {
    return currentUser?.id
        ? `user-${currentUser.id}-${currentUser.confirmed}`
        : 'user-guest';
}

/** Default page URL for an Expo tab route (`0`…`4`). More tab uses the first overflow item. */
export function getTabRouteRootUrl(routeIndex, tabList = [], currentUser) {
    const { overflow, moreTabIndex } = splitTabBarItems(tabList);
    const item = overflow.length > 0 && routeIndex === moreTabIndex
        ? tabList[moreTabIndex]
        : tabList[routeIndex];
    if (!item) return '/home';
    return resolveTabUrl(item, currentUser) || '/home';
}

export function resolveTabUrl(tab, currentUser) {
    return tab.url === '{profile}' ? currentUser?.url : tab.url;
}

/** Icons-only tab bar: labels off (`native.tab_labels`) or no tab has a title. */
export function areTabBarLabelsHidden(tabList = []) {
    return !isTabBarLabelsEnabled() || tabList.every((tab) => tab.title === '');
}

/** Own profile (`{profile}`) — drawn as the user's avatar in the tab bar. */
export function isProfileTab(tab) {
    return tab?.url === '{profile}';
}

export function isDashboardTab(tab, currentUser) {
    const tabUrl = resolveTabUrl(tab, currentUser);
    return tabUrl === appSetting('dashboard', 'url') || tab.icon === 'dashboard';
}

export function isExternalTabUrl(tabUrl) {
    return !!(tabUrl && (tabUrl.startsWith('http://') || tabUrl.startsWith('https://')));
}

export function isTabBarUrlActive(pathname, url) {
    if (!url) return false;
    return appSetting('messenger', 'url') === url ? pathname.includes(url) : pathname === url;
}

/** Exact tab-root / transpile_urls match → tab index, else -1. Nested pages do not infer. */
export function inferTabIndexFromUrl(pathname, tabList = [], currentUser) {
    const path = String(pathname || '').split('?')[0];
    const normalized = (path === '/' || path === '') ? '/home' : path;
    const links = buildTabUrlIndex(tabList);
    for (const item of links) {
        const url = item.url === '{profile}' ? currentUser?.url : item.url;
        if (!url) continue;
        if (normalized === String(url).split('?')[0]) {
            return item.index;
        }
    }
    return -1;
}

/** Drop separators left at either end or doubled up after filtering menu items. */
export function trimMenuSeparators(items) {
    const out = [];
    for (const item of items) {
        if (item?.type === 'separator' && (!out.length || out[out.length - 1]?.type === 'separator')) continue;
        out.push(item);
    }
    while (out.length && out[out.length - 1]?.type === 'separator') out.pop();
    return out;
}

export function tabBarMoreSeparator() {
    return {
        id: 'tabbar-more-separator',
        type: 'separator',
        title: createElement(View, { className: 'h-px w-full bg-border my-1.5' }),
    };
}

/**
 * More popup items: visible bar tabs, separator, overflow tabs.
 * `mode: 'native'` keeps tab metadata for custom onSelect; `mode: 'web'` adds `link`.
 */
export function buildTabBarMoreMenuItems({
    visible = [],
    overflow = [],
    moreTabIndex = -1,
    currentUser,
    t,
    pathname = '',
    activeOverflowUrl = null,
    mode = 'native',
}) {
    const moreRootUrl = overflow[0] ? resolveTabUrl(overflow[0], currentUser) : null;
    const selectedOverflowUrl = activeOverflowUrl || moreRootUrl;

    const mapTab = (tab, tabIndex, isOverflow) => {
        if (!tab || tab.hide === true) return null;
        const url = resolveTabUrl(tab, currentUser);
        const selected = mode === 'web'
            ? isTabBarUrlActive(pathname, url)
            : isOverflow
                ? pathname?.startsWith(`/tab${moreTabIndex}`) && url === selectedOverflowUrl
                : pathname?.startsWith(`/tab${tabIndex}`);

        const item = {
            id: tab.key || `tab-${tabIndex}`,
            title: t(tab.title),
            icon: tab.icon,
            animated: tab.animated,
            addClassName: tab.addClassName,
            selected,
            isOverflow: !!isOverflow,
            isProfile: isProfileTab(tab),
        };

        if (mode === 'web') {
            item.link = url;
        } else {
            item.tab = tab;
            item.tabIndex = tabIndex;
        }

        return item;
    };

    const visibleItems = visible.map((tab, tabIndex) => mapTab(tab, tabIndex, false)).filter(Boolean);
    const overflowItems = overflow
        .map((tab, overflowIndex) => mapTab(tab, moreTabIndex + overflowIndex, true))
        .filter(Boolean);

    if (visibleItems.length === 0 || overflowItems.length === 0) {
        return [...visibleItems, ...overflowItems];
    }

    return [...visibleItems, tabBarMoreSeparator(), ...overflowItems];
}

/**
 * More menu headed by the own profile, on every platform: a `{profile}` item
 * first in More makes the More tab the user's avatar, and the menu's header
 * row (avatar, name, "View profile", plus the operator agent button).
 *
 * `items` from `buildTabBarMoreMenuItems`; `exclude`: tab urls left out of the
 * menu (native sheets: `expo_ui.tabs.more_sheet_exclude`). Returns the header
 * item (null without a profile More), the rest of the menu, and `profileOnly`
 * — the profile is the only More link and there is no agent, so the avatar is
 * a plain profile tab instead of a menu.
 */
export function splitProfileMoreMenu({ items = [], overflow = [], hasAgent = false, exclude = [] }) {
    const header = isProfileTab(overflow[0]) ? items.find((item) => item.isProfile) ?? null : null;
    const rest = trimMenuSeparators(items.filter(
        (item) => item !== header && !(item.tab?.url && exclude.includes(item.tab.url))
    ));
    const profileOnly = !!header && !hasAgent && !rest.some((item) => item.isOverflow);
    return { header, items: rest, profileOnly };
}
