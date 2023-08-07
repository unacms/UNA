import { cookies } from 'next/headers'
import { env } from 'app/lib/env';
import { Page } from './content'

export const runtime = 'edge'; 

export default async function Path (props) {
    
    let path = props.params.path.join('/');
 
    let c = cookies().getAll();
    let cookieString = '';
 
    c.map(function (item) {
        cookieString += item.name + '=' + encodeURIComponent(item.value) + '; '
    });
    const opts = {
        headers: {
            cookie: cookieString
        }
    };

    const res = await fetch(env('PROTO') + '//'+ env('HOST') +':'+ env('PORT') +'/api/api.php?r=system/get_page_by_request/TemplServicePages&params[]=' + path, opts)
    const data = await res.json()

    return <Page path={'home'} data={data.data} uri={data.data.uri} url ={data.data.url}>{}</Page>
}
