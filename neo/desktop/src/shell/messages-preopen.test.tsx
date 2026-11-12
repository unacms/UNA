import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useEffect, useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createUnaApi, type Schema, type UnaApi } from 'una-api';

import { listenForCommands } from '../lib/command-bus';
import { AppContext, type AppContextValue } from '../lib/context';
import { RouterProvider } from '../lib/navigation';
import { type Route, RouteHistory, routeToPath, sectionRoute } from '../lib/router';
import { PREOPEN_READ_MS, preopenedId, setPreopened, useShownFor } from '../features/messages/preopen';
import { type CommandHandler, Shell } from './shell';
import type { NavItem } from './sidebar';

type Profile = Schema<'Profile'>;

const lily: Profile = { id: '4', kind: 'person', module: 'bx_persons', display_name: 'Lily', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const mila: Profile = { id: '8', kind: 'person', module: 'bx_persons', display_name: 'Mila', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const eric: Profile = { id: '6', kind: 'person', module: 'bx_persons', display_name: 'Eric', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };

const me = { account: { id: '3', email: 'lily@example.com' }, active_profile_id: '4', profiles: [lily] } as unknown as Schema<'Me'>;

function conversation(id: string, other: Profile, at: string): Schema<'Conversation'> {
    return {
        id,
        author: other,
        participants: [other, lily],
        body: 'Hi',
        body_html: '<p>Hi</p>',
        media: [],
        replies: 1,
        unread: 1,
        last_reply_at: at,
        last_message: { text: `From ${other.display_name}`, has_media: false, media_kind: null, created_at: at, by: other },
        created_at: '2026-11-01T09:00:00Z',
        can_add_participants: false,
        can_leave: true,
    };
}

// the server's order is not the inbox's: Eric's is the newest
const older = conversation('7', mila, '2026-11-05T10:00:00Z');
const newest = conversation('9', eric, '2026-11-06T10:00:00Z');

type Answer = { status: number; body?: unknown };
type Routes = Record<string, (request: Request) => Answer | Promise<Answer>>;

function fakeApi(routes: Routes, calls: string[] = []): UnaApi {
    return createUnaApi({
        siteUrl: 'https://community.example',
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            const request = input instanceof Request ? input : new Request(input, init);
            const path = new URL(request.url).pathname.replace(/^\/api\/v2/, '');
            calls.push(`${request.method} ${path}`);
            const handler = routes[`${request.method} ${path}`];
            if (!handler) return new Promise<Response>(() => {});
            const { status, body } = await handler(request);
            if (body === undefined) return new Response(null, { status });
            return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' } });
        },
    });
}

const inboxRoutes: Routes = {
    'GET /conversations': () => ({ status: 200, body: { items: [older, newest], next_cursor: null } }),
    'GET /conversations/7': () => ({ status: 200, body: older }),
    'GET /conversations/9': () => ({ status: 200, body: newest }),
    'GET /conversations/7/messages': () => ({ status: 200, body: { items: [], next_cursor: null } }),
    'GET /conversations/9/messages': () => ({ status: 200, body: { items: [], next_cursor: null } }),
    'POST /conversations/7/read': () => ({ status: 204 }),
    'POST /conversations/9/read': () => ({ status: 204 }),
};

const items: NavItem[] = [
    { section: 'home', label: 'Home', command: 'go-home' },
    { section: 'notifications', label: 'Notifications', command: 'go-notifications' },
    { section: 'messages', label: 'Messages', command: 'go-messages' },
];

function Harness({ history, api }: { history: RouteHistory; api: UnaApi }) {
    const commands = useRef<CommandHandler | null>(null);
    useEffect(() => listenForCommands((id) => commands.current?.(id), { mac: false, nativeMenu: false }), []);
    const ctx: AppContextValue = { api, siteUrl: 'https://community.example', me, signOut: () => {}, signingOut: false, messageTo: () => {} };
    return (
        <AppContext.Provider value={ctx}>
            <RouterProvider history={history}>
                <Shell siteUrl="https://community.example" items={items} profile={lily} commands={commands} />
            </RouterProvider>
        </AppContext.Provider>
    );
}

function renderShell(start: Route, api: UnaApi) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, refetchInterval: false } }, logger: { log: () => {}, warn: () => {}, error: () => {} } });
    const history = new RouteHistory(start);
    render(
        <QueryClientProvider client={client}>
            <Harness history={history} api={api} />
        </QueryClientProvider>,
    );
    return { history, client };
}

