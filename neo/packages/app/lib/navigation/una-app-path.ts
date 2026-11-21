// Query parameters UNA's API request adds to a URL it echoes back; the rest belong to the page.
const UNA_API_PARAM = /^(r|lang|_q|params(\[[^\]]*\])?)$/;
// `r` of UNA's page request (`system/get_page_by_request/TemplServicePages`).
const UNA_PAGE_REQUEST = /^system\/get_page/i;
const SCHEME = /^[a-z][a-z0-9+.-]*:/i;
// Resolves relative links; never requested.
const RELATIVE_BASE = 'https://una.invalid';

/** `path` without slashes at its start or end (a loop: a `/+$` pattern backtracks). */
function trimSlashes(path: string, end: 'start' | 'end'): string {
    let from = 0;
    let to = path.length;
    if (end === 'start') while (from < to && path[from] === '/') from++;
    else while (to > from && path[to - 1] === '/') to--;
    return path.slice(from, to);
}

function parseBase(unaBase: string): URL | null {
    try {
        return unaBase ? new URL(unaBase) : null;
    } catch {
        return null;
    }
}

/** The URL as an absolute http(s) URL, or null. A relative link resolves on RELATIVE_BASE. */
function parseTarget(raw: string, absolute: boolean): URL | null {
    let target: URL;
    try {
        target = absolute ? new URL(raw) : new URL('/' + trimSlashes(raw, 'start'), RELATIVE_BASE);
    } catch {
        return null;
    }
    if (target.protocol !== 'https:' && target.protocol !== 'http:') return null;
    // A browser reads `/\host` as `//host`: not a relative link.
    if (!absolute && target.origin !== RELATIVE_BASE) return null;
    return target;
}

/** The page path of an absolute URL on UNA: its path less UNA's own; null outside it. */
function pathUnderBase(pathname: string, base: URL | null, onUnaOrigin: boolean): string | null {
    const basePath = base ? trimSlashes(base.pathname, 'end') : '';
    if (!basePath) return pathname;
    if (pathname === basePath || pathname.startsWith(basePath + '/')) return pathname.slice(basePath.length);
    return onUnaOrigin ? null : pathname;
}

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

    const absolute = SCHEME.test(raw) || raw.startsWith('//');
    const target = parseTarget(raw, absolute);
    if (!target) return null;

    let pathname: string | null = target.pathname;
    if (absolute) {
        const base = parseBase(unaBase);
        const onUnaOrigin = !!base && target.origin === base.origin;
        const fromPageRequest = UNA_PAGE_REQUEST.test(target.searchParams.get('r') ?? '');
        if (!onUnaOrigin && !fromPageRequest) return null;
        pathname = pathUnderBase(pathname, base, onUnaOrigin);
        if (pathname === null) return null;
    }

    const query = new URLSearchParams();
    target.searchParams.forEach((value, key) => {
        if (!UNA_API_PARAM.test(key)) query.append(key, value);
    });
    const search = query.toString();
    // Collapse leading slashes: `//host` would leave the site.
    return '/' + trimSlashes(pathname, 'start') + (search ? '?' + search : '') + target.hash;
}
