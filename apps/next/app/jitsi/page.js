import { cookies } from 'next/headers'
import { env } from 'app/lib/env';
import { Page } from './content'
import { cache } from 'react'


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


export default async function Path (props) {

    const data = await getData(props)
    return <Page path={'home'} data={data.data} uri={data.data.uri} url ={data.data.url}>{}</Page>
}
