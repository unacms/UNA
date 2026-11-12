import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useEffect, useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createUnaApi, type Schema, type UnaApi } from 'una-api';

import { listenForCommands } from '../../lib/command-bus';
import { AppContext, type AppContextValue } from '../../lib/context';
import { RouterProvider } from '../../lib/navigation';
import { type Route, RouteHistory, routeToPath, sectionRoute } from '../../lib/router';
import type { CommandId } from '../../lib/shortcuts';
import { type CommandHandler, Shell } from '../../shell/shell';
import type { NavItem } from '../../shell/sidebar';
import {
    commandEntries,
    filterEntries,
    flatten,
    keepActive,
    matchScore,
    moveActive,
    navigationEntries,
    optionId,
    paletteSections,
    postEntry,
    profileEntry,
    RecentEntries,
    resultsText,
    searchEntry,
} from './commands';

type Profile = Schema<'Profile'>;

const lily: Profile = { id: '4', kind: 'person', module: 'bx_persons', display_name: 'Lily Carter', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const lilyOrg: Profile = { id: '9', kind: 'organization', module: 'bx_organizations', display_name: 'Lily Studio', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const group: Profile = { id: '13', kind: 'group', module: 'bx_groups', display_name: 'Lily Gardeners', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };

const activity = (id: string, text: string): Schema<'Activity'> =>
    ({
        id,
        verb: 'posted',
        actor: lily,
        owner_id: '4',
        object: {
            id,
            kind: 'feed_post',
            module: 'bx_timeline',
            author: lily,
            anonymous: false,
            audience: 'public',
            context_id: null,
            card: { title: null, text, body_html: `<p>${text}</p>`, url: null },
            media: [],
            links: [],
            stats: { comments: 0, reactions: 0, reposts: 0, views: 0 },
            published_at: '2026-11-06T10:00:00Z',
            viewer: { reaction: null, favorited: false, can_react: true, can_comment: true, can_edit: false, can_delete: false },
        },
        pinned: false,
        sticky: false,
        promoted: false,
        version: 'v1',
        created_at: '2026-11-06T10:00:00Z',
    }) as Schema<'Activity'>;

const noShortcut = () => undefined;
const local = (profiles: Profile[] = [], active?: string) => [...navigationEntries(noShortcut), ...commandEntries(noShortcut, profiles, active)];

/** A search hit as the API sends it: a Hit (from the Item) with `module` and the activity. */
const hit = (module: string, a: Schema<'Activity'>): Schema<'Hit'> => ({
    id: a.object.id,
    kind: a.object.kind,
    author: a.object.author ?? null,
    card: a.object.card,
    published_at: a.object.published_at,
    module,
    content_id: a.object.id,
    activity: a,
});

describe('palette matching', () => {
    it('ranks the whole label, then its start, a word, keywords, inside, letters in order', () => {
        const e = (label: string, keywords?: string[]) => ({ label, keywords });
        expect(matchScore(e('Home'), 'home')).toBe(0);
        expect(matchScore(e('Home: Hot'), 'home')).toBe(1);
        expect(matchScore(e('Explore: Hot'), 'hot')).toBe(2);
        expect(matchScore(e('New Post', ['compose']), 'comp')).toBe(3);
        expect(matchScore(e('Refresh'), 'fres')).toBe(4);
        expect(matchScore(e('New Post'), 'nwpst')).toBe(5);
        expect(matchScore(e('New Post'), 'xyz')).toBeNull();
        // case and accents do not matter
        expect(matchScore(e('Éloïse'), 'ELOI')).toBe(1);
    });

    it('finds the theme commands by "theme", the first one first', () => {
        const found = filterEntries(local(), 'theme');
        expect(found.map((x) => x.key).slice(0, 3)).toEqual(['cmd:theme-system', 'cmd:theme-light', 'cmd:theme-dark']);
        expect(filterEntries(local(), 'dark mode')[0]?.key).toBe('cmd:theme-dark');
    });

    it('finds compose, sign out and the shortcut sheet by other words', () => {
        expect(filterEntries(local(), 'compose')[0]?.key).toBe('cmd:new-post');
        expect(filterEntries(local(), 'log out')[0]?.key).toBe('cmd:sign-out');
        expect(filterEntries(local(), 'keyboard')[0]?.key).toBe('cmd:show-shortcuts');
        expect(filterEntries(local(), 'unread')[0]?.key).toBe('go:unread');
    });

    it('offers to act as each other profile of the account, not the active one', () => {
        const keys = commandEntries(noShortcut, [lily, lilyOrg], '4').map((x) => x.key);
        expect(keys).toContain('switch:9');
        expect(keys).not.toContain('switch:4');
        expect(filterEntries(local([lily, lilyOrg], '4'), 'switch')[0]?.label).toBe('Switch to Lily Studio');
    });

    it('offers Discussions only where the site has them, as the sidebar does', () => {
        expect(navigationEntries(noShortcut).some((e) => e.label === 'Discussions')).toBe(false);
        expect(navigationEntries(noShortcut, { discussions: true }).find((e) => e.label === 'Discussions')?.action).toEqual({ kind: 'list', list: { section: 'discussions' } });
    });

    it('leaves out what acts on the focused item', () => {
        const keys = commandEntries(noShortcut).map((x) => x.key);
        for (const id of ['next-item', 'react', 'comment', 'close-detail', 'command-palette', 'mark-read']) expect(keys).not.toContain(`cmd:${id}`);
    });
});

describe('palette sections', () => {
    const people = [profileEntry(lily, 'people'), profileEntry(lilyOrg, 'people')];
    const groups = [profileEntry(group, 'groups')];
    const posts = [postEntry(activity('68', 'Lily went to the lake'))];

    it('without a query: what was chosen before, places, commands', () => {
        const recent = new RecentEntries();
        recent.remember(people[0]!);
        const sections = paletteSections('', { local: local(), recent: recent.list(), people, groups, posts });
        expect(sections.map((s) => s.group)).toEqual(['recent', 'go', 'commands']);
        expect(sections[0]?.entries[0]?.label).toBe('Lily Carter');
    });

    it('with a query: matches, then people, groups and posts, and the full search last', () => {
        const sections = paletteSections('lily', { local: local(), recent: [], people, groups, posts });
        expect(sections.map((s) => s.group)).toEqual(['people', 'groups', 'posts', 'search']);
        const all = flatten(sections);
        expect(all[0]?.label).toBe('Lily Carter');
        expect(all[all.length - 1]?.label).toBe('Search for “lily”');
        expect(postEntry(activity('1', '')).label).toBe('Post');
        expect(posts[0]?.detail).toBe('Post by Lily Carter');
    });

    it('keeps each group short', () => {
        const many = Array.from({ length: 9 }, (_, i) => profileEntry({ ...lily, id: String(100 + i) }, 'people'));
        const sections = paletteSections('li', { local: [], recent: [], people: many });
        expect(sections.find((s) => s.group === 'people')?.entries).toHaveLength(5);
    });
});

describe('palette keys and state', () => {
    it('moves the active option round, and by five with Page Up and Down', () => {
        expect(moveActive('ArrowDown', -1, 3)).toBe(0);
        expect(moveActive('ArrowDown', 2, 3)).toBe(0);
        expect(moveActive('ArrowUp', 0, 3)).toBe(2);
        expect(moveActive('ArrowUp', -1, 3)).toBe(2);
        expect(moveActive('PageDown', 1, 10)).toBe(6);
        expect(moveActive('PageDown', 8, 10)).toBe(9);
        expect(moveActive('PageUp', 3, 10)).toBe(0);
        expect(moveActive('ArrowDown', -1, 0)).toBe(-1);
        expect(moveActive('a', 0, 3)).toBeNull();
        expect(moveActive('Home', 0, 3)).toBeNull();
    });

    it('keeps the active entry when results arrive around it', () => {
        const a = searchEntry('a');
        const b = profileEntry(lily, 'people');
        expect(keepActive(b.key, [a, b])).toBe(1);
        expect(keepActive('gone', [a, b])).toBe(0);
        expect(keepActive(null, [a, b])).toBe(0);
        expect(keepActive(null, [])).toBe(-1);
    });

    it('does not make a result for older words the active option', () => {
        const old = profileEntry(lily, 'people');
        const search = searchEntry('tom');
        expect(keepActive(null, [old, search], new Set([old.key]))).toBe(1);
        // one the viewer moved to stays
        expect(keepActive(old.key, [old, search], new Set([old.key]))).toBe(0);
        expect(keepActive(null, [old], new Set([old.key]))).toBe(0);
    });

    it('gives every key its own element id', () => {
        const ids = ['search:анна', 'search:иван', 'search:lily carter', 'search:lily-carter', 'search:lily_carter', 'search:lily carter', 'cmd:new-post', 'post:68'].map(optionId);
        expect(new Set(ids).size).toBe(ids.length);
        for (const id of ids) expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('remembers people, groups, posts and searches, newest first, once each', () => {
        const recent = new RecentEntries(3);
        const person = profileEntry(lily, 'people');
        recent.remember(person);
        recent.remember(local()[0]!); // a place: always listed anyway
        recent.remember(searchEntry('  lake '));
        recent.remember(person);
        expect(recent.list().map((e) => e.label)).toEqual(['Lily Carter', 'lake']);
        expect(recent.list().every((e) => e.group === 'recent')).toBe(true);
        recent.remember(profileEntry(group, 'groups'));
        recent.remember(postEntry(activity('68', 'x')));
        expect(recent.list()).toHaveLength(3);
        recent.forget();
        expect(recent.list()).toHaveLength(0);
    });

    it('says how many results there are', () => {
        expect(resultsText(0, false)).toBe('No results');
        expect(resultsText(1, false)).toBe('1 result');
        expect(resultsText(7, false)).toBe('7 results');
        expect(resultsText(1, true)).toBe('Searching…');
    });
});

// The palette in the app: Ctrl+K from any pane, arrow keys and Enter, Esc gives focus back.

const me = {
    account: { id: '3', email: 'lily@example.com' },
    active_profile_id: '4',
    profiles: [{ ...lily, about: '', created_at: '2026-01-01T00:00:00Z' }],
} as unknown as Schema<'Me'>;

type Answer = { status: number; body?: unknown };

function fakeApi(routes: Record<string, (request: Request) => Answer>, calls: string[]): UnaApi {
    return createUnaApi({
        siteUrl: 'https://community.example',
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            const request = input instanceof Request ? input : new Request(input, init);
            const url = new URL(request.url);
            const path = url.pathname.replace(/^\/api\/v2/, '');
            calls.push(`${request.method} ${path}${url.search}`);
            const handler = routes[`${request.method} ${path}`];
            if (!handler) return new Promise<Response>(() => {});
            const { status, body } = handler(request);
            if (body === undefined) return new Response(null, { status });
            return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' } });
        },
    });
}

const items: NavItem[] = [
    { section: 'home', label: 'Home', command: 'go-home' },
    { section: 'search', label: 'Search', command: 'go-search' },
];

function renderApp(route: Route = sectionRoute('home'), runCommand?: (id: CommandId) => void, routes: Record<string, (request: Request) => Answer> = {}) {
    const calls: string[] = [];
    const api = fakeApi(
        {
            'GET /search/profiles': (r) => ({ status: 200, body: new URL(r.url).searchParams.get('q') === 'tom' ? [] : [lily, lilyOrg] }),
            'GET /search/groups': () => ({ status: 404, body: { type: 'about:blank', title: 'Not Found', status: 404, code: 'no_such_endpoint' } }),
            'GET /search/content': () => ({ status: 200, body: { items: [hit('bx_timeline', activity('68', 'Lily went to the lake'))], next_cursor: null } }),
            ...routes,
        },
        calls,
    );
    const history = new RouteHistory(route);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } }, logger: { log: () => {}, warn: () => {}, error: () => {} } });
    function Harness() {
        const commands = useRef<CommandHandler | null>(null);
        useEffect(() => listenForCommands((id) => commands.current?.(id), { mac: false, nativeMenu: false }), []);
        const ctx: AppContextValue = { api, siteUrl: 'https://community.example', me, signOut: () => {}, signingOut: false, messageTo: () => {}, runCommand };
        return (
            <AppContext.Provider value={ctx}>
                <RouterProvider history={history}>
                    <Shell siteUrl="https://community.example" items={items} commands={commands} profile={lily} />
                </RouterProvider>
            </AppContext.Provider>
        );
    }
    render(
        <QueryClientProvider client={client}>
            <Harness />
        </QueryClientProvider>,
    );
    return { history, calls, client };
}

