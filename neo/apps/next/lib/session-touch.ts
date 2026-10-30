/**
 * Keeps a remembered UNA session's cookie end in step with the server on NEO web.
 *
 * UNA moves a remembered session's end forward as it is used (at most once a day). That
 * often happens on the page's server-side fetch (`[...path]/page.tsx`), and a Server
 * Component can't pass the `Set-Cookie` on, so the browser would keep the earlier end. The
 * proxy asks UNA's `touch_session` service before a page every few hours instead, and hands
 * the cookie it gets back both to the browser and to the page request it forwards.
 *
 * Backends without `touch_session` answer with an error, but those still repeat the session
 * cookie in every API response, so whatever `Set-Cookie` comes back is applied all the same.
 */

export const SESSION_COOKIE = 'memberSession';
/** Set for a few hours after a touch, so the next pages skip it. */
export const SESSION_MARK = 'neo_session_ok';
export const SESSION_MARK_AGE = 6 * 3600;
/** After a failed touch (UNA down or slow): try again sooner. */
export const SESSION_RETRY_AGE = 3600;
export const SESSION_TOUCH_TIMEOUT_MS = 1500;
export const SESSION_TOUCH_PATH = '/api.php?r=system/touch_session/TemplServiceLogin';

type CookieReader = { has(name: string): boolean };

/** A page request with a UNA session that hasn't been touched lately. */
export function needsSessionTouch(cookies: CookieReader): boolean {
    return cookies.has(SESSION_COOKIE) && !cookies.has(SESSION_MARK);
}

/** A mark left over after the session cookie went away (logout): drop it. */
export function hasStaleSessionMark(cookies: CookieReader): boolean {
    return !cookies.has(SESSION_COOKIE) && cookies.has(SESSION_MARK);
}

export function sessionMarkCookie(maxAge: number, secure: boolean): string {
    return `${SESSION_MARK}=1; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
}

type ParsedSetCookie = { name: string; value: string; removed: boolean };

/** Name and value of a `Set-Cookie` line, and whether it removes the cookie. */
export function parseSetCookie(raw: string, now: number = Date.now()): ParsedSetCookie | null {
    const [pair = '', ...attributes] = String(raw).split(';');
    const eq = pair.indexOf('=');
    if (eq <= 0) return null;

    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    let removed = value === '' || value === 'deleted';
    for (const attribute of attributes) {
        const [key = '', ...rest] = attribute.split('=');
        const attributeValue = rest.join('=').trim();
        switch (key.trim().toLowerCase()) {
            case 'max-age':
                if (Number(attributeValue) <= 0) removed = true;
                break;
            case 'expires': {
                const time = Date.parse(attributeValue);
                if (!Number.isNaN(time) && time <= now) removed = true;
                break;
            }
        }
    }
    return name ? { name, value, removed } : null;
}

/**
 * The `Cookie` header the page request should carry once the browser has applied these
 * `Set-Cookie` lines, so the page renders with the cookies the browser will send next.
 * Values stay as they were sent: the header is forwarded to UNA unchanged.
 */
export function applySetCookies(cookieHeader: string, setCookies: string[], now: number = Date.now()): string {
    const cookies = new Map<string, string>();
    for (const part of String(cookieHeader || '').split(';')) {
        const eq = part.indexOf('=');
        if (eq <= 0) continue;
        cookies.set(part.slice(0, eq).trim(), part.slice(eq + 1).trim());
    }
    for (const raw of setCookies) {
        const cookie = parseSetCookie(raw, now);
        if (!cookie) continue;
        if (cookie.removed) cookies.delete(cookie.name);
        else cookies.set(cookie.name, cookie.value);
    }
    return [...cookies].map(([name, value]) => `${name}=${value}`).join('; ');
}
