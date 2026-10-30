import { getTabListFor } from 'app/lib/navigation/tab-bar-menu';
import { peekTabLastUrl } from 'app/lib/navigation/tab-history';
import { splitTabBarItems } from 'app/components/nav/tabs/tab-menu';

type TabMenuItem = { key?: string; url?: string };
type TabUser = { url?: string } | false | null | undefined;

function getMenu(logged: boolean): TabMenuItem[] {
    return getTabListFor(logged);
}

/**
 * The UNA page a tab screen shows (`pagePath` of the native tab Screen): the route's `url`
 * param, or for a tab root without a usable one, the More tab's last page or the tab's menu
 * item. Shared with the analytics tracker, so screen views name the page on screen.
 *
 * @param tabKey `/tab0`…
 * @param url the route's `url` param
 * @param pushed a page pushed onto the tab's stack, not the tab root
 */
export function resolveTabPageUrl(tabKey: string, url: string | null | undefined, currentUser: TabUser, pushed: boolean): string | null | undefined {
    const logged = !!currentUser;
    const tabList = getMenu(logged);
    let path = url;

    // A native press on the More tab (switching to it or re-tapping it) is
    // followed by a JUMP_TO that drops this route's params, and the root
    // fallback below would swap in the first overflow item. Keep the page the
    // More tab was showing.
    if (!path && !pushed && tabKey === `/tab${splitTabBarItems(tabList).moreTabIndex}`) {
        path = peekTabLastUrl(tabKey);
    }

    // BOTTOM TABS NAVIGATION
    // Also detect a stale URL from the other user context (e.g. guest's /safety still
    // held by Expo Router after login). Recompute it from the current context's menu.
    const otherMenuItem = getMenu(!logged).find((item) => item.key === tabKey);
    const isStaleContextUrl = !!otherMenuItem?.url && path === otherMenuItem.url;

    if (!pushed && (!path || path.includes('/tab') || isStaleContextUrl)) {
        const item = tabList.find((menuItem) => menuItem.key === tabKey);
        path = item ? item.url : null;
        if (path === '{profile}') {
            path = currentUser ? currentUser.url : undefined;
        }
    }

    return path;
}
