/**
 * Conductor load tracer (native profile ~7s). On in __DEV__ by default.
 * Mute: `globalThis.__NEO_CONDUCTOR_TRACE__ = false`
 * Metro filter: `[NEO:cnd]`
 */

const PREFIX = '[NEO:cnd]';
const sessions = new Map();

function now() {
    return typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now();
}

export function conductorTraceEnabled() {
    if (typeof __DEV__ === 'undefined' || !__DEV__) return false;
    return globalThis.__NEO_CONDUCTOR_TRACE__ !== false;
}

function sessionKey(url) {
    return String(url || '(no-url)').replace(/^\/+/, '').replace(/\/+$/, '') || '(no-url)';
}

function sessionFor(url) {
    const key = sessionKey(url);
    let s = sessions.get(key);
    if (!s) {
        s = { t0: now(), last: now(), n: 0 };
        sessions.set(key, s);
        if (sessions.size > 24) {
            const first = sessions.keys().next().value;
            sessions.delete(first);
        }
    }
    return s;
}

export function conductorTrace(url, label, extra) {
    if (!conductorTraceEnabled()) return;
    const s = sessionFor(url);
    const t = now();
    const fromStart = Math.round(t - s.t0);
    const fromLast = Math.round(t - s.last);
    s.last = t;
    s.n += 1;
    if (extra === undefined) {
        console.log(`${PREFIX} +${fromStart}ms Δ${fromLast}ms ${label}`);
        return;
    }
    console.log(`${PREFIX} +${fromStart}ms Δ${fromLast}ms ${label}`, extra);
}

export function conductorTraceReset(url) {
    if (!conductorTraceEnabled()) return;
    sessions.delete(sessionKey(url));
}

export function pageTraceShape(data) {
    if (!data || typeof data !== 'object') return null;
    const elements = data.elements && typeof data.elements === 'object'
        ? Object.keys(data.elements).length
        : 0;
    return {
        url: data.url,
        elements,
        menu: data.menu?.items?.length ?? 0,
        cover: Boolean(data.cover_block),
        parsed: Boolean(data.layout_parsed),
    };
}
