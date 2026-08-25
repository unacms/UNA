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
}

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

function getChatEndpoint(agentId: number | string, endpoint?: string): string
{
    if (endpoint)
        return endpoint;

    const root = typeof sUrlRoot !== 'undefined' ? sUrlRoot : '/';

    return `${root}sys-ai-chat/${agentId}`;
}

function ChatView({
    agentId,
    endpoint,
    placeholder = 'Type a message…',
    credentials = 'same-origin',
    formatting = false,
}: ChatOptions)
{
    const [input, setInput] = useState('');
    const messagesRef = useRef<HTMLDivElement>(null);

    const connection = useMemo(
        () => fetchServerSentEvents(getChatEndpoint(agentId, endpoint), { credentials }),
        [agentId, endpoint, credentials],
    );

    const { messages, sendMessage, isLoading, error } = useChat({ connection });

    useEffect(() => {
        const list = messagesRef.current;
        if (list)
            list.scrollTop = list.scrollHeight;
    }, [messages, error]);

    function handleSubmit(event: FormEvent<HTMLFormElement>)
    {
        event.preventDefault();

        const text = input.trim();
        if (!text || isLoading)
            return;

        setInput('');
        void sendMessage(text);
    }

    return (
        <div className={`${CLASSES.root}${isLoading ? ' bx-ai-chat-loading' : ''}`}>
            <div ref={messagesRef} className={CLASSES.messages}>
                {messages.map((message) => {
                    const isUser = message.role === 'user';
                    const text = getMessageText(message);

                    return (
                        <div
                            key={message.id}
                            className={isUser ? CLASSES.messageUser : CLASSES.messageAssistant}
                        >
                            <div className={isUser ? CLASSES.bubbleUser : CLASSES.bubbleAssistant}>
                                {formatting && !isUser && text
                                    ? <MarkdownContent text={text} />
                                    : (text || '\u00a0')}
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
