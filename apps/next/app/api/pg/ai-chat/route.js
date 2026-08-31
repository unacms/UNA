/**
 * Dev-only AG-UI SSE stand-in used by `/pg/ai` in emulator mode.
 *
 * Live web chat goes to same-origin `/sys-ai-chat/{AgentId}` (proxied to UNA).
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
