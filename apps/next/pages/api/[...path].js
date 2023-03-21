import { fetcherRaw } from 'app/lib/fetcher';

const setCookie = require('set-cookie-parser');

export default async function handler(req, res) {

    let path = req.query.path.join('/');
    let params = '';
    let body = req.body;
    let headersToPass = ['content-type', 'origin', 'cookie'];
    let headers = {};

    // get list of headers to pass on to backend
    Object.keys(req.headers).forEach(key => {
        if (-1 != headersToPass.indexOf(key.toLocaleLowerCase()))
            headers[key] = req.headers[key];
    });

    // make correct URL and GET params for backend call
    path = path.startsWith('/') ? path : '/' + path;
    Object.keys(req.query).forEach(key => {
        if ('path' !== key)
            params += '&' + key + "=" + req.query[key];
    });
    if ('' != params)
        path += '?' + params.substring(1);
    
    // perform fetch
    const data = await fetcherRaw(process.env.NEXT_PUBLIC_UNA_URL, [path, process.env.UNA_API_KEY, body, undefined, headers]).then(r => {
        if (r.headers.has('Set-Cookie')) {
            var combinedCookieHeader = r.headers.get('Set-Cookie');            
            var splitCookieHeaders = setCookie.splitCookiesString(combinedCookieHeader)
            res.setHeader('Set-Cookie', splitCookieHeaders);
        }
        return r.json();
    });

    // return result
    res.status(data.props?.status ? data.props.status : 200).json(data);
}

