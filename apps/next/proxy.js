import { NextResponse } from 'next/server'
import { UNA_URL, UNA_API_KEY, MULTITENANT } from 'app/config';
import { getDomainByHostname } from 'app/lib/domains/domains';
import fs from 'fs';
import path from 'path';

export const config = {
    matcher: ["/((?!sw.js|logo192.png|loader.svg|favicon.ico|favicon.svg|manifest.json|static/|_vercel).*)"],
    //runtime: 'experimental-edge',
};

async function setTenantHeaders(response, tenant) {
    response.headers.set("x-tenant-id", tenant.id);
    response.headers.set("x-tenant-una-url", tenant.unaUrl);
    response.headers.set("x-tenant-una-key", tenant.unaApiKey);
    response.headers.set("x-tenant-revision", tenant.revision);
}

async function resolveTenant(hostnameWithPort) {
    const hostname = hostnameWithPort.split(':')[0];
    const domain = await getDomainByHostname(hostname); // return {'id': 'aaa', 'unaUrl': 'http://hihi.com/unatest', 'unaApiKey': 'WqFfru3U3FYFssjaU+Tf2!vsHkRtP!xYqP7/,4YmgG?c?YB9', 'revision': 1};
    // console.log('Resolved tenant for hostname', hostname, ':', domain);
    return domain;
}

export async function proxy(request) {    
    // Main middleware entry: decide how to rewrite incoming requests.
    const pathname = request.nextUrl.pathname;
    
    // Early return for static files and source maps - return 404 immediately without rendering
    const staticExtensions = ['.map'];
    const isSourceMap = staticExtensions.some(ext => pathname.endsWith(ext));
    const isWellKnown = pathname.startsWith('/.well-known/');
    const isAppleAppSiteAssociation = pathname.startsWith('/.well-known/apple-app-site-association');
    
    if (isAppleAppSiteAssociation) {
        const res = NextResponse.next();
        res.headers.set('Content-Type', 'application/json');
        return res;
    }

    if (isSourceMap || isWellKnown) {
        // Return 404 directly without any processing or rendering
        return new NextResponse(null, { status: 404 });
    }

    // serve images proxy as it is
    if (pathname.includes('/api/image')) {
        return NextResponse.next();
    }

    const hostname = request.headers.get("host");
    const tenant = MULTITENANT ? await resolveTenant(hostname) : null;

    // If the request is NOT targeting a PHP endpoint, handle it as a regular
    // page or an internal asset (icons) served by this Next.js app.
    if (!request.nextUrl.pathname.includes('.php')) {

        if (tenant == null && MULTITENANT && !request.nextUrl.pathname.includes('static')) {
            // rewrite to specific page where new tenant can be created
            // return NextResponse.rewrite(new URL(`/new-tenant`, request.url));
            return NextResponse.redirect(new URL('http://localhost:4000'), 307); // temporary redirect
        }        

        // If the path is not an icon, treat it as a normal page: collect
        // cookies and optionally append them as a `cookieString` query param
        // so the downstream handler can access them.
        if (!request.nextUrl.pathname.includes('.icon')) {
            let c = request.cookies.getAll();
            let cookieString = '';
            c.map(function (item) {
                cookieString += item.name + '=' + encodeURIComponent(item.value) + '; '
            });

            // Build the target URL using the original origin + path + search.
            let url = request.nextUrl.origin + request.nextUrl.pathname + request.nextUrl.search;
            // Map root URL `/` to `/home` for downstream routing.
            if (request.nextUrl.pathname == '/')
                url = request.nextUrl.origin + '/home' + request.nextUrl.search            

            // If cookies exist, rewrite the request to include them as a query
            // parameter. This is useful for server-side handlers that read the
            // cookie string from the query.
            if (cookieString != ''){
                const response =  NextResponse.rewrite(new URL(url + (url.includes('?') ? '&' : '?') + "cookieString=" + cookieString));
                if (MULTITENANT && tenant)
                    setTenantHeaders(response, tenant)
                return response
            }
            else{
                // No cookies: perform a simple rewrite and add cache headers
                // to suggest caching behavior at the CDN/Vercel level.
                const response = NextResponse.rewrite(new URL(url))
                response.headers.set('Cache-Control', 'public, s-maxage=1')
                response.headers.set('CDN-Cache-Control', 'public, s-maxage=60')
                response.headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=3600')
                if (MULTITENANT && tenant)
                    setTenantHeaders(response, tenant)
                return response
            }
        }
        else{
            // Path contains `.icon` — rewrite to internal `/api/icon` route,
            // preserving the original query string.
            const url = new URL(request.url);
            const iconApiUrl = new URL('/api/icon', request.url);
            iconApiUrl.search = url.search;
            const response = NextResponse.rewrite(iconApiUrl);
            if (MULTITENANT)
                setTenantHeaders(response, tenant)
            return response
        }
    }
    else {

        // If multi-tenant is enabled and a tenant is resolved, override
        // the UNA URL and API key for this request.
        let unaUrl = UNA_URL;
        let unaApiKey = UNA_API_KEY;
        if (MULTITENANT) {
            if (tenant == null) { // if no tenant found, UNA should not be reached
                return new NextResponse('Tenant not found', { status: 404 });
            }
            unaUrl = tenant.unaUrl;
            unaApiKey = tenant.unaApiKey;  
        }

        // Path targets a PHP endpoint: proxy the request to the UNA backend.
        // Collect cookies and forward them along with an Authorization header.
        let c = request.cookies.getAll();
        let cookieString = '';
        c.map(function (item) {
            cookieString += item.name + '=' + encodeURIComponent(item.value) + '; '
        });

        const url = new URL(request.url);

        // Clone and modify request headers for the upstream call.
        const tmpHeaders = new Headers(request.headers)

        // Add a debug header, an authorization bearer token, and attach the
        // cookie string so the UNA API receives the client's cookies.
        tmpHeaders.set('x-hello-from-middleware1', 'hello')
        tmpHeaders.set('authorization', `Bearer ${unaApiKey}`)
        tmpHeaders.set('cookie', cookieString)

        // Preserve the original query string when proxying.
        let q = url.search;
       /* if (url.searchParams.get('r') == 'q'){
            let a = {'accounts_count': {q: 'SELECT Count(*) FROM sys_accounts', t: 'One'}}
            let b = a[url.searchParams.get('q')];
            q = '?r=q&q=' + b.q + '&t=' + b.t;
        }*/

        // Rewrite the request to the UNA backend URL, replacing a local
        // `/api/` prefix with the UNA path and forwarding the modified headers.
        return NextResponse.rewrite(unaUrl + request.nextUrl.pathname.replace('/api/','/') + q,
        {
            request: {
                headers: tmpHeaders,
            },
        })
    }
}
