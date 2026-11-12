import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { type ReactNode, useEffect, useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createUnaApi, type Schema, type UnaApi } from 'una-api';

import { listenForCommands } from '../lib/command-bus';
import { AppContext, type AppContextValue } from '../lib/context';
import { RouterProvider } from '../lib/navigation';
import { type Route, RouteHistory, routeToPath, sectionRoute } from '../lib/router';
import { profileSummaryKey } from '../screens/conversation';
import { type CommandHandler, Shell } from './shell';
import type { NavItem } from './sidebar';
import { setRichText } from '../components/rich-editor/test-utils';

const profile: Schema<'Profile'> = { id: '4', kind: 'person', module: 'bx_persons', display_name: 'Lily', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const eric: Schema<'Profile'> = { id: '8', kind: 'person', module: 'bx_persons', display_name: 'Eric', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };

const me = {
    account: { id: '3', email: 'lily@example.com' },
    active_profile_id: '4',
    profiles: [{ ...profile, about: '', created_at: '2026-01-01T00:00:00Z' }],
} as unknown as Schema<'Me'>;

type Answer = { status: number; body?: unknown };
type Routes = Record<string, (request: Request) => Answer | Promise<Answer>>;

/**
 * The typed client on a fake fetch: "GET /activities/12" answers from `routes`; anything else
 * never answers (the shell is what is under test, not the screens' data).
 */
function fakeApi(routes: Routes = {}): UnaApi {
    return createUnaApi({
        siteUrl: 'https://community.example',
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            const request = input instanceof Request ? input : new Request(input, init);
            const path = new URL(request.url).pathname.replace(/^\/api\/v2/, '');
            const handler = routes[`${request.method} ${path}`];
            if (!handler) return new Promise<Response>(() => {});
            const { status, body } = await handler(request);
            if (body === undefined) return new Response(null, { status });
            const type = status >= 400 ? 'application/problem+json' : 'application/json';
            return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': type } });
        },
    });
}

const notFound: Answer = { status: 404, body: { type: 'about:blank', title: 'Not Found', status: 404, detail: 'No such post' } };

function activity(id: string): Schema<'Activity'> {
    return {
        id,
        verb: 'posted',
        actor: profile,
        object: {
            id: `c${id}`,
            kind: 'feed_post',
            module: 'bx_timeline',
            author: profile,
            anonymous: false,
            audience: 'public',
            card: { text: `Post ${id}` },
            media: [],
            stats: { comments: 0, reactions: 0, reposts: 0, views: 0 },
            published_at: '2026-11-01T00:00:00Z',
            viewer: { reaction: null, favorited: false, can_react: false, can_comment: false, can_delete: true },
        },
        pinned: false,
        sticky: false,
        promoted: false,
        version: 'v1',
        created_at: '2026-11-01T00:00:00Z',
    } as unknown as Schema<'Activity'>;
}

const postRoute = (id: string): Route => ({ list: { section: 'home' }, detail: { kind: 'post', id } });

const items: NavItem[] = [
    { section: 'home', label: 'Home', command: 'go-home' },
    { section: 'explore', label: 'Explore', command: 'go-explore' },
    { section: 'notifications', label: 'Notifications', command: 'go-notifications', badge: 3 },
    { section: 'messages', label: 'Messages', command: 'go-messages', badge: 120 },
    { section: 'profile', label: 'Profile', command: 'go-profile' },
];

type HarnessProps = { history: RouteHistory; api: UnaApi; me: Schema<'Me'>; children?: ReactNode };

function Harness({ history, api, me: viewer, children }: HarnessProps) {
    const commands = useRef<CommandHandler | null>(null);
    useEffect(() => listenForCommands((id) => commands.current?.(id), { mac: false, nativeMenu: false }), []);
    const ctx: AppContextValue = { api, siteUrl: 'https://community.example', me: viewer, signOut: () => {}, signingOut: false, messageTo: () => {} };
    return (
        <AppContext.Provider value={ctx}>
            <RouterProvider history={history}>
                <Shell siteUrl="https://community.example" items={items} profile={profile} commands={commands} />
                {children}
            </RouterProvider>
        </AppContext.Provider>
    );
}

const newClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } }, logger: { log: () => {}, warn: () => {}, error: () => {} } });

type Options = { api?: UnaApi; me?: Schema<'Me'>; client?: QueryClient; children?: ReactNode };

function renderShell(history = new RouteHistory(sectionRoute('home')), options: Options = {}) {
    render(
        <QueryClientProvider client={options.client ?? newClient()}>
            <Harness history={history} api={options.api ?? fakeApi()} me={options.me ?? me}>
                {options.children}
            </Harness>
        </QueryClientProvider>,
    );
    return history;
}

