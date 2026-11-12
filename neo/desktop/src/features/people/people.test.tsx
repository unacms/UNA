import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useEffect, useRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { createUnaApi, type Schema, type UnaApi } from 'una-api';

import { listenForCommands } from '../../lib/command-bus';
import { AppContext, type AppContextValue } from '../../lib/context';
import { RouterProvider } from '../../lib/navigation';
import { feedRoute, parseRoute, type Route, RouteHistory, routeToPath, sectionRoute } from '../../lib/router';
import { setSiteModules } from '../../lib/site-modules';
import { type CommandHandler, Shell } from '../../shell/shell';
import type { NavItem } from '../../shell/sidebar';
import { connectionSince } from '../profile/connections-list';
import { peopleTabs } from './people-page';

const person = (id: string, name: string, more: Partial<Schema<'Profile'>> = {}): Schema<'Profile'> => ({
    id,
    kind: 'person',
    module: 'bx_persons',
    display_name: name,
    status: 'active',
    about: '',
    created_at: '2026-03-01T00:00:00Z',
    ...more,
});
const lily = person('4', 'Lily');
const mila = person('8', 'Mila', { badges: [{ id: '8', name: 'Moderator', icon: 'shield-check', color: '#2563eb' }] });
const tom = person('10', 'Tom');
// a person whose page is private: the site sends no join date
const ana = person('12', 'Ana', { created_at: '1970-01-01T00:00:00Z' });

const me = { account: { id: '3', email: 'lily@example.com' }, active_profile_id: '4', profiles: [lily] } as unknown as Schema<'Me'>;

type Answer = { status: number; body?: unknown };

/** A site whose directory has Ana, Tom and Mila (recent), Tom first when active, Mila online; Lily's friend is Tom. */
function site(opts: { friends?: boolean; online?: Schema<'Profile'>[]; modules?: Schema<'ModuleInfo'>[] } = {}) {
    const calls: string[] = [];
    const answer = (path: string, query: URLSearchParams): Answer | null => {
        // GET /api/v2: the modules the site has, Persons by default
        if (path === '/') return { status: 200, body: { name: 'UNA', version: '2', modules: opts.modules ?? [{ module: 'bx_persons', tag: 'persons', title: 'People', kind: 'person' }] } };
        if (path === '/persons') {
            const view = query.get('view') ?? 'recent';
            const items = view === 'active' ? [tom, mila, ana] : view === 'online' ? (opts.online ?? [mila]) : [ana, tom, mila];
            // two at a time: the second page after the cursor
            if (query.get('cursor') === 'next') return { status: 200, body: { items: items.slice(2), next_cursor: null } };
            return { status: 200, body: { items: items.slice(0, 2), next_cursor: items.length > 2 ? 'next' : null } };
        }
        if (path === '/profiles/4/connections') return { status: 200, body: { followers: 0, following: 0, friends: 1, viewer: null, lists: { followers: true, following: true, friends: opts.friends ?? true } } };
        if (path === '/profiles/4/friends') return { status: 200, body: { items: [{ profile: tom, since: '2026-11-01T00:00:00Z' }], next_cursor: null } };
        return null;
    };
    const api: UnaApi = createUnaApi({
        siteUrl: 'https://community.example',
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            const request = input instanceof Request ? input : new Request(input, init);
            const url = new URL(request.url);
            const path = url.pathname.replace(/^\/api\/v2/, '');
            calls.push(`${request.method} ${path}${url.search}`);
            const a = request.method === 'GET' ? answer(path, url.searchParams) : null;
            if (!a) return new Promise<Response>(() => {});
            return new Response(JSON.stringify(a.body), { status: a.status, headers: { 'Content-Type': a.status >= 400 ? 'application/problem+json' : 'application/json' } });
        },
    });
    return { api, calls };
}

const items: NavItem[] = [
    { section: 'home', label: 'Home', command: 'go-home', icon: 'house' },
    { section: 'people', label: 'People', icon: 'user-round' },
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

function renderApp(route: Route, api: UnaApi) {
    const history = new RouteHistory(route);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } }, logger: { log: () => {}, warn: () => {}, error: () => {} } });
    render(
        <QueryClientProvider client={client}>
            <Harness history={history} api={api} />
        </QueryClientProvider>,
    );
    return { history };
}

const pane = () => screen.getByRole('region', { name: 'People' });
const names = (list: HTMLElement) => within(list).getAllByRole('listitem').map((li) => li.querySelector('[data-row-name]')?.textContent);

afterEach(() => {
    cleanup();
    setSiteModules(null);
});

