/**
 * Assistant `actions` on a chat message.
 *
 * { type: "link", label, url }  → open url in a new window / in-app browser
 * { type: "reply", label }      → send label as the next user message
 */

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

export function messageActions(message) {
    return readRawActions(message)
        .map((action) => {
            if (!action || typeof action !== 'object') return null;
            const label = String(action.label || action.title || action.text || '').trim();
            const url = String(action.url || action.href || '').trim();
            const type = action.type === 'link' || (!action.type && url)
                ? 'link'
                : 'reply';
            if (!label) return null;
            if (type === 'link') {
                if (!url) return null;
                return { type: 'link', label, url };
            }
            return { type: 'reply', label, message: String(action.message || label).trim() || label };
        })
        .filter(Boolean);
}
