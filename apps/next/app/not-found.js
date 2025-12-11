import { Root } from 'app/root'
import { Suspense } from 'react'
import { Loading } from 'app/loading'
// CSS imports removed - already imported in root layout.js
// This prevents Next.js from creating a separate not-found.css bundle
// that gets speculatively preloaded on all pages
import { cache } from 'react'
import { UNA_URL, UNA_API_KEY } from 'app/config';
import { cookies } from 'next/headers'

export const getData = cache(async (props) => {

    const cookieStore = await cookies()
    let c = cookieStore.getAll();
    let cookieString = '';
    
    c.map(function (item) {
        cookieString += item.name + '=' + encodeURIComponent(item.value) + '; '
    });

    const opts = {
        headers: {
            cookie: cookieString,
            authorization: 'Bearer ' + UNA_API_KEY,
        },
        cache: 'no-store'
    };
    let l = UNA_URL + '/api.php' + '?r=system/get_page_by_request/TemplServicePages&params[]=' + 'home';
    


    const res = await fetch(l, opts)
    let b = await res.json();
    b.data.page_status = 404
    return  b;
});

export default async function NotFound() {
    const data = await getData();    

    
    return (
        <Suspense fallback={<Loading/>}>
            <Root path={'home'} data={data?.data} uri={data?.data?.uri} url={data?.data?.url} code={data.code}></Root>
        </Suspense>
  )
}