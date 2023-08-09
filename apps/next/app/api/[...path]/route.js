import { env } from 'app/lib/env';

export const runtime = 'edge'

export async function rqt(request, method) {
    const url = new URL(request.url);
    const endpoint = env('UNA_URL') + '/api.php' + url.search;

    let cookieString = request.headers.get('cookie');
    const headers = {
        authorization: `Bearer ${env('UNA_API_KEY')}`,
        cookie: cookieString,
    };

    const options = {
        method,
        headers,
    };

    if (method === 'POST') {
        options.body = await request.formData();
    }

    const res = await fetch(endpoint, options);
    const data = await res.json();

    return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Set-Cookie': res.headers.get('set-cookie') }
    });
}   

export async function GET(request) {
    return rqt(request, 'GET');
}

export async function POST(request) {
    return rqt(request, 'POST');
}