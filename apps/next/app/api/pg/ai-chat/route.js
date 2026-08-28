/**
 * Dev-only AG-UI SSE stand-in for the future UNA Agents chat endpoint.
 *
 * `useChat({ connection: fetchServerSentEvents('/api/pg/ai-chat') })` talks
 * to this route. Swap the URL to UNA when the real contract exists.
 */

import { toServerSentEventsResponse } from '@tanstack/ai';
import { emulateUnaChatStream } from 'app/components/page-layout/_playground/ai-chat-emulator';

export const runtime = 'nodejs';

function messagesFromBody(body) {
    if (Array.isArray(body?.messages)) return body.messages;
    if (Array.isArray(body?.input?.messages)) return body.input.messages;
    return [];
}

export async function POST(request) {
    let body = {};
    try {
        body = await request.json();
    } catch {
        body = {};
    }

    return toServerSentEventsResponse(
        emulateUnaChatStream(messagesFromBody(body), request.signal)
    );
}
