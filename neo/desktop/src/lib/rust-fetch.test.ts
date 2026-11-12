import { describe, expect, it } from 'vitest';

import { type RustBridge, rustFetch, RustRequestError } from './rust-fetch';

const session = { siteUrl: 'https://community.example', generation: 7 };
const encode = (text: string) => new TextEncoder().encode(text);

function message(kind: number, text = ''): ArrayBuffer {
    const bytes = encode(text);
    const out = new Uint8Array(bytes.length + 1);
    out[0] = kind;
    out.set(bytes, 1);
    return out.buffer;
}

type Call = { command: string; args: Record<string, unknown> };

/** Rust, played by the test: `answer` gets each api_request and the channel to send the body on. */
function bridgeOf(answer: (request: Record<string, unknown>, send: (m: ArrayBuffer) => void) => Promise<unknown>) {
    const calls: Call[] = [];
    let n = 0;
    const bridge: RustBridge = {
        invoke: async (command, args) => {
            calls.push({ command, args });
            if (command !== 'api_request') return undefined;
            const channel = args.onBody as { onmessage: (m: ArrayBuffer) => void };
            return answer(args.request as Record<string, unknown>, (m) => channel.onmessage(m));
        },
        channel: () => ({ onmessage: () => undefined }),
        id: () => `r${++n}`,
    };
    return { bridge, calls, aborts: () => calls.filter((c) => c.command === 'api_abort').map((c) => c.args.id) };
}

describe('a request through Rust', () => {
    it('names the session and carries the method, address, headers and body, and no token', async () => {
        const { bridge, calls } = bridgeOf(async (_request, send) => {
            send(message(1));
            return { status: 204, headers: [] };
        });
        const response = await rustFetch(session, bridge)('https://community.example/api/v2/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept-Language': 'ru' },
            body: JSON.stringify({ text: 'Hi' }),
        });
        expect(response.status).toBe(204);
        expect(calls).toHaveLength(1);
        const request = calls[0]?.args.request as { headers: [string, string][]; body: number[] };
        expect(request).toMatchObject({ id: 'r1', siteUrl: 'https://community.example', generation: 7, method: 'POST', url: 'https://community.example/api/v2/posts' });
        expect(Object.fromEntries(request.headers)).toEqual({ 'content-type': 'application/json', 'accept-language': 'ru' });
        expect(new TextDecoder().decode(new Uint8Array(request.body))).toBe('{"text":"Hi"}');
        expect(JSON.stringify(calls)).not.toMatch(/authorization|bearer/i);
    });

    it('sends no body with a GET', async () => {
        const { bridge, calls } = bridgeOf(async (_request, send) => {
            send(message(0, '{}'));
            send(message(1));
            return { status: 200, headers: [] };
        });
        await rustFetch(session, bridge)('https://community.example/api/v2/me');
        expect((calls[0]?.args.request as { body: unknown }).body).toBeNull();
    });

    it('answers the status, the headers and the body put together from its pieces', async () => {
        const { bridge } = bridgeOf(async (_request, send) => {
            send(message(0, '{"name":'));
            send(message(0, '"Лили"}'));
            send(message(1));
            return {
                status: 200,
                headers: [
                    ['content-type', 'application/json'],
                    ['etag', '"abc"'],
                ],
            };
        });
        const response = await rustFetch(session, bridge)('https://community.example/api/v2/me');
        expect(response.status).toBe(200);
        expect(response.ok).toBe(true);
        expect(response.headers.get('ETag')).toBe('"abc"');
        expect(await response.json()).toEqual({ name: 'Лили' });
    });

    it('reads a streamed body as it arrives, before it ends', async () => {
        let send: (m: ArrayBuffer) => void = () => undefined;
        const { bridge } = bridgeOf(async (_request, s) => {
            send = s;
            return { status: 200, headers: [['content-type', 'text/event-stream']] };
        });
        const response = await rustFetch(session, bridge)('https://community.example/api/v2/agents/1/runs', { method: 'POST', body: '{}' });
        const reader = response.body!.getReader();
        send(message(0, 'data: one\n\n'));
        expect(new TextDecoder().decode((await reader.read()).value)).toBe('data: one\n\n');
        send(message(0, 'data: two\n\n'));
        expect(new TextDecoder().decode((await reader.read()).value)).toBe('data: two\n\n');
        send(message(1));
        expect((await reader.read()).done).toBe(true);
    });

    it('gives an answer without a body where the status has none', async () => {
        const { bridge } = bridgeOf(async (_request, send) => {
            send(message(1));
            return { status: 304, headers: [['etag', '"abc"']] };
        });
        const response = await rustFetch(session, bridge)('https://community.example/api/v2/me', { headers: { 'If-None-Match': '"abc"' } });
        expect(response.status).toBe(304);
        expect(response.body).toBeNull();
    });

    it('fails the body when the answer is cut short', async () => {
        const { bridge } = bridgeOf(async (_request, send) => {
            send(message(0, '{"na'));
            send(message(2, 'connection reset'));
            return { status: 200, headers: [] };
        });
        const response = await rustFetch(session, bridge)('https://community.example/api/v2/me');
        await expect(response.text()).rejects.toThrow('connection reset');
    });
});

