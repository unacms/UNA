//import { cookies } from 'next/headers'
import { env, isCustom } from 'app/lib/env';
import { cache } from 'react'
import { Root } from 'app/root'
import { Suspense } from 'react'
import 'app/styles/global.css'

const siteTitle = 'NEO';
export const runtime = 'edge'

const getData = cache(async (props) => {
    let path = 'home';
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

    console.log('^^^^^^^^^^^^^^^^^^^^^^^^^', l);
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
    return {
        description: siteTitle,
        manifest: '/manifest.json',
        icons: {
            icon: isCustom() ? '/static/favicon.ico' : '/favicon.ico',
        },
        other: {
            'apple-mobile-web-app-capable': 'yes',
        },
        
    }
}

export default async function Path (props) {
    const data = await getData(props);
    return  <Suspense fallback={<p>Loading feed...</p>}>
        <Root path={'home'} data={data.data} uri={data.data.uri} url ={data.data.url}></Root>
    </Suspense>
   /* const data = await getData(props);
    
    if (data.data){
        if (props?.searchParams?.empty)
            data.data.empty = true;
        return <Root path={'home'} data={data.data} uri={data.data.uri} url ={data.data.url}></Root>
    }*/
}
