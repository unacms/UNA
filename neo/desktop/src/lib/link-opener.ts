import type { UnaApi } from 'una-api';

import type { LinkOpener } from './native';
import type { DetailRoute } from './router';
import { isSiteLink, linkRoute } from './targets';

/**
 * Site links that open in the app: a link to the signed-in site that shows a post, profile,
 * group or conversation (GET /links/resolve) is shown with `show`; any other link is left to
 * the browser (false). Answers are kept for the session, refusals too, but not a failure to
 * reach the site, which is asked again next time.
 */
export function makeLinkOpener(api: UnaApi, siteUrl: string, show: (route: DetailRoute) => void): LinkOpener {
    const known = new Map<string, DetailRoute | null>();
    return async (href) => {
        if (!isSiteLink(href, siteUrl)) return false;
        let route = known.get(href);
        if (route === undefined) {
            const result = await api.GET('/links/resolve', { params: { query: { url: href } } });
            route = result.data ? linkRoute(result.data) : null;
            if (result.data || result.response.status === 404) known.set(href, route);
        }
        if (!route) return false;
        show(route);
        return true;
    };
}
