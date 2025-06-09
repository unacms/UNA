import { UNA_URL, UNA_API_KEY, getRemoteSettings } from 'app/config';
import { cache } from 'react'
import { Root } from 'app/root'
import { Suspense } from 'react'
import { Loading } from 'app/loading'
import 'app/styles/global.default.css'
import 'app/styles/global.css'
import { notFound } from 'next/navigation'
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
    let cookieString = search_params.cookieString;

    const opts = {
        headers: {
            cookie: cookieString,
            authorization: 'Bearer ' + UNA_API_KEY,
        },
        cache: 'no-store'
    };
    let l = UNA_URL + '/api.php' + '?r=system/get_page_by_request/TemplServicePages&params[]=' + path;
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
    const res = await fetch(l, opts)
    const resClone = res.clone();
    try {
        return await res.json();
    } catch (error) {
        const text = await resClone.text();
        console.error("!-------------------------! JSON error:", text);
    }
});


export const viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'viewport-fit',
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: 'rgba(255,255,255,0.8)' },
        { media: '(prefers-color-scheme: dark)', color: 'rgba(17,24,39,0.8)' },
    ],
}


export async function generateMetadata(props) {
    
    const data = await getCachedData(props);
    const description = data?.data?.description || SITE_TITLE;
    const name = data?.data?.title || SITE_TITLE;
    const image = data?.data?.image;
    const isClientProject = UNA_URL != 'https://api.neo.so';

    return {
        description: description,
        manifest: '/manifest.json',
        icons: {
            icon: '/favicon.ico',
        },
        other: {
            'mobile-web-app-capable': 'yes',
            // 'og:title': data?.data?.title
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

    const data = await getCachedData(props);
    if (!remote_config.data || data.hash != remote_config.hash) {
        remote_config = await getRemoteSettings(true);
    }
    if (data?.data.page_status == 404) {
        notFound(props)
    }

    return (
        <Suspense fallback={<Loading />}>
            <Root settings={remote_config.data} path={'home'} data={data?.data} uri={data?.data?.uri} url={data?.data?.url} code={data.code}></Root>
        </Suspense>
    )
}
