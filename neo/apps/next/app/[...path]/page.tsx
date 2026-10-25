import { UNA_URL, UNA_API_KEY, MULTITENANT, PREVIEW_DOMAIN, APP_URL, appSetting } from 'app/config';
import { decodeTextNode, truncateWords } from 'app/lib/util/html-text';
import { cache } from 'react'
import Root from 'app/root-client'
import { Suspense } from 'react'
import type { Metadata, Viewport } from 'next'
import { notFound, redirect } from 'next/navigation'
import { headers } from "next/headers"
import { resolveLangCode } from '../../lib/resolve-lang'
import { cachedUnaPageJson, unaPageCacheKey } from '../../lib/una-page-cache'

type SearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
    params: Promise<{ path?: string[] }>;
    searchParams: Promise<SearchParams>;
};

/** Link preview hints; only newer UNA versions send them. */
type UnaPageMeta = {
    image_width?: number | string;
    image_height?: number | string;
    card?: string;
    og_type?: string;
};

/** The fields of UNA's page payload read here; the rest goes to Root as it came. */
type UnaPage = {
    title?: string;
    // Read only after a typeof check.
    description?: unknown;
    image?: unknown;
    url?: string;
    uri?: string;
    page_status?: number | string;
    redirect?: string;
    meta?: UnaPageMeta;
};

/** UNA's api.php envelope, or the fallback getData builds when the request fails. */
type UnaPageResponse = {
    data?: UnaPage;
    code?: number;
};

const SITE_TITLE: string = appSetting('config', 'title');

// Query parameters that never change the page: left out of og:url and canonical.
const TRACKING_PARAM = /^(utm_.*|fbclid|gclid|igshid|mc_cid|mc_eid|_rsc)$/i;
// Query parameters UNA's API request adds to a `redirect` URL; the rest belong to the page.
const UNA_API_PARAM = /^(r|lang|_q|params(\[.*\])?)$/;
const OG_TYPES = ['website', 'article', 'profile'] as const;
const TWITTER_CARDS = ['summary', 'summary_large_image'] as const;
// Older UNA versions send up to ~700 chars of stripped HTML as the description.
const DESCRIPTION_MAX = 200;

/** Whether UNA's value is one of the values this page passes on. */
function isOneOf<T extends string>(list: readonly T[], value: unknown): value is T {
    return (list as readonly unknown[]).includes(value);
}

async function loadPage(props: PageProps): Promise<UnaPageResponse> {
    const [params, searchParams] = await Promise.all([
        props.params,
        props.searchParams,
    ]);
    return getData((params.path ?? []).join('/'), JSON.stringify(searchParams));
}

// Tenant headers come from proxy.js only (it drops client-sent ones); trust them
// only when the proxy can set them: multi-tenant mode or CI preview hosts.
const trustTenantHeaders = (): boolean => !!MULTITENANT || !!PREVIEW_DOMAIN;

/** The UNA this request's page JSON comes from: the tenant's or the configured one. */
async function unaBaseUrl(): Promise<string> {
    const hdrs = await headers();
    return (trustTenantHeaders() ? hdrs.get('x-tenant-una-url') : null) ?? UNA_URL;
}

/**
 * Origin of the public page URL. Multi-tenant and preview hosts use the Host header
 * proxy.js resolved the tenant from; otherwise APP_URL. Never x-forwarded-host.
 */
async function siteOrigin(): Promise<string> {
    if (!trustTenantHeaders() && APP_URL) {
        try {
            return new URL(APP_URL).origin;
        } catch {
            // fall back to the Host header
        }
    }
    const host = (await headers()).get('host') || '';
    if (!/^[a-z0-9.-]+(:\d+)?$/i.test(host)) return '';
    const local = /^(localhost|[^:]+\.localhost)(:\d+)?$/i.test(host);
    return (local ? 'http://' : 'https://') + host;
}

/** `/` for home, else `/<path>`, with the query; tracking parameters dropped when asked. */
function pagePath(path: string[] = [], searchParams: SearchParams | undefined, dropTracking: boolean): string {
    const isHome = path.length === 0 || (path.length === 1 && ['home', 'index'].includes(path[0] ?? ''));
    const pathname = isHome ? '/' : '/' + path.map(encodeURIComponent).join('/');
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams || {})) {
        if (dropTracking && TRACKING_PARAM.test(key)) continue;
        for (const item of Array.isArray(value) ? value : [value]) query.append(key, item ?? '');
    }
    const search = query.toString();
    return pathname + (search ? '?' + search : '');
}

/**
 * UNA answers a non-canonical URL (mixed case, trailing slash, renamed page URI) with
 * `redirect`: its own absolute URL plus the API request's query. The same path and the
 * page's own query on NEO, or null when it points anywhere but that UNA.
 */
