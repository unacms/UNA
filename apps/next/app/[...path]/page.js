import { UNA_URL, UNA_API_KEY, getRemoteSettings, appSetting } from 'app/config';
import { cache } from 'react'
import Root from 'app/root-client'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { headers } from "next/headers"

const SITE_TITLE = 'NEO';
// Settings use the historical misspelling; keep this key aligned with settings/layout.js.
const AVAILABLE_LANGS_SETTING_KEY = 'avaliable_langs';

// Resilience tuning (mirrors getRemoteSettings() in packages/app/config.js and not-found.js):
// a short per-attempt timeout fails fast instead of waiting undici's 10s default
// connectTimeout, then retries with linear backoff before degrading gracefully.
const FETCH_TIMEOUT_MS = 3500;
const MAX_ATTEMPTS = 3;
const BASE_RETRY_DELAY_MS = 300;

const buildErrorData = (code) => ({ data: { title: SITE_TITLE, description: SITE_TITLE }, code });

let remote_config = { hash: null, data: null };
//export const runtime = 'edge'

const getCookieValue = (cookieString = '', name) => {
    return cookieString
        .split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith(name + '='))
        ?.split('=')
        .slice(1)
        .join('=') || '';
};

const decodeCookieValue = (value = '') => {
    try {
        return decodeURIComponent(value);
    } catch {
        return '';
    }
};

const normalizeLangCode = (value = '') => String(value)
    .toLowerCase()
    .split(/[-_]/)[0];

const resolveLangFromAcceptLanguage = (acceptLanguage = '') => {
    const configuredLangs = appSetting('layout', AVAILABLE_LANGS_SETTING_KEY);
    const supportedLangs = Array.isArray(configuredLangs)
        ? configuredLangs.filter((lang) => lang && lang !== 'auto')
        : ['en'];
    const requestedLangs = acceptLanguage
        .split(',')
        .map((part) => normalizeLangCode(part.split(';')[0]?.trim()))
        .filter(Boolean);

    return requestedLangs.find((lang) => supportedLangs.includes(lang)) || supportedLangs[0] || 'en';
};

async function getCachedData(props) {
    const [params, search_params] = await Promise.all([
        props.params,
        props.searchParams,
    ])

    // Key the request-scoped cache on a stable primitive. generateMetadata() and the
    // Page component run in the same request but receive distinct props objects, so
    // passing the objects straight to React cache() never deduped (Object.is miss) and
    // both calls hit the backend. Stringifying gives both callers an identical key, so
    // React cache() collapses them into a single fetch per request.
    const cacheKey = JSON.stringify({ params, search_params });
    return getData(cacheKey);
}


const getData = cache(async (cacheKey) => {
    const { params, search_params } = JSON.parse(cacheKey);
    let path = params.path.join('/');
    
    // Ранняя проверка для статических файлов - до любых логов и запросов к UNA
    const staticFileExtensions = ['.map', '.js', '.css', '.json', '.png', '.jpg', '.svg', '.ico', '.woff', '.woff2', '.ttf'];
    const isStaticFile = staticFileExtensions.some(ext => path.endsWith(ext));
    
    if (isStaticFile || path.startsWith('_next/') || path.startsWith('static/')) {
        // Возвращаем 404 без логирования и запросов к UNA
        return buildErrorData(404);
    }
    
    let hdrs = await headers();
    let cookieString = search_params.cookieString;    

    const fetchHeaders = {
        cookie: cookieString,
        authorization: 'Bearer ' + (hdrs?.get("x-tenant-una-key") ?? UNA_API_KEY),
    };
    
    let l = hdrs?.get("x-tenant-una-url") ?? UNA_URL;
    l += '/api.php' + '?r=system/get_page_by_request/TemplServicePages&params[]=' + path;
    const langMode = decodeCookieValue(getCookieValue(cookieString, 'neo_lang'));
    const cookieLangCode = decodeCookieValue(getCookieValue(cookieString, 'neo_lang_code'));
    const langCode = cookieLangCode || (langMode && langMode !== 'auto'
        ? langMode
        : resolveLangFromAcceptLanguage(hdrs?.get('accept-language') || ''));
    if (langCode) {
        l += '&lang=' + encodeURIComponent(langCode);
    }
    let searchParams = JSON.parse(JSON.stringify(search_params));

    delete searchParams.cookieString;
    delete searchParams.path;
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

    console.log('^^^^^^^^^^^^^^^^^^^^^^^^^', searchParams, l);

    let lastError = null;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        try {
            const res = await fetch(l, {
                headers: fetchHeaders,
                cache: 'no-store',
                signal: controller.signal,
            });

            // Keep the abort timer active across the body read so a slow/stalled
            // response body is bounded too — not just the connection/headers phase.
            const resClone = res.clone();
            try {
                return await res.json();
            } catch (parseError) {
                // A timeout abort during the body read is a transient/network-class
                // failure (retryable). A fully-received but malformed body is not.
                if (controller.signal.aborted) {
                    throw parseError;
                }
                const text = await resClone.text().catch(() => '');
                console.error('!-------------------------! JSON error:', text);
                return buildErrorData(500);
            }
        } catch (error) {
            // Network/connection error or per-attempt timeout abort (connect, headers,
            // or body read) — retry with backoff.
            lastError = error;
            if (attempt < MAX_ATTEMPTS) {
                await new Promise((resolve) => setTimeout(resolve, BASE_RETRY_DELAY_MS * attempt));
                continue;
            }
            console.error('Server fetch failed (network/connection or timeout) after retries:', error);
            return buildErrorData(503);
        } finally {
            clearTimeout(timeout);
        }
    }

    // Defensive: loop should always return above.
    console.error('Server fetch exhausted attempts:', lastError);
    return buildErrorData(503);
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
    
    const data = await getCachedData(props);
    const description = data?.data?.description || SITE_TITLE;
    const name = data?.data?.title || SITE_TITLE;
    const image = data?.data?.image;
    const isClientProject = UNA_URL != 'https://api.neo.so';

    return {
        title: name,
        description: description,
        manifest: isClientProject ? '/static/manifest.json' : '/manifest.json',
        icons: {
            icon: isClientProject ? '/static/favicon.svg' : '/favicon.svg',
        },
        other: {
            'mobile-web-app-capable': 'yes',
        },
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
    
    const data = await getCachedData(props);
    
    // Если это 404 для статических файлов - сразу notFound
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
        
        if (!remote_config.data) {
            try {
                remote_config = await getRemoteSettings(true);
            } catch (e) {
                console.error('Remote settings fetch failed:', e);
            }
        }
        
        return (
            <Suspense fallback={null}>
                <Root settings={remote_config.data} path={'home'} data={fallbackData} uri={'/'} url={'/'} code={200} />
            </Suspense>
        );
    }
    
    if (!remote_config.data || data?.hash != remote_config.hash) {
        try {
            remote_config = await getRemoteSettings(true);
        } catch (e) {
            console.error('Remote settings fetch failed:', e);
        }
    }
    if (data?.data?.page_status == 404) {
        notFound(props)
    }

    return (
        <Suspense fallback={null}>
            <Root settings={remote_config.data} path={'home'} data={data?.data} uri={data?.data?.uri} url={data?.data?.url} code={data?.code}></Root>
        </Suspense>
    )
}
