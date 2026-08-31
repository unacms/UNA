/**
 * Same-origin UNA Agents chat: GET hydrate + POST AG-UI SSE.
 *
 * Do not use `fetcher` — it always parses JSON and appends `&lang=`.
 * Join/resume (`?offset=`) is not supported by UNA; the adapter omits `joinRun`.
 */

import { fetchServerSentEvents } from '@tanstack/ai-client';

const AGENT_ID_RE = /^[A-Za-z0-9_-]+$/;

export function isUnaAiChatAgentId(value) {
    return typeof value === 'string' && AGENT_ID_RE.test(value);
}

export function unaAiChatPath(agentId) {
    return `/sys-ai-chat/${encodeURIComponent(agentId)}`;
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

async function unaAiChatFetch(input, init) {
    const response = await fetch(input, init);
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        const data = await response.clone().json().catch(() => null);
        throwIfUnaAiChatError(data);
    }
    return response;
}

async function hydrateUnaAiChat(url, credentials) {
    const response = await unaAiChatFetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials,
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
    const url = unaAiChatPath(agentId);
    const credentials = options.credentials || 'same-origin';
    const base = fetchServerSentEvents(url, {
        credentials,
        fetchClient: unaAiChatFetch,
    });

    return {
        async *connect(messages, data, abortSignal, runContext) {
            yield* base.connect(messages, data, abortSignal, runContext);
        },
        async hydrate() {
            try {
                const result = await hydrateUnaAiChat(url, credentials);
                options.onHydrateError?.(null);
                return result;
            } catch (error) {
                options.onHydrateError?.(error);
                throw error;
            }
        },
    };
}
