/**
 * Whether a request the web proxy passes to UNA carries the server's API key.
 *
 * UNA reads the key on `api.php` only (`bx_api_check_access`: a request with a valid key
 * passes without an allowed Origin). The proxy sends every visitor's `*.php` request on, so
 * the key goes with `api.php` and with nothing else: storage, grids, modules and the other
 * PHP entry points get the visitor's request without it.
 */
export function sendsUnaApiKey(unaPath: string): boolean {
    const path = String(unaPath || '').split(/[?#]/)[0].replace(/\/+$/, '');
    return /(^|\/)api\.php$/i.test(path);
}
