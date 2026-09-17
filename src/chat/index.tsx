import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { fetchServerSentEvents, useChat, type UIMessage } from '@tanstack/ai-react';
import Markdown, { type Components } from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

export interface ChatOptions {
    agentId: number | string;
    endpoint?: string;
    placeholder?: string;
    credentials?: RequestCredentials;
    formatting?: boolean;
    initialMessages?: UIMessage[];
    threadId?: string;
}

type ChatActionReply = {
    type: 'reply';
    label: string;
};

type ChatActionLink = {
    type: 'link';
    label: string;
    url: string;
};

type ChatAction = ChatActionReply | ChatActionLink;

declare const sUrlRoot: string | undefined;

const CLASSES = {
    root: 'bx-ai-chat flex flex-col gap-3 h-full min-h-72 text-gray-800 dark:text-gray-200',
    messages: 'bx-ai-chat-messages flex flex-1 flex-col gap-2 overflow-y-auto p-3 md:p-4 rounded-2xl ring-1 ring-gray-300/50 dark:ring-gray-600/50 bg-gray-50/80 dark:bg-gray-900/50',
    form: 'bx-ai-chat-form flex items-center gap-2',
    inputWrapper: 'bx-form-input-wrapper bx-form-input-wrapper-text flex-1 min-w-0',
    input: 'bx-ai-chat-input bx-def-font-inputs bx-form-input-text',
    send: 'bx-ai-chat-send bx-btn bx-btn-primary shrink-0',
    messageUser: 'bx-ai-chat-message bx-ai-chat-message-user flex justify-end',
    messageAssistant: 'bx-ai-chat-message bx-ai-chat-message-assistant flex justify-start',
    bubbleUser: 'bx-ai-chat-message-inner max-w-[85%] px-3 py-2 rounded-2xl rounded-br-md text-sm leading-relaxed break-words whitespace-pre-wrap bg-blue-600 text-white dark:bg-blue-500',
    bubbleAssistant: 'bx-ai-chat-message-inner max-w-[85%] px-3 py-2 rounded-2xl rounded-bl-md text-sm leading-relaxed break-words whitespace-pre-wrap bg-white text-gray-800 ring-1 ring-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600',
    markdown: 'bx-ai-chat-markdown bx-def-vanilla-html bx-def-vh-sm max-w-none whitespace-normal',
    actions: 'bx-ai-chat-actions flex flex-wrap gap-1.5 mt-2',
    action: 'bx-ai-chat-action bx-btn bx-btn-small',
    actionLink: 'bx-ai-chat-action bx-btn bx-btn-small underline',
    error: 'bx-ai-chat-error text-sm text-red-600 dark:text-red-400 px-1',
};

function isSafeHref(href: string | undefined): href is string
{
    if (!href)
        return false;

    try {
        const url = new URL(href, window.location.href);
        return url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'mailto:';
    }
    catch {
        return false;
    }
}

const markdownComponents: Components = {
    a({ href, children, ...props }) {
        return (
            <a
                {...props}
                href={isSafeHref(href) ? href : undefined}
                target="_blank"
                rel="noopener noreferrer"
            >
                {children}
            </a>
        );
    },
};

function MarkdownContent({ text }: { text: string })
{
    return (
        <div className={CLASSES.markdown}>
            <Markdown remarkPlugins={[remarkGfm, remarkBreaks]} components={markdownComponents}>
                {text}
            </Markdown>
        </div>
    );
}

function getMessageText(message: UIMessage): string
{
    if (!message.parts || !message.parts.length)
        return '';

    return message.parts
        .filter((part) => part.type === 'text')
        .map((part) => part.content)
        .join('');
}

function isAllowedChatActionUrl(url: string): boolean
{
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:';
    }
    catch {
        return false;
    }
}

function sanitizeChatActions(raw: unknown): ChatAction[]
{
    if (!Array.isArray(raw))
        return [];

    const out: ChatAction[] = [];
    for (const item of raw) {
        if (!item || typeof item !== 'object')
            continue;

        const type = String((item as { type?: unknown }).type ?? '').toLowerCase().trim();
        const label = String((item as { label?: unknown }).label ?? '').trim().slice(0, 80);
        if (!label)
            continue;

        if (type === 'reply') {
            out.push({ type: 'reply', label });
        }
        else if (type === 'link') {
            const url = String((item as { url?: unknown }).url ?? '').trim();
            if (!isAllowedChatActionUrl(url))
                continue;
            out.push({ type: 'link', label, url });
        }

        if (out.length >= 8)
            break;
    }

    return out;
}

function getMessageActions(message: UIMessage, streamed?: ChatAction[]): ChatAction[]
{
    const extra = message as UIMessage & { actions?: unknown };
    const fromMessage = sanitizeChatActions(extra.actions ?? extra.metadata?.actions);
    if (fromMessage.length)
        return fromMessage;

    return streamed && streamed.length ? streamed : [];
}

function parseChatActionsEvent(data: unknown): { messageId: string; actions: ChatAction[] } | null
{
    if (Array.isArray(data)) {
        const actions = sanitizeChatActions(data);
        return actions.length ? { messageId: '', actions } : null;
    }

    if (!data || typeof data !== 'object')
        return null;

    const payload = data as { messageId?: unknown; actions?: unknown };
    const actions = sanitizeChatActions(payload.actions ?? data);
    if (!actions.length)
        return null;

    return {
        messageId: typeof payload.messageId === 'string' ? payload.messageId : '',
        actions,
    };
}

function getChatEndpoint(agentId: number | string, endpoint?: string): string
{
    if (endpoint)
        return endpoint;

    const root = typeof sUrlRoot !== 'undefined' ? sUrlRoot : '/';

    return `${root}sys-ai-chat/${agentId}`;
}

