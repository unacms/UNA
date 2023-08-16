import { NextResponse } from 'next/server'
import { env } from 'app/lib/env';

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
            cookie: cookieString,
        };
        const url = new URL(request.url);


        /*return new NextResponse(
            JSON.stringify({ success: false, message: JSON.stringify(headers) }),
            { status: 401, headers: { 'content-type': 'application/json' } }
          )
*/
        return NextResponse.rewrite(env('UNA_URL') + '/api.php' + url.search, {
            headers: headers,
        })
    }
}