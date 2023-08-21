import { cookies } from 'next/headers'
import { env } from 'app/lib/env';
import { cache } from 'react'
import { Root } from 'app/root'
import 'app/styles/global.css'

const siteTitle = 'NEO';
//export const runtime = 'edge'

const getData = cache(async (props) => {
    let path = props.params.path.join('/');
 
    let c = cookies().getAll();
    let cookieString = "";
    //let cookieString = props.searchParams.cookieString;

    c.map(function (item) {
        cookieString += item.name + '=' + encodeURIComponent(item.value) + '; '
    });
    const opts = {
        headers: {
            cookie: cookieString,
            authorization: 'Bearer ' + env('UNA_API_KEY'),
            
          /*  'Cache-Control': 'public, s-maxage=1',
            'CDN-Cache-Control': 'public, s-maxage=60',
            'Vercel-CDN-Cache-Control': 'public, s-maxage=3600',*/
        },
        cache: 'force-cache'  
    };
    
    let l = env('UNA_URL') + '/api.php' + '?r=system/get_page_by_request/TemplServicePages&params[]=' + path;
    const res = await fetch(l, opts)
    return await res.json()
 });

export async function generateMetadata(props) {
    const data = await getData(props)
    return {
        title: data?.data?.title,
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
            'og:title': data?.data?.title
        },
        themeColor: [
            { media: '(prefers-color-scheme: light)', color: 'rgba(255,255,255,0.8)' },
            { media: '(prefers-color-scheme: dark)', color: 'rgba(17,24,39,0.8)' },
        ],
    }
}

export default async function Path (props) {
    //console.log('&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&',props)
    const data = await getData(props)
    if (data.data)
        return <Root  path={'home'} data={data.data} uri={data.data.uri} url ={data.data.url}></Root>
    else
        return <div className='bg-red-500'>cxvz</div>
   
}
