/**
 * `una://` links (src-tauri/src/deep_link.rs): `una://open?path=/home/post/12`, and with
 * `&site=https://community.example` when it is for one network of several. The path is a
 * route as routeToPath writes it and goes through parseRoute, so only a place the app knows
 * opens; anything else is refused. A link only ever shows a place: it never posts, follows or
 * signs anything, and a network not signed in to is not opened (nor signed in to).
 */
import type { SessionSummary } from './native';
import { parseRoute, type Route } from './router';
import { APP_SCHEME } from './brand';

export const DEEP_LINK_SCHEME = APP_SCHEME;
const MAX_LENGTH = 2048;

export type DeepLink = {
    /** The network it is for, as an address (origin and path), or null: the active one. */
    site: string | null;
    route: Route;
};

/** A site's address as the app keeps it: http(s), no user, query or fragment, no slash at the end. */
export function normalizeSite(value: string): string | null {
    let url: URL;
    try {
        url = new URL(value);
    } catch {
        return null;
    }
    if ((url.protocol !== 'https:' && url.protocol !== 'http:') || url.username || url.password || url.search || url.hash || !url.host) return null;
    return `${url.protocol}//${url.host}${url.pathname.replace(/\/+$/, '')}`;
}

/** What a una:// link opens, or null when it is not one the app takes. */
export function parseDeepLink(link: string): DeepLink | null {
    if (link.length > MAX_LENGTH) return null;
    let url: URL;
    try {
        url = new URL(link);
    } catch {
        return null;
    }
    if (url.protocol !== DEEP_LINK_SCHEME || url.host !== 'open' || (url.pathname !== '' && url.pathname !== '/') || url.hash || url.username || url.password) return null;

    const keys = [...url.searchParams.keys()];
    if (new Set(keys).size !== keys.length || keys.some((k) => k !== 'path' && k !== 'site')) return null;
    const path = url.searchParams.get('path');
    if (!path || !path.startsWith('/') || path.startsWith('//')) return null;
    const route = parseRoute(path);
    if (!route) return null;

    const rawSite = url.searchParams.get('site');
    if (rawSite === null) return { site: null, route };
    const site = normalizeSite(rawSite);
    return site ? { site, route } : null;
}

/** Where a link goes among the networks signed in to. */
export type DeepLinkTarget = { kind: 'here'; route: Route } | { kind: 'switch'; key: string; route: Route } | { kind: 'not-signed-in'; site: string };

/**
 * The active network when the link names none or names its site; another one signed in to
 * on that site (the active account first, else the first in the list); otherwise none.
 */
export function deepLinkTarget(link: DeepLink, sessions: readonly SessionSummary[], activeSite: string): DeepLinkTarget {
    if (link.site === null || link.site === normalizeSite(activeSite)) return { kind: 'here', route: link.route };
    const match = sessions.find((s) => normalizeSite(s.siteUrl) === link.site);
    return match ? { kind: 'switch', key: match.key, route: link.route } : { kind: 'not-signed-in', site: link.site };
}

/** The link that opens a route of a network: what "Copy app link" would give. */
export function deepLinkFor(route: string, site?: string): string {
    const params = new URLSearchParams({ path: route });
    if (site) params.set('site', site);
    return `${APP_SCHEME}//open?${params.toString()}`;
}
