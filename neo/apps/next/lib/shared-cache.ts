/**
 * A small in-process cache for UNA answers that every viewer in a group shares (guest menus,
 * the analytics settings): one request to UNA per key and time-to-live, however many pages
 * the server renders.
 *
 * - A fresh entry is returned at once.
 * - A stale entry (up to `staleMs` past its time-to-live) is returned at once too, while one
 *   refresh runs in the background (stale-while-revalidate).
 * - Otherwise the caller waits for the load, at most `waitMs`, and gets `undefined` on a
 *   timeout or a failed load; the load keeps running and fills the cache for the next page.
 *
 * Loads in flight are kept apart from stored values: eviction never drops a running load (a
 * second load for the same key would race it), and at most `maxEntries` values are stored.
 * A load that resolves to `undefined` is not stored.
 */

type Stored<T> = { value: T; expires: number };

export type SharedCacheOptions = {
    ttlMs: number;
    staleMs: number;
    waitMs: number;
    maxEntries: number;
    now?: () => number;
};

export function createSharedCache<T>({ ttlMs, staleMs, waitMs, maxEntries, now = Date.now }: SharedCacheOptions) {
    const values = new Map<string, Stored<T>>();
    const pending = new Map<string, Promise<T | undefined>>();

    function store(key: string, value: T) {
        values.delete(key);
        values.set(key, { value, expires: now() + ttlMs });
        const at = now();
        for (const [k, entry] of values) {
            if (entry.expires + staleMs <= at) values.delete(k);
        }
        while (values.size > maxEntries) {
            const oldest = values.keys().next().value;
            if (oldest === undefined) break;
            values.delete(oldest);
        }
    }

    function refresh(key: string, load: () => Promise<T | undefined>): Promise<T | undefined> {
        const running = pending.get(key);
        if (running) return running;
        const request = Promise.resolve()
            .then(load)
            .catch(() => undefined)
            .then((value) => {
                pending.delete(key);
                if (value !== undefined) store(key, value);
                return value;
            });
        pending.set(key, request);
        return request;
    }

    function within(promise: Promise<T | undefined>): Promise<T | undefined> {
        let timer: ReturnType<typeof setTimeout> | undefined;
        const timeout = new Promise<undefined>((resolve) => {
            timer = setTimeout(resolve, waitMs, undefined);
        });
        return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
    }

    return {
        /** The cached value for `key`, loading it with `load` when missing or stale. */
        get(key: string, load: () => Promise<T | undefined>): Promise<T | undefined> {
            if (ttlMs <= 0) return within(Promise.resolve().then(load).catch(() => undefined));
            const entry = values.get(key);
            const at = now();
            if (entry && entry.expires > at) return Promise.resolve(entry.value);
            const request = refresh(key, load);
            if (entry && entry.expires + staleMs > at) return Promise.resolve(entry.value);
            return within(request);
        },
        /** For tests: stored values and loads in flight. */
        size: () => values.size,
        pendingSize: () => pending.size,
    };
}
