import { NextResponse } from 'next/server'
import { UNA_URL, UNA_API_KEY } from 'app/config';
export const config = {
    matcher: ["/((?!static|_next|sw.js|manifest.json|logo192.png|loader.svg|favicon.ico|_vercel).*)"],
    //runtime: 'experimental-edge',
};

export function proxy(request) {
    
    if (!request.nextUrl.pathname.includes('.php')) {
        
        if (!request.nextUrl.pathname.includes('.icon')) {
            let c = request.cookies.getAll();
            let cookieString = '';
            c.map(function (item) {
                cookieString += item.name + '=' + encodeURIComponent(item.value) + '; '
            });
            let url = request.nextUrl.origin + request.nextUrl.pathname + request.nextUrl.search;
            if (request.nextUrl.pathname == '/')
                url = request.nextUrl.origin + '/home' + request.nextUrl.search

            if (cookieString != ''){
                const response =  NextResponse.rewrite(new URL(url + (url.includes('?') ? '&' : '?') + "cookieString=" + cookieString));
                response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
                response.headers.set('CDN-Cache-Control', 'no-store')
                response.headers.set('Vercel-CDN-Cache-Control', 'no-store')
                return response
            }
            else{
                const response = NextResponse.rewrite(new URL(url))
                response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
                response.headers.set('CDN-Cache-Control', 'no-store')
                response.headers.set('Vercel-CDN-Cache-Control', 'no-store')
                return response
            }
        }
        else{
            const url = new URL(request.url);
            const iconApiUrl = new URL('/api/icon', request.url);
            iconApiUrl.search = url.search;
            return NextResponse.rewrite(iconApiUrl);
        }
    }
    else{
        let c = request.cookies.getAll();
        let cookieString = '';
        c.map(function (item) {
            cookieString += item.name + '=' + encodeURIComponent(item.value) + '; '
        });

        const url = new URL(request.url);

        const tmpHeaders = new Headers(request.headers)

        tmpHeaders.set('x-hello-from-middleware1', 'hello')
        tmpHeaders.set('authorization', `Bearer ${UNA_API_KEY}`)
        tmpHeaders.set('cookie', cookieString)

        let q = url.search;
       /* if (url.searchParams.get('r') == 'q'){
            let a = {'accounts_count': {q: 'SELECT Count(*) FROM sys_accounts', t: 'One'}}
            let b = a[url.searchParams.get('q')];
            q = '?r=q&q=' + b.q + '&t=' + b.t;
        }*/
        
        return NextResponse.rewrite(UNA_URL + request.nextUrl.pathname.replace('/api/','/') + q,
        {
            request: {
                headers: tmpHeaders,
            },
        })
    }
}