function getChatThreadId(agentId: number | string, threadId?: string): string
{
    return threadId || `agent:${agentId}`;
}

function MessageActions({
    actions,
    disabled,
    onReply,
}: {
    actions: ChatAction[];
    disabled: boolean;
    onReply: (label: string) => void;
})
{
    if (!actions.length)
        return null;

    return (
        <div className={CLASSES.actions}>
            {actions.map((action, index) => {
                if (action.type === 'link') {
                    return (
                        <a
                            key={`${action.type}-${index}-${action.label}`}
                            className={CLASSES.actionLink}
                            href={action.url}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {action.label}
                        </a>
                    );
                }

                return (
                    <button
                        key={`${action.type}-${index}-${action.label}`}
                        type="button"
                        className={`${CLASSES.action}${disabled ? ' bx-btn-disabled opacity-70' : ''}`}
                        disabled={disabled}
                        onClick={() => onReply(action.label)}
                    >
                        {action.label}
                    </button>
                );
            })}
        </div>
    );
}

function ChatView({
    agentId,
    endpoint,
    placeholder = 'Type a message…',
    credentials = 'same-origin',
    formatting = false,
    initialMessages,
    threadId,
}: ChatOptions)
{
    const [input, setInput] = useState('');
    const [streamedActions, setStreamedActions] = useState<Record<string, ChatAction[]>>({});
    const messagesRef = useRef<HTMLDivElement>(null);
    const messagesSnapshotRef = useRef<UIMessage[]>([]);
    const chatThreadId = getChatThreadId(agentId, threadId);

    const connection = useMemo(
        () => fetchServerSentEvents(getChatEndpoint(agentId, endpoint), { credentials }),
        [agentId, endpoint, credentials],
    );

    const { messages, sendMessage, isLoading, error } = useChat({
        connection,
        persistence: true,
        threadId: chatThreadId,
        initialMessages: initialMessages ?? [],
        onCustomEvent: (eventType, data) => {
            if (eventType !== 'chat_actions')
                return;

            const parsed = parseChatActionsEvent(data);
            if (!parsed)
                return;

            const messageId = parsed.messageId || [...messagesSnapshotRef.current]
                .reverse()
                .find((message) => message.role === 'assistant')
                ?.id;
            if (!messageId)
                return;

            setStreamedActions((current) => ({ ...current, [messageId]: parsed.actions }));
        },
    });

    messagesSnapshotRef.current = messages;

    useEffect(() => {
        const list = messagesRef.current;
        if (list)
            list.scrollTop = list.scrollHeight;
    }, [messages, streamedActions, error]);

    function handleSubmit(event: FormEvent<HTMLFormElement>)
    {
        event.preventDefault();

        const text = input.trim();
        if (!text || isLoading)
            return;

        setInput('');
        void sendMessage(text);
    }

    function handleReply(label: string)
    {
        const text = label.trim();
        if (!text || isLoading)
            return;

        void sendMessage(text);
    }

    return (
        <div className={`${CLASSES.root}${isLoading ? ' bx-ai-chat-loading' : ''}`}>
            <div ref={messagesRef} className={CLASSES.messages}>
                {messages.map((message) => {
                    const isUser = message.role === 'user';
                    const text = getMessageText(message);
                    const actions = isUser ? [] : getMessageActions(message, streamedActions[message.id]);

                    return (
                        <div
                            key={message.id}
                            className={isUser ? CLASSES.messageUser : CLASSES.messageAssistant}
                        >
                            <div className={isUser ? CLASSES.bubbleUser : CLASSES.bubbleAssistant}>
                                {formatting && !isUser && text
                                    ? <MarkdownContent text={text} />
                                    : (text || '\u00a0')}
                                {!isUser
                                    ? (
                                        <MessageActions
                                            actions={actions}
                                            disabled={isLoading}
                                            onReply={handleReply}
                                        />
                                    )
                                    : null}
                            </div>
                        </div>
                    );
                })}
                {error ? <div className={CLASSES.error}>{error.message}</div> : null}
            </div>
            <form className={CLASSES.form} onSubmit={handleSubmit}>
                <div className={CLASSES.inputWrapper}>
                    <input
                        type="text"
                        className={CLASSES.input}
                        placeholder={placeholder}
                        autoComplete="off"
                        disabled={isLoading}
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                    />
                </div>
                <button
                    type="submit"
                    className={`${CLASSES.send}${isLoading ? ' bx-btn-disabled opacity-70 cursor-wait' : ''}`}
                    disabled={isLoading}
                >
                    Send
                </button>
            </form>
        </div>
    );
}

export class Chat
{
    protected _oContainer: HTMLElement;
    protected _oRoot: Root | null = null;
    protected _oOptions: ChatOptions;

    constructor(container: HTMLElement | string, options: ChatOptions)
    {
        const el = typeof container === 'string'
            ? document.querySelector<HTMLElement>(container)
            : container;

        if (!el)
            throw new Error('Chat: container not found');

        this._oContainer = el;
        this._oOptions = options;
        this._oContainer.classList.add('bx-ai-chat-root');
    }

    attach(): void
    {
        if (this._oRoot)
            return;

        this._oRoot = createRoot(this._oContainer);
        this._oRoot.render(<ChatView {...this._oOptions} />);
    }

    detach(): void
    {
        if (!this._oRoot)
            return;

        this._oRoot.unmount();
        this._oRoot = null;
    }

    destroy(): void
    {
        this.detach();
        this._oContainer.classList.remove('bx-ai-chat-root', 'bx-ai-chat-loading');
    }

    static init(container: HTMLElement | string, options: ChatOptions): Chat
    {
        const chat = new Chat(container, options);
        chat.attach();
        return chat;
    }
}
