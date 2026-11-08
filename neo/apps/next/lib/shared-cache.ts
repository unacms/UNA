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
 * A load that resolves to `undefined` is not stored.
 */

type Entry<T> = { value?: T; expires: number; pending?: Promise<T | undefined> };

export type SharedCacheOptions = {
    ttlMs: number;
    staleMs: number;
    waitMs: number;
    maxEntries: number;
    now?: () => number;
};

export function createSharedCache<T>({ ttlMs, staleMs, waitMs, maxEntries, now = Date.now }: SharedCacheOptions) {
    const entries = new Map<string, Entry<T>>();

    function evict() {
        const at = now();
        for (const [key, entry] of entries) {
            if (!entry.pending && entry.expires + staleMs <= at) entries.delete(key);
        }
        while (entries.size > maxEntries) {
            const oldest = entries.keys().next().value;
            if (oldest === undefined) break;
            entries.delete(oldest);
        }
    }

    function refresh(key: string, load: () => Promise<T | undefined>): Promise<T | undefined> {
        const entry = entries.get(key) ?? { expires: 0 };
        if (entry.pending) return entry.pending;
        const pending = Promise.resolve()
            .then(load)
            .catch(() => undefined)
            .then((value) => {
                const current = entries.get(key) ?? entry;
                current.pending = undefined;
                if (value !== undefined) {
                    current.value = value;
                    current.expires = now() + ttlMs;
                }
                if (current.value === undefined) entries.delete(key);
                else entries.set(key, current);
                return value;
            });
        entry.pending = pending;
        entries.set(key, entry);
        evict();
        return pending;
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
            const entry = entries.get(key);
            const at = now();
            if (entry?.value !== undefined && entry.expires > at) return Promise.resolve(entry.value);
            const pending = refresh(key, load);
            if (entry?.value !== undefined && entry.expires + staleMs > at) return Promise.resolve(entry.value);
            return within(pending);
        },
        /** For tests. */
        size: () => entries.size,
    };
}
