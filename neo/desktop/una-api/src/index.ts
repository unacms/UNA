/**
 * Typed client for UNA API v2. Types come from the OpenAPI document (src/schema.ts, generated;
 * run `yarn generate` in `una-api` after the API changes).
 *
 *   const api = createUnaApi({ siteUrl: 'https://community.example', getToken });
 *   const { data, error } = await api.GET('/feeds/home', { params: { query: { limit: 20 } } });
 */
import createClient, { type Client, type Middleware } from 'openapi-fetch';

import type { components, paths } from './schema';

export type { components, paths } from './schema';

/** A component schema by name: `Schema<'Activity'>`. */
export type Schema<Name extends keyof components['schemas']> = components['schemas'][Name];

export type Problem = Schema<'Problem'>;

export type UnaApi = Client<paths>;

export type UnaApiOptions = {
    /** The site's address, e.g. https://community.example (the API lives at /api/v2). */
    siteUrl: string;
    /** A current access token, or null for a guest. Called before every request. */
    getToken?: () => Promise<string | null> | string | null;
    /** Called when the API answers 401 to a request that carried a token, with that token. */
    onUnauthorized?: (token: string) => void;
    /** fetch to use; the global one by default. */
    fetch?: typeof fetch;
    /** Accept-Language for texts such as notifications. */
    language?: string;
};

export function apiBaseUrl(siteUrl: string): string {
    return `${siteUrl.replace(/\/+$/, '')}/api/v2`;
}

export function createUnaApi(options: UnaApiOptions): UnaApi {
    const client = createClient<paths>({
        baseUrl: apiBaseUrl(options.siteUrl),
        fetch: options.fetch,
        headers: options.language ? { 'Accept-Language': options.language } : undefined,
    });

    const auth: Middleware = {
        async onRequest({ request }) {
            const token = options.getToken ? await options.getToken() : null;
            if (token) request.headers.set('Authorization', `Bearer ${token}`);
            return request;
        },
        onResponse({ request, response }) {
            const sent = request.headers.get('Authorization');
            if (response.status === 401 && sent) options.onUnauthorized?.(sent.replace(/^Bearer /, ''));
            return response;
        },
    };
    client.use(auth);

    return client;
}

/** True for an RFC 9457 problem document from the API. */
export function isProblem(value: unknown): value is Problem {
    return typeof value === 'object' && value !== null && 'code' in value && 'status' in value && 'title' in value;
}

/** A message to show for an error the client returned. */
export function problemMessage(error: unknown, fallback = 'Something went wrong'): string {
    if (!isProblem(error)) return fallback;
    const field = error.errors?.[0];
    return field?.message ? `${error.detail ?? error.title}: ${field.message}` : (error.detail ?? error.title);
}

/** Discovery document of a site: GET /api/v2. Works without a client. */
export async function discover(siteUrl: string, fetchImpl: typeof fetch = fetch): Promise<Schema<'ApiInfo'>> {
    const res = await fetchImpl(apiBaseUrl(siteUrl), { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`${siteUrl} has no UNA API v2 (${res.status})`);
    return (await res.json()) as Schema<'ApiInfo'>;
}
