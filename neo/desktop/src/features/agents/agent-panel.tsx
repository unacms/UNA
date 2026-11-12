/**
 * An agent chat as a floating panel over the content, as Linear's agent chat: the chat's title,
 * a More menu (New Chat, Copy Conversation, Close Chat), Minimise (back to its tab in the bottom
 * bar, Esc too), Expand (the panel takes the content's whole container) and Close; the
 * conversation, the agent's words drawn as the app draws rich text (the site's HTML of its
 * Markdown, through RichText); and a reply box, the app's rich editor in its mini mode, that
 * Cmd+Enter (Ctrl+Enter) sends. The reply shows as it is written (the stream's deltas, plain
 * text until it ends and the site's HTML replaces it); Stop ends it. Every open chat keeps its
 * panel mounted (hidden but the shown one), so a reply goes on while its chat is minimised.
 */
import { useQueryClient } from '@tanstack/react-query';
import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

import { Icon } from '../../components/icon';
import { RichEditor, type RichEditorHandle } from '../../components/rich-editor/rich-editor';
import { RichText } from '../../components/rich-text';
import { VisuallyHidden } from '../../components/visually-hidden';
import { useWindowAnnounce } from '../../lib/announce';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { t } from '../../lib/i18n';
import { showMenu } from '../../lib/native-menu';
import { copyText } from '../../lib/native';
import { platform } from '../../lib/platform';
import { ToolbarButton } from '../../shell/pane';
import { agentPanelId, agentTabId, AGENT_BUTTON_ID } from './agent-dock';
import { type AgentChatsStore, agentChatKey, agentChatsKey, type AgentEvent, chatTitle, type OpenChat, openChatKey, startChat, streamReply, useAgentChat, useAgents, useOpenChats } from './agents';

/** The panels of the chats open in this window, the shown one visible (shell/layout.tsx `overlay`). */
export function AgentPanels() {
    const store = useOpenChats();
    if (!store?.open.length) return null;
    const shown = store.shown;
    return (
        <>
            {store.open.map((c) => (
                <ChatPanel key={openChatKey(c)} chat={c} store={store} shown={!!shown && openChatKey(shown) === openChatKey(c)} expanded={store.expanded} />
            ))}
        </>
    );
}

/** What the person sent last and what came back of it, until the chat as kept has it. */
type Turn = {
    user: string;
    reply: string;
    state: 'streaming' | 'stopped' | 'failed';
    error?: string;
};

function isModEnter(e: KeyboardEvent): boolean {
    return e.key === 'Enter' && (platform.mac ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey) && !e.altKey && !e.shiftKey;
}

