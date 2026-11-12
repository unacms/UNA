/**
 * The network's AI agents and the viewer's chats with them (API v2 `agents`: GET /agents, the
 * chats, a turn whose reply streams as Server-Sent Events), and the chats open in this window:
 * each a tab in the bottom bar, one of them shown as a floating panel over the content
 * (agent-dock.tsx, agent-panel.tsx). The open chats are kept per network on this computer.
 */
import { useQuery } from '@tanstack/react-query';
import { createContext, useContext, useSyncExternalStore } from 'react';

import type { Schema, UnaApi } from 'una-api';

import { ApiError, unwrap } from '../../lib/api';
import { useApp } from '../../lib/context';
import { t } from '../../lib/i18n';

export type Agent = Schema<'Agent'>;
export type AgentList = Schema<'AgentList'>;
export type AgentChat = Schema<'AgentChat'>;
export type AgentChatThread = Schema<'AgentChatThread'>;
export type AgentMessage = Schema<'AgentMessage'>;

export const AGENTS_KEY = ['agents'] as const;
export const agentChatsKey = (agentId: string) => ['agent-chats', agentId] as const;
export const agentChatKey = (agentId: string, chatId: string) => ['agent-chat', agentId, chatId] as const;

/**
 * The agents the viewer may chat with: undefined while loading, null on a site without them
 * (no route, or the API refused), else the list with its default.
 */
export function useAgents(): AgentList | null | undefined {
    const { api } = useApp();
    const query = useQuery({
        queryKey: AGENTS_KEY,
        queryFn: async (): Promise<AgentList | null> => {
            try {
                return unwrap(await api.GET('/agents'));
            } catch (e) {
                // an older site: no such route
                if (e instanceof ApiError && (e.status === 404 || e.status === 403)) return null;
                throw e;
            }
        },
        staleTime: 10 * 60_000,
    });
    return query.isError ? null : query.data;
}

/** The agent a new chat goes to, or null: then there is no agent chat in this window. */
export function defaultAgent(list: AgentList | null | undefined): Agent | null {
    if (!list?.default_id) return null;
    return list.items.find((a) => a.id === list.default_id) ?? null;
}

export function useAgentChats(agentId: string | null) {
    const { api } = useApp();
    return useQuery({
        queryKey: agentChatsKey(agentId ?? ''),
        queryFn: async () =>
            unwrap(
                await api.GET('/agents/{id}/chats', {
                    params: { path: { id: agentId ?? '' } },
                }),
            ).items,
        enabled: !!agentId,
        staleTime: 30_000,
    });
}

export function useAgentChat(agentId: string, chatId: string) {
    const { api } = useApp();
    return useQuery({
        queryKey: agentChatKey(agentId, chatId),
        queryFn: async () =>
            unwrap(
                await api.GET('/agents/{id}/chats/{chat}', {
                    params: { path: { id: agentId, chat: chatId } },
                }),
            ),
        staleTime: 30_000,
        retry: false,
    });
}

export async function startChat(api: UnaApi, agentId: string): Promise<AgentChat> {
    return unwrap(
        await api.POST('/agents/{id}/chats', {
            params: { path: { id: agentId } },
        }),
    );
}

/** An event of the agent's run (AG-UI), as the stream carries it. */
export type AgentEvent = {
    type: string;
    delta?: string;
    message?: string;
    messageId?: string;
    name?: string;
    value?: Record<string, unknown>;
};

/**
 * The events in what the stream has given so far, and what is left of a frame not ended yet.
 * Frames end with a blank line; a frame's `data:` lines are its JSON (other fields are left out).
 */
export function parseSse(buffer: string): {
    events: AgentEvent[];
    rest: string;
} {
    const events: AgentEvent[] = [];
    const frames = buffer.replace(/\r\n/g, '\n').split('\n\n');
    const rest = frames.pop() ?? '';
    for (const frame of frames) {
        const data = frame
            .split('\n')
            .filter((l) => l.startsWith('data:'))
            .map((l) => l.slice(5).replace(/^ /, ''))
            .join('\n');
        if (!data || data === '[DONE]') continue;
        try {
            const e = JSON.parse(data) as AgentEvent;
            if (e && typeof e.type === 'string') events.push(e);
        } catch {
            // a frame of something else: skipped
        }
    }
    return { events, rest };
}

/**
 * Send a message and read the reply as it comes: each event to `onEvent`, in order. Resolves
 * when the stream ends; an abort (Stop) rejects with an AbortError. A refusal (422, 403) throws
 * the API's error.
 */
export async function streamReply(api: UnaApi, agentId: string, chatId: string, text: string, signal: AbortSignal, onEvent: (e: AgentEvent) => void): Promise<void> {
    const result = await api.POST('/agents/{id}/chats/{chat}/messages', {
        params: { path: { id: agentId, chat: chatId } },
        body: { text },
        parseAs: 'stream',
        signal,
    });
    if (result.error !== undefined || !result.response.ok || !result.data) unwrap(result as { data?: unknown; error?: unknown; response: Response });
    const reader = (result.data as ReadableStream<Uint8Array>).getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parsed = parseSse(buffer);
        buffer = parsed.rest;
        parsed.events.forEach(onEvent);
    }
    const last = parseSse(buffer + decoder.decode() + '\n\n');
    last.events.forEach(onEvent);
}

