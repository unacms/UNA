import { UNA_URL, UNA_API_KEY, getRemoteSettings } from 'app/config';
import { cache } from 'react'
import { Root } from 'app/root'
import { Suspense } from 'react'
import { Loading } from 'app/loading'
import 'app/styles/global.default.css'
import 'app/styles/global.css'

const SITE_TITLE = 'NEO';
let remote_config = {hash: null, data: null};
//export const runtime = 'edge'

const getData = cache(async (props) => {
    let path = props.params.path.join('/');
    let cookieString = props.searchParams.cookieString;

    const opts = {
        headers: {
            cookie: cookieString,
            authorization: 'Bearer ' + UNA_API_KEY,
        },
        cache: 'no-store'
    };

    let l = UNA_URL + '/api.php' + '?r=system/get_page_by_request/TemplServicePages&params[]=' + path;
    let searchParams = JSON.parse(JSON.stringify(props.searchParams));

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
    //console.log('^^^^^^^^^^^^^^^^^^^^^^^^^', res);
    return await res.json()
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
    const isClientProject = UNA_URL != 'https://api.neo.so';

    return {
        description: SITE_TITLE,
        manifest: isClientProject ? '/static/manifest.json' : '/manifest.json',
        icons: {
            icon: isClientProject ? '/static/favicon.ico' : '/favicon.ico',
        },
        other: {
            'apple-mobile-web-app-capable': 'yes',
            // 'og:title': data?.data?.title
        },

    }
}

export default async function Page(props) {
    const data = await getData(props);    
    if (!remote_config.data || data.hash != remote_config.hash){
        remote_config = await getRemoteSettings(true);   
    }
    return <Suspense fallback={<Loading />}>
        <Root settings={remote_config.data} path={'home'} data={data?.data} uri={data?.data?.uri} url={data?.data?.url} code={data.code}></Root>
    </Suspense>
}
