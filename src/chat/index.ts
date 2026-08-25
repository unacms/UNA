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

const CHAT_STYLES = `
.bx-ai-chat-root .bx-ai-chat{display:flex;flex-direction:column;gap:.75rem;height:100%;min-height:18rem}
.bx-ai-chat-root .bx-ai-chat-messages{flex:1 1 auto;overflow-y:auto;display:flex;flex-direction:column;gap:.5rem;padding:.75rem;border:1px solid rgba(0,0,0,.08);border-radius:.5rem;background:rgba(255,255,255,.6)}
.bx-ai-chat-root .bx-ai-chat-message{display:flex}
.bx-ai-chat-root .bx-ai-chat-message-user{justify-content:flex-end}
.bx-ai-chat-root .bx-ai-chat-message-assistant{justify-content:flex-start}
.bx-ai-chat-root .bx-ai-chat-message-inner{max-width:85%;padding:.5rem .75rem;border-radius:.75rem;line-height:1.4;word-break:break-word}
.bx-ai-chat-root .bx-ai-chat-message-user .bx-ai-chat-message-inner{background:#2563eb;color:#fff}
.bx-ai-chat-root .bx-ai-chat-message-assistant .bx-ai-chat-message-inner{background:#f3f4f6;color:#111827}
.bx-ai-chat-root .bx-ai-chat-form{display:flex;gap:.5rem}
.bx-ai-chat-root .bx-ai-chat-input{flex:1 1 auto}
.bx-ai-chat-root .bx-ai-chat-error{color:#b91c1c;font-size:.875rem}
.bx-ai-chat-root.bx-ai-chat-loading .bx-ai-chat-send{opacity:.7}`;

let stylesInjected = false;

function injectStyles()
{
    if (stylesInjected || typeof document === 'undefined')
        return;

    const style = document.createElement('style');
    style.setAttribute('data-bx-ai-chat', '1');
    style.textContent = CHAT_STYLES;
    document.head.appendChild(style);
    stylesInjected = true;
}

function escapeHtml(text)
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

        return `<div class="bx-ai-chat-message bx-ai-chat-message-${role}"><div class="bx-ai-chat-message-inner">${text || '&nbsp;'}</div></div>`;
    }).join('');

    list.scrollTop = list.scrollHeight;
}

function setLoading(container: HTMLElement, isLoading: boolean): void
{
    const input = container.querySelector('.bx-ai-chat-input');
    const button = container.querySelector('.bx-ai-chat-send');

    if (input)
        input.disabled = isLoading;

    if (button)
        button.disabled = isLoading;

    container.classList.toggle('bx-ai-chat-loading', isLoading);
}

function buildMarkup(placeholder: string): string
{
    return `
<div class="bx-ai-chat">
    <div class="bx-ai-chat-messages"></div>
    <form class="bx-ai-chat-form">
        <input type="text" class="bx-ai-chat-input bx-form-input" placeholder="${escapeHtml(placeholder)}" autocomplete="off" />
        <button type="submit" class="bx-ai-chat-send bx-btn">Send</button>
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

        injectStyles();

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
                note.className = 'bx-ai-chat-error';
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
