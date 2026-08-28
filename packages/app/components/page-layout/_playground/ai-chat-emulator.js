/**
 * Playground stand-in for the future UNA Agents AG-UI endpoint.
 *
 * Speaks the same StreamChunk types `useChat` expects
 * (RUN_STARTED → TEXT_MESSAGE_* → RUN_FINISHED). Swap the connection
 * adapter to the real UNA URL when it exists.
 */

const ASSISTANT_NAME = 'UNA Assistant';

function lastUserText(messages = []) {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
        const message = messages[i];
        if (message?.role !== 'user') continue;
        if (typeof message.content === 'string' && message.content.trim()) {
            return message.content.trim();
        }
        const parts = message.parts || [];
        const text = parts
            .filter((part) => part?.type === 'text' && part.content)
            .map((part) => part.content)
            .join('')
            .trim();
        if (text) return text;
    }
    return '';
}

function isCyrillic(text) {
    return /[а-яё]/i.test(text);
}

function buildReply(userText) {
    const ru = isCyrillic(userText);
    const quoted = userText ? `“${userText}”` : ru ? 'пустое сообщение' : 'an empty message';

    if (ru) {
        return [
            `Я эмулятор ассистента UNA, не живая модель.`,
            `Ключ, модель и prompt по-прежнему будут жить в Studio → Agents.`,
            `Сейчас эндпоинт UNA ещё неизвестен, поэтому я отвечаю локально на ${quoted}`,
            `Когда появится AG-UI стрим с chat.php / api.php, этот же useChat переключится на него без смены UI.`,
        ].join(' ');
    }

    return [
        `I'm the UNA assistant emulator, not a live model.`,
        `API key, model, and prompt will stay in Studio → Agents.`,
        `The UNA endpoint is not wired yet, so I answer locally to ${quoted}.`,
        `When the AG-UI stream from chat.php / api.php lands, this same useChat hook will point at it.`,
    ].join(' ');
}

function tokenize(text) {
    return text.split(/(\s+)/).filter(Boolean);
}

function sleep(ms, signal) {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
            return;
        }
        const timer = setTimeout(resolve, ms);
        const onAbort = () => {
            clearTimeout(timer);
            reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
        };
        signal?.addEventListener('abort', onAbort, { once: true });
    });
}

function newId(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Async iterable of AG-UI StreamChunks. Used by the Next SSE route and by
 * the native `stream()` connection adapter.
 */
export async function* emulateUnaChatStream(messages, signal) {
    const threadId = 'pg-una-thread';
    const runId = newId('run');
    const messageId = newId('msg');
    const userText = lastUserText(messages);
    const reply = buildReply(userText);
    const tokens = tokenize(reply);

    yield { type: 'RUN_STARTED', threadId, runId, timestamp: Date.now() };
    yield { type: 'TEXT_MESSAGE_START', messageId, role: 'assistant', timestamp: Date.now() };

    for (const token of tokens) {
        if (signal?.aborted) {
            yield {
                type: 'RUN_ERROR',
                message: 'Aborted',
                code: 'ABORTED',
                metadata: { tanstack: { threadId, runId } },
            };
            return;
        }
        yield { type: 'TEXT_MESSAGE_CONTENT', messageId, delta: token, timestamp: Date.now() };
        try {
            await sleep(28, signal);
        } catch {
            yield {
                type: 'RUN_ERROR',
                message: 'Aborted',
                code: 'ABORTED',
                metadata: { tanstack: { threadId, runId } },
            };
            return;
        }
    }

    yield { type: 'TEXT_MESSAGE_END', messageId, timestamp: Date.now() };
    yield {
        type: 'RUN_FINISHED',
        threadId,
        runId,
        timestamp: Date.now(),
        usage: [{ inputTokens: 0, outputTokens: tokens.length, totalTokens: tokens.length }],
        metadata: {
            tanstack: {
                finishReason: 'stop',
                model: 'una-emulator',
            },
        },
    };
}

export const UNA_CHAT_EMULATOR = {
    assistantName: ASSISTANT_NAME,
    lastUserText,
};
