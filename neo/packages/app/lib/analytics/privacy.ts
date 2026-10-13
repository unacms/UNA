/**
 * What leaves the device in error and vitals hits: URLs without query strings and fragments
 * (only UNA's page `i` and API route `r` parameters stay), the site's own origin dropped from
 * scripts and stack frames, tokens and emails redacted. UNA strips and redacts again.
 */

/** Query parameters kept: they name a page or an API service, not a person. */
const KEEP_PARAMS = ['i', 'r'];
const MAX_PARAM_LENGTH = 128;
const MAX_STACK_FRAMES = 30;
/** BxAnalyticsErrors MAX_STACK_INPUT */
const MAX_STACK_LENGTH = 8000;
const REDACTED = '<redacted>';

const URL_PATTERN = /\b(?:https?|wss?):\/\/[^\s()<>"'`]+/gi;
const EXTENSION_PATTERN = /\b[a-z-]*extension:\/\//i;

/** Tokens and secrets. */
const SECRET_PATTERNS: Array<[RegExp, string]> = [
    [/\beyJ[\w-]+\.[\w-]+\.[\w-]+/g, REDACTED],
    [/\bBearer\s+[^\s"'`]+/gi, `Bearer ${REDACTED}`],
    [/\b(token|key|secret|password|pass|auth|sid|session)=[^&\s"'`]+/gi, `$1=${REDACTED}`],
];
/**
 * Emails. Safari and Firefox stack frames are `fn@file`, but a cleaned frame is `fn@/path` or
 * `fn@https://host/...`: neither has a dot right after the first word, so neither matches.
 */
const EMAIL_PATTERN = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;

function redact(text: string): string {
    const redacted = SECRET_PATTERNS.reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), text);
    return redacted.replace(EMAIL_PATTERN, REDACTED);
}

/**
 * `url` without its query string and fragment (the `i` and `r` parameters stay) and without
 * `ownOrigin`: `https://site/view-post?id=5#c` -> `/view-post`.
 */
export function cleanUrl(url: string, ownOrigin = ''): string {
    const match = /^([a-z][a-z0-9+.-]*:\/\/[^/?#]*)?([^?#]*)(\?[^#]*)?/i.exec(String(url ?? ''));
    if (!match) return '';
    const origin = match[1] ?? '';
    const path = match[2] ?? '';
    const kept = (match[3] ?? '')
        .slice(1)
        .split('&')
        .filter((pair) => {
            const [key, value = ''] = pair.split('=');
            return !!key && KEEP_PARAMS.includes(key) && value !== '' && value.length <= MAX_PARAM_LENGTH;
        });
    const keepOrigin = origin && origin.toLowerCase() !== ownOrigin.toLowerCase();
    return `${keepOrigin ? origin : ''}${path}${kept.length ? `?${kept.join('&')}` : ''}`;
}

/** Every URL in `text` cleaned (a frame's `:line:column` stays), secrets and emails redacted. */
export function cleanText(text: unknown, ownOrigin = ''): string {
    const value = typeof text === 'string' ? text : '';
    if (!value) return '';
    const cleaned = value.replace(URL_PATTERN, (url) => {
        const position = /(?::\d+){1,2}$/.exec(url)?.[0] ?? '';
        return cleanUrl(position ? url.slice(0, -position.length) : url, ownOrigin) + position;
    });
    return redact(cleaned);
}

/** A message: cleaned, at most `max` characters. */
export function cleanMessage(text: unknown, ownOrigin = '', max = 500): string {
    return cleanText(text, ownOrigin).trim().slice(0, max);
}

export function isExtensionUrl(text: unknown): boolean {
    return typeof text === 'string' && EXTENSION_PATTERN.test(text);
}

/** At most 30 frames, without browser extensions' frames, cleaned. */
export function cleanStack(stack: unknown, ownOrigin = ''): string {
    if (typeof stack !== 'string' || !stack) return '';
    const frames = stack
        .split('\n')
        .filter((line) => line.trim() !== '' && !isExtensionUrl(line))
        .slice(0, MAX_STACK_FRAMES);
    return cleanText(frames.join('\n'), ownOrigin).slice(0, MAX_STACK_LENGTH);
}