const ctrlK = () => fireEvent.keyDown(document.activeElement ?? document.body, { key: 'k', code: 'KeyK', ctrlKey: true });
const field = () => screen.getByRole('combobox', { name: 'Go to, search or run a command' });
const activeOption = () => {
    const id = field().getAttribute('aria-activedescendant');
    return id ? document.getElementById(id) : null;
};

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe('the command palette', () => {
    it('opens on Ctrl+K with focus in its field, and Esc puts focus back', async () => {
        renderApp();
        const nav = screen.getByRole('button', { name: /Search/ });
        nav.focus();
        ctrlK();
        await waitFor(() => expect(document.activeElement).toBe(field()));
        expect(field().getAttribute('aria-expanded')).toBe('true');
        expect(within(screen.getByRole('listbox')).getAllByRole('group').map((g) => g.getAttribute('aria-labelledby')).length).toBeGreaterThan(1);
        expect(activeOption()?.textContent).toContain('Home');
        fireEvent.keyDown(field(), { key: 'Escape' });
        await waitFor(() => expect(document.activeElement).toBe(nav));
        expect(document.querySelector('dialog.palette[open]')).toBeNull();
    });

    it('moves with the arrow keys and opens a place with Enter', async () => {
        const { history } = renderApp();
        ctrlK();
        await waitFor(() => expect(document.activeElement).toBe(field()));
        fireEvent.change(field(), { target: { value: 'unread' } });
        await waitFor(() => expect(activeOption()?.textContent).toContain('Notifications: Unread'));
        fireEvent.keyDown(field(), { key: 'ArrowDown' });
        expect(activeOption()?.getAttribute('aria-selected')).toBe('true');
        fireEvent.keyDown(field(), { key: 'ArrowUp' });
        fireEvent.keyDown(field(), { key: 'Enter' });
        expect(routeToPath(history.current)).toBe('/notifications?filter=unread');
    });

    it('runs a command typed by name ("theme")', async () => {
        const run = vi.fn();
        renderApp(sectionRoute('home'), run);
        ctrlK();
        await waitFor(() => expect(document.activeElement).toBe(field()));
        fireEvent.change(field(), { target: { value: 'theme' } });
        fireEvent.keyDown(field(), { key: 'Enter' });
        expect(run).toHaveBeenCalledWith('theme-system');
        expect(document.querySelector('dialog.palette[open]')).toBeNull();
    });

    it('finds people and posts on the site, says how many, and opens one', async () => {
        const { history, calls } = renderApp();
        ctrlK();
        await waitFor(() => expect(document.activeElement).toBe(field()));
        fireEvent.change(field(), { target: { value: 'lily' } });
        const people = await screen.findByRole('group', { name: 'People' });
        expect(within(people).getAllByRole('option').map((o) => o.textContent)).toEqual(['LCLily CarterPerson', 'LSLily StudioOrganization']);
        await screen.findByRole('group', { name: 'Posts' });
        // no Groups on a site without the module, and only one request per kind
        expect(screen.queryByRole('group', { name: 'Groups' })).toBeNull();
        expect(calls.filter((c) => c.startsWith('GET /search/profiles'))).toEqual(['GET /search/profiles?q=lily&limit=5']);
        const dialog = document.querySelector<HTMLElement>('dialog.palette')!;
        await waitFor(() => expect(within(dialog).getByRole('status').textContent).toBe('4 results'));
        expect(activeOption()?.textContent).toContain('Lily Carter');
        fireEvent.keyDown(field(), { key: 'Enter' });
        expect(routeToPath(history.current)).toBe('/profile?id=4');
    });

    it('remembers what was chosen for the next time it opens', async () => {
        renderApp();
        ctrlK();
        await waitFor(() => expect(document.activeElement).toBe(field()));
        fireEvent.change(field(), { target: { value: 'lake' } });
        const posts = await screen.findByRole('group', { name: 'Posts' });
        fireEvent.click(within(posts).getByRole('option'));
        ctrlK();
        await waitFor(() => expect(document.activeElement).toBe(field()));
        const recent = screen.getByRole('group', { name: 'Recent' });
        expect(within(recent).getByRole('option').textContent).toContain('Lily went to the lake');
    });

    it('does not open a result of the last words with Enter while new ones are on their way', async () => {
        const { history } = renderApp();
        ctrlK();
        await waitFor(() => expect(document.activeElement).toBe(field()));
        fireEvent.change(field(), { target: { value: 'lily' } });
        await screen.findByRole('group', { name: 'People' });
        await waitFor(() => expect(activeOption()?.textContent).toContain('Lily Carter'));
        // new words: Lily is still shown, but the full search is the option Enter runs
        fireEvent.change(field(), { target: { value: 'tom' } });
        expect(screen.getByRole('group', { name: 'People' })).toBeTruthy();
        expect(activeOption()?.textContent).toContain('Search for “tom”');
        fireEvent.keyDown(field(), { key: 'Enter' });
        expect(routeToPath(history.current)).toBe('/search?q=tom');
    });

    it('asks nothing for the last words when it opens again', async () => {
        const { calls } = renderApp();
        ctrlK();
        await waitFor(() => expect(document.activeElement).toBe(field()));
        fireEvent.change(field(), { target: { value: 'lily' } });
        await screen.findByRole('group', { name: 'People' });
        fireEvent.keyDown(field(), { key: 'Escape' });
        const before = calls.length;
        ctrlK();
        await waitFor(() => expect(document.activeElement).toBe(field()));
        await new Promise((r) => setTimeout(r, 300));
        expect(calls.slice(before).filter((c) => c.startsWith('GET /search'))).toEqual([]);
    });

    it('loads a post it opens, and forgets one that is gone', async () => {
        const { calls } = renderApp(sectionRoute('home'), undefined, {
            'GET /activities/68': () => ({ status: 404, body: { type: 'about:blank', title: 'Not Found', status: 404, code: 'not_found' } }),
        });
        ctrlK();
        await waitFor(() => expect(document.activeElement).toBe(field()));
        fireEvent.change(field(), { target: { value: 'lake' } });
        const posts = await screen.findByRole('group', { name: 'Posts' });
        fireEvent.click(within(posts).getByRole('option'));
        // the copy the palette had is shown while the thread asks for the post, which is gone
        await waitFor(() => expect(calls).toContain('GET /activities/68'));
        expect(await screen.findByText('This post is gone')).toBeTruthy();
        ctrlK();
        await waitFor(() => expect(document.activeElement).toBe(field()));
        expect(screen.queryByRole('group', { name: 'Recent' })).toBeNull();
    });

    it('opens a profile shown in part with its name, picture and the site page, not a dead end', async () => {
        const studio = { ...lilyOrg, url: 'https://community.example/view-org-profile/lily-studio' };
        renderApp(sectionRoute('home'), undefined, {
            'GET /search/profiles': () => ({ status: 200, body: [studio] }),
            'GET /profiles/9': () => ({ status: 403, body: { type: 'about:blank', title: 'Forbidden', status: 403, code: 'forbidden' } }),
        });
        ctrlK();
        await waitFor(() => expect(document.activeElement).toBe(field()));
        fireEvent.change(field(), { target: { value: 'studio' } });
        const people = await screen.findByRole('group', { name: 'People' });
        fireEvent.click(within(people).getByRole('option'));
        expect(await screen.findByText(/You can’t see this profile here. To see what it shows you or to connect, open it on the site \(More\)/)).toBeTruthy();
        // the site is the way on here, quietly, in More
        fireEvent.click(screen.getByRole('button', { name: 'More for Lily Studio' }));
        expect(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'Open on Site' })).toBeTruthy();
        expect(screen.getAllByText('Lily Studio').length).toBeGreaterThan(0);
    });

    it('opens the Search view with the words', async () => {
        const { history } = renderApp();
        ctrlK();
        await waitFor(() => expect(document.activeElement).toBe(field()));
        fireEvent.change(field(), { target: { value: 'lily carter' } });
        fireEvent.keyDown(field(), { key: 'End' });
        const search = screen.getByRole('option', { name: /Search for “lily carter”/ });
        fireEvent.click(search);
        expect(routeToPath(history.current)).toBe('/search?q=lily+carter');
        await waitFor(() => expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('lily carter'));
    });
});
