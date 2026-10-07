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

/**
 * Everything on a message that is not text: image parts and the like. Read from
 * both places they can live — a multimodal `content` array (what `sendMessage`
 * was given) and `parts` (what the client normalizes to).
 */
export function messageMediaParts(message) {
    const content = Array.isArray(message?.content) ? message.content : [];
    const parts = Array.isArray(message?.parts) ? message.parts : [];
    return [...content, ...parts].filter((part) => part && typeof part === 'object' && part.type !== 'text');
}

function imageSrcFromPart(part) {
    if (part.type !== 'image' && part.type !== 'image_url') return '';
    const source = part.source;
    if (source && typeof source === 'object') {
        if (source.type === 'url' && source.value) return String(source.value);
        if (source.type === 'data' && source.value) {
            const mime = source.mimeType || 'image/jpeg';
            return `data:${mime};base64,${source.value}`;
        }
    }
    return String(part.url || part.src || part.image_url?.url || '');
}

/** Distinct image URLs (or data URLs) on a user/assistant message. */
export function messageImages(message) {
    const seen = new Set();
    for (const part of messageMediaParts(message)) {
        const src = imageSrcFromPart(part);
        if (src) seen.add(src);
    }
    return [...seen];
}

/** Ids a bubble answers to: its own, plus those of any messages folded into it. */
export function messageIds(message) {
    return message?.foldedIds?.length ? message.foldedIds : [message?.id];
}

export function lastAssistantId(messages) {
    for (let i = (messages?.length || 0) - 1; i >= 0; i--) {
        if (messages[i]?.role === 'assistant') return messages[i].id;
    }
    return null;
}

function uniqueActionItems(items) {
    const seen = new Set();
    const out = [];
    for (const item of items || []) {
        if (!item || typeof item !== 'object') continue;
        const key = `${item.type || ''}|${item.label || ''}|${item.url || ''}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(item);
    }
    return out;
}

/**
 * One model turn can emit two assistant bubbles (text, then a tool, then
 * "buttons are below"). Show them as a single reply with one button row.
 *
 * The folded bubble keeps the *first* message's id, so its React key is stable
 * when the second message arrives; `foldedIds` lists every id it stands for
 * (see `messageIds`). Text is joined, media parts and actions are concatenated.
 */
export function foldConsecutiveAssistants(messages) {
    const out = [];
    for (const message of messages || []) {
        const prev = out[out.length - 1];
        if (message?.role !== 'assistant' || prev?.role !== 'assistant') {
            out.push(message);
            continue;
        }
        const text = [messageText(prev), messageText(message)].filter(Boolean).join('\n\n');
        out[out.length - 1] = {
            ...prev,
            foldedIds: [...messageIds(prev), message.id],
            content: text,
            parts: [
                ...(text ? [{ type: 'text', content: text }] : []),
                ...messageMediaParts(prev),
                ...messageMediaParts(message),
            ],
            actions: uniqueActionItems([
                ...(Array.isArray(prev.actions) ? prev.actions : []),
                ...(Array.isArray(message.actions) ? message.actions : []),
            ]),
        };
    }
    return out;
}

/** Streamed buttons may be keyed by any id of a folded bubble; newest wins. */
export function streamActionsForMessage(message, streamActions) {
    const ids = messageIds(message);
    for (let i = ids.length - 1; i >= 0; i--) {
        const actions = streamActions?.[ids[i]];
        if (Array.isArray(actions) && actions.length) return actions;
    }
    return undefined;
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
