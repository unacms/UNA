import { afterEach, describe, expect, it, vi } from 'vitest';

const rust = vi.hoisted(() => ({
    status: 401,
    /** null: Rust answers; a code: Rust refuses the request with it */
    failure: null as string | null,
    sessions: [] as { siteUrl: string; generation: number }[],
    sent: [] as Request[],
}));

vi.mock('./native', async (importOriginal) => ({
    ...(await importOriginal<typeof import('./native')>()),
    inApp: true,
}));

vi.mock('./rust-fetch', async (importOriginal) => {
    const real = await importOriginal<typeof import('./rust-fetch')>();
    return {
        ...real,
        rustFetch: (session: { siteUrl: string; generation: number }) => {
            rust.sessions.push(session);
            return async (input: RequestInfo | URL, init?: RequestInit) => {
                rust.sent.push(new Request(input, init));
                if (rust.failure) throw new real.RustRequestError('no', rust.failure);
                return new Response(JSON.stringify({ code: 'unauthorized', status: rust.status, title: 'Unauthorized' }), { status: rust.status });
            };
        },
    };
});

import { fetchOf, makeApi, SessionOverError } from './api';
import { RustRequestError } from './rust-fetch';

const session = { siteUrl: 'http://desktop.localhost:8090', generation: 3 };

afterEach(() => {
    rust.status = 401;
    rust.failure = null;
    rust.sessions.length = 0;
    rust.sent.length = 0;
});

describe("a session's requests", () => {
    it('go out through Rust for that session, with no token from the page', async () => {
        rust.status = 200;
        await makeApi(session, vi.fn()).GET('/me');
        expect(rust.sessions).toEqual([session]);
        expect(rust.sent).toHaveLength(1);
        expect(rust.sent[0]?.url).toBe('http://desktop.localhost:8090/api/v2/me');
        expect(rust.sent[0]?.headers.get('Authorization')).toBeNull();
        expect(rust.sent[0]?.headers.get('Accept-Language')).toBe('en-US');
    });

    it('have a fetch of their own for a request made without the client', async () => {
        rust.status = 200;
        const refused = vi.fn();
        const api = makeApi(session, refused);
        await fetchOf(api)('http://desktop.localhost:8090/api/v2');
        expect(rust.sent[0]?.url).toBe('http://desktop.localhost:8090/api/v2');
        rust.status = 401;
        await fetchOf(api)('http://desktop.localhost:8090/api/v2');
        expect(refused).toHaveBeenCalledWith('refused');
    });
});

describe('a request the site refuses', () => {
    it('is said as refused, and signs nothing out by itself', async () => {
        const refused = vi.fn();
        const api = makeApi(session, refused);
        const result = await api.GET('/me');
        expect(result.response.status).toBe(401);
        expect(refused).toHaveBeenCalledTimes(1);
        expect(refused).toHaveBeenCalledWith('refused');
    });

    it('a request of a session that is over goes nowhere and says so', async () => {
        rust.failure = 'session_over';
        const refused = vi.fn();
        const api = makeApi(session, refused);
        await expect(api.GET('/me')).rejects.toBeInstanceOf(SessionOverError);
        expect(refused).toHaveBeenCalledTimes(1);
        expect(refused).toHaveBeenCalledWith('over');
    });

    it('other answers are not refusals', async () => {
        rust.status = 403;
        const refused = vi.fn();
        await makeApi(session, refused).GET('/me');
        expect(refused).not.toHaveBeenCalled();
    });

    it('another failure of Rust is that failure, not a refusal', async () => {
        rust.failure = 'invalid_request';
        const refused = vi.fn();
        await expect(makeApi(session, refused).GET('/me')).rejects.toBeInstanceOf(RustRequestError);
        expect(refused).not.toHaveBeenCalled();
    });
});
