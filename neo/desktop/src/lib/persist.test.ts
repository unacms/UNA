import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import { CACHE_MAX_AGE_MS, cacheKey, memoryStore, persistCache, removeCache, restoreCache, snapshot } from './persist';

const A = 'https://a.example|3';
const B = 'https://b.example|7';

function client() {
    return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe('persist', () => {
    it('keeps feeds, posts and the account, and nothing that is not worth reading again', () => {
        const c = client();
        c.setQueryData(['me'], { account: { id: '3' } });
        c.setQueryData(['feed', 'following'], { pages: [1, 2, 3, 4].map((n) => ({ items: [n] })), pageParams: [null, 'a', 'b', 'c'] });
        c.setQueryData(['activity', '12'], { id: '12' });
        c.setQueryData(['upload', '1'], { id: '1' });
        c.setQueryData(['feed-head', 'following'], { items: [] });
        const keys = snapshot(c).state.queries.map((q) => q.queryKey[0]);
        expect(keys.sort()).toEqual(['activity', 'feed', 'me']);
        const feed = snapshot(c).state.queries.find((q) => q.queryKey[0] === 'feed');
        expect((feed?.state.data as { pages: unknown[] }).pages).toHaveLength(2);
    });

    it('brings a network back after a restart, without the network', async () => {
        const store = memoryStore();
        const before = client();
        before.setQueryData(['feed', 'following'], { pages: [{ items: [{ id: '1' }] }], pageParams: [null] });
        await store.set(cacheKey(A), snapshot(before));

        const after = client();
        expect(await restoreCache(after, store, A)).toBe(true);
        expect(after.getQueryData(['feed', 'following'])).toEqual({ pages: [{ items: [{ id: '1' }] }], pageParams: [null] });
    });

    it('never gives one network what another saved', async () => {
        const store = memoryStore();
        const a = client();
        a.setQueryData(['me'], { account: { id: '3' }, site: 'a' });
        const saving = persistCache(a, store, A, 10);
        a.setQueryData(['activity', '1'], { id: '1' });
        await saving.flush();
        saving.stop();

        const b = client();
        expect(await restoreCache(b, store, B)).toBe(false);
        expect(b.getQueryData(['me'])).toBeUndefined();
        expect(store.keys()).toEqual([cacheKey(A)]);
    });

    it('deletes a network’s data at sign-out and saves nothing after it stopped', async () => {
        vi.useFakeTimers();
        try {
            const store = memoryStore();
            const c = client();
            const saving = persistCache(c, store, A, 1000);
            c.setQueryData(['me'], { account: { id: '3' } });
            await vi.advanceTimersByTimeAsync(1000);
            expect(store.keys()).toEqual([cacheKey(A)]);

            // signing out: stop, clear, delete; the cleared cache is not saved again
            saving.stop();
            c.clear();
            await removeCache(store, A);
            c.setQueryData(['me'], { account: { id: '5' } });
            await vi.advanceTimersByTimeAsync(5000);
            expect(store.keys()).toEqual([]);
        } finally {
            vi.useRealTimers();
        }
    });

    it('drops what is too old or of another version', async () => {
        const store = memoryStore();
        const c = client();
        c.setQueryData(['me'], { account: { id: '3' } });
        const saved = snapshot(c, 1_000);
        await store.set(cacheKey(A), saved);
        expect(await restoreCache(client(), store, A, 1_000 + CACHE_MAX_AGE_MS + 1)).toBe(false);
        expect(store.keys()).toEqual([]);

        await store.set(cacheKey(A), { ...saved, version: 0 });
        expect(await restoreCache(client(), store, A)).toBe(false);
        expect(store.keys()).toEqual([]);
    });
});
