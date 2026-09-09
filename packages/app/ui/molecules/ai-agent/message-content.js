/**
 * Parsing of everything the agent sends us: message text, `actions`, session end.
 *
 * Everything in this module treats its input as untrusted — it comes from a model,
 * not from our own code — so every reader is total: bad shapes degrade to empty,
 * never to a throw.
 *
 * { type: "link", label, url }  → open url in a new window / in-app browser
 * { type: "reply", label }      → send label as the next user message
 *
 * Session end
 * { ended: true, reason: "non_answer" | "turn_cap" | "hostile" }
 */

/* ------------------------------------------------------------------ session */

export function parseChatSessionPayload(value) {
    const reason = value?.reason;
    if (reason !== 'non_answer' && reason !== 'turn_cap' && reason !== 'hostile') return null;
    return { ended: true, reason };
}

export function sessionAllowsRestart(session) {
    return !!session?.ended && session.reason !== 'hostile';
}

/** Newest assistant message that carries a session-end payload, if any. */
export function sessionFromMessages(messages) {
    for (let i = (messages?.length || 0) - 1; i >= 0; i--) {
        const message = messages[i];
        if (message?.role !== 'assistant') continue;
        return parseChatSessionPayload(message?.session);
    }
    return null;
}

/* ------------------------------------------------------------------- text */

/** Flatten a message to plain text; `content` (string) or text `parts`. */
export function messageText(message) {
    if (typeof message?.content === 'string') return message.content;
    const parts = message?.parts || [];
    return parts
        .filter((part) => part?.type === 'text')
        .map((part) => part.content || '')
        .join('');
}

export function lastAssistantId(messages) {
    for (let i = (messages?.length || 0) - 1; i >= 0; i--) {
        if (messages[i]?.role === 'assistant') return messages[i].id;
    }
    return null;
}

/** Agent row `max_input_chars`. 0 = no cap (same as UNA applyChatInputLimit). */
export function agentMaxInputChars(data) {
    const n = Number(data?.max_input_chars);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/**
 * Clip to `maxChars` code points (UNA counts the same way).
 *
 * The fast path may use `.length` even though it is a UTF-16 count: that count is
 * never *smaller* than the code-point count, so "fits in UTF-16 units" implies
 * "fits in code points". The slow path must not use `.length`, or a string of
 * emoji would be reported as twice its visible size and clipped too early.
 */
export function clipAgentText(text, maxChars) {
    const value = String(text ?? '');
    if (!maxChars || value.length <= maxChars) return value;
    return [...value].slice(0, maxChars).join('');
}

/**
 * Agent output is rendered as HTML (the `Html` atom sanitizes on web, and UNA's
 * `preprocessHtml` strips raw newlines) — so newlines have to become `<br>` here.
 *
 * `format: 'text'` escapes everything: use it for agents that emit plain prose.
 * The default keeps markup working but escapes an "orphan" `<` — one that cannot
 * open a tag — so that ordinary prose like "5 < 6" or "x <- y" survives instead of
 * being swallowed by the parser as a broken tag.
 */
export function agentTextToHtml(text, format = 'html') {
    const value = String(text ?? '');
    const escaped = format === 'text'
        ? value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        : value.replace(/<(?![a-zA-Z/!?])/g, '&lt;');
    return escaped.replace(/\r\n|\n|\r/g, '<br>');
}

/* ----------------------------------------------------------------- actions */

export function parseChatActionsPayload(value) {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') {
        if (Array.isArray(value.actions)) return value.actions;
        if (Array.isArray(value.value)) return value.value;
    }
    return [];
}

function readRawActions(message) {
    if (Array.isArray(message?.actions)) return message.actions;
    if (Array.isArray(message?.data?.actions)) return message.data.actions;
    if (Array.isArray(message?.metadata?.actions)) return message.metadata.actions;
    const parts = message?.parts || [];
    for (const part of parts) {
        if (!part || typeof part !== 'object') continue;
        if (Array.isArray(part.actions)) return part.actions;
        if (part.type === 'actions' && Array.isArray(part.content)) return part.content;
        if (part.type === 'data-actions' && Array.isArray(part.data)) return part.data;
        if (part.type === 'data-actions' && Array.isArray(part.value)) return part.value;
    }
    return [];
}

const SAFE_URL_SCHEME = /^(?:https?:|mailto:|tel:)/i;
const HAS_SCHEME = /^[a-z][a-z\d+\-.]*:/i;

/**
 * Link targets are chosen by the model, so a prompt-injected `javascript:` or
 * `data:text/html` action must never reach the link renderer. Anything carrying a
 * scheme has to be on the whitelist; scheme-less values are relative in-app links
 * and keep the platform's normal handling (`sanitazeUrl` / `normalizeLinkHref`).
 */
function safeActionUrl(raw) {
    const url = String(raw || '').trim();
    if (!url) return '';
    if (!HAS_SCHEME.test(url)) return url;
    return SAFE_URL_SCHEME.test(url) ? url : '';
}

/**
 * Normalize a message's actions into `{ type, label, url }` / `{ type, label, message }`.
 * `streamedActions` (from the live CUSTOM chunk) wins over whatever is on the
 * message, because the message copy may not have been persisted yet.
 */
export function messageActions(message, streamedActions) {
    const raw = Array.isArray(streamedActions) && streamedActions.length
        ? streamedActions
        : readRawActions(message);
    return raw
        .map((action) => {
            if (!action || typeof action !== 'object') return null;
            const label = String(action.label || action.title || action.text || '').trim();
            if (!label) return null;
            const rawUrl = String(action.url || action.href || '').trim();
            const url = safeActionUrl(rawUrl);
            // An explicit `type` wins; otherwise the presence of a url means "link".
            // This deliberately tests the *raw* url: an action that meant to be a link
            // but whose target we rejected must be dropped, never silently downgraded
            // to a reply that would push the label into the chat as if the user typed it.
            const isLink = action.type === 'link' || (!action.type && !!rawUrl);
            if (isLink) return url ? { type: 'link', label, url } : null;
            return { type: 'reply', label, message: String(action.message || label).trim() || label };
        })
        .filter(Boolean);
}
