// Run with `node --test apps/next/lib/shared-cache.test.ts` from the NEO root (Node 24 strips the types).
import assert from 'node:assert/strict';
import test from 'node:test';
import { createSharedCache } from './shared-cache.ts';

function clock(start = 1000) {
    let at = start;
    return { now: () => at, advance: (ms: number) => { at += ms; } };
}

test('one load per key while fresh', async () => {
    const time = clock();
    const cache = createSharedCache<string>({ ttlMs: 60_000, staleMs: 600_000, waitMs: 1000, maxEntries: 10, now: time.now });
    let loads = 0;
    const load = async () => { loads += 1; return 'menu'; };
    assert.equal(await cache.get('k', load), 'menu');
    assert.equal(await cache.get('k', load), 'menu');
    assert.equal(loads, 1);
});

test('concurrent misses share one load', async () => {
    const cache = createSharedCache<string>({ ttlMs: 60_000, staleMs: 0, waitMs: 1000, maxEntries: 10 });
    let loads = 0;
    const load = () => new Promise<string>((resolve) => { loads += 1; setTimeout(resolve, 10, 'x'); });
    const values = await Promise.all([cache.get('k', load), cache.get('k', load), cache.get('k', load)]);
    assert.deepEqual(values, ['x', 'x', 'x']);
    assert.equal(loads, 1);
});

test('a stale value comes back at once and is refreshed in the background', async () => {
    const time = clock();
    const cache = createSharedCache<number>({ ttlMs: 1000, staleMs: 10_000, waitMs: 1000, maxEntries: 10, now: time.now });
    let n = 0;
    const load = async () => { n += 1; return n; };
    assert.equal(await cache.get('k', load), 1);
    time.advance(2000);
    assert.equal(await cache.get('k', load), 1);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(await cache.get('k', load), 2);
});

test('a slow load times out to undefined and still fills the cache', async () => {
    const cache = createSharedCache<string>({ ttlMs: 60_000, staleMs: 0, waitMs: 5, maxEntries: 10 });
    const load = () => new Promise<string>((resolve) => setTimeout(resolve, 30, 'late'));
    assert.equal(await cache.get('k', load), undefined);
    await new Promise((resolve) => setTimeout(resolve, 40));
    assert.equal(await cache.get('k', load), 'late');
});

test('failed loads are not stored', async () => {
    const cache = createSharedCache<string>({ ttlMs: 60_000, staleMs: 0, waitMs: 1000, maxEntries: 10 });
    assert.equal(await cache.get('k', async () => { throw new Error('down'); }), undefined);
    assert.equal(await cache.get('k', async () => undefined), undefined);
    assert.equal(cache.size(), 0);
    assert.equal(await cache.get('k', async () => 'up'), 'up');
});

test('ttl 0 never caches', async () => {
    const cache = createSharedCache<number>({ ttlMs: 0, staleMs: 0, waitMs: 1000, maxEntries: 10 });
    let n = 0;
    const load = async () => ++n;
    assert.equal(await cache.get('k', load), 1);
    assert.equal(await cache.get('k', load), 2);
});

test('entries are bounded', async () => {
    const cache = createSharedCache<number>({ ttlMs: 60_000, staleMs: 0, waitMs: 1000, maxEntries: 3 });
    for (let i = 0; i < 10; i += 1) await cache.get(`k${i}`, async () => i);
    assert.ok(cache.size() <= 3);
});

test('concurrent loads past the limit: each key loads once and the store stays bounded', async () => {
    const cache = createSharedCache<number>({ ttlMs: 60_000, staleMs: 0, waitMs: 1000, maxEntries: 2 });
    const loads = new Map<string, number>();
    const load = (key: string, n: number) => () => new Promise<number>((resolve) => {
        loads.set(key, (loads.get(key) ?? 0) + 1);
        setTimeout(resolve, 10, n);
    });
    const keys = ['a', 'b', 'c', 'd', 'e'];
    // Every key twice while all loads are still running.
    const first = keys.map((k, i) => cache.get(k, load(k, i)));
    const second = keys.map((k, i) => cache.get(k, load(k, i)));
    assert.equal(cache.pendingSize(), keys.length);
    assert.deepEqual(await Promise.all(first), [0, 1, 2, 3, 4]);
    assert.deepEqual(await Promise.all(second), [0, 1, 2, 3, 4]);
    for (const k of keys) assert.equal(loads.get(k), 1, `${k} loaded once`);
    assert.equal(cache.pendingSize(), 0);
    assert.ok(cache.size() <= 2);
});
