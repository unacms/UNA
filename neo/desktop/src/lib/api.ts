import { createUnaApi, problemMessage, type UnaApi } from 'una-api';

import { offCode } from './api-availability';
import { EtagCache, withEtags } from './etag-fetch';
import { locale, t } from './i18n';
import { inApp, type Session } from './native';
import { withRateLimitWait } from './rate-limit-fetch';
import { rustFetch, RustRequestError } from './rust-fetch';

/** A request of a session that is over: it never goes out, not even as a guest's. */
export class SessionOverError extends Error {
    constructor() {
        super(t('You are signed out'));
        this.name = 'SessionOverError';
    }
}

/**
 * Why a request of a session did not go through as that session's: `over`, the session is no
 * longer the one signed in, so nothing was sent; `refused`, the site answered 401.
 */
export type Refusal = 'over' | 'refused';

/**
 * The API client of one signed-in session; its GETs are conditional (etag-fetch.ts) and a short
 * "asked too often" answer is waited out once (rate-limit-fetch.ts). The page holds no token:
 * in the app Rust sends each request with that session's token on it (rust-fetch.ts, api.rs).
 * Once the session is over a request goes nowhere and onRefused is called with `over`, so a
 * window opened before never has a later session's token sent to its site, nor asks it as a
 * guest. A request the site answers 401 calls it with `refused`: Rust has renewed the session
 * by then, or kept it as signed out (native.ts tokenRefused says which), so a refused token
 * never signs anything out by itself.
 */
const sessions = new WeakMap<UnaApi, Session>();
const fetches = new WeakMap<UnaApi, typeof fetch>();

/** The session an API client of makeApi is of (what Rust's uploads are sent for). */
export function sessionOf(api: UnaApi): Session | undefined {
    return sessions.get(api);
}

/**
 * The fetch an API client of makeApi sends with: for the few requests made without the client
 * (the site's discovery document). The global fetch for any other client.
 */
export function fetchOf(api: UnaApi): typeof fetch {
    return fetches.get(api) ?? ((...args) => fetch(...args));
}

/** fetch for one session's requests, which says when one was not that session's (makeApi). */
export function sessionFetch(session: Session, onRefused: (why: Refusal) => void): typeof fetch {
    // outside the app there is no session: requests go out as a guest's
    if (!inApp) return (...args) => fetch(...args);
    const send = rustFetch(session);
    return async (input, init) => {
        let response: Response;
        try {
            response = await send(input, init);
        } catch (e) {
            if (e instanceof RustRequestError && e.code === 'session_over') {
                onRefused('over');
                throw new SessionOverError();
            }
            throw e;
        }
        if (response.status === 401) onRefused('refused');
        return response;
    };
}

export function makeApi(session: Session, onRefused: (why: Refusal) => void): UnaApi {
    const send = sessionFetch(session, onRefused);
    const api = createUnaApi({
        siteUrl: session.siteUrl,
        fetch: withEtags(withRateLimitWait(send), new EtagCache()),
        language: locale(),
    });
    sessions.set(api, session);
    fetches.set(api, send);
    return api;
}

/** A failed API call: the problem's message and the HTTP status. */
export class ApiError extends Error {
    constructor(
        message: string,
        readonly status: number,
        /** The problem's `code` (`already_voted`, `not_open`...), when it has one. */
        readonly code?: string,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

/** The item is gone for this viewer: deleted, or no longer visible to them. */
export function isGone(error: unknown): boolean {
    return error instanceof ApiError && (error.status === 404 || error.status === 403 || error.status === 410);
}

/**
 * The site said its API is turned off (503 `api_v2_disabled`, or `api_disabled` for the whole
 * API): not a failure of the request, and nobody was signed out (lib/api-availability.ts).
 */
export function isApiOff(error: unknown): boolean {
    return error instanceof ApiError && error.status === 503 && offCode(error.code) !== null;
}

/**
 * Retry a failed query once, but not when the site refused it (4xx) or said its API is turned
 * off: asking again gets the same answer.
 */
export function retryOnce(failureCount: number, error: unknown): boolean {
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
    if (isApiOff(error)) return false;
    return failureCount < 1;
}

function fail(result: { error?: unknown; response: Response }): never {
    const problem = result.error && typeof result.error === 'object' ? (result.error as { code?: unknown }) : undefined;
    const code = typeof problem?.code === 'string' ? problem.code : undefined;
    throw new ApiError(problemMessage(result.error, t('The site answered {{status}}', { status: String(result.response.status) })), result.response.status, code);
}

/** The data of an openapi-fetch result, or an ApiError with the API's problem message. */
export function unwrap<T>(result: { data?: T; error?: unknown; response: Response }): T {
    if (result.error !== undefined || !result.response.ok) fail(result);
    return result.data as T;
}

/** For 204 responses, which carry no data. */
export function ensureOk(result: { error?: unknown; response: Response }): void {
    if (result.error !== undefined || !result.response.ok) fail(result);
}

const rtf = new Intl.RelativeTimeFormat(locale(), { numeric: 'auto' });
const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
];

export function ago(iso: string): string {
    const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
    for (const [unit, size] of steps) if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
    return rtf.format(0, 'second');
}

/**
 * How long a save waits for the site's answer. The API client gives up only on a site it can't
 * reach (api.rs CONNECT_TIMEOUT), and a form takes no change while it is being saved, so a save
 * the site never answers is stopped here: it is then not saved, as far as the app knows.
 */
export const SAVE_ANSWER_MS = 60_000;

/** The limit of one save: the signal that stops it after SAVE_ANSWER_MS, and `done` for when it ended. */
export function saveLimit(): { signal: AbortSignal; done: () => void } {
    const stop = new AbortController();
    const limit = setTimeout(() => stop.abort(), SAVE_ANSWER_MS);
    return { signal: stop.signal, done: () => clearTimeout(limit) };
}
