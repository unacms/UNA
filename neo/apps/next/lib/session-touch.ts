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

/** `expires`: when the cookie ends (ms), null when it ends with the browser. */
type ParsedSetCookie = { name: string; value: string; removed: boolean; expires: number | null };

/** Name, value and end of a `Set-Cookie` line, and whether it removes the cookie. */
export function parseSetCookie(raw: string, now: number = Date.now()): ParsedSetCookie | null {
    const [pair = '', ...attributes] = String(raw).split(';');
    const eq = pair.indexOf('=');
    if (eq <= 0) return null;

    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    let maxAge: number | null = null;
    let expires: number | null = null;
    for (const attribute of attributes) {
        const [key = '', ...rest] = attribute.split('=');
        const attributeValue = rest.join('=').trim();
        switch (key.trim().toLowerCase()) {
            case 'max-age': {
                const seconds = Number(attributeValue);
                if (attributeValue !== '' && !Number.isNaN(seconds)) maxAge = seconds;
                break;
            }
            case 'expires': {
                const time = Date.parse(attributeValue);
                if (!Number.isNaN(time)) expires = time;
                break;
            }
        }
    }
    // Max-Age wins over Expires, as in browsers.
    const end = maxAge !== null ? now + maxAge * 1000 : expires;
    const removed = value === '' || value === 'deleted' || (end !== null && end <= now);
    return name ? { name, value, removed, expires: end } : null;
}

/**
 * Seconds until the next touch. UNA moves a remembered session's end once half its lifetime
 * (at most a day) has passed, and the moved end may only reach the browser on a touch. So the
 * next touch comes while the cookie the browser holds still has half its time left: a short
 * `sys_session_lifetime_in_min` touches more often. A failed touch is retried sooner.
 */
export function sessionMarkAge(ok: boolean, setCookies: string[], now: number = Date.now()): number {
    if (!ok) return SESSION_RETRY_AGE;
    const session = setCookies
        .map((raw) => parseSetCookie(raw, now))
        .find((cookie) => cookie?.name === SESSION_COOKIE && !cookie.removed);
    if (!session?.expires) return SESSION_MARK_AGE;
    return Math.max(60, Math.min(SESSION_MARK_AGE, Math.floor((session.expires - now) / 2000)));
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
