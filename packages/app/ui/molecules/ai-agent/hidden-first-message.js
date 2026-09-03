/**
 * Agent field `hidden_first_message`: rule for the hidden WEA-1939 first user line.
 * Empty / invalid rule → do not send. Token: lowercase, truncate, [a-z0-9_-], max 32.
 */

const FROM = new Set(['query', 'value', 'data']);
const TOKEN_CHAR = /^[a-z0-9_-]$/;

function sanitizeToken(raw) {
    if (raw == null) return '';
    const lower = String(raw).toLowerCase();
    let out = '';
    for (let i = 0; i < lower.length; i++) {
        const ch = lower[i];
        if (!TOKEN_CHAR.test(ch)) break;
        out += ch;
        if (out.length >= 32) break;
    }
    return out;
}

function isRulePart(s) {
    return typeof s === 'string' && s.length > 0 && s.length <= 32 && /^[a-z0-9_-]+$/.test(s);
}

/** @param {unknown} raw */
export function parseHiddenFirstMessageRule(raw) {
    const s = String(raw ?? '').trim().toLowerCase();
    if (!s) return null;
    const i = s.indexOf(':');
    const from = i === -1 ? 'query' : s.slice(0, i);
    const key = i === -1 ? s : s.slice(i + 1);
    if (!FROM.has(from) || !isRulePart(key)) return null;
    return { from, key };
}

function readQueryParam(params, key) {
    const direct = params?.[key];
    const fromParam = Array.isArray(direct) ? direct[0] : direct;
    if (fromParam != null && String(fromParam) !== '') return String(fromParam);
    const href = typeof params?.url === 'string' ? params.url : '';
    if (!href.includes('?')) return '';
    return new URLSearchParams(href.slice(href.indexOf('?') + 1)).get(key) || '';
}

function readDataField(data, key) {
    if (!data || typeof data !== 'object') return '';
    const value = data[key];
    if (value == null) return '';
    if (Array.isArray(value)) return value[0] != null ? String(value[0]) : '';
    if (typeof value === 'object') return '';
    return String(value);
}

export function buildHiddenFirstMessage(rule, { params, data } = {}) {
    if (!rule) return '';
    let raw = '';
    if (rule.from === 'query') raw = readQueryParam(params, rule.key);
    else if (rule.from === 'value') raw = rule.key;
    else if (rule.from === 'data') raw = readDataField(data, rule.key);
    const token = sanitizeToken(raw);
    return token ? `[page opened; hint: ${token}]` : '[page opened]';
}

/** Any WEA-1939 hidden first line (exact text may differ after sanitize / org). */
export function isHiddenFirstMessageText(text) {
    return typeof text === 'string' && text.startsWith('[page opened');
}

/**
 * @param {object | null | undefined} data block payload
 * @param {object | null | undefined} params useLocalSearchParams()
 * @param {string} [fallbackWhenAbsent] used only if the field is missing (not if it is "")
 */
export function hiddenFirstMessageFromData(data, params, fallbackWhenAbsent = '') {
    const hasField = !!data && Object.prototype.hasOwnProperty.call(data, 'hidden_first_message');
    const source = hasField ? data.hidden_first_message : fallbackWhenAbsent;
    return buildHiddenFirstMessage(parseHiddenFirstMessageRule(source), { params, data });
}
