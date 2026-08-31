/**
 * UNA Agents chat: GET hydrate + POST AG-UI SSE.
 *
 * Host/auth match `fetcher` (UNA_URL on native, same-origin proxy on web,
 * `credentials: 'include'`, native `Origin`). Do not use `fetcher` itself —
 * it always parses JSON, appends `&lang=`, and times out SSE.
 * Native SSE uses `expo/fetch` (`una-ai-chat-fetch.native.js`) — RN fetch
 * cannot stream. Join/resume (`?offset=`) is omitted; UNA returns 405.
 */

import { Platform } from 'react-native';
import { fetchServerSentEvents } from '@tanstack/ai-client';
import { APP_ORIGIN, APP_URL, UNA_URL, appSetting, joinUnaUrl } from 'app/config';
import { unaAiChatStreamingFetch } from 'app/lib/una-ai-chat-fetch';

const AGENT_ID_RE = /^[A-Za-z0-9_-]+$/;
const USE_PROXY_WEB = appSetting('config', 'use_proxy_web');
const USE_PROXY_NATIVE = appSetting('config', 'use_proxy_native');

export function isUnaAiChatAgentId(value) {
    return typeof value === 'string' && AGENT_ID_RE.test(value);
}

export function unaAiChatPath(agentId) {
    return `/sys-ai-chat/${encodeURIComponent(agentId)}`;
}

/**
 * Same host rules as `fetcher`: web proxy stays same-origin; native hits UNA
 * (or APP_URL when `use_proxy_native` is on). Pretty `/sys-ai-chat` is not
 * under `/api`.
 */
export function unaAiChatRequestUrl(agentId) {
    const path = unaAiChatPath(agentId);
    if (Platform.OS === 'web' && USE_PROXY_WEB) {
        return path;
    }
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

function unaAiChatHeaders(extra) {
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

function unaAiChatErrorMessage(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    if (Array.isArray(data.messages)) return null;
    const code = Number(data.code);
    if (!Number.isFinite(code) || code === 0) return null;
    return data.msg || data.message || `AI chat error ${code}`;
}

function throwIfUnaAiChatError(data) {
    const message = unaAiChatErrorMessage(data);
    if (message) {
        const error = new Error(message);
        error.code = data.code;
        throw error;
    }
}

async function unaAiChatFetch(input, init = {}) {
    const response = await unaAiChatStreamingFetch(input, {
        ...init,
        credentials: init.credentials || 'include',
        cache: init.cache || 'no-store',
        headers: unaAiChatHeaders(init.headers),
    });
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        const data = await response.clone().json().catch(() => null);
        throwIfUnaAiChatError(data);
    }
    return response;
}

async function hydrateUnaAiChat(url) {
    const response = await unaAiChatFetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
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
    throwIfUnaAiChatError(data);
    if (!response.ok) {
        throw new Error(data.msg || `AI chat HTTP ${response.status}`);
    }
    return {
        messages: Array.isArray(data.messages) ? data.messages : [],
        activeRun: null,
        interrupts: null,
    };
}

/**
 * Connection for `useChat`. Hydrate is GET `/sys-ai-chat/{id}` with no query.
 * `joinRun` is omitted — UNA returns 405 for `?offset=`.
 */
export function createUnaAiChatConnection(agentId, options = {}) {
    const url = unaAiChatRequestUrl(agentId);
    const credentials = options.credentials || 'include';
    const base = fetchServerSentEvents(url, {
        credentials,
        headers: unaAiChatHeaders(options.headers),
        fetchClient: unaAiChatFetch,
    });

    return {
        async *connect(messages, data, abortSignal, runContext) {
            yield* base.connect(messages, data, abortSignal, runContext);
        },
        async hydrate() {
            try {
                const result = await hydrateUnaAiChat(url);
                options.onHydrateError?.(null);
                return result;
            } catch (error) {
                options.onHydrateError?.(error);
                throw error;
            }
        },
    };
}
