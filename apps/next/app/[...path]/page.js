//import { cookies } from 'next/headers'
import { env } from 'app/lib/env';
import { cache } from 'react'
import { Root,Root2} from 'app/root'
import 'app/styles/global.css'

const siteTitle = 'NEO';
export const runtime = 'edge'

const getData = cache(async (props) => {
    let path = props.params.path.join('/');
    
    let cookieString = props.searchParams.cookieString;

    const opts = {
        headers: {
            cookie: cookieString,
            authorization: 'Bearer ' + env('UNA_API_KEY'),
        },
        cache: 'no-store' 
        //next: { revalidate: 0 } 
    };
    
    let l = env('UNA_URL') + '/api.php' + '?r=system/get_page_by_request/TemplServicePages&params[]=' + path;
    let searchParams = JSON.parse(JSON.stringify(props.searchParams));

    delete searchParams.cookieString;
    delete searchParams.path;
    
    if (Object.keys(searchParams).length > 0) {
        l = l + '&params[]=&params[]=' + JSON.stringify(searchParams);
    }

    //console.log('^^^^^^^^^^^^^^^^^^^^^^^^^',searchParams, l);
    const res = await fetch(l, opts)
    //console.log('^^^^^^^^^^^^^^^^^^^^^^^^^', res);
    return await res.json()
 });

 export async function generateMetadata(props) {
    return {
        description: siteTitle,
        viewport: {
            width: 'device-width',
            initialScale: 1,
            viewportFit: 'viewport-fit',
        },
        manifest: '/manifest.json',
        icons: {
            icon: '/favicon.ico',
        },
        other: {
            'apple-mobile-web-app-capable': 'yes',
           // 'og:title': data?.data?.title
        },
        themeColor: [
            { media: '(prefers-color-scheme: light)', color: 'rgba(255,255,255,0.8)' },
            { media: '(prefers-color-scheme: dark)', color: 'rgba(17,24,39,0.8)' },
        ],
    }
}

export default async function Path (props) {
    const data = await getData(props);
    
    if (data.data){
        if (props?.searchParams?.empty)
            data.data.empty = true;
        return <Root path={'home'} data={data.data} uri={data.data.uri} url ={data.data.url}></Root>
    }
}