/** A chat open in this window: a tab in the bottom bar. */
export type OpenChat = { agentId: string; chatId: string; title: string };

export const openChatKey = (c: Pick<OpenChat, 'agentId' | 'chatId'>) => `${c.agentId}/${c.chatId}`;

type Kept = { v: 1; chats: OpenChat[]; shown: string | null; expanded: boolean };

/** What is kept per network, under this key. */
export function agentChatsStorageKey(sessionKey: string): string {
    return `una-desktop-agent-chats:${sessionKey}`;
}

/** At most this many chats are open; opening one more closes the oldest. */
export const OPEN_CHATS_MAX = 8;

/**
 * The chats open in this window, the one shown in the panel (null: all minimised to their
 * tabs) and whether the panel is wide. Kept per network in localStorage.
 */
export class AgentChatsStore {
    private chats: OpenChat[] = [];
    private shownKey: string | null = null;
    private wide = false;
    private version = 0;
    private listeners = new Set<() => void>();

    constructor(
        private readonly key: string | null = null,
        private readonly store: Pick<Storage, 'getItem' | 'setItem'> | null = typeof localStorage === 'undefined' ? null : localStorage,
    ) {
        try {
            const kept = this.key && this.store ? (JSON.parse(this.store.getItem(this.key) ?? 'null') as Kept | null) : null;
            if (kept?.v === 1 && Array.isArray(kept.chats)) {
                this.chats = kept.chats.filter((c) => typeof c?.agentId === 'string' && typeof c.chatId === 'string').slice(0, OPEN_CHATS_MAX);
                this.shownKey = this.chats.some((c) => openChatKey(c) === kept.shown) ? kept.shown : null;
                this.wide = !!kept.expanded;
            }
        } catch {
            // none kept
        }
    }

    get snapshot(): number {
        return this.version;
    }

    get open(): readonly OpenChat[] {
        return this.chats;
    }

    get shown(): OpenChat | null {
        return this.chats.find((c) => openChatKey(c) === this.shownKey) ?? null;
    }

    get expanded(): boolean {
        return this.wide;
    }

    subscribe(l: () => void): () => void {
        this.listeners.add(l);
        return () => this.listeners.delete(l);
    }

    /** Open a chat (or bring one open forward) and show it. */
    show(chat: OpenChat): void {
        const key = openChatKey(chat);
        if (!this.chats.some((c) => openChatKey(c) === key)) this.chats = [...this.chats, chat].slice(-OPEN_CHATS_MAX);
        this.shownKey = key;
        this.changed();
    }

    /** Back to its tab (the panel goes). */
    minimize(): void {
        if (this.shownKey === null) return;
        this.shownKey = null;
        this.changed();
    }

    /** Shown, or back to its tab when it is shown: what a click on its tab does. */
    toggle(chat: OpenChat): void {
        if (this.shownKey === openChatKey(chat)) this.minimize();
        else this.show(chat);
    }

    close(chat: Pick<OpenChat, 'agentId' | 'chatId'>): void {
        const key = openChatKey(chat);
        this.chats = this.chats.filter((c) => openChatKey(c) !== key);
        if (this.shownKey === key) this.shownKey = null;
        this.changed();
    }

    rename(chat: Pick<OpenChat, 'agentId' | 'chatId'>, title: string): void {
        const key = openChatKey(chat);
        const c = this.chats.find((x) => openChatKey(x) === key);
        if (!c || c.title === title) return;
        this.chats = this.chats.map((x) => (openChatKey(x) === key ? { ...x, title } : x));
        this.changed();
    }

    setExpanded(wide: boolean): void {
        if (this.wide === wide) return;
        this.wide = wide;
        this.changed();
    }

    private changed(): void {
        this.version += 1;
        if (this.key && this.store) {
            try {
                this.store.setItem(
                    this.key,
                    JSON.stringify({
                        v: 1,
                        chats: this.chats,
                        shown: this.shownKey,
                        expanded: this.wide,
                    } satisfies Kept),
                );
            } catch {
                // it lasts until the app quits
            }
        }
        for (const l of this.listeners) l();
    }
}

export const AgentChatsContext = createContext<AgentChatsStore | null>(null);

/** The window's open chats, following their changes (null outside a shell that has them). */
export function useOpenChats(): AgentChatsStore | null {
    const store = useContext(AgentChatsContext);
    useSyncExternalStore(
        (l) => store?.subscribe(l) ?? (() => {}),
        () => store?.snapshot ?? 0,
    );
    return store;
}

/** A chat's name in its tab and panel. */
export function chatTitle(title: string): string {
    return title.trim() || t('New chat');
}