function unaRedirectPath(redirectUrl: string, unaBase: string): string | null {
    let base: URL, target: URL;
    try {
        base = new URL(unaBase);
        target = new URL(redirectUrl, base);
    } catch {
        return null;
    }
    if (target.origin !== base.origin) return null;
    const basePath = base.pathname.replace(/\/+$/, '');
    if (basePath && target.pathname !== basePath && !target.pathname.startsWith(basePath + '/')) return null;
    // Collapse leading slashes: `//host` would leave the site.
    const pathname = '/' + target.pathname.slice(basePath.length).replace(/^\/+/, '');
    for (const key of [...target.searchParams.keys()]) {
        if (UNA_API_PARAM.test(key)) target.searchParams.delete(key);
    }
    const search = target.searchParams.toString();
    return pathname + (search ? '?' + search : '');
}

/** Follow UNA's `redirect` on the server, so crawlers (no JS) reach the real page too. */
async function followUnaRedirect(props: PageProps, page: UnaPage | undefined): Promise<void> {
    if (!page?.redirect) return;
    const [params, searchParams] = await Promise.all([props.params, props.searchParams]);
    const target = unaRedirectPath(page.redirect, await unaBaseUrl());
    if (target && target !== pagePath(params.path, searchParams, false)) {
        redirect(target);
    }
}

/** UNA's description as plain text, or '' when it sends none. */
function previewDescription(raw: unknown): string {
    return typeof raw === 'string' && raw.trim()
        ? truncateWords(decodeTextNode(raw), DESCRIPTION_MAX)
        : '';
}

// Primitive arguments let metadata and page rendering share this request's fetch.
const getData = cache(async (path: string, searchParamsKey: string): Promise<UnaPageResponse> => {
    const search_params: SearchParams = JSON.parse(searchParamsKey);

    // Early check for static files — before any logs or UNA requests
    const staticFileExtensions = ['.map', '.js', '.css', '.json', '.png', '.jpg', '.svg', '.ico', '.woff', '.woff2', '.ttf'];
    const isStaticFile = staticFileExtensions.some(ext => path.endsWith(ext));
    
    if (isStaticFile || path.startsWith('_next/') || path.startsWith('static/')) {
        // Return 404 without logging or UNA requests
        return { data: { title: SITE_TITLE, description: SITE_TITLE }, code: 404 };
    }
    
    const hdrs = await headers();
    // The viewer's Cookie header exactly as the browser sent it — forwarded to UNA.
    const cookieString = hdrs.get('cookie') || '';
    const tenantUnaUrl = trustTenantHeaders() ? hdrs.get('x-tenant-una-url') : null;
    const tenantUnaKey = trustTenantHeaders() ? hdrs.get('x-tenant-una-key') : null;

    const fetchHeaders = {
        cookie: cookieString,
        authorization: 'Bearer ' + (tenantUnaKey ?? UNA_API_KEY),
        // The page is rendered for a NEO web viewer: UNA records site actions with this platform.
        'x-neo-platform': 'web',
    };

    let l = tenantUnaUrl ?? UNA_URL;
    l += '/api.php' + '?r=system/get_page_by_request/TemplServicePages&params[]=' + path;
    const langCode = resolveLangCode(cookieString, hdrs.get('accept-language') || '');
    if (langCode) {
        l += '&lang=' + encodeURIComponent(langCode);
    }
    const searchParams: SearchParams = { ...search_params };

    delete searchParams.cookieString; // legacy: old proxy put cookies in the URL
    delete searchParams.path;
    delete searchParams._rsc;
    let sBlocks: string | string[] = '';
    if (searchParams.blocks) {
        sBlocks = searchParams.blocks;
    }
    delete searchParams.blocks;

    if (sBlocks != '' && Object.keys(searchParams).length == 0) {
        l = l + '&params[]=' + sBlocks;
    }

    if (Object.keys(searchParams).length > 0) {
        l = l + '&params[]=' + sBlocks + '&params[]=' + JSON.stringify(searchParams);
    }

    const loadUnaPage = async (): Promise<UnaPageResponse> => {
        let res: Response;
        try {
            res = await fetch(l, {
                headers: fetchHeaders,
                cache: 'no-store',
            })
        } catch (error) {
            console.error('Server fetch failed (network/connection):', error);
            return { data: { title: SITE_TITLE, description: SITE_TITLE }, code: 503 };
        }

       /* if (!res.ok) {
            const body = await res.text().catch(() => '');
            console.error('Server fetch failed (http):', res.status, body);
            return { data: { title: SITE_TITLE, description: SITE_TITLE }, code: res.status };
        }*/

        // Read the body once: a clone kept for the error branch buffered every page twice.
        let text = '';
        try {
            text = await res.text();
            return JSON.parse(text) as UnaPageResponse;
        } catch (error) {
            const fatal = text.match(/Fatal error[^<]*/i)?.[0]
                || text.match(/Uncaught [\w\\]+:[^\n<]+/)?.[0]
                || text.slice(0, 200);
            console.error('UNA page JSON parse failed:', fatal);
            return {
                data: { title: SITE_TITLE, description: SITE_TITLE, page_status: 503 },
                code: 500,
            };
        }
    };

    return cachedUnaPageJson({
        path,
        key: unaPageCacheKey({
            url: l,
            tenant: tenantUnaUrl ?? '',
            cookieString: cookieString || '',
        }),
        load: loadUnaPage,
    });
});


