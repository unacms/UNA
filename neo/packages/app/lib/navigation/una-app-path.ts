// Query parameters UNA's API request adds to a URL it echoes back; the rest belong to the page.
const UNA_API_PARAM = /^(r|lang|_q|params(\[.*\])?)$/;
// `r` of UNA's page request (`system/get_page_by_request/TemplServicePages`).
const UNA_PAGE_REQUEST = /^system\/get_page/i;
const SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const RELATIVE_BASE = 'http://una.invalid';

/**
 * NEO path for a link or redirect UNA sends, or null when it leads anywhere but UNA's pages.
 *
 * UNA's own page is:
 * - a relative URL (`/view-persons-profile/admin`, `page.php?i=…` resolves against UNA);
 * - an absolute URL on `unaBase`'s origin, under its path;
 * - an absolute URL on another host that carries UNA's page request (`?r=system/get_page_by_request…`):
 *   UNA builds a redirect from its own site URL (`BX_DOL_URL_ROOT`), and that host can differ
 *   from the one NEO calls it by (`localhost` and a LAN name, an internal host on a deployment).
 *
 * The path keeps the page's own query and drops what UNA's API request added.
 */
export function unaAppPath(url: string, unaBase: string): string | null {
    const raw = String(url ?? '').trim();
    if (!raw || /^(javascript|data|mailto|tel):/i.test(raw)) return null;

    let base: URL | null = null;
    try {
        base = unaBase ? new URL(unaBase) : null;
    } catch {
        base = null;
    }
    const absolute = SCHEME.test(raw) || raw.startsWith('//');
    let target: URL;
    try {
        target = new URL(absolute ? raw : '/' + raw.replace(/^\/+/, ''), absolute ? undefined : RELATIVE_BASE);
    } catch {
        return null;
    }
    if (!/^https?:$/.test(target.protocol)) return null;
    // A browser reads `/\host` as `//host`: not a relative link.
    if (!absolute && target.origin !== RELATIVE_BASE) return null;

    const basePath = base ? base.pathname.replace(/\/+$/, '') : '';
    const onUnaOrigin = !!base && target.origin === base.origin;
    const fromPageRequest = UNA_PAGE_REQUEST.test(target.searchParams.get('r') ?? '');
    if (absolute && !onUnaOrigin && !fromPageRequest) return null;

    let pathname = target.pathname;
    // A relative link is already a page path; an absolute one starts with UNA's path.
    if (absolute && basePath) {
        if (pathname === basePath || pathname.startsWith(basePath + '/')) {
            pathname = pathname.slice(basePath.length);
        } else if (onUnaOrigin) {
            return null;
        }
    }
    for (const key of [...target.searchParams.keys()]) {
        if (UNA_API_PARAM.test(key)) target.searchParams.delete(key);
    }
    // Collapse leading slashes: `//host` would leave the site.
    const search = target.searchParams.toString();
    return '/' + pathname.replace(/^\/+/, '') + (search ? '?' + search : '') + target.hash;
}
