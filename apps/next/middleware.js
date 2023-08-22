import { NextResponse } from 'next/server'
import { env } from 'app/lib/env';

export const config = {
    matcher: "/((?!static|_next).*)",
    runtime: 'experimental-edge',
};

export function middleware(request) {
    if (!request.nextUrl.pathname.includes('api.php')) {
        //return NextResponse.next()
        if (request.nextUrl.pathname == '/')
            return NextResponse.redirect(new URL(request.url + 'home'));    
        
        return NextResponse.next()

        /*    let c = request.cookies.getAll();
        let cookieString = '';
        c.map(function (item) {
            cookieString += item.name + '=' + encodeURIComponent(item.value) + '; '
        });
        
        const tmpHeaders = new Headers(request.headers)

        if (cookieString != '')
            return NextResponse.rewrite(
                new URL(request.url + "?cookieString=" + cookieString),  {
                request: {
                    headers: tmpHeaders,
                },
              });
        else
            return NextResponse.next()*/
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
            cache: 'force-cache'  
        };
        const url = new URL(request.url);

        const tmpHeaders = new Headers(request.headers)

        //tmpHeaders.set('cache', 'force-cache');
        //console.log(env('UNA_URL') );
        return NextResponse.rewrite(env('UNA_URL') + '/api.php' + url.search,
        {
          request: {
            headers: tmpHeaders,
          },
        })
    }
}