import { Platform } from 'react-native';
import i18n from 'i18next';
import { appSetting, UNA_URL, APP_URL, APP_ORIGIN, MULTITENANT } from 'app/config';

const USE_PROXY_WEB = appSetting('config', 'use_proxy_web'); 
const USE_PROXY_NATIVE = appSetting('config', 'use_proxy_native');
const FETCH_TIMEOUT_MS = appSetting('config', 'fetch_timeout_ms') || 15000;

export async function fetcher (mixed, useProxy = false, fetchOptions = {}) {
    let prefix = UNA_URL;
    if ((Platform.OS === 'web'  && USE_PROXY_WEB) || useProxy){
        const webBaseUrl = typeof window !== 'undefined' ? window.location.origin : APP_URL;
        prefix = MULTITENANT ? webBaseUrl : webBaseUrl + "/api";
    }

    if ((Platform.OS != 'web'  && USE_PROXY_NATIVE)){
        prefix =  APP_URL + "/api";
    }

    const r = await fetcherRaw(prefix, mixed, fetchOptions).then(async (r) => {
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

async function fetcherRawOnce(url, { data, headers, callback, signal, timeoutMs }) {
    const controller = new AbortController();
    const timeout = timeoutMs ?? FETCH_TIMEOUT_MS;
    const onExternalAbort = () => controller.abort();
    if (signal?.aborted) {
        const err = new Error('Aborted');
        err.name = 'AbortError';
        err.aborted = true;
        throw err;
    }
    signal?.addEventListener('abort', onExternalAbort);
    const timer = setTimeout(() => controller.abort(), timeout);

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
            if (signal?.aborted) {
                const err = new Error('Aborted');
                err.name = 'AbortError';
                err.aborted = true;
                throw err;
            }
            throw new Error('Timeout');
        }
        throw error;
    } finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', onExternalAbort);
    }
}

export async function fetcherRaw(host, mixed, fetchOptions = {}) {
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
    const {
        signal,
        timeoutMs,
        maxAttempts: maxAttemptsOverride,
        silent = false,
    } = fetchOptions;
    const maxAttempts = maxAttemptsOverride ?? (data ? 1 : 3);
    const baseDelayMs = 300;
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (signal?.aborted) {
            const err = new Error('Aborted');
            err.name = 'AbortError';
            err.aborted = true;
            throw err;
        }
        try {
            return await fetcherRawOnce(url, { data, headers, callback, signal, timeoutMs });
        } catch (error) {
            lastError = error;
            if (error?.aborted) {
                throw error;
            }
            const isRetriable = error?.message === 'Timeout' || error?.name === 'TypeError';
            if (!isRetriable || attempt >= maxAttempts) {
                if (!silent) {
                    if (error?.message === 'Timeout') {
                        console.error('Api call timeout:', timeoutMs ?? FETCH_TIMEOUT_MS, url);
                    } else {
                        console.error('Api call error: ', error, url);
                    }
                }
                throw error;
            }
            await new Promise((resolve) => setTimeout(resolve, baseDelayMs * attempt));
        }
    }

    throw lastError;
}