const ctrl = (key: string, code: string) => fireEvent.keyDown(window, { key, code, ctrlKey: true });
/** Ctrl+Alt (Cmd+Option on macOS): the sections' keys; Ctrl+1…9 are the tabs'. */
const ctrlAlt = (key: string, code: string) => fireEvent.keyDown(window, { key, code, ctrlKey: true, altKey: true });

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    document.querySelectorAll('body > dialog').forEach((d) => d.remove());
});

describe('Shell', () => {
    it('has its named regions, and no detail pane or list handle while nothing is open', () => {
        const history = renderShell();
        expect(screen.getByRole('navigation', { name: 'Sections' })).toBeTruthy();
        const home = screen.getByRole('region', { name: 'Home' });
        expect(screen.getByRole('main').contains(home)).toBe(true);
        expect(screen.queryByRole('region', { name: 'Details' })).toBeNull();
        expect(screen.queryByRole('separator', { name: 'Resize list' })).toBeNull();

        act(() => history.push(postRoute('1')));
        const post = screen.getByRole('region', { name: 'Post' });
        expect(screen.getByRole('main').contains(post)).toBe(true);
        expect(screen.getByRole('separator', { name: 'Resize list' })).toBeTruthy();
    });

    it('puts badge counts in the button names, not in aria-label on a span', () => {
        renderShell();
        const nav = screen.getByRole('navigation', { name: 'Sections' });
        expect(within(nav).getByRole('button', { name: 'Notifications, 3 unread' })).toBeTruthy();
        const messages = within(nav).getByRole('button', { name: 'Messages, 120 unread' });
        expect(messages.querySelector('.nav-badge')?.getAttribute('aria-hidden')).toBe('true');
        expect(messages.querySelector('.nav-badge')?.textContent).toBe('99+');
        expect(messages.querySelector('.sr-only')?.textContent).toBe(', 120 unread');
        expect(nav.querySelector('span[aria-label]')).toBeNull();
    });

    it('marks the current section and moves focus to its heading', () => {
        renderShell();
        const nav = screen.getByRole('navigation', { name: 'Sections' });
        fireEvent.click(within(nav).getByRole('button', { name: 'Explore' }));
        expect(within(nav).getByRole('button', { name: 'Explore' }).getAttribute('aria-current')).toBe('page');
        expect(within(nav).getByRole('button', { name: 'Home' }).getAttribute('aria-current')).toBeNull();
        expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Explore', level: 1 }));
        expect(document.title).toBe('Explore – community.example');
    });

    it('switches sections with Ctrl+Alt+1…5 and goes back and forward', () => {
        const history = renderShell();
        act(() => void ctrlAlt('3', 'Digit3'));
        expect(screen.getByRole('region', { name: 'Notifications' })).toBeTruthy();
        act(() => void ctrlAlt('4', 'Digit4'));
        expect(screen.getByRole('region', { name: 'Messages' })).toBeTruthy();
        // nothing open: the inbox alone, no "Select a conversation" beside it
        expect(screen.queryByRole('region', { name: 'Details' })).toBeNull();

        act(() => void ctrl('[', 'BracketLeft'));
        expect(routeToPath(history.current)).toBe('/notifications');
        act(() => void fireEvent.mouseUp(window, { button: 3 }));
        expect(routeToPath(history.current)).toBe('/home');
        act(() => void fireEvent.mouseUp(window, { button: 4 }));
        act(() => void ctrl(']', 'BracketRight'));
        expect(routeToPath(history.current)).toBe('/messages');
    });

    it('closes the detail pane with Esc and returns focus to what opened it', () => {
        const history = renderShell();
        const opener = screen.getByRole('button', { name: 'Explore' });
        opener.focus();
        act(() => history.push({ list: { section: 'home' }, detail: { kind: 'post', id: '1' } }));
        expect(screen.getByRole('region', { name: 'Post' })).toBeTruthy();
        expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Post', level: 2 }));

        act(() => void fireEvent.keyDown(document.activeElement!, { key: 'Escape', code: 'Escape' }));
        expect(routeToPath(history.current)).toBe('/home');
        expect(screen.queryByRole('region', { name: 'Post' })).toBeNull();
        expect(document.activeElement).toBe(opener);
    });

    it('opens the compose sheet with Ctrl+N over any section, its text box focused', () => {
        const history = renderShell(new RouteHistory(sectionRoute('messages')));
        act(() => void ctrl('n', 'KeyN'));
        expect(routeToPath(history.current)).toBe('/messages');
        const sheet = screen.getByRole('dialog', { name: 'New post' });
        expect(document.activeElement?.id).toBe('new-post');
        expect(sheet.contains(document.activeElement)).toBe(true);
    });

    it('keeps Esc for the text field being typed in', () => {
        const history = renderShell(new RouteHistory({ list: { section: 'home' }, detail: { kind: 'post', id: '1' } }));
        act(() => void ctrl('n', 'KeyN'));
        const box = document.getElementById('new-post')!;
        act(() => void fireEvent.keyDown(box, { key: 'Escape', code: 'Escape' }));
        expect(routeToPath(history.current)).toBe('/home/post/1');
    });

    it('skips the empty detail pane with F6, whose only heading is not drawn', () => {
        renderShell();
        const home = screen.getByRole('button', { name: 'Home' });
        home.focus();
        act(() => void fireEvent.keyDown(home, { key: 'F6', code: 'F6' }));
        expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Home', level: 1 }));
        act(() => void fireEvent.keyDown(document.activeElement!, { key: 'F6', code: 'F6' }));
        expect(document.activeElement).toBe(home);
        act(() => void fireEvent.keyDown(home, { key: 'F6', code: 'F6', shiftKey: true }));
        expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Home', level: 1 }));
    });

    it('gives the window its plain title back when it goes away', () => {
        renderShell();
        expect(document.title).toBe('Home – community.example');
        cleanup();
        expect(document.title).toBe('UNA');
    });

    it('leaves keys to an open dialog wherever focus is', () => {
        const history = renderShell(new RouteHistory(postRoute('1')));
        const dialog = document.createElement('dialog');
        dialog.setAttribute('open', '');
        document.body.append(dialog);
        (document.activeElement as HTMLElement | null)?.blur();
        act(() => void fireEvent.keyDown(document.body, { key: 'Escape', code: 'Escape' }));
        act(() => void fireEvent.mouseUp(document.body, { button: 3 }));
        expect(routeToPath(history.current)).toBe('/home/post/1');
        dialog.remove();
        act(() => void fireEvent.keyDown(document.body, { key: 'Escape', code: 'Escape' }));
        expect(routeToPath(history.current)).toBe('/home');
    });

    it('says when a refresh failed', async () => {
        function Failing() {
            useQuery({ queryKey: ['failing'], queryFn: () => Promise.reject(new Error('down')) });
            return null;
        }
        renderShell(undefined, { children: <Failing /> });
        act(() => void ctrl('r', 'KeyR'));
        expect(await screen.findByText('Could not refresh')).toBeTruthy();
    });

    it('closes a post deleted from the detail pane, and Back does not bring it back', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        const client = newClient();
        const api = fakeApi({
            'GET /activities/12': () => ({ status: 200, body: activity('12') }),
            'DELETE /activities/12': () => ({ status: 204 }),
        });
        const history = new RouteHistory(sectionRoute('home'));
        history.push(postRoute('12'));
        renderShell(history, { api, client });

        const post = screen.getByRole('region', { name: 'Post' });
        fireEvent.click(await within(post).findByRole('button', { name: /^More actions for / }));
        fireEvent.click(screen.getByRole('menuitem', { name: 'Delete Post…' }));
        await waitFor(() => expect(routeToPath(history.current)).toBe('/home'));
        expect(history.canGoBack).toBe(false);
        act(() => void ctrl('[', 'BracketLeft'));
        expect(screen.queryByRole('region', { name: 'Post' })).toBeNull();
        expect(client.getQueryData(['activity', '12'])).toBeUndefined();
    });

    it('shows a post the site no longer returns as gone, not the copy it had', async () => {
        const client = newClient();
        client.setQueryData(['activity', '12'], activity('12'));
        const api = fakeApi({ 'GET /activities/12': () => notFound });
        renderShell(new RouteHistory(postRoute('12')), { api, client });

        const post = screen.getByRole('region', { name: 'Post' });
        expect(await within(post).findByText('This post is gone')).toBeTruthy();
        expect(within(post).queryByText('Post 12')).toBeNull();
        expect(within(post).queryByRole('button', { name: /^More actions for / })).toBeNull();
    });

    it('says when the viewer may not see a post', async () => {
        const api = fakeApi({ 'GET /activities/12': () => ({ status: 403, body: { type: 'about:blank', title: 'Forbidden', status: 403, detail: 'No' } }) });
        renderShell(new RouteHistory(postRoute('12')), { api });
        const post = screen.getByRole('region', { name: 'Post' });
        expect(await within(post).findByText('You can’t see this post')).toBeTruthy();
    });

    it('Esc closes a post and focus goes back to its row in the list', async () => {
        const api = fakeApi({ 'GET /activities/12': () => ({ status: 200, body: activity('12') }) });
        const history = new RouteHistory(sectionRoute('home'));
        renderShell(history, { api });
        // a row of the list, as the feed draws it
        const list = document.querySelector<HTMLElement>('[data-pane="list"]');
        const row = document.createElement('article');
        row.dataset.id = '12';
        row.tabIndex = -1;
        list?.appendChild(row);
        row.focus();
        act(() => history.push(postRoute('12')));
        await within(screen.getByRole('region', { name: 'Post' })).findByText('Post 12');
        // the virtualized feed drew the row anew while the post was open
        const redrawn = row.cloneNode() as HTMLElement;
        row.replaceWith(redrawn);

        act(() => void fireEvent.keyDown(document.activeElement ?? window, { key: 'Escape', code: 'Escape' }));
        expect(routeToPath(history.current)).toBe('/home');
        expect(document.activeElement).toBe(redrawn);
        redrawn.remove();
    });

    it('keeps focus in a new message box and remembers what opened it', () => {
        const client = newClient();
        client.setQueryData(profileSummaryKey('8'), eric);
        const history = renderShell(undefined, { client });
        const opener = screen.getByRole('button', { name: 'Explore' });
        opener.focus();
        act(() => history.push({ list: { section: 'messages' }, detail: { kind: 'new-message', profileId: '8' } }));
        expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Message Eric' }));

        fireEvent.click(screen.getByRole('button', { name: 'Close details' }));
        expect(document.activeElement).toBe(opener);
    });

    describe('a new conversation, once sent', () => {
        function setup() {
            let answer: (a: Answer) => void = () => {};
            const client = newClient();
            client.setQueryData(profileSummaryKey('8'), eric);
            const api = fakeApi({
                'POST /conversations': () => new Promise<Answer>((resolve) => (answer = resolve)),
                'GET /conversations': () => ({ status: 200, body: { items: [], next_cursor: null } }),
            });
            const history = new RouteHistory(sectionRoute('home'));
            history.push({ list: { section: 'messages' }, detail: { kind: 'new-message', profileId: '8' } });
            renderShell(history, { api, client });
            setRichText(screen.getByRole('textbox', { name: 'Message Eric' }), 'Hi');
            fireEvent.click(screen.getByRole('button', { name: 'Send' }));
            return { history, answer: (a: Answer) => answer(a) };
        }
        const created: Answer = { status: 201, body: { id: '77', participants: [eric], body: 'Hi', body_html: '<p>Hi</p>', replies: 0, unread: 0, created_at: '2026-11-01T00:00:00Z' } };

        it('replaces the new message route', async () => {
            const { history, answer } = setup();
            await waitFor(() => expect(screen.getByRole('button', { name: 'Send' }).getAttribute('aria-busy')).toBe('true'));
            await act(async () => answer(created));
            await waitFor(() => expect(routeToPath(history.current)).toBe('/messages/conversation/77'));
            expect(history.snapshot().paths).toEqual(['/home', '/messages/conversation/77']);
        });

        it('leaves the route alone when the person went elsewhere meanwhile', async () => {
            const { history, answer } = setup();
            await waitFor(() => expect(screen.getByRole('button', { name: 'Send' }).getAttribute('aria-busy')).toBe('true'));
            act(() => void ctrlAlt('1', 'Digit1'));
            await act(async () => answer(created));
            await act(async () => {});
            expect(routeToPath(history.current)).toBe('/home');
            expect(history.snapshot().paths).toEqual(['/home', '/messages/new-message/8', '/home']);
        });
    });

    it('closes the detail and starts history over when another profile acts', async () => {
        const org = { ...profile, id: '9', kind: 'organization', module: 'bx_organizations', display_name: 'Acme', about: '', created_at: '2026-01-01T00:00:00Z' };
        const two = { ...me, profiles: [...me.profiles, org] } as unknown as Schema<'Me'>;
        const client = newClient();
        client.setQueryData(['conversation', '1'], { id: '1' });
        client.setQueryData(['me'], two);
        // 204: the new Me is read after it
        const api = fakeApi({ 'PUT /me/active-profile': () => ({ status: 204, body: undefined }), 'GET /me': () => ({ status: 200, body: { ...two, active_profile_id: '9' } }) });
        const history = new RouteHistory(sectionRoute('messages'));
        history.push({ list: { section: 'messages' }, detail: { kind: 'conversation', id: '1' } });
        history.push(sectionRoute('profile'));
        history.push({ list: { section: 'profile' }, detail: { kind: 'post', id: '5' } });
        renderShell(history, { api, client, me: two });

        // the profile menu of the sidebar
        fireEvent.click(screen.getByRole('button', { name: 'Lily, switch profile' }));
        fireEvent.click(within(screen.getByRole('menu', { name: 'Profile' })).getByRole('menuitemradio', { name: 'Acme' }));
        await waitFor(() => expect(history.snapshot()).toEqual({ paths: ['/profile'], index: 0 }));
        expect(history.canGoBack).toBe(false);
        expect(client.getQueryData(['conversation', '1'])).toBeUndefined();
        expect((client.getQueryData(['me']) as Schema<'Me'>).active_profile_id).toBe('9');
    });
});
