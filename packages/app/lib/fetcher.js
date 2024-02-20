import { Platform } from 'react-native';
import { env } from 'app/lib/env';
import i18n from 'i18next';
import { appSetting , UNA_URL, APP_URL } from 'app/config';

const USE_PROXY = appSetting('config', 'use_proxy'); // TODO: move to some setting 

function IsSafeEndpoint(url) {
    return appSetting('config', 'safe_endpoints').some(substring => url.includes(substring));
}

export async function fetcher (mixed) {
    const t1 = Date.now();
   
    let prefix = UNA_URL;
    if ('web' === Platform.OS && (USE_PROXY || IsSafeEndpoint(mixed[0]))){
        prefix =  APP_URL + "/api";
    }
   /* if ('web' !== Platform.OS ){
        prefix =  appSetting('config', 'app_url_real') + "/api";
    }*/
    const r = await fetcherRaw(prefix, mixed).then(async (r) => {

        let a;
        try {
            a = await r.json();
        } catch (error) {
            console.log("ERROR")
            console.log("----------- Response isn't valid JSON for " + mixed);
            if ('readable' == r?.body?.state)
                console.log(await r.text());
            else
                console.log("RESPONSE BODY ISN'T READABLE");
            console.log("----------- END --------------");
            a = {};
        }
        return a;
    });

    const diff = Date.now() - t1;
    if (appSetting('config', 'debug'))
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~ load time:", parseFloat(diff/1000), "sec (", prefix + mixed, ")");
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
        headers['Origin'] = 'neo://app';


    // headers['Cache-Control'] = "no-cache, no-store, must-revalidate";
    // headers['Pragma'] = "no-cache";
    // headers['Expires'] = "0";
    // perform fetch
    const lang = i18n.language;

    return fetch(host + path + "&lang=" + lang, {
        method: data ? 'POST' : 'GET',
        body: data ? data : null,
        headers: headers,
        credentials: 'include' // Set to true on UNA side - Access-Control-Allow-Credentials
    })
    .then(async (r) => {
        if (callback)
            callback(r);
        return r;
    })
    .catch((error) => {
        console.log("Api call error: " + error.message);
        throw error;
    });
}