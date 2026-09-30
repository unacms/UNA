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
import { fetcher } from 'app/lib/fetcher';
import { unaAiChatStreamingFetch } from './fetch';

const USE_PROXY_WEB = appSetting('config', 'use_proxy_web');
const USE_PROXY_NATIVE = appSetting('config', 'use_proxy_native');

/** Shorter values are treated as "no chat id": too easy to guess or to collide. */
const CHAT_ID_MIN_LENGTH = 8;

/** Sanitize a chat id for the `?chat=` query: `[a-zA-Z0-9_-]`, at most 64 chars. */
export function chatQueryId(chatId) {
    return String(chatId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
}

/** True when `chatId` survives sanitizing and is long enough to use. */
export function isChatId(chatId) {
    return chatQueryId(chatId).length >= CHAT_ID_MIN_LENGTH;
}

function requestUrl(agentId, contextProfileId, chatId) {
    const path = `/sys-ai-chat/${encodeURIComponent(agentId)}`;
    const params = new URLSearchParams();
    const pid = Number(contextProfileId) || 0;
    if (pid > 0) params.set('context', String(pid));
    if (isChatId(chatId)) params.set('chat', chatQueryId(chatId));
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
        session: data.session && typeof data.session === 'object' ? data.session : null,
    };
}

/**
 * @typedef {object} AgentChatThread One row of the viewer's history with an agent.
 * @property {string} thread_id Server thread key; opaque, passed back to fetchAgentChatThread.
 * @property {string} chat The `?chat=` nonce this thread lives under, '' for the base thread.
 * @property {number} context_pid Profile the conversation was about, 0 = site-wide.
 * @property {string} context_name Display name of that profile, '' when site-wide.
 * @property {'opened'|'closed'} status
 * @property {string} closed_reason
 * @property {string} title First thing the person typed; '' for an empty thread.
 * @property {string} preview Last line said, plain text.
 * @property {number} messages_count
 * @property {number} created_ts Unix seconds, 0 when unknown.
 * @property {number} updated_ts Unix seconds, 0 when unknown.
 */

function apiErrorMessage(response, fallback) {
    if (!response || typeof response !== 'object') return fallback;
    const code = Number(response.status);
    if (response.error || (Number.isFinite(code) && code >= 400)) {
        return String(response.error || response.msg || fallback);
    }
    return null;
}

/**
 * UNA `system/get_ai_chat_threads/TemplServices` — the viewer's own conversations
 * with this agent, newest first. Only their threads: the server keys by profile id
 * (guests: session id), so nothing of anyone else's can come back.
 *
 * @returns {Promise<AgentChatThread[]>}
 */
export async function fetchAgentChatThreads(agentId) {
    const response = await fetcher(
        `/api.php?r=system/get_ai_chat_threads/TemplServices&params[]=${encodeURIComponent(agentId)}`
    );
    const message = apiErrorMessage(response, 'AI chat history failed.');
    if (message) throw new Error(message);
    const threads = response?.data?.threads;
    return Array.isArray(threads) ? threads : [];
}

/**
 * UNA `system/get_ai_chat_thread/TemplServices` — one earlier conversation, read-only,
 * in the same message shape hydrate returns. Does not touch which thread is current.
 *
 * @returns {Promise<{messages: object[], status: 'opened'|'closed', closedReason: string}>}
 */
export async function fetchAgentChatThread(agentId, threadId) {
    const response = await fetcher(
        `/api.php?r=system/get_ai_chat_thread/TemplServices&params[]=${encodeURIComponent(agentId)}&params[]=${encodeURIComponent(threadId)}`
    );
    const message = apiErrorMessage(response, 'AI chat history failed.');
    if (message) throw new Error(message);
    const data = response?.data;
    return {
        messages: Array.isArray(data?.messages) ? data.messages : [],
        status: data?.status === 'closed' ? 'closed' : 'opened',
        closedReason: String(data?.closed_reason || ''),
    };
}

/**
 * Transcript only, without building a stream.
 *
 * `createAgentChat` constructs an SSE client eagerly, so calling it just to reach
 * `hydrate()` sets up a connection that is never used. The prefetch in `AiAgent`
 * wants exactly this GET and nothing else.
 */
export async function hydrateAgentChat(agentId, options = {}) {
    const url = requestUrl(agentId, options.contextProfileId, options.chatId);
    return hydrateChat(url, chatHeaders(options.headers));
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
                if (chunk?.type === 'CUSTOM' && chunk.name === 'chat_session') {
                    options.onChatSession?.(chunk.messageId, chunk.value);
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
