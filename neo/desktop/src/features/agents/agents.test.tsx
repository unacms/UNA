import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useEffect, useRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { createUnaApi, type Schema, type UnaApi } from 'una-api';

import { setRichText } from '../../components/rich-editor/test-utils';
import { listenForCommands } from '../../lib/command-bus';
import { AppContext, type AppContextValue } from '../../lib/context';
import { TabsProvider } from '../../lib/navigation';
import { sectionRoute } from '../../lib/router';
import { TabsModel } from '../../lib/tabs';
import { type CommandHandler, Shell } from '../../shell/shell';
import { AgentChatsStore, agentChatsStorageKey, parseSse } from './agents';

const SITE = 'https://community.example';
const lily: Schema<'Profile'> = { id: '4', kind: 'person', module: 'bx_persons', display_name: 'Lily', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const me = { account: { id: '3', email: 'lily@example.com' }, active_profile_id: '4', profiles: [lily] } as unknown as Schema<'Me'>;

const AGENTS: Schema<'AgentList'> = {
    items: [{ id: '3', name: 'helper', title: 'Helper', description: 'Answers questions about this network', icon: null, operator: true, default: true, max_input_chars: 8000 }],
    default_id: '3',
};
const chat = (id: string, title = ''): Schema<'AgentChat'> => ({ id, title, preview: '', status: 'open', closed_reason: null, messages_count: 0, created_at: null, updated_at: null });

type Handler = (request: Request) => Response | Promise<Response>;
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' } });

/** A site whose routes the test answers; others never answer. */
function api(routes: Record<string, Handler>): UnaApi {
    return createUnaApi({
        siteUrl: SITE,
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            const request = input instanceof Request ? input : new Request(input, init);
            const path = new URL(request.url).pathname.replace(/^\/api\/v2/, '');
            const handler = routes[`${request.method} ${path}`];
            return handler ? handler(request) : new Promise<Response>(() => {});
        },
    });
}

/** A stream of SSE frames the test writes as it goes. */
function sse(signal?: AbortSignal | null) {
    let push: (s: string) => void = () => {};
    let end: () => void = () => {};
    const body = new ReadableStream<Uint8Array>({
        start(controller) {
            const enc = new TextEncoder();
            push = (s) => controller.enqueue(enc.encode(s));
            end = () => controller.close();
            signal?.addEventListener('abort', () => controller.error(new DOMException('Aborted', 'AbortError')));
        },
    });
    return { response: new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } }), push: (e: object) => push(`data: ${JSON.stringify(e)}\n\n`), end: () => end() };
}

function renderShell(routes: Record<string, Handler>) {
    function Harness() {
        const commands = useRef<CommandHandler | null>(null);
        useEffect(() => listenForCommands((id) => commands.current?.(id), { mac: false, nativeMenu: false }), []);
        const ctx: AppContextValue = { api: api(routes), siteUrl: SITE, me, signOut: () => {}, signingOut: false, messageTo: () => {}, sessionKey: `${SITE}|3` };
        return (
            <AppContext.Provider value={ctx}>
                <TabsProvider tabs={new TabsModel(sectionRoute('home'), null, null)}>
                    <Shell siteUrl={SITE} items={[{ section: 'home', label: 'Home', command: 'go-home', icon: 'house' }]} profile={lily} commands={commands} />
                </TabsProvider>
            </AppContext.Provider>
        );
    }
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } }, logger: { log: () => {}, warn: () => {}, error: () => {} } });
    render(
        <QueryClientProvider client={client}>
            <Harness />
        </QueryClientProvider>,
    );
}

const bottom = () => document.querySelector<HTMLElement>('.chrome-bottom')!;
const box = (panel: HTMLElement) => panel.querySelector<HTMLElement>('[contenteditable="true"]')!;

afterEach(() => {
    cleanup();
    localStorage.clear();
});