export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    //maximumScale: 1, // Prevent iOS auto-zoom on input focus
    viewportFit: 'cover',
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: 'rgb(244,244,245)' },
        { media: '(prefers-color-scheme: dark)', color: 'rgb(9,9,11)' },
    ],
}


export async function generateMetadata(props: PageProps): Promise<Metadata> {
    const data = await loadPage(props);
    const page: UnaPage = data?.data || {};
    await followUnaRedirect(props, page);

    const [params, searchParams] = await Promise.all([props.params, props.searchParams]);
    const origin = await siteOrigin();
    const url = pagePath(params.path, searchParams, true);
    // A page the viewer can't open, a missing page or a failed request shows nothing of
    // the entry: older UNA versions still send its title and text there.
    const isOpen = !page.page_status && !((data?.code ?? 0) >= 400) && !page.redirect;
    // Only a page UNA reports as missing or closed (404, 403) is kept out of search. A failed
    // request is temporary: UNA down, or a reply that isn't JSON (getData's page_status 503).
    const isNoIndex = [403, 404].includes(Number(page.page_status)) || data?.code === 404;
    // UNA sends titles HTML-escaped; Next escapes metadata again, so the tab would read `&amp;`.
    const name = isOpen ? decodeTextNode(page.title || SITE_TITLE) : SITE_TITLE;
    const description = isOpen ? previewDescription(page.description) : '';
    const image = isOpen && typeof page.image === 'string' ? page.image : '';
    // `meta` comes from newer UNA versions only.
    const meta: UnaPageMeta = (isOpen && page.meta) || {};
    const imageWidth = Number(meta.image_width) > 0 ? Number(meta.image_width) : undefined;
    const imageHeight = Number(meta.image_height) > 0 ? Number(meta.image_height) : undefined;
    const card = image
        ? (isOneOf(TWITTER_CARDS, meta.card) ? meta.card : 'summary_large_image')
        : 'summary';
    const isClientProject = UNA_URL != 'https://api.neo.so';
    const iconPng = isClientProject ? '/static/logo192.png' : '/logo192.png';

    const appleAppId = appSetting('smart_app_banner', 'apple_app_id');
    const appleAppArgument = appSetting('smart_app_banner', 'apple_app_argument');
    const other: Record<string, string> = {
        'mobile-web-app-capable': 'yes',
    };
    if (appleAppId) {
        other['apple-itunes-app'] = appleAppArgument
            ? `app-id=${appleAppId}, app-argument=${appleAppArgument}`
            : `app-id=${appleAppId}`;
    }

    return {
        ...(origin && { metadataBase: new URL(origin) }),
        title: name,
        ...(description && { description }),
        ...(isNoIndex && { robots: { index: false } }),
        alternates: { canonical: url },
        manifest: isClientProject ? '/static/manifest.json' : '/manifest.json',
        icons: {
            // PNG for link previews and clients without SVG icons; the SVG last, for
            // browsers that take the last icon they can use.
            icon: [
                { url: iconPng, type: 'image/png', sizes: '192x192' },
                { url: isClientProject ? '/static/favicon.svg' : '/favicon.svg', type: 'image/svg+xml' },
            ],
            apple: iconPng,
        },
        other,
        openGraph: {
            title: name,
            ...(description && { description }),
            url,
            siteName: SITE_TITLE,
            type: isOneOf(OG_TYPES, meta.og_type) ? meta.og_type : 'website',
            ...(image && {
                images: [
                    {
                        url: image,
                        ...(imageWidth && imageHeight && { width: imageWidth, height: imageHeight }),
                        alt: name,
                    },
                ],
            }),
        },
        // Next fills twitter:title, description and image from openGraph.
        twitter: { card },
    }
}

export default async function Page(props: PageProps) {
    const params = await props.params;
    const path = params?.path?.join('/') || '';
    const isHomePage = path === '' || path === 'home' || path === 'index';
    
    const data = await loadPage(props);
    await followUnaRedirect(props, data?.data);

    // Static file 404 — call notFound immediately
    if (data?.code === 404 && !isHomePage) {
        notFound();
    }
    
    // Handle API errors gracefully - especially for home/splash page
    // UNA may return errors for guest users when certain blocks (e.g., messenger) 
    // try to access user context. The frontend should still render the splash page.
    const hasApiError = data?.code === 500 || data?.code === 503;
    
    if (hasApiError && isHomePage) {
        console.warn('UNA API error on home page - rendering with fallback data for splash screen');
        // Provide minimal fallback data so splash page can render
        const fallbackData = {
            title: SITE_TITLE,
            description: SITE_TITLE,
            uri: '/',
            url: '/',
            page_name: 'home',
            page_type: 'home',
            logged: 0,
            // Empty blocks - splash will render static content
            blocks: {}
        };
        
        return (
            <Suspense fallback={null}>
                <Root path={'home'} data={fallbackData} uri={'/'} url={'/'} code={200} />
            </Suspense>
        );
    }
    
    if (data?.data?.page_status == 404) {
        notFound()
    }

    return (
        <Suspense fallback={null}>
            <Root path={path} data={data?.data} uri={data?.data?.uri} url={data?.data?.url} code={data?.code}></Root>
        </Suspense>
    )
}
