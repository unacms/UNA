import { describe, expect, it, vi } from 'vitest';

import { MAX_WAIT_SECONDS, retryAfterSeconds, withRateLimitWait } from './rate-limit-fetch';

const url = 'https://community.example/api/v2/search?q=tea';

function limited(retryAfter: string | null): Response {
    const headers: Record<string, string> = { 'Content-Type': 'application/problem+json' };
    if (retryAfter !== null) headers['Retry-After'] = retryAfter;
    return new Response(JSON.stringify({ status: 429, code: 'rate_limited' }), { status: 429, headers });
}

function ok(body: unknown = { items: [] }): Response {
    return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

describe('retryAfterSeconds', () => {
    it('reads whole seconds and nothing else', () => {
        expect(retryAfterSeconds(limited('12'))).toBe(12);
        expect(retryAfterSeconds(limited(' 3 '))).toBe(3);
        expect(retryAfterSeconds(limited('0'))).toBe(0);
        expect(retryAfterSeconds(limited(null))).toBeNull();
        expect(retryAfterSeconds(limited('soon'))).toBeNull();
        expect(retryAfterSeconds(limited('Wed, 21 Oct 2026 07:28:00 GMT'))).toBeNull();
        expect(retryAfterSeconds(limited('-1'))).toBeNull();
    });
});

describe('withRateLimitWait', () => {
    it('passes any other answer through without waiting', async () => {
        const sleep = vi.fn(async () => {});
        const inner = vi.fn(async () => ok({ items: [1] }));
        const f = withRateLimitWait(inner as typeof fetch, { sleep });

        expect(await (await f(url)).json()).toEqual({ items: [1] });
        expect(inner).toHaveBeenCalledTimes(1);
        expect(sleep).not.toHaveBeenCalled();
    });

    it('waits out a short refusal and asks once more', async () => {
        const waits: number[] = [];
        const answers = [limited('2'), ok({ items: [2] })];
        const inner = vi.fn(async () => answers.shift()!);
        const f = withRateLimitWait(inner as typeof fetch, {
            sleep: async (ms) => {
                waits.push(ms);
            },
        });

        const response = await f(url);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ items: [2] });
        expect(inner).toHaveBeenCalledTimes(2);
        // the seconds asked for, and a little more
        expect(waits).toHaveLength(1);
        expect(waits[0]).toBeGreaterThanOrEqual(2000);
        expect(waits[0]).toBeLessThan(3000);
    });

    it('sends a write again with its body and headers', async () => {
        const seen: { method: string; body: string; key: string | null }[] = [];
        const answers = [limited('1'), new Response(null, { status: 204 })];
        const inner = async (input: RequestInfo | URL) => {
            const request = input as Request;
            seen.push({ method: request.method, body: await request.text(), key: request.headers.get('Idempotency-Key') });
            return answers.shift()!;
        };
        const f = withRateLimitWait(inner as typeof fetch, { sleep: async () => {} });

        const response = await f('https://community.example/api/v2/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'k-1' },
            body: JSON.stringify({ text: 'Hello' }),
        });
        expect(response.status).toBe(204);
        expect(seen).toEqual([
            { method: 'POST', body: '{"text":"Hello"}', key: 'k-1' },
            { method: 'POST', body: '{"text":"Hello"}', key: 'k-1' },
        ]);
    });

    it('asks only once more: a second refusal is the answer', async () => {
        const sleep = vi.fn(async () => {});
        const inner = vi.fn(async () => limited('1'));
        const f = withRateLimitWait(inner as typeof fetch, { sleep });

        expect((await f(url)).status).toBe(429);
        expect(inner).toHaveBeenCalledTimes(2);
        expect(sleep).toHaveBeenCalledTimes(1);
    });

    it('leaves a long wait to the caller', async () => {
        const sleep = vi.fn(async () => {});
        const inner = vi.fn(async () => limited(String(MAX_WAIT_SECONDS + 1)));
        const f = withRateLimitWait(inner as typeof fetch, { sleep });

        const response = await f(url);
        expect(response.status).toBe(429);
        expect(response.headers.get('Retry-After')).toBe(String(MAX_WAIT_SECONDS + 1));
        expect(inner).toHaveBeenCalledTimes(1);
        expect(sleep).not.toHaveBeenCalled();
    });

    it('does not guess a wait the answer does not give', async () => {
        const sleep = vi.fn(async () => {});
        const inner = vi.fn(async () => limited(null));
        const f = withRateLimitWait(inner as typeof fetch, { sleep });

        expect((await f(url)).status).toBe(429);
        expect(inner).toHaveBeenCalledTimes(1);
        expect(sleep).not.toHaveBeenCalled();
    });

    it('does not ask again for a caller that gave up while waiting', async () => {
        const controller = new AbortController();
        const inner = vi.fn(async () => limited('3'));
        const f = withRateLimitWait(inner as typeof fetch, {
            sleep: async () => {
                controller.abort();
            },
        });

        expect((await f(url, { signal: controller.signal })).status).toBe(429);
        expect(inner).toHaveBeenCalledTimes(1);
    });

    it('stops waiting as soon as the caller gives up', async () => {
        vi.useFakeTimers();
        try {
            const controller = new AbortController();
            const inner = vi.fn(async () => limited('5'));
            const f = withRateLimitWait(inner as typeof fetch);

            const pending = f(url, { signal: controller.signal });
            await vi.advanceTimersByTimeAsync(100);
            controller.abort();
            expect((await pending).status).toBe(429);
            expect(inner).toHaveBeenCalledTimes(1);
            expect(vi.getTimerCount()).toBe(0);
        } finally {
            vi.useRealTimers();
        }
    });
});
