/**
 * Which UNA a web request talks to. One NEO can serve several UNA backends:
 * - multi-tenant mode (`config.multitenant`): Redis maps each host name to a UNA URL and key;
 * - CI previews (`UNA_PREVIEW_DOMAIN`): `pr-<n>.<domain>` is served by `api-pr-<n>.<domain>`.
 *
 * The Host header picks the backend, in proxy.js for API calls and in the page for its own
 * request (`request-tenant.ts`). The choice is never passed on in request headers: a request
 * the proxy's matcher skips reaches the page with whatever headers the client sent, so the
 * proxy drops every `x-tenant-*` header and nothing reads them.
 */

/** A UNA backend with its API key; the shape of a domain in multi-tenant mode. */
export type Tenant = {
    id: string;
    unaUrl: string;
    unaApiKey: string;
    revision: number | string;
};

const TENANT_HEADER_PREFIX = 'x-tenant-';

/** Drop every `x-tenant-*` header a client sent; returns the same Headers object. */
export function dropTenantHeaders(headers: Headers): Headers {
    for (const name of [...headers.keys()]) {
        if (name.startsWith(TENANT_HEADER_PREFIX)) headers.delete(name);
    }
    return headers;
}

/**
 * CI previews (UNA's .github/workflows/ci.yml): `pr-<n>.<previewDomain>` is a client alias
 * for PR <n>, whose backend is `api-pr-<n>.<previewDomain>`. Null for any other host, which
 * keeps the configured UNA_URL, and when previews aren't configured.
 */
export function resolvePreviewBackend(
    host: string | null | undefined,
    previewDomain: string | null | undefined,
    previewApiKey: string | null | undefined,
): Tenant | null {
    if (!previewDomain || !previewApiKey) return null;
    const hostname = String(host || '').split(':')[0]!.toLowerCase();
    const match = hostname.match(/^pr-(\d+)\.(.+)$/);
    if (!match || match[2] !== previewDomain.toLowerCase()) return null;
    return {
        id: `preview-${match[1]}`,
        unaUrl: `https://api-pr-${match[1]}.${previewDomain}`,
        unaApiKey: previewApiKey,
        revision: 0,
    };
}
