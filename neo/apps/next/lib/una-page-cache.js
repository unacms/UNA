import { createHash } from 'node:crypto';
import { appSetting } from 'app/config';

const MAX_ENTRIES = 80;
const DEFAULT_TTL_SECONDS = 20;
const DEFAULT_PROFILE_TTL_SECONDS = 30;

const store = new Map();
const inflight = new Map();

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
 * guest a private cache entry.
 */
const NEO_ONLY_COOKIES = new Set(['neo_lang', 'neo_lang_code']);

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
        .sort()
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
    // Unconfirmed viewer: confirm_email keeps the same cookie, so a cached page would
    // keep showing the confirm lock after a successful confirmation.
    const user = payload.data?.user;
    if (user && (!user.confirmed || user.confirmed === '0')) return false;
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
 * Cross-request cache + in-flight coalescing for UNA get_page_by_request.
 * Keyed by URL + tenant + fingerprint of the cookies that can change the page
 * (never store the cookie).
 */
export function unaPageCacheKey({ url, tenant, cookieString }) {
    return `${tenant || ''}|${url}|${fingerprint(cookieString, url)}`;
}

export async function cachedUnaPageJson({ path, key, load }) {
    const ttlMs = Math.max(0, ttlSeconds(path)) * 1000;
    if (!ttlMs) return load();

    const now = Date.now();
    const hit = store.get(key);
    if (hit) {
        if (hit.expires > now) return hit.value;
        store.delete(key);
    }

    const pending = inflight.get(key);
    if (pending) return pending;

    const request = Promise.resolve()
        .then(load)
        .then((value) => {
            if (shouldStore(value)) {
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
            inflight.delete(key);
        });

    inflight.set(key, request);
    return request;
}
