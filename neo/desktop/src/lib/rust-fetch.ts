/**
 * fetch for a session's API requests in the app: the request goes to Rust (src-tauri/src/api.rs),
 * which checks that its address is the site's API, attaches the session's token and sends it.
 * The page never holds a token: it names the session (the site and which sign-in), and a
 * session that is over gets no request at all.
 *
 * The answer's status and headers come back as the command's result; the body arrives in pieces
 * on a channel, so a streamed reply (an agent's) reads as it is written. Aborting the request
 * stops it in Rust too.
 */
import { Channel, invoke } from '@tauri-apps/api/core';

/** Why Rust sent nothing or got no answer (api.rs ApiFailure). */
export class RustRequestError extends Error {
    constructor(
        message: string,
        /** `session_over`, `invalid_request`, `unreachable`, `internal`. */
        readonly code: string,
    ) {
        super(message);
        this.name = 'RustRequestError';
    }
}

type Head = { status: number; headers: [string, string][] };

/** What the first byte of a body message says the rest is (api.rs BODY_*). */
const DATA = 0;
const END = 1;
const FAILED = 2;

/** Statuses whose Response takes no body. */
const NO_BODY = new Set([101, 204, 205, 304]);

export type RustBridge = {
    invoke: (command: string, args: Record<string, unknown>) => Promise<unknown>;
    /** A channel Rust sends the body on: what `onmessage` is set to gets each message. */
    channel: () => { onmessage: (message: ArrayBuffer) => void };
    id: () => string;
};

const tauriBridge: RustBridge = {
    invoke: (command, args) => invoke(command, args),
    channel: () => new Channel<ArrayBuffer>(),
    id: () => crypto.randomUUID(),
};

function aborted(signal: AbortSignal): unknown {
    return signal.reason ?? new DOMException('The request was aborted', 'AbortError');
}

function failure(e: unknown): { code: string; message: string } {
    if (typeof e === 'object' && e !== null) {
        const { code, message } = e as { code?: unknown; message?: unknown };
        return { code: typeof code === 'string' ? code : 'internal', message: typeof message === 'string' ? message : String(e) };
    }
    return { code: 'internal', message: String(e) };
}

/** fetch for the requests of one session. */
export function rustFetch(session: { siteUrl: string; generation: number }, bridge: RustBridge = tauriBridge): typeof fetch {
    return async (input, init) => {
        const request = new Request(input, init);
        const { signal } = request;
        if (signal.aborted) throw aborted(signal);

        const sent = request.method === 'GET' || request.method === 'HEAD' ? null : new Uint8Array(await request.arrayBuffer());
        const body = sent && sent.byteLength ? Array.from(sent) : null;
        const id = bridge.id();

        let over = false;
        let control: ReadableStreamDefaultController<Uint8Array> | null = null;
        const stop = () => {
            if (over) return;
            over = true;
            void bridge.invoke('api_abort', { id }).catch(() => undefined);
        };
        const stream = new ReadableStream<Uint8Array>({
            start: (controller) => {
                control = controller;
            },
            // the reader gave up on the body
            cancel: stop,
        });
        const onBody = bridge.channel();
        onBody.onmessage = (message) => {
            if (over || !control) return;
            const bytes = new Uint8Array(message);
            const kind = bytes[0];
            if (kind === DATA) {
                // a copy: the message's buffer is the channel's
                control.enqueue(bytes.slice(1));
            } else {
                over = true;
                if (kind === END) control.close();
                else control.error(new TypeError(kind === FAILED ? new TextDecoder().decode(bytes.subarray(1)) : 'The answer was cut short'));
            }
        };
        const onAbort = () => {
            const control_ = control;
            stop();
            try {
                control_?.error(aborted(signal));
            } catch {
                // closed already
            }
        };
        signal.addEventListener('abort', onAbort, { once: true });

        let head: Head;
        try {
            head = (await bridge.invoke('api_request', {
                request: { id, siteUrl: session.siteUrl, generation: session.generation, method: request.method, url: request.url, headers: [...request.headers], body },
                onBody,
            })) as Head;
        } catch (e) {
            over = true;
            signal.removeEventListener('abort', onAbort);
            if (signal.aborted) throw aborted(signal);
            const { code, message } = failure(e);
            if (code === 'cancelled') throw new DOMException(message, 'AbortError');
            // a request that got no answer is a TypeError, as fetch has it
            if (code === 'unreachable') throw new TypeError(message);
            throw new RustRequestError(message, code);
        }
        if (signal.aborted) throw aborted(signal);
        const empty = request.method === 'HEAD' || NO_BODY.has(head.status);
        return new Response(empty ? null : stream, { status: head.status, headers: head.headers });
    };
}
