type AbortErrorLike = Error & { aborted?: boolean };

export type XhrRequestOptions = {
    method?: string;
    body?: BodyInit | null;
    headers?: Record<string, string>;
    /** `fetch`'s `credentials: 'include'`. */
    withCredentials?: boolean;
    signal?: AbortSignal;
    /** Fraction of the request body sent so far, 0..1. */
    onUploadProgress?: (fraction: number) => void;
};

const NULL_BODY_STATUSES = new Set([101, 204, 205, 304]);

function parseResponseHeaders(raw: string): Headers {
    const headers = new Headers();
    for (const line of raw.trim().split(/[\r\n]+/)) {
        const at = line.indexOf(':');
        if (at > 0) headers.append(line.slice(0, at).trim(), line.slice(at + 1).trim());
    }
    return headers;
}

/**
 * `fetch`-shaped request over XMLHttpRequest, for upload progress (`fetch` has no upload events).
 * Works on web and React Native. Rejects like `fetch`: `AbortError` on abort, `TypeError` on network failure.
 * Listening to upload progress makes a cross-origin browser request non-simple, so it is preflighted.
 */
export function xhrRequest(url: string, options: XhrRequestOptions = {}): Promise<Response> {
    const { method = 'GET', body = null, headers = {}, withCredentials = false, signal, onUploadProgress } = options;

    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            const err: AbortErrorLike = new Error('Aborted');
            err.name = 'AbortError';
            reject(err);
            return;
        }

        const xhr = new XMLHttpRequest();
        const onAbort = () => xhr.abort();
        const cleanup = () => signal?.removeEventListener('abort', onAbort);

        xhr.open(method, url, true);
        xhr.withCredentials = withCredentials;
        for (const [key, value] of Object.entries(headers)) {
            xhr.setRequestHeader(key, value);
        }

        if (onUploadProgress) {
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable && e.total > 0) onUploadProgress(Math.min(1, e.loaded / e.total));
            };
        }

        xhr.onload = () => {
            cleanup();
            const status = xhr.status;
            resolve(new Response(NULL_BODY_STATUSES.has(status) ? null : xhr.responseText, {
                status,
                statusText: xhr.statusText,
                headers: parseResponseHeaders(xhr.getAllResponseHeaders() || ''),
            }));
        };
        xhr.onerror = () => {
            cleanup();
            reject(new TypeError('Network request failed'));
        };
        xhr.ontimeout = xhr.onerror;
        xhr.onabort = () => {
            cleanup();
            const err: AbortErrorLike = new Error('Aborted');
            err.name = 'AbortError';
            reject(err);
        };

        signal?.addEventListener('abort', onAbort);
        xhr.send(body as XMLHttpRequestBodyInit | null);
    });
}