describe('agent chats', () => {
    it('reads the events of a stream, a frame at a time', () => {
        const { events, rest } = parseSse('data: {"type":"RUN_STARTED"}\n\ndata: {"type":"TEXT_MESSAGE_CONTENT","delta":"Hi"}\r\n\r\ndata: {"type":"TEXT_MES');
        expect(events.map((e) => e.type)).toEqual(['RUN_STARTED', 'TEXT_MESSAGE_CONTENT']);
        expect(events[1]?.delta).toBe('Hi');
        expect(rest).toBe('data: {"type":"TEXT_MES');
        expect(parseSse('data: [DONE]\n\n: comment\n\ndata: not json\n\n').events).toEqual([]);
    });

    it('keeps the open chats per network and profile, the shown one and the wide panel', () => {
        const data = new Map<string, string>();
        const store = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
        const key = agentChatsStorageKey(`${SITE}|3|4`);
        const a = new AgentChatsStore(key, store);
        a.show({ agentId: '3', chatId: 'aaaaaaaa', title: '' });
        a.show({ agentId: '3', chatId: 'bbbbbbbb', title: 'Second' });
        a.setExpanded(true);
        a.rename({ agentId: '3', chatId: 'aaaaaaaa' }, 'First');
        const b = new AgentChatsStore(key, store);
        expect(b.open.map((c) => c.title)).toEqual(['First', 'Second']);
        expect(b.shown?.chatId).toBe('bbbbbbbb');
        expect(b.expanded).toBe(true);
        b.minimize();
        expect(new AgentChatsStore(key, store).shown).toBeNull();
        expect(new AgentChatsStore(agentChatsStorageKey(`${SITE}|3|9`), store).open).toEqual([]);
    });

    it('has no Agent button where the network offers no agent', async () => {
        renderShell({ 'GET /agents': () => json(200, { items: [], default_id: null }) });
        await act(async () => {});
        expect(within(bottom()).queryByRole('button', { name: 'Agent' })).toBeNull();
        expect(within(bottom()).queryByRole('button', { name: 'Chat history' })).toBeNull();
        cleanup();
        renderShell({ 'GET /agents': () => json(404, { type: 'about:blank', title: 'Not Found', status: 404, code: 'not_found' }) });
        await act(async () => {});
        expect(within(bottom()).queryByRole('button', { name: 'Agent' })).toBeNull();
    });

    it('starts a chat, streams the reply as it comes, and shows the kept one', async () => {
        let stream: ReturnType<typeof sse> | null = null;
        let sent = '';
        let kept: Schema<'AgentChatThread'> = { chat: chat('c0ffee11'), messages: [] };
        renderShell({
            'GET /agents': () => json(200, AGENTS),
            'GET /agents/3/chats': () => json(200, { items: [] }),
            'POST /agents/3/chats': () => json(201, chat('c0ffee11')),
            'GET /agents/3/chats/c0ffee11': () => json(200, kept),
            'POST /agents/3/chats/c0ffee11/messages': async (r) => {
                sent = ((await r.json()) as { text: string }).text;
                stream = sse(r.signal);
                return stream.response;
            },
        });
        fireEvent.click(await within(bottom()).findByRole('button', { name: 'Agent' }));
        const panel = await screen.findByRole('dialog', { name: 'New chat' });
        // its tab says it is shown, and controls the panel
        const tab = within(bottom()).getByRole('button', { name: 'New chat', expanded: true });
        expect(tab.getAttribute('aria-controls')).toBe(panel.id);
        await within(panel).findByText(/Ask Helper anything/);
        await waitFor(() => expect(panel.contains(document.activeElement)).toBe(true));

        // Ctrl+Enter sends
        setRichText(box(panel), 'What is new?');
        fireEvent.keyDown(box(panel), { key: 'Enter', code: 'Enter', ctrlKey: true });
        await waitFor(() => expect(sent).toBe('What is new?'));
        expect(within(panel).getByText('What is new?')).toBeTruthy();
        expect(within(panel).getByRole('log').getAttribute('aria-busy')).toBe('true');
        expect(within(panel).getByRole('button', { name: 'Stop' })).toBeTruthy();

        await act(async () => {
            stream!.push({ type: 'RUN_STARTED' });
            stream!.push({ type: 'TEXT_MESSAGE_START', messageId: 'm2' });
            stream!.push({ type: 'TEXT_MESSAGE_CONTENT', messageId: 'm2', delta: 'Three new' });
        });
        await within(panel).findByText('Three new');
        await act(async () => stream!.push({ type: 'TEXT_MESSAGE_CONTENT', messageId: 'm2', delta: ' **posts**.' }));
        await within(panel).findByText('Three new **posts**.');

        kept = {
            chat: { ...chat('c0ffee11', 'What is new?'), messages_count: 2 },
            messages: [
                { id: 'm1', role: 'user', text: 'What is new?', html: '<p>What is new?</p>' },
                { id: 'm2', role: 'assistant', text: 'Three new **posts**.', html: '<p>Three new <strong>posts</strong>.</p>' },
            ],
        };
        await act(async () => {
            stream!.push({ type: 'TEXT_MESSAGE_END', messageId: 'm2' });
            stream!.push({ type: 'RUN_FINISHED' });
            stream!.end();
        });
        // the site's HTML replaces the streamed words, and the chat takes its title
        await waitFor(() => expect(panel.querySelector('.agent-msg-agent strong')?.textContent).toBe('posts'));
        await screen.findByRole('dialog', { name: 'What is new?' });
        expect(within(bottom()).getByRole('button', { name: 'What is new?', expanded: true })).toBeTruthy();
        expect(within(panel).getByRole('log').getAttribute('aria-busy')).toBeNull();
    });

    it('stops a reply, minimises to its tab and back, and closes', async () => {
        let stream: ReturnType<typeof sse> | null = null;
        renderShell({
            'GET /agents': () => json(200, AGENTS),
            'GET /agents/3/chats': () => json(200, { items: [chat('decafbad', 'Earlier chat')] }),
            'POST /agents/3/chats': () => json(201, chat('c0ffee22')),
            'GET /agents/3/chats/c0ffee22': () => json(200, { chat: chat('c0ffee22'), messages: [] }),
            'POST /agents/3/chats/c0ffee22/messages': (r) => {
                stream = sse(r.signal);
                return stream.response;
            },
        });
        fireEvent.click(await within(bottom()).findByRole('button', { name: 'Agent' }));
        const panel = await screen.findByRole('dialog', { name: 'New chat' });
        setRichText(box(panel), 'Write a long answer');
        fireEvent.click(within(panel).getByRole('button', { name: 'Send' }));
        await waitFor(() => expect(stream).not.toBeNull());
        await act(async () => stream!.push({ type: 'TEXT_MESSAGE_CONTENT', delta: 'Once upon' }));
        await within(panel).findByText('Once upon');
        fireEvent.click(within(panel).getByRole('button', { name: 'Stop' }));
        await within(panel).findByText('Stopped');
        expect(within(panel).getByText('Once upon')).toBeTruthy();
        expect(within(panel).getByRole('button', { name: 'Send' })).toBeTruthy();

        // Minimise (Esc too): the panel goes, focus to its tab; the tab brings it back
        fireEvent.click(within(panel).getByRole('button', { name: 'Minimise' }));
        expect(panel.hidden).toBe(true);
        const tab = within(bottom()).getByRole('button', { name: 'New chat', expanded: false });
        await waitFor(() => expect(document.activeElement).toBe(tab));
        fireEvent.click(tab);
        expect(panel.hidden).toBe(false);
        fireEvent.keyDown(within(panel).getByRole('log'), { key: 'Escape' });
        expect(panel.hidden).toBe(true);

        // Expand makes it wide
        fireEvent.click(tab);
        fireEvent.click(within(panel).getByRole('button', { name: 'Expand' }));
        expect(panel.hasAttribute('data-expanded')).toBe(true);
        expect(within(panel).getByRole('button', { name: 'Make smaller' })).toBeTruthy();

        // Close: the tab and the panel go, focus to the Agent button
        fireEvent.click(within(panel).getByRole('button', { name: 'Close chat' }));
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(within(bottom()).queryByRole('button', { name: 'New chat' })).toBeNull();
        await waitFor(() => expect(document.activeElement).toBe(within(bottom()).getByRole('button', { name: 'Agent' })));
    });

    it('says why the agent could not answer', async () => {
        renderShell({
            'GET /agents': () => json(200, AGENTS),
            'GET /agents/3/chats': () => json(200, { items: [] }),
            'POST /agents/3/chats': () => json(201, chat('c0ffee33')),
            'GET /agents/3/chats/c0ffee33': () => json(200, { chat: chat('c0ffee33'), messages: [] }),
            'POST /agents/3/chats/c0ffee33/messages': () => {
                const s = sse();
                queueMicrotask(() => {
                    s.push({ type: 'RUN_STARTED' });
                    s.push({ type: 'RUN_ERROR', message: 'No model is set up for this agent' });
                    s.end();
                });
                return s.response;
            },
        });
        fireEvent.click(await within(bottom()).findByRole('button', { name: 'Agent' }));
        const panel = await screen.findByRole('dialog', { name: 'New chat' });
        setRichText(box(panel), 'Hello');
        fireEvent.click(within(panel).getByRole('button', { name: 'Send' }));
        expect((await within(panel).findByRole('alert')).textContent).toBe('No model is set up for this agent');
    });
});
