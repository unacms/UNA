import { UNA_URL, UNA_API_KEY, MULTITENANT, PREVIEW_DOMAIN, appSetting } from 'app/config';
import { cache } from 'react'
import Root from 'app/root-client'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { headers } from "next/headers"
import { resolveLangCode } from '../../lib/resolve-lang'
import { cachedUnaPageJson, unaPageCacheKey } from '../../lib/una-page-cache'

const SITE_TITLE = appSetting('config', 'title');

async function loadPage(props) {
    const [params, searchParams] = await Promise.all([
        props.params,
        props.searchParams,
    ]);
    return getData(params.path.join('/'), JSON.stringify(searchParams));
}

// Primitive arguments let metadata and page rendering share this request's fetch.
const getData = cache(async (path, searchParamsKey) => {
    const search_params = JSON.parse(searchParamsKey);

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
    // Tenant headers come from proxy.js only (it drops client-sent ones); trust them
    // only when the proxy can set them: multi-tenant mode or CI preview hosts.
    const trustTenantHeaders = MULTITENANT || !!PREVIEW_DOMAIN;
    const tenantUnaUrl = trustTenantHeaders ? hdrs.get('x-tenant-una-url') : null;
    const tenantUnaKey = trustTenantHeaders ? hdrs.get('x-tenant-una-key') : null;

    const fetchHeaders = {
        cookie: cookieString,
        authorization: 'Bearer ' + (tenantUnaKey ?? UNA_API_KEY),
    };

    let l = tenantUnaUrl ?? UNA_URL;
    l += '/api.php' + '?r=system/get_page_by_request/TemplServicePages&params[]=' + path;
    const langCode = resolveLangCode(cookieString, hdrs?.get('accept-language') || '');
    if (langCode) {
        l += '&lang=' + encodeURIComponent(langCode);
    }
    let searchParams = { ...search_params };

    delete searchParams.cookieString; // legacy: old proxy put cookies in the URL
    delete searchParams.path;
    delete searchParams._rsc;
    let sBlocks = '';
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

    const loadUnaPage = async () => {
        let res;
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
            return JSON.parse(text);
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


export const viewport = {
    width: 'device-width',
    initialScale: 1,
    //maximumScale: 1, // Prevent iOS auto-zoom on input focus
    viewportFit: 'cover',
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: 'rgb(244,244,245)' },
        { media: '(prefers-color-scheme: dark)', color: 'rgb(9,9,11)' },
    ],
}


export async function generateMetadata(props) {
    
    const data = await loadPage(props);
    const description = data?.data?.description || SITE_TITLE;
    const name = data?.data?.title || SITE_TITLE;
    const image = data?.data?.image;
    const isClientProject = UNA_URL != 'https://api.neo.so';

    const appleAppId = appSetting('smart_app_banner', 'apple_app_id');
    const appleAppArgument = appSetting('smart_app_banner', 'apple_app_argument');
    const other = {
        'mobile-web-app-capable': 'yes',
    };
    if (appleAppId) {
        other['apple-itunes-app'] = appleAppArgument
            ? `app-id=${appleAppId}, app-argument=${appleAppArgument}`
            : `app-id=${appleAppId}`;
    }

    return {
        title: name,
        description: description,
        manifest: isClientProject ? '/static/manifest.json' : '/manifest.json',
        icons: {
            icon: isClientProject ? '/static/favicon.svg' : '/favicon.svg',
        },
        other,
        openGraph: {
            title: name,
            description: description,
            ...(image && {
                images: [
                    {
                        url: image,
                        alt: name,
                    },
                ],
            }),
        },
        twitter: {
            card: 'summary_large_image',
            title: name,
            description: description,
            ...(image && {
                images: [image],
            }),
            
        },

    }
}

export default async function Page(props) {
    const params = await props.params;
    const path = params?.path?.join('/') || '';
    const isHomePage = path === '' || path === 'home' || path === 'index';
    
    const data = await loadPage(props);
    
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
        notFound(props)
    }

    return (
        <Suspense fallback={null}>
            <Root path={path} data={data?.data} uri={data?.data?.uri} url={data?.data?.url} code={data?.code}></Root>
        </Suspense>
    )
}
