import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useGlobalSearchParams, usePathname } from 'expo-router';
import { useCurrentUserStore } from 'app/context/user';
import { parseTabKey } from 'app/lib/navigation/tab-path';
import { resolveTabPageUrl } from 'app/components/nav/tab-page-url';
import { setTrackerVisible, startTracker, trackPageview } from './tracker';

/** A screen shown for less than this isn't a screen view (web waits as long for the title). */
const SETTLE_MS = 400;

/** `/view-post?id=5` from a UNA page URL or path (`https://site/view-post?id=5`, `view-post`). */
function toPagePath(url: string): string {
    const absolute = /^https?:\/\/[^/]+(\/[^#]*)?/i.exec(url);
    if (absolute) return absolute[1] || '/';
    const path = url.split('#')[0] ?? '';
    return path.startsWith('/') ? path : `/${path}`;
}

/**
 * The UNA page a screen shows, resolved as the tab Screen resolves it (`url` param, the More
 * tab's last page, the tab's menu item). Other routes (`/pg`) are their own path.
 * `user` is the signed-in profile, `false` for a guest, `null` while unknown.
 */
function getScreenPath(pathname: string, url: string | undefined, user: { url?: string } | false | null): string {
    const tabKey = parseTabKey(pathname);
    if (!tabKey) return pathname;
    if (user === null) return '';
    const page = resolveTabPageUrl(tabKey, url, user, pathname !== tabKey);
    return page ? toPagePath(page) : '';
}

/** Sends screen views and engaged time to UNA's analytics. Mounted once, in the tabs layout. */
export function AnalyticsTracker() {
    const pathname = usePathname();
    const params = useGlobalSearchParams<{ url?: string | string[] }>();
    const url = Array.isArray(params.url) ? params.url[0] : params.url;
    const user = useCurrentUserStore((store) => store.currentUser);
    const screenPath = getScreenPath(pathname, url, user);

    useEffect(() => {
        startTracker(AppState.currentState === 'active');
        // `inactive` (iOS app switcher, Control Center) passes quickly: only background counts as hidden
        const subscription = AppState.addEventListener('change', (appState) => {
            if (appState === 'active') setTrackerVisible(true);
            else if (appState === 'background') setTrackerVisible(false);
        });
        return () => subscription.remove();
    }, []);

    useEffect(() => {
        if (!screenPath) return undefined;
        // A screen left before this fires isn't counted, as on web: the tab root a deep
        // link lands on just before its page is pushed.
        const timer = setTimeout(() => trackPageview(screenPath), SETTLE_MS);
        return () => clearTimeout(timer);
    }, [screenPath]);

    return null;
}
