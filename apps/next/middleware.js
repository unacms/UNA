import { NextResponse } from 'next/server'
import { env } from 'app/lib/env';

export const config = {
    matcher: "/((?!static|_next|sw.js|manifest.json|logo192.png).*)",
    runtime: 'experimental-edge',
};

export function middleware(request) {
    //console.log(request.nextUrl.pathname)
    if (!request.nextUrl.pathname.includes('.php')) {
        let c = request.cookies.getAll();
        let cookieString = '';
        c.map(function (item) {
            cookieString += item.name + '=' + encodeURIComponent(item.value) + '; '
        });
        if (cookieString != ''){
            const response =  NextResponse.rewrite(new URL(request.url + (request.url.includes('?') ? '&' : '?') + "cookieString=" + cookieString));
            /*response.headers.set('lalalx', 'lalal2')
            response.headers.set('Cache-Control', 'public, s-maxage=1')
            response.headers.set('CDN-Cache-Control', 'public, s-maxage=60')
            response.headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=3600')*/
            return response
        }
        else{
            const response = NextResponse.next()
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
        return NextResponse.rewrite(env('UNA_URL') + request.nextUrl.pathname.replace('/api/','/') + url.search,
        {
            request: {
                headers: tmpHeaders,
            },
        })
    }
}