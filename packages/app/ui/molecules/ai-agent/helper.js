/**
 * UNA AI agent chat: guest identity, hydrate, and SSE for `useChat`.
 *
 * Same host/auth as `fetcher` (proxy on web, UNA_URL on native, cookies + Origin).
 * Do not use `fetcher` itself — it parses JSON, appends `&lang=`, and times out SSE.
 * Native streaming lives in `fetch.native.js` (RN fetch cannot stream).
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchServerSentEvents } from '@tanstack/ai-client';
import { APP_ORIGIN, APP_URL, UNA_URL, appSetting, joinUnaUrl } from 'app/config';
import { unaAiChatStreamingFetch } from './fetch';

const GUEST_HEADER = 'X-Una-Ai-Guest-Key';
const GUEST_STORAGE_KEY = 'una-ai-guest-key';
const GUEST_KEY_RE = /^[A-Za-z0-9_-]{16,64}$/;
const USE_PROXY_WEB = appSetting('config', 'use_proxy_web');
const USE_PROXY_NATIVE = appSetting('config', 'use_proxy_native');

let guestKey = '';
let guestKeyPending = null;

function createGuestKey() {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
        return globalThis.crypto.randomUUID();
    }
    const bytes = new Uint8Array(16);
    if (typeof globalThis.crypto?.getRandomValues === 'function') {
        globalThis.crypto.getRandomValues(bytes);
    } else {
        for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function readGuestKey() {
    if (Platform.OS === 'web') {
        try {
            return window.localStorage.getItem(GUEST_STORAGE_KEY);
        } catch {
            return null;
        }
    }
    return AsyncStorage.getItem(GUEST_STORAGE_KEY);
}

async function writeGuestKey(value) {
    if (Platform.OS === 'web') {
        window.localStorage.setItem(GUEST_STORAGE_KEY, value);
        return;
    }
    await AsyncStorage.setItem(GUEST_STORAGE_KEY, value);
}

async function getOrCreateGuestKey() {
    if (GUEST_KEY_RE.test(guestKey)) return guestKey;
    if (guestKeyPending) return guestKeyPending;

    guestKeyPending = (async () => {
        try {
            const existing = await readGuestKey();
            if (GUEST_KEY_RE.test(existing || '')) {
                guestKey = existing;
                return existing;
            }
        } catch {
            // storage unavailable — keep an in-memory key for this session
        }

        const created = createGuestKey();
        guestKey = created;
        try {
            await writeGuestKey(created);
        } catch {
            // same as above
        }
        return created;
    })();

    try {
        return await guestKeyPending;
    } finally {
        guestKeyPending = null;
    }
}

function requestUrl(agentId) {
    const path = `/sys-ai-chat/${encodeURIComponent(agentId)}`;
    if (Platform.OS === 'web' && USE_PROXY_WEB) return path;
    if (Platform.OS !== 'web' && USE_PROXY_NATIVE) {
        const appUrl = String(APP_URL || '').replace(/\/+$/, '');
        return appUrl ? `${appUrl}${path}` : path;
    }
    return joinUnaUrl(path, UNA_URL);
}

function headersToRecord(extra) {
    if (!extra) return {};
    if (typeof Headers !== 'undefined' && extra instanceof Headers) {
        return Object.fromEntries(extra.entries());
    }
    return { ...extra };
}

function chatHeaders(extra) {
    const headers = {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        Expires: '0',
        ...headersToRecord(extra),
    };
    if (Platform.OS !== 'web' && APP_ORIGIN) {
        headers.Origin = APP_ORIGIN;
    }
    return headers;
}

function unaErrorMessage(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    if (Array.isArray(data.messages)) return null;
    const code = Number(data.code);
    if (!Number.isFinite(code) || code === 0) return null;
    return data.msg || data.message || `AI chat error ${code}`;
}

function throwIfUnaError(data) {
    const message = unaErrorMessage(data);
    if (!message) return;
    const error = new Error(message);
    error.code = data.code;
    throw error;
}

async function chatFetch(input, init = {}) {
    const headers = chatHeaders(init.headers);
    const key = await getOrCreateGuestKey();
    if (key) headers[GUEST_HEADER] = key;

    const response = await unaAiChatStreamingFetch(input, {
        ...init,
        credentials: init.credentials || 'include',
        cache: init.cache || 'no-store',
        headers,
    });
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        const data = await response.clone().json().catch(() => null);
        throwIfUnaError(data);
    }
    return response;
}

async function hydrateChat(url, extraHeaders) {
    const response = await chatFetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json', ...headersToRecord(extraHeaders) },
        credentials: 'include',
        cache: 'no-store',
    });
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        throw new Error(
            response.ok
                ? 'AI chat hydrate did not return JSON.'
                : `AI chat HTTP ${response.status}`
        );
    }
    const data = await response.json().catch(() => ({}));
    throwIfUnaError(data);
    if (!response.ok) {
        throw new Error(data.msg || `AI chat HTTP ${response.status}`);
    }
    return {
        messages: Array.isArray(data.messages) ? data.messages : [],
        activeRun: null,
        interrupts: null,
    };
}

/** Adapter for `useChat`: GET hydrate + POST SSE. Join/resume (`?offset=`) is omitted — UNA returns 405. */
export function createAgentChat(agentId, options = {}) {
    const url = requestUrl(agentId);
    const credentials = options.credentials || 'include';
    const headers = chatHeaders(options.headers);
    const stream = fetchServerSentEvents(url, {
        credentials,
        headers,
        fetchClient: chatFetch,
    });

    return {
        async *connect(messages, data, abortSignal, runContext) {
            yield* stream.connect(messages, data, abortSignal, runContext);
        },
        async hydrate() {
            try {
                const result = await hydrateChat(url, headers);
                options.onHydrateError?.(null);
                return result;
            } catch (error) {
                options.onHydrateError?.(error);
                throw error;
            }
        },
    };
}
