/**
 * Request headers that tell UNA who the visitor is: the client address and the location a
 * CDN adds. UNA reads them from requests the web proxy sends with the API key, so only the
 * edge in front of NEO may set them. An edge sets its own headers and passes the rest
 * through: behind Vercel a client can still add `CF-IPCountry`, and with nothing in front
 * of Next (`next start` on a public port) a client's own `X-Forwarded-For` reaches UNA
 * unchanged, since Next adds the socket address only when there is none.
 *
 * `NEO_EDGE` names the edge:
 * - `vercel` (the default on Vercel): `X-Forwarded-For`, `X-Real-IP`, `X-Vercel-IP-*`
 * - `cloudflare`: `X-Forwarded-For`, `CF-Connecting-IP`, `CF-IP*`
 * - `cloudfront`: `X-Forwarded-For`, `CloudFront-Viewer-*`
 * - `proxy` (the default elsewhere): `X-Forwarded-For` and `X-Real-IP` from a reverse proxy
 *   or load balancer that appends the address it got the request from (nginx with
 *   `$proxy_add_x_forwarded_for`, Caddy, Railway); no location
 * - `none`: browsers reach Next directly, nothing is forwarded
 */

const ADDRESS = ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip', 'true-client-ip'];
const LOCATION = ['x-country-code', 'x-appengine-country'];
const LOCATION_PREFIXES = ['cf-ip', 'x-vercel-ip-', 'cloudfront-viewer-'];

type EdgeRules = { names: string[]; prefixes: string[] };

const EDGES: Record<string, EdgeRules> = {
    vercel: { names: ['x-forwarded-for', 'x-real-ip'], prefixes: ['x-vercel-ip-'] },
    cloudflare: { names: ['x-forwarded-for', 'cf-connecting-ip'], prefixes: ['cf-ip'] },
    cloudfront: { names: ['x-forwarded-for'], prefixes: ['cloudfront-viewer-'] },
    proxy: { names: ['x-forwarded-for', 'x-real-ip'], prefixes: [] },
    none: { names: [], prefixes: [] },
};

/** The edge in front of NEO from the environment: `NEO_EDGE`, else `vercel` on Vercel, else `proxy`. */
export function resolveEdge(env: Record<string, string | undefined> = {}): string {
    const edge = String(env.NEO_EDGE || '').trim().toLowerCase();
    if (Object.hasOwn(EDGES, edge)) return edge;
    return env.VERCEL ? 'vercel' : 'proxy';
}

function isClientHeader(name: string): boolean {
    return ADDRESS.includes(name) || LOCATION.includes(name) || LOCATION_PREFIXES.some((prefix) => name.startsWith(prefix));
}

function isEdgeHeader(name: string, edge: string): boolean {
    const rules = EDGES[edge] ?? { names: [], prefixes: [] };
    return rules.names.includes(name) || rules.prefixes.some((prefix) => name.startsWith(prefix));
}

/** Delete, in place, the address and location headers the edge didn't set. Returns the headers. */
export function dropForeignClientHeaders(headers: Headers, edge: string): Headers {
    const names: string[] = [];
    headers.forEach((_value, name) => {
        const lower = name.toLowerCase();
        if (isClientHeader(lower) && !isEdgeHeader(lower, edge)) names.push(name);
    });
    for (const name of names) headers.delete(name);
    return headers;
}