const sidebarButton = (name: string) => within(screen.getByRole('navigation', { name: 'Sections' })).getByRole('button', { name });
const pause = (ms = 30) => act(() => new Promise((resolve) => setTimeout(resolve, ms)));

/** The panes measured `width` wide, and a way to change it (the window resized). */
function measuredPanes(width: number) {
    let current = width;
    const observers = new Set<() => void>();
    vi.stubGlobal(
        'ResizeObserver',
        class {
            constructor(private readonly callback: () => void) {}
            observe() {
                observers.add(this.callback);
            }
            unobserve() {}
            disconnect() {
                observers.delete(this.callback);
            }
        },
    );
    const real = Element.prototype.getBoundingClientRect;
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
        return this.classList.contains('panes') ? ({ width: current, height: 800, top: 0, left: 0, right: current, bottom: 800, x: 0, y: 0, toJSON: () => ({}) } as DOMRect) : real.call(this);
    });
    return (next: number) => {
        current = next;
        act(() => observers.forEach((o) => o()));
    };
}

beforeEach(() => {
    try {
        localStorage.clear();
    } catch {
        // no storage
    }
});

afterEach(() => {
    cleanup();
    setPreopened(null);
    delete document.documentElement.dataset.windowActive;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
});

describe('Messages opens the newest conversation beside the inbox', () => {
    it('in three panes, in place of the empty route, with focus left in the list', async () => {
        const { history } = renderShell(sectionRoute('home'), fakeApi(inboxRoutes));
        fireEvent.click(sidebarButton('Messages'));
        const heading = screen.getByRole('heading', { name: 'Messages', level: 1 });
        expect(document.activeElement).toBe(heading);

        await waitFor(() => expect(routeToPath(history.current)).toBe('/messages/conversation/9'));
        // replaced, not pushed: Back goes to Home, not to an inbox alone
        expect(history.snapshot()).toEqual({ paths: ['/home', '/messages/conversation/9'], index: 1 });
        expect(screen.getByRole('button', { name: /^Eric/ }).getAttribute('aria-current')).toBe('true');
        expect(await screen.findByRole('heading', { name: 'Eric', level: 2 })).toBeTruthy();
        // the detail heading did not take focus
        expect(document.activeElement).toBe(heading);
        act(() => void history.back());
        expect(routeToPath(history.current)).toBe('/home');
    });

    it('keeps focus in the sidebar when it is there as the inbox comes', async () => {
        let answer: ((a: Answer) => void) | null = null;
        const api = fakeApi({ ...inboxRoutes, 'GET /conversations': () => new Promise<Answer>((resolve) => (answer = resolve)) });
        const { history } = renderShell(sectionRoute('home'), api);
        fireEvent.click(sidebarButton('Messages'));
        const nav = sidebarButton('Messages');
        nav.focus();
        await waitFor(() => expect(answer).not.toBeNull());
        await act(async () => answer!({ status: 200, body: { items: [older, newest], next_cursor: null } }));
        await waitFor(() => expect(routeToPath(history.current)).toBe('/messages/conversation/9'));
        expect(document.activeElement).toBe(nav);
    });

    it('waits for the inbox, and opens nothing when it is empty, nor when one comes later on the visit', async () => {
        let inboxItems: Schema<'Conversation'>[] = [];
        const api = fakeApi({ ...inboxRoutes, 'GET /conversations': () => ({ status: 200, body: { items: inboxItems, next_cursor: null } }) });
        const { history, client } = renderShell(sectionRoute('messages'), api);
        expect(await screen.findByText('No conversations yet')).toBeTruthy();
        await pause();
        expect(routeToPath(history.current)).toBe('/messages');

        // the first one arrives (the inbox refetched): the empty first answer decided this visit
        inboxItems = [newest];
        await act(async () => {
            await client.refetchQueries({ queryKey: ['conversations'] });
        });
        await screen.findByRole('button', { name: /^Eric/ });
        await pause();
        expect(routeToPath(history.current)).toBe('/messages');
    });

    it('not when the route names a conversation or New message', async () => {
        const named = renderShell({ list: { section: 'messages' }, detail: { kind: 'conversation', id: '7' } }, fakeApi(inboxRoutes));
        await screen.findByRole('button', { name: /^Eric/ });
        await pause();
        expect(routeToPath(named.history.current)).toBe('/messages/conversation/7');
        cleanup();

        const fresh = renderShell({ list: { section: 'messages' }, detail: { kind: 'new-message' } }, fakeApi(inboxRoutes));
        await screen.findByRole('button', { name: /^Eric/ });
        await pause();
        expect(routeToPath(fresh.history.current)).toBe('/messages/new-message');
    });

    it('not in a window too narrow for three panes, until it widens', async () => {
        const resize = measuredPanes(600);
        const { history } = renderShell(sectionRoute('messages'), fakeApi(inboxRoutes));
        await screen.findByRole('button', { name: /^Eric/ });
        await pause();
        expect(routeToPath(history.current)).toBe('/messages');
        expect(document.querySelector<HTMLElement>('.panes')!.dataset.panes).toBe('cover');

        resize(1000);
        await waitFor(() => expect(routeToPath(history.current)).toBe('/messages/conversation/9'));
        expect(history.snapshot()).toEqual({ paths: ['/messages/conversation/9'], index: 0 });
    });

    it('narrowed into the cover before it is chosen, goes back to the list, focus left there', async () => {
        const resize = measuredPanes(1000);
        const { history } = renderShell(sectionRoute('messages'), fakeApi(inboxRoutes));
        await waitFor(() => expect(routeToPath(history.current)).toBe('/messages/conversation/9'));
        const heading = screen.getByRole('heading', { name: 'Messages', level: 1 });
        act(() => heading.focus());

        resize(600);
        await waitFor(() => expect(routeToPath(history.current)).toBe('/messages'));
        expect(history.snapshot()).toEqual({ paths: ['/messages'], index: 0 });
        expect(document.activeElement).toBe(heading);
        // widened again on this visit: nothing opens
        resize(1000);
        await pause();
        expect(routeToPath(history.current)).toBe('/messages');
        cleanup();

        // chosen first: it stays open, covering the list as any open conversation
        const again = measuredPanes(1000);
        const chosen = renderShell(sectionRoute('messages'), fakeApi(inboxRoutes));
        await waitFor(() => expect(routeToPath(chosen.history.current)).toBe('/messages/conversation/9'));
        fireEvent.click(screen.getByRole('button', { name: /^Eric/ }));
        again(600);
        await pause();
        expect(routeToPath(chosen.history.current)).toBe('/messages/conversation/9');
    });

    it('Back or Forward to it shows it preopened again: not read at once, focus left in the list', async () => {
        // a focused window: only the 2 s would hold the read back
        vi.spyOn(document, 'hasFocus').mockImplementation(() => true);
        const calls: string[] = [];
        const { history } = renderShell(sectionRoute('home'), fakeApi(inboxRoutes, calls));
        fireEvent.click(sidebarButton('Messages'));
        await waitFor(() => expect(routeToPath(history.current)).toBe('/messages/conversation/9'));
        await screen.findByRole('heading', { name: 'Eric', level: 2 });

        fireEvent.click(sidebarButton('Home'));
        expect(preopenedId()).toBeNull();
        act(() => void history.back());
        expect(routeToPath(history.current)).toBe('/messages/conversation/9');
        expect(preopenedId()).toBe('9');
        await screen.findByRole('heading', { name: 'Eric', level: 2 });
        await pause(50);
        expect(calls).not.toContain('POST /conversations/9/read');
        expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Messages', level: 1 }));

        act(() => void history.back());
        expect(routeToPath(history.current)).toBe('/home');
        act(() => void history.forward());
        expect(routeToPath(history.current)).toBe('/messages/conversation/9');
        expect(preopenedId()).toBe('9');
        await screen.findByRole('heading', { name: 'Eric', level: 2 });
        await pause(50);
        expect(calls).not.toContain('POST /conversations/9/read');
        expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Messages', level: 1 }));

        // closed, then Back to it: open as any other (read, its heading focused)
        act(() => void fireEvent.keyDown(document.activeElement!, { key: 'Escape', code: 'Escape' }));
        expect(routeToPath(history.current)).toBe('/messages');
        act(() => void history.back());
        expect(preopenedId()).toBeNull();
        await waitFor(() => expect(calls).toContain('POST /conversations/9/read'));
        await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Eric', level: 2 })));
    });

    it('closed, leaves the inbox alone until Messages is entered again', async () => {
        const { history, client } = renderShell(sectionRoute('home'), fakeApi(inboxRoutes));
        fireEvent.click(sidebarButton('Messages'));
        await waitFor(() => expect(routeToPath(history.current)).toBe('/messages/conversation/9'));
        const heading = screen.getByRole('heading', { name: 'Messages', level: 1 });

        act(() => void fireEvent.keyDown(document.activeElement!, { key: 'Escape', code: 'Escape' }));
        expect(routeToPath(history.current)).toBe('/messages');
        expect(screen.queryByRole('region', { name: 'Details' })).toBeNull();
        // focus was in the list: it stays there
        expect(document.activeElement).toBe(heading);
        // the inbox comes again: still nothing open
        await act(async () => {
            await client.refetchQueries({ queryKey: ['conversations'] });
        });
        await pause();
        expect(routeToPath(history.current)).toBe('/messages');

        // entered again: the newest opens again
        fireEvent.click(sidebarButton('Home'));
        fireEvent.click(sidebarButton('Messages'));
        await waitFor(() => expect(routeToPath(history.current)).toBe('/messages/conversation/9'));
    });

    it('closed with focus inside, gives focus to its row', async () => {
        const { history } = renderShell(sectionRoute('messages'), fakeApi(inboxRoutes));
        await waitFor(() => expect(routeToPath(history.current)).toBe('/messages/conversation/9'));
        const detailHeading = await screen.findByRole('heading', { name: 'Eric', level: 2 });
        act(() => detailHeading.focus());
        act(() => void fireEvent.keyDown(detailHeading, { key: 'Escape', code: 'Escape' }));
        expect(routeToPath(history.current)).toBe('/messages');
        expect(document.activeElement).toBe(screen.getByRole('button', { name: /^Eric/ }));
    });

    it('is not read at once; choosing it (its row, or focus in it) reads it now', async () => {
        const calls: string[] = [];
        const { history } = renderShell(sectionRoute('messages'), fakeApi(inboxRoutes, calls));
        await waitFor(() => expect(routeToPath(history.current)).toBe('/messages/conversation/9'));
        await screen.findByRole('heading', { name: 'Eric', level: 2 });
        await waitFor(() => expect(calls).toContain('GET /conversations/9'));
        await pause(50);
        expect(calls).not.toContain('POST /conversations/9/read');
        expect(preopenedId()).toBe('9');

        // its row, though it is open already: gone to as one opened is
        fireEvent.click(screen.getByRole('button', { name: /^Eric/ }));
        await waitFor(() => expect(calls).toContain('POST /conversations/9/read'));
        expect(preopenedId()).toBeNull();
        expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Eric', level: 2 }));
        cleanup();

        const more: string[] = [];
        const again = renderShell(sectionRoute('messages'), fakeApi(inboxRoutes, more));
        await waitFor(() => expect(routeToPath(again.history.current)).toBe('/messages/conversation/9'));
        await waitFor(() => expect(more).toContain('GET /conversations/9'));
        await pause(50);
        expect(more).not.toContain('POST /conversations/9/read');
        act(() => screen.getByRole('heading', { name: 'Eric', level: 2 }).focus());
        await waitFor(() => expect(more).toContain('POST /conversations/9/read'));
    });

    it('another conversation chosen is read now, and takes focus to its heading', async () => {
        const calls: string[] = [];
        const { history } = renderShell(sectionRoute('messages'), fakeApi(inboxRoutes, calls));
        await waitFor(() => expect(routeToPath(history.current)).toBe('/messages/conversation/9'));
        fireEvent.click(screen.getByRole('button', { name: /^Mila/ }));
        expect(routeToPath(history.current)).toBe('/messages/conversation/7');
        await waitFor(() => expect(calls).toContain('POST /conversations/7/read'));
        await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Mila', level: 2 })));
        expect(calls).not.toContain('POST /conversations/9/read');
    });

    it('Notifications and Discussions keep a single list', async () => {
        const notification: Schema<'Notification'> = {
            id: '50',
            kind: 'social.comment',
            source: 'bx_timeline.commentPost',
            module: 'bx_timeline',
            actors: 1,
            text: 'Eric commented on your post',
            url: 'https://community.example/item?id=12',
            object_kind: 'content',
            object_id: '12',
            item_id: null,
            thread_id: null,
            data: {},
            read: false,
            created_at: '2026-11-06T10:00:00Z',
            updated_at: '2026-11-06T10:00:00Z',
        };
        const discussion = {
            id: '3',
            content_id: '903',
            title: 'Seeds to swap',
            summary: 'Who has tomatoes?',
            body: 'Who has tomatoes?',
            body_html: '<p>Who has tomatoes?</p>',
            author: mila,
            anonymous: false,
            category: { id: '1', title: 'General' },
            audience: 'public',
            context_id: null,
            stats: { replies: 2, views: 5 },
            sticky: false,
            locked: false,
            resolved: null,
            last_reply_at: '2026-11-05T10:00:00Z',
            last_reply_by: eric,
            url: 'https://community.example/view-discussion/x',
            created_at: '2026-11-04T10:00:00Z',
            updated_at: '2026-11-04T10:00:00Z',
            viewer: { can_edit: false, can_edit_text: false, can_delete: false, can_reply: true },
        };
        const api = fakeApi({
            'GET /notifications': () => ({ status: 200, body: { items: [notification], next_cursor: null } }),
            'GET /discussions/categories': () => ({ status: 200, body: { categories: [{ id: '1', title: 'General' }], can_create: true } }),
            'GET /discussions': () => ({ status: 200, body: { items: [discussion], next_cursor: null } }),
        });
        // the notifications list draws the rows that fit its measured pane
        for (const prop of ['clientHeight', 'clientWidth', 'offsetHeight'] as const) {
            vi.spyOn(HTMLElement.prototype, prop, 'get').mockImplementation(function (this: HTMLElement) {
                if (this.classList.contains('pane-body')) return prop === 'clientWidth' ? 600 : 800;
                return prop === 'offsetHeight' && this.classList.contains('notification-row') ? 64 : 0;
            });
        }
        const { history } = renderShell(sectionRoute('notifications'), api);
        expect(await within(await screen.findByRole('feed', { name: 'Notifications, All' })).findAllByRole('article')).toHaveLength(1);
        await pause();
        expect(routeToPath(history.current)).toBe('/notifications');

        act(() => history.push(sectionRoute('discussions')));
        expect(await screen.findByText('Seeds to swap')).toBeTruthy();
        await pause();
        expect(routeToPath(history.current)).toBe('/discussions');
    });
});