function ChatPanel({ chat, store, shown, expanded }: { chat: OpenChat; store: AgentChatsStore; shown: boolean; expanded: boolean }) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const announce = useWindowAnnounce();
    const titleId = useId();
    const thread = useAgentChat(chat.agentId, chat.chatId);
    const agent = useAgents()?.items.find((a) => a.id === chat.agentId);
    const agentName = agent?.title ?? t('Agent');
    const editor = useRef<RichEditorHandle>(null);
    const log = useRef<HTMLDivElement>(null);
    const [draft, setDraft] = useState({ html: '', text: '' });
    const [turn, setTurn] = useState<Turn | null>(null);
    const [problem, setProblem] = useState<string | null>(null);
    const abort = useRef<AbortController | null>(null);
    const streaming = turn?.state === 'streaming';
    const title = chatTitle(thread.data?.chat.title || chat.title);

    // the tab follows the chat's title (the agent's, or the first thing written)
    const kept = thread.data?.chat.title;
    useEffect(() => {
        if (kept) store.rename(chat, kept);
    }, [kept, store, chat]);

    // shown: the reply box takes focus (opened from its tab, the Agent button or History)
    useEffect(() => {
        if (shown) requestAnimationFrame(() => editor.current?.focus('end'));
    }, [shown]);

    // a reply that goes on: the newest words stay in view unless the person scrolled up
    const pinned = useRef(true);
    const messages = thread.data?.messages ?? [];
    useLayoutEffect(() => {
        const el = log.current;
        if (el && pinned.current) el.scrollTop = el.scrollHeight;
    }, [messages.length, turn?.reply, turn?.state, shown]);

    // closed (or another network): a reply on its way stops
    useEffect(() => () => abort.current?.abort(), []);

    const minimize = () => {
        store.minimize();
        requestAnimationFrame(() => document.getElementById(agentTabId(chat))?.focus());
    };
    const close = () => {
        abort.current?.abort();
        store.close(chat);
        requestAnimationFrame(() => document.getElementById(AGENT_BUTTON_ID)?.focus());
    };

    const send = () => {
        const text = draft.text.trim();
        if (!text || streaming) return;
        setProblem(null);
        const controller = new AbortController();
        abort.current = controller;
        setTurn({ user: text, reply: '', state: 'streaming' });
        setDraft({ html: '', text: '' });
        let failed: string | null = null;
        streamReply(api, chat.agentId, chat.chatId, text, controller.signal, (e: AgentEvent) => {
            if (e.type === 'TEXT_MESSAGE_CONTENT' && e.delta) setTurn((now) => (now ? { ...now, reply: now.reply + e.delta } : now));
            else if (e.type === 'RUN_ERROR') failed = e.message || t('The agent could not answer');
        })
            .then(async () => {
                if (failed) {
                    setTurn((now) =>
                        now
                            ? {
                                  ...now,
                                  state: 'failed',
                                  error: failed ?? undefined,
                              }
                            : now,
                    );
                    announce(failed);
                    return;
                }
                // the chat as kept: the reply as the site's HTML, and its title
                await queryClient.refetchQueries(agentChatKey(chat.agentId, chat.chatId));
                void queryClient.invalidateQueries(agentChatsKey(chat.agentId));
                setTurn(null);
                announce(t('{{name}} replied', { name: agentName }));
            })
            .catch((e: unknown) => {
                if (controller.signal.aborted) {
                    setTurn((now) => (now ? { ...now, state: 'stopped' } : now));
                    announce(t('Stopped'));
                    return;
                }
                // refused before it started (a limit, too long): the words come back to the box
                setTurn(null);
                setDraft({
                    html: `<p>${text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] ?? c)}</p>`,
                    text,
                });
                setProblem(errorMessage(e));
            })
            .finally(() => {
                if (abort.current === controller) abort.current = null;
            });
    };

    const stop = () => abort.current?.abort();

    const more = (anchor: HTMLElement) => {
        void showMenu(
            [
                {
                    text: t('New Chat'),
                    run: () => {
                        startChat(api, chat.agentId)
                            .then((c) => {
                                store.show({
                                    agentId: chat.agentId,
                                    chatId: c.id,
                                    title: c.title,
                                });
                                void queryClient.invalidateQueries(agentChatsKey(chat.agentId));
                            })
                            .catch((e: unknown) => announce(t('Could not start a chat: {{reason}}', { reason: errorMessage(e) })));
                    },
                },
                {
                    text: t('Copy Conversation'),
                    enabled: messages.length > 0,
                    run: () => {
                        const transcript = messages.map((m) => `${m.role === 'user' ? t('You') : agentName}: ${m.text}`).join('\n\n');
                        void copyText(transcript).then(
                            () => announce(t('Conversation copied')),
                            (e: unknown) => announce(errorMessage(e)),
                        );
                    },
                },
                'separator',
                { text: t('Close Chat'), run: close },
            ],
            { anchor },
            { label: title },
        ).catch((e: unknown) => console.error('menu', e));
    };

    const onKeyDown = (e: ReactKeyboardEvent<HTMLElement>) => {
        if (e.key !== 'Escape' || e.defaultPrevented || document.querySelector('dialog[open]')) return;
        e.preventDefault();
        e.stopPropagation();
        minimize();
    };

    const sendKeys = platform.mac ? 'Meta+Enter' : 'Control+Enter';
    const empty = !thread.isLoading && !messages.length && !turn;

    return (
        <section id={agentPanelId(chat)} className="agent-panel" role="dialog" aria-modal="false" aria-labelledby={titleId} data-expanded={expanded || undefined} hidden={!shown} onKeyDown={onKeyDown}>
            <header className="agent-panel-head">
                <h2 id={titleId} className="agent-panel-title truncate">
                    {title}
                </h2>
                <button type="button" className="tb-btn" aria-label={t('More')} aria-haspopup="menu" onClick={(e) => more(e.currentTarget)}>
                    <Icon name="ellipsis" />
                </button>
                <span className="agent-panel-fill" />
                <ToolbarButton icon="minus" label={t('Minimise')} onClick={minimize} />
                <ToolbarButton icon={expanded ? 'minimize-2' : 'maximize-2'} label={expanded ? t('Make smaller') : t('Expand')} onClick={() => store.setExpanded(!expanded)} />
                <ToolbarButton icon="x" label={t('Close chat')} onClick={close} />
            </header>
            <div
                ref={log}
                className="agent-log"
                role="log"
                aria-label={t('Conversation with {{name}}', { name: agentName })}
                aria-busy={streaming || undefined}
                tabIndex={0}
                onScroll={(e) => {
                    const el = e.currentTarget;
                    pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
                }}
            >
                {thread.isLoading ? <p className="agent-note muted">{t('Loading…')}</p> : null}
                {thread.isError ? (
                    <p className="agent-note error" role="alert">
                        {t('This chat can’t be opened. {{reason}}', { reason: errorMessage(thread.error) })}
                    </p>
                ) : null}
                {empty ? (
                    <div className="agent-empty">
                        <Icon name="bot" size={32} />
                        <p>{agent?.description ? t('Ask {{name}} anything: {{description}}', { name: agentName, description: agent.description }) : t('Ask {{name}} anything.', { name: agentName })}</p>
                    </div>
                ) : null}
                <ol className="agent-messages">
                    {messages.map((m) => (
                        <li key={m.id} className={m.role === 'user' ? 'agent-msg agent-msg-user' : 'agent-msg agent-msg-agent'}>
                            <VisuallyHidden>{m.role === 'user' ? t('You:') : `${agentName}:`}</VisuallyHidden>
                            <RichText html={m.html} className="agent-msg-text" />
                        </li>
                    ))}
                    {turn ? (
                        <>
                            <li className="agent-msg agent-msg-user">
                                <VisuallyHidden>{t('You:')}</VisuallyHidden>
                                <p className="agent-msg-text agent-msg-plain">{turn.user}</p>
                            </li>
                            <li className="agent-msg agent-msg-agent" data-state={turn.state}>
                                <VisuallyHidden>{`${agentName}:`}</VisuallyHidden>
                                {turn.reply ? (
                                    <p className="agent-msg-text agent-msg-plain">{turn.reply}</p>
                                ) : turn.state === 'streaming' ? (
                                    <p className="agent-thinking muted">{t('{{name}} is writing…', { name: agentName })}</p>
                                ) : null}
                                {turn.state === 'stopped' ? <p className="agent-note muted">{t('Stopped')}</p> : null}
                                {turn.state === 'failed' ? (
                                    <p className="agent-note error" role="alert">
                                        {turn.error}
                                    </p>
                                ) : null}
                            </li>
                        </>
                    ) : null}
                </ol>
            </div>
            <div className="agent-composer">
                {problem ? (
                    <p className="agent-note error" role="alert">
                        {problem}
                    </p>
                ) : null}
                {/* drawn once the agent is known: the editor takes its name as it starts */}
                {agent ? (
                    <RichEditor
                        ref={editor}
                        mode="mini"
                        value={draft.html}
                        rows={2}
                        label={t('Message to {{name}}', { name: agentName })}
                        placeholder={t('Reply…')}
                        mentions={false}
                        hashtags={false}
                        onChange={(html, text) => setDraft({ html, text })}
                        onKeyDown={(e) => {
                            if (!isModEnter(e)) return false;
                            send();
                            return true;
                        }}
                    />
                ) : null}
                <div className="agent-composer-actions">
                    {streaming ? (
                        <button type="button" className="agent-send" aria-label={t('Stop')} onClick={stop}>
                            <Icon name="square" size={14} />
                        </button>
                    ) : (
                        <button type="button" className="agent-send" aria-label={t('Send')} aria-keyshortcuts={sendKeys} aria-disabled={!draft.text.trim() || undefined} onClick={send}>
                            <Icon name="arrow-up" size={16} />
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
}
