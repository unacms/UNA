import { NextResponse } from 'next/server'
 
export function middleware(request) {
   // Clone the request headers and set a new header `x-hello-from-middleware1`
   const requestHeaders = new Headers(request.headers)
   requestHeaders.set('x-hello-from-middleware1', 'hello')
  
   // You can also set request headers in NextResponse.rewrite
   const response = NextResponse.next({
     request: {
       // New request headers
       headers: requestHeaders,
       params:{
          path2:'xxx'
       }
     },
     
   })
   //console.log(request)
   // Set a new response header `x-hello-from-middleware2`
  // response.headers.set('x-hello-from-middleware2', 'hello')
   // return NextResponse.rewrite(new URL('/about', 'xxx'))
   if (!request.nextUrl.pathname.includes('api.php')) {
   let c = request.cookies.getAll();
   let cookieString = '';

   c.map(function (item) {
       cookieString += item.name + '=' + encodeURIComponent(item.value) + '; '
   });
   if (cookieString != '')
    return NextResponse.rewrite(new URL(request.url+"?cookieString="+cookieString));
   }
    return NextResponse.next()
   //return NextResponse.next();
   //return response
}