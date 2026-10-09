import { Platform } from 'react-native';
import i18n from 'i18next';
import { appSetting, UNA_URL, APP_URL, APP_ORIGIN, MULTITENANT } from 'app/config';
import { xhrRequest } from 'app/lib/xhr-request';

/**
 * UNA request: an `/api.php?r=…` path, or a tuple
 * `[path, token?, body?, origin?, headers?, onResponse?]` (body → POST, e.g. FormData).
 */
export type FetcherRequest =
    | string
    | [
        path: string,
        token?: string | null,
        data?: BodyInit | null,
        origin?: string | null,
        headers?: Record<string, string>,
        callback?: (response: Response) => void,
    ];

export type FetchOptions = {
    /** Abort the request (throws an `AbortError` with `aborted: true`). */
    signal?: AbortSignal;
    /** Per-attempt timeout; defaults to `config.fetch_timeout_ms`. */
    timeoutMs?: number;
    /**
     * Attempts on a network error; defaults to 3 for GET, 1 for POST. A timeout is not
     * retried: the server got the request and is still working on it, so sending it again
     * only adds load (PHP keeps running an aborted request to the end).
     */
    maxAttempts?: number;
    /** Don't log failures to the console. */
    silent?: boolean;
    /** Report request body progress (0..1); sends over XMLHttpRequest instead of `fetch`. */
    onUploadProgress?: (fraction: number) => void;
};

type AbortErrorLike = Error & { aborted?: boolean };

const USE_PROXY_WEB = appSetting('config', 'use_proxy_web'); 
const USE_PROXY_NATIVE = appSetting('config', 'use_proxy_native');
const FETCH_TIMEOUT_MS: number = appSetting('config', 'fetch_timeout_ms') || 15000;

/**
 * Call the UNA API and parse JSON (`{}` when the body isn't JSON). Resolves the host from
 * proxy settings (web: same-origin `/api` when `use_proxy_web`; native: `APP_URL/api`).
 */
export async function fetcher (mixed: FetcherRequest, useProxy = false, fetchOptions: FetchOptions = {}): Promise<any> {
    let prefix = UNA_URL;
    if ((Platform.OS === 'web'  && USE_PROXY_WEB) || useProxy){
        const webBaseUrl = typeof window !== 'undefined' ? window.location.origin : APP_URL;
        prefix = MULTITENANT ? webBaseUrl : webBaseUrl + "/api";
    }

    if ((Platform.OS != 'web'  && USE_PROXY_NATIVE)){
        prefix =  APP_URL + "/api";
    }

    const r = await fetcherRaw(prefix, mixed, fetchOptions).then(async (r) => {
        let a: any;
        try {
            a = await r.json();
        } catch (error: any) {
            a = {};
        }
        return a;
    });

    return r;
}

async function fetcherRawOnce(
    url: string,
    { data, headers, callback, signal, timeoutMs, onUploadProgress }: {
        data?: BodyInit | null;
        headers: Record<string, string>;
        callback?: (response: Response) => void;
        signal?: AbortSignal;
        timeoutMs?: number;
        onUploadProgress?: (fraction: number) => void;
    },
): Promise<Response> {
    const controller = new AbortController();
    const timeout = timeoutMs ?? FETCH_TIMEOUT_MS;
    const onExternalAbort = () => controller.abort();
    if (signal?.aborted) {
        const err: AbortErrorLike = new Error('Aborted');
        err.name = 'AbortError';
        err.aborted = true;
        throw err;
    }
    signal?.addEventListener('abort', onExternalAbort);
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
        const r = data && onUploadProgress
            ? await xhrRequest(url, {
                method: 'POST',
                body: data,
                headers,
                withCredentials: true,
                signal: controller.signal,
                onUploadProgress,
            })
            : await fetch(url, {
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
    } catch (error: any) {
        if (error?.name === 'AbortError') {
            if (signal?.aborted) {
                const err: AbortErrorLike = new Error('Aborted');
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

/** Low-level fetch with retries; returns the raw `Response`. */
export async function fetcherRaw(host: string, mixed: FetcherRequest, fetchOptions: FetchOptions = {}): Promise<Response> {
    let path: string;
    let token: string | null | undefined;
    let data: BodyInit | null | undefined;
    let origin: string | null | undefined;
    let headers: Record<string, string> | undefined;
    let callback: ((response: Response) => void) | undefined;

    if (Array.isArray(mixed)){
        [path, token, data, origin, headers, callback] = mixed;
    }
    else {
        path = mixed;
    }
    // A copy: the caller's object may be reused for other requests.
    headers = { ...headers };

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
        onUploadProgress,
    } = fetchOptions;
    const maxAttempts = maxAttemptsOverride ?? (data ? 1 : 3);
    const baseDelayMs = 300;
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (signal?.aborted) {
            const err: AbortErrorLike = new Error('Aborted');
            err.name = 'AbortError';
            err.aborted = true;
            throw err;
        }
        try {
            return await fetcherRawOnce(url, { data, headers, callback, signal, timeoutMs, onUploadProgress });
        } catch (error: any) {
            lastError = error;
            if (error?.aborted) {
                throw error;
            }
            const isRetriable = error?.name === 'TypeError';
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