/**
 * What the app does when the API says it is asked too often. The API counts requests per member
 * in one-minute windows and answers one over the limit with 429 and Retry-After, the seconds
 * until the window ends. It refuses before it reads the body, so nothing was done and asking
 * again is safe for a write too.
 *
 * A short wait is taken here, once: the caller sees the second answer and nothing else. A long
 * one is the caller's to show (the 429's problem says how long), since a spinner that hangs for
 * most of a minute tells the person less than the message does.
 */

/** The longest Retry-After the app waits out by itself. */
export const MAX_WAIT_SECONDS = 5;
/** Added to the wait, so the second try lands inside the next window on a site whose clock is a little behind. */
const CUSHION_MS = 250;

export type RateLimitWaitOptions = {
    maxWaitSeconds?: number;
    /** Resolves after `ms`, or as soon as `signal` aborts. */
    sleep?: (ms: number, signal: AbortSignal) => Promise<void>;
};

/** The whole seconds of a Retry-After header, or null when it has none (a date is not read: the API sends seconds). */
export function retryAfterSeconds(response: Response): number | null {
    const raw = response.headers.get('Retry-After')?.trim();
    return raw !== undefined && /^\d+$/.test(raw) ? Number(raw) : null;
}

function sleepFor(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
        if (signal.aborted) return resolve();
        const done = () => {
            clearTimeout(timer);
            signal.removeEventListener('abort', done);
            resolve();
        };
        const timer = setTimeout(done, ms);
        signal.addEventListener('abort', done);
    });
}

/** fetch that waits out a short 429 and asks once more; any other answer, and a long 429, pass through. */
export function withRateLimitWait(fetchImpl: typeof fetch, options: RateLimitWaitOptions = {}): typeof fetch {
    const maxWaitSeconds = options.maxWaitSeconds ?? MAX_WAIT_SECONDS;
    const sleep = options.sleep ?? sleepFor;

    return async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = new Request(input, init);
        // a body is sent once: the second try needs its own copy
        const again = request.clone();

        const response = await fetchImpl(request);
        if (response.status !== 429) return response;

        const wait = retryAfterSeconds(response);
        if (wait === null || wait > maxWaitSeconds) return response;

        await sleep(wait * 1000 + CUSHION_MS, again.signal);
        // the caller gave up while waiting: it gets the refusal it would have had
        if (again.signal.aborted) return response;
        return fetchImpl(again);
    };
}
