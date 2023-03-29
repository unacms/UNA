/*
import { createProxyMiddleware } from "http-proxy-middleware"

export const config = {
    api: {
        externalResolver: true,
        bodyParser: false
    }
}

const proxy = createProxyMiddleware({
    target: process.env.UNA_URL,
    secure: false,
    pathRewrite: { 
        "^/api": "" // remove `/api` prefix
    }, 
    logLevel: 'debug',
    changeOrigin: true,
    headers: {
        authorization: 'Bearer ' + process.env.UNA_API_KEY
    },
});

export default function handler(req, res) {
    proxy(req, res, (err) => {        
      if (err) {
        throw err;
      }
      throw new Error(
        `Request '${req.url}' is not proxied! We should never reach here!`
      );
    });    
}
*/
/* OLD implementation: */

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
    const data = await fetcherRaw(process.env.UNA_URL, [path, process.env.UNA_API_KEY, body, undefined, headers]).then(async r => {
        let a;
        try {
            if (r.headers.has('Set-Cookie')) {
                var combinedCookieHeader = r.headers.get('Set-Cookie');            
                var splitCookieHeaders = setCookie.splitCookiesString(combinedCookieHeader)            
                res.setHeader('Set-Cookie', splitCookieHeaders);
            }    
            a = await r.json();
        } catch (error) {
            console.log("----------- Response isn't valid JSON for " + process.env.UNA_URL + path);
            if ('readable' == r.body.state)
                console.log(await r.text());
            else
                console.log("RESPONSE BODY ISN'T READABLE");
            console.log("----------- END --------------");
            a = {};
        }
        return a;
    });

    // return result
    res.status(data.props?.status ? data.props.status : 200).json(data);
}
