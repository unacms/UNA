import {
    ChatClient,
    fetchServerSentEvents,
    type UIMessage,
} from '@tanstack/ai-client';

export interface ChatOptions {
    agentId: number | string;
    endpoint?: string;
    placeholder?: string;
    credentials?: RequestCredentials;
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
    bubbleUser: 'bx-ai-chat-message-inner max-w-[85%] px-3 py-2 rounded-2xl rounded-br-md text-sm leading-relaxed break-words bg-blue-600 text-white dark:bg-blue-500',
    bubbleAssistant: 'bx-ai-chat-message-inner max-w-[85%] px-3 py-2 rounded-2xl rounded-bl-md text-sm leading-relaxed break-words bg-white text-gray-800 ring-1 ring-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600',
    error: 'bx-ai-chat-error text-sm text-red-600 dark:text-red-400 px-1',
};

function escapeHtml(text: string)
{
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
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

function renderMessages(container: HTMLElement, messages: UIMessage[]): void
{
    const list = container.querySelector('.bx-ai-chat-messages');
    if (!list)
        return;

    list.innerHTML = messages.map((message) => {
        const role = message.role === 'user' ? 'user' : 'assistant';
        const text = escapeHtml(getMessageText(message)).replace(/\n/g, '<br>');

        const rowClass = role === 'user' ? CLASSES.messageUser : CLASSES.messageAssistant;
        const bubbleClass = role === 'user' ? CLASSES.bubbleUser : CLASSES.bubbleAssistant;

        return `<div class="${rowClass}"><div class="${bubbleClass}">${text || '&nbsp;'}</div></div>`;
    }).join('');

    list.scrollTop = list.scrollHeight;
}

function setLoading(container: HTMLElement, isLoading: boolean): void
{
    const input = container.querySelector<HTMLInputElement>('.bx-ai-chat-input');
    const button = container.querySelector<HTMLButtonElement>('.bx-ai-chat-send');

    if (input)
        input.disabled = isLoading;

    if (button) {
        button.disabled = isLoading;
        button.classList.toggle('bx-btn-disabled', isLoading);
        button.classList.toggle('opacity-70', isLoading);
        button.classList.toggle('cursor-wait', isLoading);
    }

    container.classList.toggle('bx-ai-chat-loading', isLoading);
}

function buildMarkup(placeholder: string): string
{
    return `
<div class="${CLASSES.root}">
    <div class="${CLASSES.messages}"></div>
    <form class="${CLASSES.form}">
        <div class="${CLASSES.inputWrapper}">
            <input type="text" class="${CLASSES.input}" placeholder="${escapeHtml(placeholder)}" autocomplete="off" />
        </div>
        <button type="submit" class="${CLASSES.send}">Send</button>
    </form>
</div>`;
}

function getChatEndpoint(agentId: number | string, endpoint?: string): string
{
    if (endpoint)
        return endpoint;

    const root = typeof sUrlRoot !== 'undefined' ? sUrlRoot : '/';

    return `${root}sys-ai-chat/${agentId}`;
}

export class Chat
{
    protected _oContainer: HTMLElement;
    protected _oClient: ChatClient;
    protected _bAttached = false;

    constructor(container: HTMLElement | string, options: ChatOptions)
    {
        const el = typeof container === 'string'
            ? document.querySelector<HTMLElement>(container)
            : container;

        if (!el)
            throw new Error('Chat: container not found');

        this._oContainer = el;
        this._oContainer.innerHTML = buildMarkup(options.placeholder || 'Type a message…');
        this._oContainer.classList.add('bx-ai-chat-root');

        const sEndpoint = getChatEndpoint(options.agentId, options.endpoint);

        this._oClient = new ChatClient({
            connection: fetchServerSentEvents(sEndpoint, {
                credentials: options.credentials || 'same-origin',
            }),
            onMessagesChange: (messages) => renderMessages(this._oContainer, messages),
            onLoadingChange: (isLoading) => setLoading(this._oContainer, isLoading),
            onErrorChange: (error) => {
                if (!error)
                    return;

                const list = this._oContainer.querySelector('.bx-ai-chat-messages');
                if (!list)
                    return;

                const note = document.createElement('div');
                note.className = CLASSES.error;
                note.textContent = error.message;
                list.appendChild(note);
                list.scrollTop = list.scrollHeight;
            },
        });

        const form = this._oContainer.querySelector<HTMLFormElement>('.bx-ai-chat-form');
        const input = this._oContainer.querySelector<HTMLInputElement>('.bx-ai-chat-input');

        form?.addEventListener('submit', (event) => {
            event.preventDefault();

            if (!input)
                return;

            const text = input.value.trim();
            if (!text)
                return;

            input.value = '';
            void this._oClient.sendMessage(text);
        });
    }

    attach(): void
    {
        if (this._bAttached)
            return;

        this._oClient.attach();
        this._bAttached = true;
    }

    detach(): void
    {
        if (!this._bAttached)
            return;

        this._oClient.detach();
        this._bAttached = false;
    }

    destroy(): void
    {
        this.detach();
        this._oContainer.innerHTML = '';
        this._oContainer.classList.remove('bx-ai-chat-root', 'bx-ai-chat-loading');
    }

    static init(container: HTMLElement | string, options: ChatOptions): Chat
    {
        const chat = new Chat(container, options);
        chat.attach();
        return chat;
    }
}
