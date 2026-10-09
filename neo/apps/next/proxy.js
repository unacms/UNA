import { NextResponse } from 'next/server'
import { UNA_URL, UNA_API_KEY, MULTITENANT, PREVIEW_DOMAIN, PREVIEW_API_KEY, joinUnaUrl } from 'app/config';
import { getDomainByHostname } from './lib/domains/domains';

export const config = {
    // Skip /.well-known/* so Digital Asset Links / AASA hit App Router routes
    // directly (no 404, no UNA rewrite).
    matcher: ["/((?!sw.js|logo192.png|loader.svg|favicon.ico|favicon.svg|manifest.json|static/|lucide/|_vercel|\\.well-known).*)"],
    //runtime: 'experimental-edge',
};

const TENANT_HEADERS = ['x-tenant-id', 'x-tenant-una-url', 'x-tenant-una-key', 'x-tenant-revision'];

/**
 * Request headers for a Next route (page, icon API).
 * - Client-sent `x-tenant-*` are always dropped: the page trusts them to pick
 *   the UNA host and key, so a client must never be able to set them.
 * - The resolved tenant is added here and passed with
 *   `rewrite(url, { request: { headers } })` — it reaches the route only.
 *   Response headers would also be sent to the browser (tenant API key).
 */
function routeRequestHeaders(request, tenant) {
    const headers = new Headers(request.headers);
    for (const name of TENANT_HEADERS) headers.delete(name);
    if (tenant) {
        headers.set('x-tenant-id', String(tenant.id));
        headers.set('x-tenant-una-url', tenant.unaUrl);
        headers.set('x-tenant-una-key', tenant.unaApiKey);
        headers.set('x-tenant-revision', String(tenant.revision));
    }
    return headers;
}

async function resolveTenant(hostnameWithPort) {
    const hostname = hostnameWithPort.split(':')[0];
    const domain = await getDomainByHostname(hostname); 
    return domain;
}

/**
 * CI previews (UNA's .github/workflows/ci.yml): `pr-<n>.<PREVIEW_DOMAIN>` is a client
 * alias for PR <n>, whose backend is `api-pr-<n>.<PREVIEW_DOMAIN>`. Returned in the
 * tenant shape so the proxy and the page use it the same way. Null for any other host,
 * which keeps the configured UNA_URL.
 */
function resolvePreviewBackend(hostnameWithPort) {
    if (!PREVIEW_DOMAIN || !PREVIEW_API_KEY) return null;
    const hostname = String(hostnameWithPort || '').split(':')[0].toLowerCase();
    const match = hostname.match(/^pr-(\d+)\.(.+)$/);
    if (!match || match[2] !== PREVIEW_DOMAIN.toLowerCase()) return null;
    return {
        id: `preview-${match[1]}`,
        unaUrl: `https://api-pr-${match[1]}.${PREVIEW_DOMAIN}`,
        unaApiKey: PREVIEW_API_KEY,
        revision: 0,
    };
}

function cookieHeaderFromRequest(request) {
    let cookieString = '';
    request.cookies.getAll().forEach((item) => {
        cookieString += item.name + '=' + encodeURIComponent(item.value) + '; ';
    });
    return cookieString;
}

function sysAiChatPath(pathname) {
    const match = String(pathname || '').match(/^\/sys-ai-chat\/([^/]+)\/?$/);
    if (!match?.[1]) return null;
    return `/sys-ai-chat/${match[1]}`;
}

/** Same-origin proxy to UNA (PHP APIs and sys-ai-chat SSE), forwarding session cookies. */
function rewriteToUna(request, tenant, unaPath) {
    let unaUrl = UNA_URL;
    let unaApiKey = UNA_API_KEY;
    if (MULTITENANT && tenant == null) {
        return new NextResponse('Tenant not found', { status: 404 });
    }
    if (tenant) {
        unaUrl = tenant.unaUrl;
        unaApiKey = tenant.unaApiKey;
    }

    const tmpHeaders = new Headers(request.headers);
    tmpHeaders.set('authorization', `Bearer ${unaApiKey}`);
    tmpHeaders.set('cookie', cookieHeaderFromRequest(request));

    const unaTarget = joinUnaUrl(unaPath, unaUrl) + new URL(request.url).search;
    return NextResponse.rewrite(unaTarget, {
        request: {
            headers: tmpHeaders,
        },
    });
}

