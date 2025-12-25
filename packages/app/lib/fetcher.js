import { Platform } from 'react-native';
import i18n from 'i18next';
import { appSetting , UNA_URL, APP_URL, APP_ORIGIN, MULTITENANT } from 'app/config';
import { getBaseUrl } from 'app/lib/util';

const USE_PROXY_WEB = appSetting('config', 'use_proxy_web'); 
const USE_PROXY_NATIVE = appSetting('config', 'use_proxy_native'); 

export async function fetcher (mixed, useProxy = false) {
    let prefix = UNA_URL;
    if ((Platform.OS === 'web'  && USE_PROXY_WEB) || useProxy){        
        prefix = MULTITENANT ? getBaseUrl() : APP_URL + "/api";
    }

    if ((Platform.OS != 'web'  && USE_PROXY_NATIVE)){
        prefix =  APP_URL + "/api";
    }

    const r = await fetcherRaw(prefix, mixed).then(async (r) => {
        let a;
        try {
            a = await r.json();
        } catch (error) {
            a = {};
        }
        return a;
    });

    return r;
}

export async function fetcherRaw (host, mixed) {
    let path, token, data, origin, headers, callback;

    if (Array.isArray(mixed)){
        [path, token, data, origin, headers, callback] = mixed;
    }
    else {
        path = mixed;
    }
    if (undefined === headers)
        headers = {};

    

    // add token and origin headers when necessary
    if (token)
        headers['Authorization'] = 'Bearer ' + token;
    if (origin)
        headers['Origin'] = origin;
    else if ('web' !== Platform.OS)
        headers['Origin'] = APP_ORIGIN;

   // headers['Content-Type'] = "application/json";
    headers['Cache-Control'] = "no-cache";
    headers['Pragma'] = "no-cache";
    headers['Expires'] = "0";
    // perform fetch
    const lang = i18n.language;

    return fetch(host + path + "&lang=" + lang, {
        method: data ? 'POST' : 'GET',
        body: data ? data : null,
        headers: headers,
        cache: 'no-store',
        credentials: 'include' // Set to true on UNA side - Access-Control-Allow-Credentials
    })
    .then(async (r) => {
        if (callback)
            callback(r);
        return r;
    })
    .catch((error) => {
        console.error("Api call error: ",error,host + path + "&lang=" + lang);
        throw error;
    });
}