import { UNA_URL, UNA_API_KEY, getRemoteSettings } from 'app/config';
import { cache } from 'react'
import Root from 'app/root-client'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { headers } from "next/headers"

const SITE_TITLE = 'NEO';

let remote_config = { hash: null, data: null };
//export const runtime = 'edge'
let cachedData = {};

async function getCachedData(props) {
     //AFTER REACT 19 UPDATE NEED REMOVE DOUBLE CALLS
    const params = await props.params
    const search_params = await props.searchParams

    // Generate a unique key for each `props` input to store cache separately for each set of `props`
    const cacheKey = JSON.stringify({ params, search_params });
    const currentTime = Date.now();

    // Check if data is in cache and if it's still valid (not older than 1 second)
    if (cachedData[cacheKey] && (currentTime - cachedData[cacheKey].timestamp < 1000)) {
        return cachedData[cacheKey].data;
    }

    // If not cached or expired, fetch new data and store it in cache with a timestamp
    const data = await getData(params, search_params);
    cachedData[cacheKey] = {
        data,
        timestamp: currentTime,
    };

    return data;
}


const getData = cache(async (params, search_params) => {
    let path = params.path.join('/');
    
    // Ранняя проверка для статических файлов - до любых логов и запросов к UNA
    const staticFileExtensions = ['.map', '.js', '.css', '.json', '.png', '.jpg', '.svg', '.ico', '.woff', '.woff2', '.ttf'];
    const isStaticFile = staticFileExtensions.some(ext => path.endsWith(ext));
    
    if (isStaticFile || path.startsWith('_next/') || path.startsWith('static/')) {
        // Возвращаем 404 без логирования и запросов к UNA
        return { data: { title: SITE_TITLE, description: SITE_TITLE }, code: 404 };
    }
    
    let hdrs = await headers();
    let cookieString = search_params.cookieString;    

    const opts = {
        headers: {
            cookie: cookieString,
            authorization: 'Bearer ' + (hdrs?.get("x-tenant-una-key") ?? UNA_API_KEY),
        },
        cache: 'no-store'
    };
    
    let l = hdrs?.get("x-tenant-una-url") ?? UNA_URL;
    l += '/api.php' + '?r=system/get_page_by_request/TemplServicePages&params[]=' + path;
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
    let res;
    try {
        res = await fetch(l, opts)
    } catch (error) {
        console.error('Server fetch failed (network/connection):', error);
        return { data: { title: SITE_TITLE, description: SITE_TITLE }, code: 503 };
    }

   /* if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error('Server fetch failed (http):', res.status, body);
        return { data: { title: SITE_TITLE, description: SITE_TITLE }, code: res.status };
    }*/

    const resClone = res.clone();
    try {
        return await res.json();
    } catch (error) {
        const text = await resClone.text();
        console.error("!-------------------------! JSON error:", text);
        return { data: { title: SITE_TITLE, description: SITE_TITLE }, code: 500 };
    }
});


export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1, // Prevent iOS auto-zoom on input focus
    viewportFit: 'cover',
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: 'rgba(255,255,255,0)' },
        { media: '(prefers-color-scheme: dark)', color: 'rgba(0,0,0,0)' },
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
            icon: isClientProject ? '/static/favicon.ico' : '/favicon.ico',
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