export async function proxy(request) {    
    // Main middleware entry: decide how to rewrite incoming requests.
    const pathname = request.nextUrl.pathname;
    
    // Early return for static files and source maps - return 404 immediately without rendering
    const staticExtensions = ['.map'];
    const isSourceMap = staticExtensions.some(ext => pathname.endsWith(ext));
    const isWellKnown = pathname.startsWith('/.well-known/');
    // Android App Links + iOS Universal Links verification files must be publicly
    // reachable (no redirects, application/json). Do not 404 these paths.
    const isDigitalAssetLinks =
        pathname === '/.well-known/assetlinks.json' ||
        pathname === '/.well-known/apple-app-site-association' ||
        pathname === '/apple-app-site-association';

    if (isDigitalAssetLinks) {
        const res = NextResponse.next();
        res.headers.set('Content-Type', 'application/json');
        return res;
    }

    if (isSourceMap || isWellKnown) {
        // Return 404 directly without any processing or rendering
        return new NextResponse(null, { status: 404 });
    }

    // serve images proxy as it is
    if (pathname.includes('/api/image')) {
        return NextResponse.next();
    }

    const hostname = request.headers.get("host");
    const tenant = MULTITENANT ? await resolveTenant(hostname) : resolvePreviewBackend(hostname);

    // Pretty URL for UNA Agents chat (GET hydrate JSON + POST AG-UI SSE).
    // Not a .php path, so it would otherwise hit the Next catch-all page.
    const aiChatPath = sysAiChatPath(pathname);
    if (aiChatPath) {
        return rewriteToUna(request, tenant, aiChatPath);
    }

    // If the request is NOT targeting a PHP endpoint, handle it as a regular
    // page or an internal asset (icons) served by this Next.js app.
    if (!request.nextUrl.pathname.includes('.php')) {

        if (tenant == null && MULTITENANT && !request.nextUrl.pathname.includes('static')) {
            // rewrite to specific page where new tenant can be created
            // return NextResponse.rewrite(new URL(`/new-tenant`, request.url));
            return NextResponse.redirect(new URL('http://localhost:4000'), 307); // temporary redirect
        }        

        // A normal page. The page reads the viewer's cookies from its own request
        // (`headers()`), so they are never copied into the URL.
        if (!request.nextUrl.pathname.includes('.icon')) {
            // Map root URL `/` to `/home` for downstream routing.
            const pathname = request.nextUrl.pathname == '/' ? '/home' : request.nextUrl.pathname;
            const url = request.nextUrl.origin + pathname + request.nextUrl.search;

            const response = NextResponse.rewrite(new URL(url), {
                request: { headers: routeRequestHeaders(request, tenant) },
            });
            if (request.cookies.getAll().length === 0) {
                // Guests see the same page: let the CDN cache it.
                response.headers.set('Cache-Control', 'public, s-maxage=1')
                response.headers.set('CDN-Cache-Control', 'public, s-maxage=60')
                response.headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=3600')
            }
            return response
        }
        else{
            // Path contains `.icon` — rewrite to internal `/api/icon` route,
            // preserving the original query string.
            const url = new URL(request.url);
            const iconApiUrl = new URL('/api/icon', request.url);
            iconApiUrl.search = url.search;
            return NextResponse.rewrite(iconApiUrl, {
                request: { headers: routeRequestHeaders(request, tenant) },
            });
        }
    }
    else {
        const url = new URL(request.url);

        // Join without creating `//api.php` — UNA nginx 308s double-slash URLs,
        // and that relative Location breaks browser fetch through the proxy.
        // Use joinUnaUrl so tenant unaUrl and default UNA_URL share the same rules.
        const unaPath = request.nextUrl.pathname.replace('/api/', '/');

        // Stripe Embedded Checkout return_url: browser lands on this API URL and
        // would otherwise see raw JSON. Serve a tiny HTML bridge that re-fetches
        // the same URL as XHR (rewrite below) and redirects to data.url.
        const apiMethod = url.searchParams.get('r') || '';
        const isCheckoutReturn =
            apiMethod.includes('initialize_checkout_api') &&
            url.searchParams.has('session_id');
        const fetchMode = request.headers.get('sec-fetch-mode') || '';
        const isXhr =
            request.headers.get('x-neo-checkout-return') === '1' ||
            fetchMode === 'cors' ||
            fetchMode === 'same-origin';

        if (isCheckoutReturn && !isXhr) {
            const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Redirecting…</title></head><body>
<script>
(async function () {
  try {
    var res = await fetch(location.pathname + location.search, {
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'X-Neo-Checkout-Return': '1'
      },
      cache: 'no-store'
    });
    var payload = await res.json();
    var next = payload && payload.data && payload.data.url;
    if (typeof next === 'string' && next.length) {
      location.replace(next);
      return;
    }
    document.body.textContent = JSON.stringify(payload);
  } catch (e) {
    document.body.textContent = String(e && e.message ? e.message : e);
  }
})();
</script>
<noscript>JavaScript is required to complete checkout.</noscript>
</body></html>`;
            return new NextResponse(html, {
                status: 200,
                headers: {
                    'content-type': 'text/html; charset=utf-8',
                    'cache-control': 'no-store',
                },
            });
        }

        // Rewrite the request to the UNA backend URL, replacing a local
        // `/api/` prefix with the UNA path and forwarding the modified headers.
        return rewriteToUna(request, tenant, unaPath);
    }
}
