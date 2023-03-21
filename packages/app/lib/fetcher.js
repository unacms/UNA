import { Platform } from 'react-native';

export async function fetcher (mixed) {
    return await fetcherRaw(process.env.NEXT_PUBLIC_UNA_URL, mixed).then(r => {
        return r.json();
    });
}

export async function fetcherRaw (host, mixed) {
    console.log(host + mixed)
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

    // TODO: replace http://localhost:3000 with actual value
    // in case of login we need to set cookies on UNA domain (for CSR) and NEO domain (for SSR), so need to make 2 calls to different domains
    if ('web' === Platform.OS && process.env.NEXT_PUBLIC_UNA_URL === host && data && path.includes('system/login_form/') && !process.env.UNA_API_KEY) {
        const dataResubmit = await fetcherRaw ('http://localhost:3000/api', mixed).then(r => {        
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