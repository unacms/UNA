import { describe, expect, it, vi } from 'vitest';

import { EtagCache, withEtags } from './etag-fetch';

const url = 'https://community.example/api/v2/feeds/hot?limit=20';

function json(body: unknown, etag: string | null, status = 200): Response {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (etag) headers.ETag = etag;
    return new Response(JSON.stringify(body), { status, headers });
}

describe('withEtags', () => {
    it('sends the kept ETag and answers a 304 with the kept body', async () => {
        const seen: (string | null)[] = [];
        const inner = vi.fn(async (input: RequestInfo | URL) => {
            const request = input as Request;
            seen.push(request.headers.get('If-None-Match'));
            return seen.length === 1 ? json({ items: [1] }, 'W/"a"') : new Response(null, { status: 304, headers: { ETag: 'W/"a"' } });
        });
        const f = withEtags(inner as typeof fetch, new EtagCache());

        expect(await (await f(url)).json()).toEqual({ items: [1] });
        const second = await f(url);
        expect(second.status).toBe(200);
        expect(second.headers.get('Content-Type')).toBe('application/json');
        expect(await second.json()).toEqual({ items: [1] });
        expect(seen).toEqual([null, 'W/"a"']);
    });

    it('keeps the newer body when the content changed', async () => {
        const bodies = [json({ v: 1 }, 'W/"1"'), json({ v: 2 }, 'W/"2"'), new Response(null, { status: 304 })];
        const tags: (string | null)[] = [];
        const inner = async (input: RequestInfo | URL) => {
            tags.push((input as Request).headers.get('If-None-Match'));
            return bodies.shift()!;
        };
        const f = withEtags(inner as typeof fetch, new EtagCache());
        await f(url);
        expect(await (await f(url)).json()).toEqual({ v: 2 });
        expect(await (await f(url)).json()).toEqual({ v: 2 });
        expect(tags).toEqual([null, 'W/"1"', 'W/"2"']);
    });

    it('leaves other methods, errors and bodies without an ETag alone', async () => {
        const cache = new EtagCache();
        const inner = vi.fn(async (input: RequestInfo | URL) => {
            const request = input as Request;
            if (request.method === 'POST') return json({ ok: true }, 'W/"p"', 201);
            return request.url.endsWith('nope') ? json({ title: 'Not Found' }, 'W/"e"', 404) : json({ x: 1 }, null);
        });
        const f = withEtags(inner as typeof fetch, cache);
        await f(url, { method: 'POST', body: '{}' });
        await f('https://community.example/api/v2/nope');
        await f(url);
        expect(cache.size).toBe(0);
    });

    it('forgets a URL that failed, so a later 304 is never served from an old body', async () => {
        const cache = new EtagCache();
        const answers = [json({ v: 1 }, 'W/"1"'), json({ title: 'Gone' }, null, 410)];
        const f = withEtags((async () => answers.shift()!) as typeof fetch, cache);
        await f(url);
        expect(cache.size).toBe(1);
        await f(url);
        expect(cache.size).toBe(0);
    });

    it('keeps at most maxEntries URLs, dropping the least recently used', () => {
        const cache = new EtagCache({ maxEntries: 2 });
        const entry = { etag: 'x', body: '{}', headers: [] };
        cache.set('a', entry);
        cache.set('b', entry);
        cache.get('a');
        cache.set('c', entry);
        expect(cache.get('a')).toBeDefined();
        expect(cache.get('b')).toBeUndefined();
        expect(cache.get('c')).toBeDefined();
    });
});