describe('People', () => {
    it('is a page of tabs, Recent first: the network’s newest people, page by page', async () => {
        const { api, calls } = site();
        renderApp(sectionRoute('people'), api);
        const tabs = within(pane()).getByRole('tablist', { name: 'People' });
        expect(within(tabs).getAllByRole('tab').map((t) => t.textContent)).toEqual(['Recent', 'Active', 'Online', 'Friends']);
        expect(within(tabs).getByRole('tab', { name: 'Recent' }).getAttribute('aria-selected')).toBe('true');
        const list = await within(pane()).findByRole('list', { name: 'People, newest first' });
        expect(names(list)).toEqual(['Ana', 'Tom']);
        expect(calls).toContain('GET /persons?limit=30&view=recent');
        // when one joined; nothing where the site keeps it
        expect(within(list).getAllByRole('listitem')[1]?.querySelector('time')?.textContent).toMatch(/^Joined /);
        expect(within(list).getAllByRole('listitem')[0]?.querySelector('time')).toBeNull();
        fireEvent.click(within(pane()).getByRole('button', { name: 'Load more' }));
        await waitFor(() => expect(names(within(pane()).getByRole('list', { name: 'People, newest first' }))).toEqual(['Ana', 'Tom', 'Mila']));
        // badges after the name
        expect(within(pane()).getByText('Moderator')).toBeTruthy();
    });

    it('switches tabs in the route: Active, Online, and one’s friends', async () => {
        const { api, calls } = site();
        const { history } = renderApp(sectionRoute('people'), api);
        const tabs = within(pane()).getByRole('tablist', { name: 'People' });
        fireEvent.click(within(tabs).getByRole('tab', { name: 'Active' }));
        expect(routeToPath(history.current)).toBe('/people?feed=active');
        expect(names(await within(pane()).findByRole('list', { name: 'People, the most recently active first' }))).toEqual(['Tom', 'Mila']);
        expect(calls).toContain('GET /persons?limit=30&view=active');
        fireEvent.click(within(tabs).getByRole('tab', { name: 'Online' }));
        expect(routeToPath(history.current)).toBe('/people?feed=online');
        expect(names(await within(pane()).findByRole('list', { name: 'People online now' }))).toEqual(['Mila']);
        fireEvent.click(within(tabs).getByRole('tab', { name: 'Friends' }));
        expect(routeToPath(history.current)).toBe('/people?feed=friends');
        const friends = await within(pane()).findByRole('list', { name: 'Your friends, newest friendship first' });
        expect(names(friends)).toEqual(['Tom']);
        expect(within(friends).getByText(/^Friends since /)).toBeTruthy();
        // one's own friends: Message and Remove friend in the row's More menu, as in Connections
        expect(within(friends).getByRole('button', { name: 'More for Tom' })).toBeTruthy();
        expect(calls.some((c) => c.startsWith('GET /profiles/4/friends'))).toBe(true);
        expect(parseRoute('/people?feed=online')?.list).toEqual(feedRoute('people', 'online'));
        expect(parseRoute('/people?feed=followers')).toBeNull();
    });

    it('opens a person’s profile from a row, and says when no one is there', async () => {
        const { api } = site({ online: [] });
        const { history } = renderApp({ list: feedRoute('people', 'online'), detail: null }, api);
        expect(await within(pane()).findByText('No one is online right now')).toBeTruthy();
        fireEvent.click(within(pane()).getByRole('tab', { name: 'Recent' }));
        const list = await within(pane()).findByRole('list', { name: 'People, newest first' });
        fireEvent.click(within(list).getByRole('button', { name: 'Tom' }));
        // as in Connections: the profile's page in the content pane, Back comes back to the tab
        expect(routeToPath(history.current)).toBe('/profile?id=10');
    });

    it('says so on a network without a people directory, Friends still there', async () => {
        const { api, calls } = site({ modules: [{ module: 'bx_posts', tag: 'posts', title: 'Posts', kind: 'post' }] });
        renderApp(sectionRoute('people'), api);
        expect(await within(pane()).findByText('This network has no people directory.')).toBeTruthy();
        expect(calls.some((c) => c.startsWith('GET /persons'))).toBe(false);
        fireEvent.click(within(pane()).getByRole('tab', { name: 'Friends' }));
        expect(names(await within(pane()).findByRole('list', { name: 'Your friends, newest friendship first' }))).toEqual(['Tom']);
    });

    it('has no Friends tab for a profile without friends, and says what a row’s date is', () => {
        expect(peopleTabs(false)).toEqual(['recent', 'active', 'online']);
        expect(peopleTabs(undefined)).toEqual(['recent', 'active', 'online', 'friends']);
        expect(connectionSince({ kind: 'people', view: 'recent' }, '1970-01-01T00:00:00Z')).toBe('');
        expect(connectionSince({ kind: 'people', view: 'recent' }, '2026-03-01T00:00:00Z')).toMatch(/^Joined /);
    });
});
