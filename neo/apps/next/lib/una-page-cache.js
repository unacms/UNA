import { createHash } from 'node:crypto';
import { appSetting } from 'app/config';

const MAX_ENTRIES = 80;
const DEFAULT_TTL_SECONDS = 20;
const DEFAULT_PROFILE_TTL_SECONDS = 30;

/**
 * One copy per server process, on `globalThis`: `proxy.js` is bundled apart from the page,
 * and it resets the cache on sign-in (`clearUnaPageCache`).
 */
const shared = globalThis.__neoUnaPageCache ??= { store: new Map(), inflight: new Map(), generation: 0 };
const { store, inflight } = shared;

const PROFILE_PAGE_HEAD = new Set([
    'view-persons-profile',
    'view-organizations-profile',
]);

function readTtlSeconds(name, fallback) {
    const raw = appSetting('cache', name);
    if (raw === '' || raw === false || raw == null) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
}

function ttlSeconds(path) {
    const head = String(path || '').split('/')[0];
    if (PROFILE_PAGE_HEAD.has(head)) {
        return readTtlSeconds('una_page_profile_ttl', DEFAULT_PROFILE_TTL_SECONDS);
    }
    return readTtlSeconds('una_page_ttl', DEFAULT_TTL_SECONDS);
}

/**
 * Cookies that never change UNA's answer for a given URL. NEO's own language
 * cookies only pick the `&lang=` already in the URL (UNA doesn't read them).
 * Every client gets them on its first visit, so keying on them would give each
 * guest a private cache entry. `neo_session_ok` only times the proxy's session
 * touch (lib/session-touch).
 */
const NEO_ONLY_COOKIES = new Set(['neo_lang', 'neo_lang_code', 'neo_session_ok']);

/**
 * The viewer's cookies that can change the page, in a stable order. UNA's own
 * `lang` cookie is dropped when it matches the URL's `lang` (the query string
 * wins in UNA); any other cookie stays, since UNA modules read many of them.
 */
export function pageCookiesForCache(cookieString = '', url = '') {
    const urlLang = String(url).match(/[?&]lang=([^&#]*)/)?.[1] || '';
    return String(cookieString)
        .split(';')
        .map((part) => part.trim())
        .filter(Boolean)
        .filter((part) => {
            const eq = part.indexOf('=');
            const name = eq === -1 ? part : part.slice(0, eq);
            if (NEO_ONLY_COOKIES.has(name)) return false;
            if (name === 'lang' && urlLang && part.slice(eq + 1) === urlLang) return false;
            return true;
        })
        .sort((a, b) => a.localeCompare(b))
        .join('; ');
}

function fingerprint(cookieString = '', url = '') {
    const pageCookies = pageCookiesForCache(cookieString, url);
    if (!pageCookies) return 'guest';
    return createHash('sha1').update(pageCookies).digest('hex').slice(0, 16);
}

function shouldStore(payload) {
    if (!payload || typeof payload !== 'object') return false;
    if (payload.code === 404 || payload.code === 500 || payload.code === 503) return false;
    if (payload.data?.page_status == 404) return false;
    // Guests' pages only: a member's page is theirs alone, and UNA may sign a viewer in or out
    // keeping the same session cookie.
    if (payload.data?.user) return false;
    return Boolean(payload.data);
}

function evict(now) {
    for (const [key, entry] of store) {
        if (entry.expires <= now) store.delete(key);
    }
    while (store.size >= MAX_ENTRIES) {
        const oldest = store.keys().next().value;
        store.delete(oldest);
    }
}

/**
 * Cross-request cache + in-flight coalescing for UNA get_page_by_request, for guests only.
 * Keyed by URL + tenant. Null (no caching) when the request carries a cookie that can change
 * the page: UNA's session cookie stays the same when its owner signs in (`sys_session_auth`),
 * so a page kept for it would show the guest page after sign-in.
 */
export function unaPageCacheKey({ url, tenant, cookieString }) {
    if (fingerprint(cookieString, url) !== 'guest') return null;
    return `${tenant || ''}|${url}`;
}

/** Drops every cached page and lets no load already running store its result (sign-in). */
export function clearUnaPageCache() {
    shared.generation++;
    store.clear();
    inflight.clear();
}

/** Whether an API request signs the viewer in (or out): the page cache is reset for it. */
export function isUnaAuthRequest(method, apiRoute) {
    return method !== 'GET' && method !== 'HEAD' && /login|logout/i.test(String(apiRoute || ''));
}

export async function cachedUnaPageJson({ path, key, load }) {
    const ttlMs = Math.max(0, ttlSeconds(path)) * 1000;
    if (!ttlMs || !key) return load();

    const now = Date.now();
    const hit = store.get(key);
    if (hit) {
        if (hit.expires > now) return hit.value;
        store.delete(key);
    }

    const pending = inflight.get(key);
    if (pending) return pending;

    const generation = shared.generation;
    const request = Promise.resolve()
        .then(load)
        .then((value) => {
            if (generation === shared.generation && shouldStore(value)) {
                evict(Date.now());
                store.set(key, {
                    expires: Date.now() + ttlMs,
                    value: typeof structuredClone === 'function'
                        ? structuredClone(value)
                        : value,
                });
            }
            return value;
        })
        .finally(() => {
            if (inflight.get(key) === request) inflight.delete(key);
        });

    inflight.set(key, request);
    return request;
}
