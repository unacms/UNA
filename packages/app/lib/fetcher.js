import { Platform } from 'react-native';

const USE_PROXY = true; // TODO: move to some setting 

function getUrlPrefix() {    
    let s, proto, host, port;
    if (typeof(window) !== 'undefined')
        [proto, host, port] = [window.location.protocol, window.location.hostname, window.location.port];
    else
        [proto, host, port] = [process.env.PROTO, process.env.HOST, process.env.PORT];

    s = `${proto}//${host}`;
    if (port && 80 !== port && 443 !== port)
        s += ":" + port;
    return s;
}

export async function fetcher (mixed) {
    let prefix = process.env.UNA_URL; // by default we don't use proxy
    if (USE_PROXY) { 
        // since we have proxy setup in NextJS, then for web we use curent site url, 
        // for native we have no standalone server, so we have to set URL of external NextJS app (there no no CORS problem in native)
        if ('web' === Platform.OS)
            prefix =  getUrlPrefix() + "/api";
        else
            prefix = process.env.API_PROXY_URL;
    }

    return await fetcherRaw(prefix, mixed).then(r => {
        return r.json();
    });
}

export async function fetcherRaw (host, mixed) {
    console.log(host + mixed);
    typeof(window) !== 'undefined' && console.log(window.location);
    let path, token, data, origin, headers, callback;

    // gen incoming variables
    if (Array.isArray(mixed)){
        [path, token, data, origin, headers, callback] = mixed;
    }
    else {
        path = mixed;
    }
    if (undefined === headers)
        headers = {};

    // when fetcher isn't using proxy then when user login 
    // we need to set cookies on UNA domain (for CSR) and NEO domain (for SSR), so need to make second calls to different domain
    if (!USE_PROXY && 'web' === Platform.OS && process.env.UNA_URL === host && data && path.includes('system/login_form/') && !process.env.UNA_API_KEY) {
        const dataResubmit = await fetcherRaw (getUrlPrefix() + "/api", mixed).then(r => {
            return r.text();
        });
    }

    // add token and origin headers when necessary
    if (token)
        headers['Authorization'] = 'Bearer ' + token;
    if (origin)
        headers['Origin'] = origin;
    else if ('web' !== Platform.OS)
        headers['Origin'] = 'neo://app';

    // perform fetch
    return fetch(host + path, {
        method: data ? 'POST' : 'GET',
        body: data ? data : null,
        headers: headers,
        credentials: 'include' // Set to true on UNA side - Access-Control-Allow-Credentials
    })
    .then((r) => {
        if (callback)
            callback(r);
        return r;
    })
    .catch((error) => {
        console.log("Api call error: " + error.message);
    });
}