function Shown({ waiting }: { waiting: boolean }) {
    const shown = useShownFor(PREOPEN_READ_MS, waiting);
    return <p>{shown ? 'shown' : 'waiting'}</p>;
}

describe('useShownFor', () => {
    it('counts only while the window is focused, and starts over after a blur', () => {
        vi.useFakeTimers();
        let focused = false;
        vi.spyOn(document, 'hasFocus').mockImplementation(() => focused);
        render(<Shown waiting />);
        act(() => void vi.advanceTimersByTime(PREOPEN_READ_MS * 3));
        // a window in the background never reads it
        expect(screen.getByText('waiting')).toBeTruthy();

        focused = true;
        act(() => void window.dispatchEvent(new Event('focus')));
        act(() => void vi.advanceTimersByTime(PREOPEN_READ_MS - 500));
        focused = false;
        act(() => void window.dispatchEvent(new Event('blur')));
        focused = true;
        act(() => void window.dispatchEvent(new Event('focus')));
        act(() => void vi.advanceTimersByTime(PREOPEN_READ_MS - 500));
        expect(screen.getByText('waiting')).toBeTruthy();
        act(() => void vi.advanceTimersByTime(500));
        expect(screen.getByText('shown')).toBeTruthy();
    });

    it("follows the window's own focus state where the chrome sets it, not the DOM's", async () => {
        vi.useFakeTimers();
        vi.spyOn(document, 'hasFocus').mockImplementation(() => true);
        const root = document.documentElement;
        root.dataset.windowActive = 'false';
        render(<Shown waiting />);
        act(() => void vi.advanceTimersByTime(PREOPEN_READ_MS * 2));
        // the DOM says focused, the window says it is not
        expect(screen.getByText('waiting')).toBeTruthy();

        await act(async () => {
            root.dataset.windowActive = 'true';
            await Promise.resolve();
        });
        act(() => void vi.advanceTimersByTime(PREOPEN_READ_MS - 1));
        expect(screen.getByText('waiting')).toBeTruthy();
        act(() => void vi.advanceTimersByTime(1));
        expect(screen.getByText('shown')).toBeTruthy();
    });

    it('is shown at once when nothing waits, and stays shown', () => {
        vi.useFakeTimers();
        vi.spyOn(document, 'hasFocus').mockImplementation(() => false);
        const { rerender } = render(<Shown waiting={false} />);
        expect(screen.getByText('shown')).toBeTruthy();
        rerender(<Shown waiting />);
        expect(screen.getByText('shown')).toBeTruthy();
    });
});
