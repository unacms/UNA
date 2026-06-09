import { Platform } from 'react-native';
import i18n from 'i18next';
import { appSetting, UNA_URL, APP_URL, APP_ORIGIN, MULTITENANT } from 'app/config';

const USE_PROXY_WEB = appSetting('config', 'use_proxy_web'); 
const USE_PROXY_NATIVE = appSetting('config', 'use_proxy_native');
const FETCH_TIMEOUT_MS = appSetting('config', 'fetch_timeout_ms') || 15000;

export async function fetcher (mixed, useProxy = false) {
    let prefix = UNA_URL;
    if ((Platform.OS === 'web'  && USE_PROXY_WEB) || useProxy){
        const webBaseUrl = typeof window !== 'undefined' ? window.location.origin : APP_URL;
        prefix = MULTITENANT ? webBaseUrl : webBaseUrl + "/api";
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

export async function fetcherRaw(host, mixed) {
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

    const url = host + path + "&lang=" + lang;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
        const r = await fetch(url, {
            method: data ? 'POST' : 'GET',
            body: data ? data : null,
            headers: headers,
            cache: 'no-store',
            credentials: 'include', // Set to true on UNA side - Access-Control-Allow-Credentials
            signal: controller.signal,
        });
        if (callback)
            callback(r);
        return r;
    } catch (error) {
        if (error?.name === 'AbortError') {
            console.error('Api call timeout:', FETCH_TIMEOUT_MS, url);
            throw new Error('Timeout');
        }
        console.error('Api call error: ', error, url);
        throw error;
    } finally {
        clearTimeout(timer);
    }
}