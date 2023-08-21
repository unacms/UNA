import { NextResponse } from 'next/server'
import { env } from 'app/lib/env';

export const config = {
    matcher: "/((?!static|_next).*)",
};

export function middleware(request) {
    //console.log(request.nextUrl.pathname);
    if (!request.nextUrl.pathname.includes('api.php')) {
        if (request.nextUrl.pathname == '/')
            return NextResponse.redirect(new URL(request.url + 'home'));    
        
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
  //  return NextResponse.next()
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
        //console.log(env('UNA_URL') );
        return NextResponse.rewrite(env('UNA_URL') + '/api.php' + url.search,
        {
          request: {
            headers: tmpHeaders,
          },
        })
    }
}