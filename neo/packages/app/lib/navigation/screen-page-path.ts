import { useGlobalSearchParams, usePathname } from 'app/lib/hooks/router';
import { useCurrentUserStore } from 'app/context/user';
import { parseTabKey } from 'app/lib/navigation/tab-path';
import { resolveTabPageUrl } from 'app/components/nav/tab-page-url';

type ScreenUser = { url?: string } | false | null;

/** `/view-post?id=5` from a UNA page URL or path (`https://site/view-post?id=5`, `view-post`). */
export function toPagePath(url: string): string {
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
export function getScreenPath(pathname: string, url: string | undefined, user: ScreenUser): string {
    const tabKey = parseTabKey(pathname);
    if (!tabKey) return pathname;
    if (user === null) return '';
    const page = resolveTabPageUrl(tabKey, url, user, pathname !== tabKey);
    return page ? toPagePath(page) : '';
}

/**
 * The path of the UNA page on screen (`/terms`), to mark links to it. A pushed page's route is
 * `/tab0/page` with the page in its `url` param, and a tab root shows its menu item's page, so
 * the route's pathname alone never matches a link. The web version is the pathname.
 */
export function useScreenPagePath(): string {
    const pathname = usePathname();
    const params = useGlobalSearchParams<{ url?: string | string[] }>();
    const url = Array.isArray(params?.url) ? params.url[0] : params?.url;
    const user = useCurrentUserStore((store) => store.currentUser);
    return getScreenPath(pathname, url, user);
}
