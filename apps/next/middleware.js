import { NextResponse } from 'next/server'
import { env } from 'app/lib/env';

export const config = {
    matcher: "/((?!static|_next).*)",
    runtime: 'experimental-edge',
};

export function middleware(request) {
    if (!request.nextUrl.pathname.includes('api.php')) {
        let c = request.cookies.getAll();
        let cookieString = '';
        c.map(function (item) {
            cookieString += item.name + '=' + encodeURIComponent(item.value) + '; '
        });
        if (cookieString != '')
            return NextResponse.rewrite(new URL(request.url + "?cookieString=" + cookieString));
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
            test: 'test555',
            cookie: cookieString,
        };
        const url = new URL(request.url);

        const tmpHeaders = new Headers(request.headers)

        tmpHeaders.set('x-hello-from-middleware1', 'hello')
        tmpHeaders.set('authorization', `Bearer ${env('UNA_API_KEY')}`)
        tmpHeaders.set('cookie', cookieString)

       /* return new NextResponse(
            JSON.stringify({ success: false, message: JSON.stringify(headers) }),
            { status: 401, headers: { 'content-type': 'application/json' } }
          )
*/
        return NextResponse.rewrite(env('UNA_URL') + '/api.php' + url.search,
        {
          request: {
            headers: tmpHeaders,
          },
        })
    }
}