/**
 * UNA AI agent chat: hydrate and SSE for `useChat`.
 *
 * Guest/member identity is the UNA session cookie (credentials: include).
 * Same host/auth as `fetcher` (proxy on web, UNA_URL on native, cookies + Origin).
 * Do not use `fetcher` itself — it parses JSON, appends `&lang=`, and times out SSE.
 * Native streaming lives in `fetch.native.js` (RN fetch cannot stream).
 */

import { Platform } from 'react-native';
import { fetchServerSentEvents } from '@tanstack/ai-client';
import { APP_ORIGIN, APP_URL, UNA_URL, appSetting, joinUnaUrl } from 'app/config';
import { unaAiChatStreamingFetch } from './fetch';

const USE_PROXY_WEB = appSetting('config', 'use_proxy_web');
const USE_PROXY_NATIVE = appSetting('config', 'use_proxy_native');

function chatQueryId(chatId) {
    return String(chatId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
}

function requestUrl(agentId, contextProfileId, chatId) {
    const path = `/sys-ai-chat/${encodeURIComponent(agentId)}`;
    const params = new URLSearchParams();
    const pid = Number(contextProfileId) || 0;
    if (pid > 0) params.set('context', String(pid));
    const chat = chatQueryId(chatId);
    if (chat.length >= 8) params.set('chat', chat);
    const query = params.toString() ? `?${params.toString()}` : '';
    if (Platform.OS === 'web' && USE_PROXY_WEB) return `${path}${query}`;
    if (Platform.OS !== 'web' && USE_PROXY_NATIVE) {
        const appUrl = String(APP_URL || '').replace(/\/+$/, '');
        return appUrl ? `${appUrl}${path}${query}` : `${path}${query}`;
    }
    return `${joinUnaUrl(path, UNA_URL)}${query}`;
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
    const response = await unaAiChatStreamingFetch(input, {
        ...init,
        credentials: init.credentials || 'include',
        cache: init.cache || 'no-store',
        headers: chatHeaders(init.headers),
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
    const url = requestUrl(agentId, options.contextProfileId, options.chatId);
    const credentials = options.credentials || 'include';
    const headers = chatHeaders(options.headers);
    const stream = fetchServerSentEvents(url, {
        credentials,
        headers,
        fetchClient: chatFetch,
    });

    return {
        async *connect(messages, data, abortSignal, runContext) {
            for await (const chunk of stream.connect(messages, data, abortSignal, runContext)) {
                if (chunk?.type === 'CUSTOM' && chunk.name === 'chat_actions') {
                    options.onChatActions?.(chunk.messageId, chunk.value);
                }
                yield chunk;
            }
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
