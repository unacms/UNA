import { NextResponse } from 'next/server'
import { env } from 'app/lib/env';

export const config = {
    matcher: ["/((?!static|_next|sw.js|manifest.json|logo192.png|loader.svg|favicon.ico).*)"],
    runtime: 'experimental-edge',
};


export function middleware(request) {
    if (!request.nextUrl.pathname.includes('.php')) {
        let c = request.cookies.getAll();
        let cookieString = '';
        c.map(function (item) {
            cookieString += item.name + '=' + encodeURIComponent(item.value) + '; '
        });
        let url = request.url;
        if (request.nextUrl.pathname == '/')
            url = url +'home';
        if (cookieString != ''){
            const response =  NextResponse.rewrite(new URL(url + (url.includes('?') ? '&' : '?') + "cookieString=" + cookieString));
            return response
        }
        else{
            const response = NextResponse.rewrite(new URL(url))
            response.headers.set('Cache-Control', 'public, s-maxage=1')
            response.headers.set('CDN-Cache-Control', 'public, s-maxage=60')
            response.headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=3600')
            return response
        }
            
    }
    else{
        let c = request.cookies.getAll();
        let cookieString = '';
        c.map(function (item) {
            cookieString += item.name + '=' + encodeURIComponent(item.value) + '; '
        });

        const headers = {
            authorization: `Bearer ${env('UNA_API_KEY')}`,
            cookie: cookieString,
        };
        const url = new URL(request.url);

        const tmpHeaders = new Headers(request.headers)

        tmpHeaders.set('x-hello-from-middleware1', 'hello')
        tmpHeaders.set('authorization', `Bearer ${env('UNA_API_KEY')}`)
        tmpHeaders.set('cookie', cookieString)

        let q = url.search;
        if (url.searchParams.get('r') == 'q'){
            let a = {'accounts_count': {q: 'SELECT Count(*) FROM sys_accounts', t: 'One'}}
            let b = a[url.searchParams.get('q')];
            q = '?r=q&q=' + b.q + '&t=' + b.t;
        }
        return NextResponse.rewrite(env('UNA_URL') + request.nextUrl.pathname.replace('/api/','/') + q,
        {
            request: {
                headers: tmpHeaders,
            },
        })
    }
}