describe('a request Rust does not answer', () => {
    const failing = (failure: unknown) =>
        bridgeOf(async () => {
            throw failure;
        }).bridge;

    it('says a session that is over by its code', async () => {
        const error = await rustFetch(session, failing({ status: 0, code: 'session_over', message: 'The session is over' }))('https://community.example/api/v2/me').catch((e: unknown) => e);
        expect(error).toBeInstanceOf(RustRequestError);
        expect((error as RustRequestError).code).toBe('session_over');
    });

    it('is a TypeError when the site could not be reached, as fetch has it', async () => {
        const error = await rustFetch(session, failing({ status: 0, code: 'unreachable', message: 'Could not reach the network: timed out' }))('https://community.example/api/v2/me').catch((e: unknown) => e);
        expect(error).toBeInstanceOf(TypeError);
        expect((error as Error).message).toBe('Could not reach the network: timed out');
    });

    it('says an address Rust would not send to', async () => {
        const error = await rustFetch(session, failing({ status: 0, code: 'invalid_request', message: "Not an address of the network's API" }))('https://evil.test/api/v2/me').catch((e: unknown) => e);
        expect((error as RustRequestError).code).toBe('invalid_request');
    });

    it('says a failure that is not Rust’s own shape', async () => {
        const error = await rustFetch(session, failing('boom'))('https://community.example/api/v2/me').catch((e: unknown) => e);
        expect((error as RustRequestError).code).toBe('internal');
        expect((error as Error).message).toBe('boom');
    });
});

describe('a request that is aborted', () => {
    it('never reaches Rust when aborted before it starts', async () => {
        const { bridge, calls } = bridgeOf(async () => ({ status: 200, headers: [] }));
        const controller = new AbortController();
        controller.abort();
        await expect(rustFetch(session, bridge)('https://community.example/api/v2/me', { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
        expect(calls).toEqual([]);
    });

    it('is stopped in Rust while it waits for the answer', async () => {
        const controller = new AbortController();
        const { bridge, aborts } = bridgeOf(
            () =>
                new Promise((_resolve, reject) => {
                    // Rust answers the stopped request as cancelled
                    controller.signal.addEventListener('abort', () => reject({ status: 0, code: 'cancelled', message: 'The request was stopped' }));
                }),
        );
        const pending = rustFetch(session, bridge)('https://community.example/api/v2/me', { signal: controller.signal });
        await Promise.resolve();
        controller.abort();
        await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
        expect(aborts()).toEqual(['r1']);
    });

    it('is stopped in Rust while its body arrives, and the body fails as aborted', async () => {
        const controller = new AbortController();
        const { bridge, aborts } = bridgeOf(async (_request, send) => {
            send(message(0, 'data: one\n\n'));
            return { status: 200, headers: [] };
        });
        const response = await rustFetch(session, bridge)('https://community.example/api/v2/agents/1/runs', { method: 'POST', body: '{}', signal: controller.signal });
        const reader = response.body!.getReader();
        await reader.read();
        controller.abort();
        await expect(reader.read()).rejects.toMatchObject({ name: 'AbortError' });
        expect(aborts()).toEqual(['r1']);
    });

    it('is stopped in Rust when the reader gives up on the body', async () => {
        const { bridge, aborts } = bridgeOf(async (_request, send) => {
            send(message(0, 'data: one\n\n'));
            return { status: 200, headers: [] };
        });
        const response = await rustFetch(session, bridge)('https://community.example/api/v2/agents/1/runs', { method: 'POST', body: '{}' });
        await response.body!.cancel();
        expect(aborts()).toEqual(['r1']);
    });

    it('asks Rust to stop nothing once the body has ended', async () => {
        const controller = new AbortController();
        const { bridge, aborts } = bridgeOf(async (_request, send) => {
            send(message(0, '{}'));
            send(message(1));
            return { status: 200, headers: [] };
        });
        const response = await rustFetch(session, bridge)('https://community.example/api/v2/me', { signal: controller.signal });
        expect(await response.text()).toBe('{}');
        controller.abort();
        expect(aborts()).toEqual([]);
    });
});
