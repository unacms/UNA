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
        if (cookieString != '')
            return NextResponse.rewrite(new URL(request.url + (request.url.includes('?') ? '&' : '?') + "cookieString=" + cookieString));
        else
            return NextResponse.next()
    }
    else{
        let c = request.cookies.getAll();
        let cookieString = '';
        c.map(function (item) {
            cookieString += item.name + '=' + encodeURIComponent(item.value) + '; '
        });

        const headers = {
            authorization: `Bearer ${env('UNA_API_KEY')}`,
            'cache-control1': 'public, s-maxage=1',
            'CDN-Cache-Control': 'public, s-maxage=60',
            'Vercel-CDN-Cache-Control': 'public, s-maxage=3600',
            cookie: cookieString,
        };
        const url = new URL(request.url);

        const tmpHeaders = new Headers(request.headers)

        tmpHeaders.set('x-hello-from-middleware1', 'hello')
        tmpHeaders.set('authorization', `Bearer ${env('UNA_API_KEY')}`)
        tmpHeaders.set('cookie', cookieString)
        tmpHeaders.set('cache-control2', 'public, s-maxage=1')
        tmpHeaders.set('CDN-Cache-Control', 'public, s-maxage=60')
        tmpHeaders.set('Vercel-CDN-Cache-Control', 'public, s-maxage=3600')
        return NextResponse.rewrite(env('UNA_URL') + request.nextUrl.pathname.replace('/api/','/') + url.search,
        {
            request: {
                headers: tmpHeaders,
            },
        })
    }
}