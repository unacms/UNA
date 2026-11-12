import { describe, expect, it, vi } from 'vitest';

import { createUnaApi } from 'una-api';

import { makeLinkOpener } from './link-opener';
import type { DetailRoute } from './router';

function api(answers: Record<string, { status: number; body?: unknown } | 'offline'>, asked: string[]) {
    return createUnaApi({
        siteUrl: 'https://community.example',
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            const request = input instanceof Request ? input : new Request(input, init);
            const url = new URL(request.url).searchParams.get('url') ?? '';
            asked.push(url);
            const answer = answers[url];
            if (!answer || answer === 'offline') throw new TypeError('Failed to fetch');
            const type = answer.status >= 400 ? 'application/problem+json' : 'application/json';
            return new Response(JSON.stringify(answer.body ?? { status: answer.status, code: 'not_found', title: 'Not Found' }), { status: answer.status, headers: { 'Content-Type': type } });
        },
    });
}

describe('site links in the app', () => {
    const post = 'https://community.example/view-post/hello';
    const page = 'https://community.example/about';
    const elsewhere = 'https://other.example/view-post/hello';

    it('open what the site says they show, and keep the answer', async () => {
        const asked: string[] = [];
        const show = vi.fn<(route: DetailRoute) => void>();
        const open = makeLinkOpener(api({ [post]: { status: 200, body: { kind: 'content', id: '12', item_id: null, thread_id: null } } }, asked), 'https://community.example', show);
        await expect(open(post)).resolves.toBe(true);
        expect(show).toHaveBeenCalledWith({ kind: 'post', id: '12' });
        await expect(open(post)).resolves.toBe(true);
        expect(asked).toEqual([post]);
    });

    it('leave other pages and other sites to the browser', async () => {
        const asked: string[] = [];
        const show = vi.fn();
        const open = makeLinkOpener(api({ [page]: { status: 404 } }, asked), 'https://community.example', show);
        await expect(open(page)).resolves.toBe(false);
        await expect(open(page)).resolves.toBe(false);
        await expect(open(elsewhere)).resolves.toBe(false);
        expect(asked).toEqual([page]);
        expect(show).not.toHaveBeenCalled();
    });

    it('ask again after the site could not be reached', async () => {
        const asked: string[] = [];
        const open = makeLinkOpener(api({ [post]: 'offline' }, asked), 'https://community.example', vi.fn());
        await expect(open(post)).rejects.toThrow();
        await expect(open(post)).rejects.toThrow();
        expect(asked).toEqual([post, post]);
    });
});
