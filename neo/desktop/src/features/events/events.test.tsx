import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useRef } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { createUnaApi, type Schema, type UnaApi } from 'una-api';

import { AppContext, type AppContextValue } from '../../lib/context';
import { RouterProvider } from '../../lib/navigation';
import { opensInWindow } from '../../lib/open-in-window';
import { contextHasTab, contextRoute, feedRoute, pageRoute, parseRoute, profilePage, type Route, RouteHistory, routeToPath, sectionRoute } from '../../lib/router';
import { profileDetail, setSiteModules } from '../../lib/site-modules';
import { linkRoute } from '../../lib/targets';
import { type CommandHandler, Shell } from '../../shell/shell';
import type { NavItem } from '../../shell/sidebar';
import { contextTabs } from '../groups/group-view';
import { answeredKind, fetchAnyContext } from '../groups/groups';
import { dateTile, type Event, eventGroup, eventWhen, eventZoneNote, withEventHeadings } from './events';

vi.mock('../../lib/native', async (importOriginal) => ({ ...(await importOriginal<typeof import('../../lib/native')>()), confirmAction: vi.fn(async () => true) }));

const lily: Schema<'Profile'> = { id: '4', kind: 'person', module: 'bx_persons', display_name: 'Lily', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const kenji: Schema<'Profile'> = { id: '212', kind: 'person', module: 'bx_persons', display_name: 'Kenji Watanabe', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const me = { account: { id: '3', email: 'lily@example.com' }, active_profile_id: '4', profiles: [lily] } as unknown as Schema<'Me'>;

const MODULES: Schema<'ModuleInfo'>[] = [
    { module: 'bx_groups', tag: 'groups', title: 'Groups', kind: 'group' },
    { module: 'bx_events', tag: 'events', title: 'Events', kind: 'event' },
];

type Viewer = NonNullable<Event['viewer']>;
const viewer = (over: Partial<Viewer> = {}): Viewer => ({
    rsvp: null,
    reaction: null,
    favorited: false,
    can_react: true,
    can_comment: false,
    can_edit: false,
    can_delete: false,
    status: 'none',
    role: null,
    can_join: true,
    join_on_site: false,
    can_leave: false,
    can_post: false,
    ...over,
});

function event(id: string, title: string, starts: string, ends: string, over: Partial<Event> = {}): Event {
    return {
        id,
        module: 'bx_events',
        title,
        summary: `About ${title}`,
        author: kenji,
        context_id: null,
        audience: 'public',
        visibility: 'public',
        join_policy: 'open',
        state: 'published',
        moderation: 'approved',
        handle: title.toLowerCase().replace(/\s+/g, '-'),
        avatar: null,
        cover: null,
        media: [],
        starts_at: starts,
        ends_at: ends,
        all_day: false,
        timezone: 'UTC',
        location: '3 Edale Road, Edale, England, United Kingdom',
        online_url: null,
        capacity: null,
        going_count: 3,
        comments_enabled: true,
        featured: false,
        stats: { comments: 0, reactions: 0, views: 0 },
        content_visible: true,
        content_id: null,
        content_kinds: ['discussions'],
        url: `https://community.example/view-event-profile/${id}`,
        published_at: '2026-01-01T00:00:00Z',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        viewer: viewer(),
        ...over,
    };
}

describe('event times', () => {
    const e = event('1', 'Open Day', '2026-11-09T10:00:00Z', '2026-11-09T16:00:00Z', { timezone: 'Europe/London' });
    const now = new Date('2026-11-07T12:00:00Z');

    it('say when an event is in the viewer’s zone, and the event’s own times where its zone is another', () => {
        expect(eventWhen(e, 'Europe/London', now, 'en-GB')).toBe('Mon 9 Nov, 10:00 – 16:00');
        // in Sydney it ends the next day
        expect(eventWhen(e, 'Australia/Sydney', now, 'en-GB')).toBe('Mon 9 Nov, 21:00 – Tue 10 Nov, 03:00');
        expect(eventZoneNote(e, 'Australia/Sydney', 'en-GB')).toBe('Mon 9 Nov, 10:00 – 16:00 London time');
        // the same offset: nothing to add
        expect(eventZoneNote(e, 'Europe/Lisbon', 'en-GB')).toBe('');
        expect(eventZoneNote(e, 'Europe/London', 'en-GB')).toBe('');
        expect(eventWhen({ starts_at: null, ends_at: null }, 'UTC', now)).toBe('Date to be set');
        expect(eventWhen(event('2', 'Next year', '2027-03-01T09:00:00Z', '2027-03-01T10:00:00Z'), 'UTC', now, 'en-GB')).toBe('Mon, 1 Mar 2027, 09:00 – 10:00');
        expect(dateTile(e, 'Europe/London', 'en-GB')).toEqual({ month: 'NOV', day: '9' });
        expect(dateTile(e, 'Pacific/Kiritimati', 'en-GB')).toEqual({ month: 'NOV', day: '10' });
    });

    it('group upcoming and past events under day headings in the viewer’s zone', () => {
        const zone = 'Europe/London';
        expect(eventGroup(event('a', 'On now', '2026-11-07T09:00:00Z', '2026-11-07T18:00:00Z'), false, zone, now).label).toBe('Happening now');
        expect(eventGroup(event('b', 'Tonight', '2026-11-07T19:00:00Z', '2026-11-07T22:00:00Z'), false, zone, now).label).toBe('Today');
        expect(eventGroup(event('c', 'Tomorrow', '2026-11-08T19:00:00Z', '2026-11-08T22:00:00Z'), false, zone, now).label).toBe('Tomorrow');
        expect(eventGroup(e, false, zone, now).label).toBe('This week');
        expect(eventGroup(event('d', 'Later', '2026-12-06T09:00:00Z', '2026-12-07T17:00:00Z'), false, zone, now, 'en-GB').label).toBe('December');
        expect(eventGroup(event('f', 'Next year', '2027-03-01T09:00:00Z', '2027-03-01T10:00:00Z'), false, zone, now, 'en-GB').label).toBe('March 2027');
        expect(eventGroup(event('g', 'Yesterday', '2026-11-06T09:00:00Z', '2026-11-06T10:00:00Z'), true, zone, now).label).toBe('Yesterday');
        // 23:30 in London is the next day in Sydney
        expect(eventGroup(event('h', 'Late', '2026-11-07T23:30:00Z', '2026-11-08T01:00:00Z'), false, 'Australia/Sydney', now).label).toBe('Tomorrow');

        const rows = withEventHeadings([event('b', 'Tonight', '2026-11-07T19:00:00Z', '2026-11-07T22:00:00Z'), event('b2', 'Also tonight', '2026-11-07T20:00:00Z', '2026-11-07T22:00:00Z'), e], false, zone, now);
        expect(rows.map((r) => (r.kind === 'day' ? `# ${r.label}` : r.event.title))).toEqual(['# Today', 'Tonight', 'Also tonight', '# This week', 'Open Day']);
    });
});

describe('event routes', () => {
    it('have one string form each, the lists as the section’s feeds, and an event as a detail opens as its page', () => {
        expect(routeToPath(contextRoute('event', '821'))).toBe('/events?event=821');
        expect(routeToPath(contextRoute('event', '821', 'attendees'))).toBe('/events?event=821&tab=attendees');
        expect(routeToPath({ list: feedRoute('events', 'past'), detail: null })).toBe('/events?feed=past');
        expect(routeToPath({ list: feedRoute('events', 'upcoming'), detail: null })).toBe('/events');
        expect(parseRoute('/events?feed=going')).toEqual({ list: { section: 'events', feed: 'going' }, detail: null });
        expect(parseRoute('/events')).toEqual(sectionRoute('events'));
        expect(parseRoute('/home/event/821/attendees')).toEqual({ list: { section: 'home' }, detail: { kind: 'event', id: '821', tab: 'attendees' } });
        expect(pageRoute(parseRoute('/notifications/event/821')!)).toEqual(contextRoute('event', '821'));
        expect(opensInWindow({ kind: 'event', id: '821' })).toBe(true);
        // Attendees is an event's tab, Members the others'
        expect(contextHasTab('event', 'attendees')).toBe(true);
        expect(contextHasTab('event', 'members')).toBe(false);
        expect(contextHasTab('group', 'attendees')).toBe(false);
        for (const bad of ['/events?event=821&tab=members', '/groups?group=67&tab=attendees', '/events?feed=hot', '/events?event=abc', '/home/event/821/posts', '/events?feed=past&event=821']) expect(parseRoute(bad), bad).toBeNull();
    });

    it('route an event profile to its page once the site lists Events', () => {
        const e = { id: '821', kind: 'group', module: 'bx_events' } as const;
        setSiteModules(MODULES);
        expect(profileDetail(e)).toEqual({ kind: 'event', id: '821' });
        expect(linkRoute({ kind: 'group', id: '821', item_id: null, thread_id: null, module: 'bx_events' })).toEqual({ kind: 'event', id: '821' });
        setSiteModules(MODULES.filter((m) => m.tag !== 'events'));
        expect(profileDetail(e)).toEqual({ kind: 'profile', id: '821' });
    });

    it('have the tabs of an event, and Events on a context the site lets events into', () => {
        const g = { content_visible: true, content_kinds: ['events', 'discussions'] };
        expect(contextTabs(g, 'event')).toEqual(['posts', 'discussions', 'attendees', 'about']);
        expect(contextTabs(g, 'group')).toEqual(['posts', 'events', 'discussions', 'members', 'about']);
        expect(contextTabs({ content_visible: false, content_kinds: ['events'] }, 'event')).toEqual(['about']);
    });
});

type Call = { method: string; path: string; query: string; body: string };

/**
 * A site with Events: Night Walk (tomorrow, open), Retreat (approval, next month) and a past
 * Pumpkin Night, one group (Design Circle) that takes events, with Critique Evening in it.
 */
function site(opts: { events?: boolean } = {}) {
    const going = new Set<string>(['831']);
    const pending = new Set<string>();
    const now = Date.now();
    const iso = (h: number) => new Date(now + h * 3_600_000).toISOString();
    // tomorrow at noon, local time: "Tomorrow" whatever the hour the tests run
    const noon = new Date(now);
    noon.setDate(noon.getDate() + 1);
    noon.setHours(12, 0, 0, 0);
    const tomorrow = (h: number) => new Date(noon.getTime() + h * 3_600_000).toISOString();
    const base: Record<string, Event> = {
        '832': event('832', 'Open Studio', iso(-1), iso(2)),
        '823': event('823', 'Night Walk', tomorrow(0), tomorrow(3), { location: '1 Oberbaumbruecke, Berlin, Berlin, Germany' }),
        '830': event('830', 'Makers Retreat', iso(24 * 30), iso(24 * 31), { join_policy: 'approval', badges: [{ id: '1', name: 'Verified', color: null, icon: null }] }),
        '831': event('831', 'Pumpkin Night', iso(-24 * 7), iso(-24 * 7 + 3)),
        '829': event('829', 'Critique Evening', iso(24 * 10), iso(24 * 10 + 2), { context_id: '67', audience: 'context', visibility: 'context' }),
    };
    const shown = (id: string): Event => {
        const e = base[id]!;
        if (going.has(id)) return { ...e, going_count: e.going_count + 1, viewer: viewer({ rsvp: 'going', status: 'active', role: 'member', can_join: false, can_leave: true, can_post: true }) };
        if (pending.has(id)) return { ...e, viewer: viewer({ status: 'pending', can_join: false, can_leave: true }) };
        return e;
    };
    const group: Schema<'Group'> = {
        id: '67',
        kind: 'group',
        module: 'bx_groups',
        display_name: 'Design Circle',
        about: '',
        status: 'active',
        created_at: '2026-01-01T00:00:00Z',
        visibility: 'public',
        join_policy: 'open',
        member_count: 4,
        content_visible: true,
        content_kinds: ['events'],
        viewer: { status: 'active', role: 'member', can_join: false, join_on_site: false, can_leave: true, can_post: true, can_edit: false },
    };
    const calls: Call[] = [];
    const json = (status: number, body?: unknown) =>
        body === undefined ? new Response(null, { status }) : new Response(JSON.stringify(body), { status, headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' } });
    const page = (ids: string[]) => ({ status: 200, body: { items: ids.map(shown), next_cursor: null } });
    const answer = (c: Call): { status: number; body?: unknown } | null => {
        if (c.path === '/') return { status: 200, body: { name: 'Makers', api_version: '2', modules: opts.events === false ? MODULES.filter((m) => m.tag !== 'events') : MODULES } };
        if (c.path === '/me/groups') return { status: 200, body: [group] };
        if (c.path === '/me/events') return page(['823', '830', '829'].filter((id) => going.has(id)));
        if (c.path === '/events') {
            if (c.query.includes('context=67')) return page(c.query.includes('when=past') ? [] : ['829']);
            if (c.query.includes('author=212')) return page(c.query.includes('when=past') ? ['831'] : ['823']);
            return page(c.query.includes('when=past') ? ['831'] : ['832', '823', '830']);
        }
        if (c.path === '/profiles/212') return { status: 200, body: kenji };
        // a context known by its id only: neither a group nor a space
        if (/^\/(groups|spaces)\/\d+$/.test(c.path) && c.path !== '/groups/67') return { status: 404, body: { type: 'about:blank', title: 'Not Found', status: 404, code: 'not_found' } };
        if (c.path === '/groups/67') return { status: 200, body: group };
        if (c.path === '/search/events') return { status: 200, body: [shown('823')] };
        const m = /^\/events\/(\d+)(\/rsvp|\/attendees)?$/.exec(c.path);
        if (m?.[1] && base[m[1]]) {
            const id = m[1];
            if (!m[2]) return { status: 200, body: { ...shown(id), body_html: `<p>All about ${base[id]!.title}</p>` } };
            if (m[2] === '/attendees') return { status: 200, body: { items: [{ profile: kenji, status: 'going', created_at: '2026-01-01T00:00:00Z', role: 'owner' }], next_cursor: null } };
            if (c.method === 'PUT') {
                if (base[id]!.join_policy === 'approval') pending.add(id);
                else going.add(id);
                return { status: 200, body: shown(id) };
            }
            if (c.method === 'DELETE') {
                going.delete(id);
                pending.delete(id);
                return { status: 204 };
            }
        }
        if (/^\/profiles\/\d+\/timeline$/.test(c.path)) return { status: 200, body: { items: [], next_cursor: null } };
        if (c.path === '/discussions') return { status: 200, body: { items: [], next_cursor: null } };
        if (c.path === '/discussions/categories') return { status: 404, body: { type: 'about:blank', title: 'Not Found', status: 404, code: 'no_such_endpoint' } };
        return null;
    };
    const api: UnaApi = createUnaApi({
        siteUrl: 'https://community.example',
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            const request = input instanceof Request ? input : new Request(input, init);
            const url = new URL(request.url);
            const c = { method: request.method, path: url.pathname.replace(/^\/api\/v2/, '') || '/', query: url.search, body: request.method === 'GET' ? '' : await request.text() };
            calls.push(c);
            const a = answer(c);
            if (!a) return new Promise<Response>(() => {});
            return json(a.status, a.body);
        },
    });
    return { api, calls };
}

const items: NavItem[] = [
    { section: 'home', label: 'Home', command: 'go-home' },
    { section: 'events', label: 'Events', icon: 'calendar' },
];

function Harness({ history, api }: { history: RouteHistory; api: UnaApi }) {
    const commands = useRef<CommandHandler | null>(null);
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
    return { history, client };
}

const sizes: [keyof HTMLElement, PropertyDescriptor | undefined][] = [];
beforeAll(() => {
    for (const prop of ['clientHeight', 'clientWidth', 'offsetHeight'] as const) {
        sizes.push([prop, Object.getOwnPropertyDescriptor(HTMLElement.prototype, prop)]);
        Object.defineProperty(HTMLElement.prototype, prop, {
            configurable: true,
            get(this: HTMLElement) {
                if (this.classList.contains('pane-body')) return prop === 'clientWidth' ? 600 : 800;
                return 0;
            },
        });
    }
});
afterAll(() => {
    for (const [prop, descriptor] of sizes) if (descriptor) Object.defineProperty(HTMLElement.prototype, prop, descriptor);
});

afterEach(() => {
    cleanup();
    localStorage.clear();
    setSiteModules(null);
});

async function pageRegion(name: string): Promise<HTMLElement> {
    return waitFor(() => {
        const pane = screen.getAllByRole('region', { name }).find((r) => r.dataset.pane === 'list');
        if (!pane) throw new Error(`no page named ${name}`);
        return pane;
    });
}

describe('events in the window', () => {
    it('lists upcoming events under day headings, switches to Going and Past, and opens one as its page', async () => {
        const { api, calls } = site();
        const { history } = renderApp(sectionRoute('events'), api);
        const list = await screen.findByRole('list', { name: 'Upcoming events, soonest first' });
        expect(within(list).getByText('Tomorrow')).toBeTruthy();
        const walk = within(list).getByRole('button', { name: /^Night Walk, / });
        // on now: said with its name, as the hidden heading and Now show it
        expect(within(list).getByText('Happening now')).toBeTruthy();
        expect(within(list).getByRole('button', { name: /^Open Studio, happening now, / })).toBeTruthy();
        expect(within(list).queryByRole('button', { name: /^Night Walk, happening now/ })).toBeNull();
        expect(within(walk.closest('li')!).getByText(/Oberbaumbruecke/)).toBeTruthy();
        // badges after the name
        expect(within(within(list).getByRole('button', { name: /^Makers Retreat, / }).closest('li')!).getByText('Verified')).toBeTruthy();

        fireEvent.click(screen.getByRole('tab', { name: 'Past' }));
        expect(routeToPath(history.current)).toBe('/events?feed=past');
        const past = await screen.findByRole('list', { name: 'Past events, the latest first' });
        expect(within(past).getByRole('button', { name: /^Pumpkin Night, / })).toBeTruthy();
        expect(calls.some((c) => c.path === '/events' && c.query.includes('when=past'))).toBe(true);

        fireEvent.click(screen.getByRole('tab', { name: 'Going' }));
        expect(await screen.findByText('You aren’t going to anything yet')).toBeTruthy();
        expect(calls.some((c) => c.path === '/me/events')).toBe(true);

        fireEvent.click(screen.getByRole('tab', { name: 'Upcoming' }));
        fireEvent.click(within(await screen.findByRole('list', { name: 'Upcoming events, soonest first' })).getByRole('button', { name: /^Night Walk, / }));
        expect(routeToPath(history.current)).toBe('/events?event=823');
        expect(await pageRegion('Night Walk')).toBeTruthy();
    });

    it('opens an event row in a window of its own on a double-click', async () => {
        const opened = vi.spyOn(window, 'open').mockReturnValue(null);
        const { api } = site();
        renderApp(sectionRoute('events'), api);
        const list = await screen.findByRole('list', { name: 'Upcoming events, soonest first' });
        fireEvent.doubleClick(within(list).getByText(/Oberbaumbruecke/));
        expect(opened).toHaveBeenCalledTimes(1);
        expect(opened.mock.calls[0]?.[0]).toContain(encodeURIComponent('/events/event/823'));
        opened.mockRestore();
    });

    it('shows an event’s page with when, where and who, and Going and Not going on its own path', async () => {
        const { api, calls } = site();
        renderApp(contextRoute('event', '823'), api);
        const pane = await pageRegion('Night Walk');
        expect(await within(pane).findByText(/Oberbaumbruecke/)).toBeTruthy();
        expect(within(pane).getByRole('button', { name: 'Kenji Watanabe' })).toBeTruthy();
        expect(within(pane).getByText('3 going')).toBeTruthy();
        const tabs = within(pane).getByRole('tablist', { name: 'Night Walk, event' });
        expect(within(tabs).getAllByRole('tab').map((t) => t.textContent)).toEqual(['Posts', 'Discussions', 'Attendees', 'About']);

        const reads = () => calls.filter((c) => c.method === 'GET' && c.path === '/events/823').length;
        const readsBefore = reads();
        fireEvent.click(within(pane).getByRole('button', { name: 'Going' }));
        await waitFor(() => expect(calls.some((c) => c.method === 'PUT' && c.path === '/events/823/rsvp' && JSON.parse(c.body).status === 'going')).toBe(true));
        expect(await within(pane).findByText('You’re going')).toBeTruthy();
        expect(within(pane).getByText('4 going')).toBeTruthy();
        // the answer to going is the event as it is now: not read again
        expect(reads()).toBe(readsBefore);
        expect(await screen.findByText('You’re going to Night Walk')).toBeTruthy();

        fireEvent.click(within(pane).getByRole('button', { name: 'Not going' }));
        await waitFor(() => expect(calls.some((c) => c.method === 'DELETE' && c.path === '/events/823/rsvp')).toBe(true));
        expect(await within(pane).findByRole('button', { name: 'Going' })).toBeTruthy();
        expect(calls.some((c) => c.path.includes('/membership'))).toBe(false);

        fireEvent.click(within(tabs).getByRole('tab', { name: 'Attendees' }));
        const attendees = await within(pane).findByRole('list', { name: 'Attendees' });
        expect(within(attendees).getByText('Owner')).toBeTruthy();

        fireEvent.click(within(tabs).getByRole('tab', { name: 'About' }));
        expect(await within(pane).findByText('All about Night Walk')).toBeTruthy();
    });

    it('asks to go to an event whose organisers approve', async () => {
        const { api } = site();
        renderApp(contextRoute('event', '830'), api);
        const pane = await pageRegion('Makers Retreat');
        fireEvent.click(await within(pane).findByRole('button', { name: 'Ask to go' }));
        expect(await within(pane).findByRole('button', { name: 'Cancel request' })).toBeTruthy();
        expect(within(pane).getByText('Request sent')).toBeTruthy();
    });

    it('lists a group’s events on its Events tab, and names the group on the event’s page', async () => {
        const { api, calls } = site();
        const { history } = renderApp(contextRoute('group', '67'), api);
        const pane = await pageRegion('Design Circle');
        const tabs = await within(pane).findByRole('tablist', { name: 'Design Circle, group' });
        fireEvent.click(within(tabs).getByRole('tab', { name: 'Events' }));
        expect(routeToPath(history.current)).toBe('/groups?group=67&tab=events');
        expect(within(await within(pane).findByRole('list', { name: 'Upcoming events in Design Circle, soonest first' })).getByRole('button', { name: /^Critique Evening, / })).toBeTruthy();
        expect(calls.some((c) => c.path === '/events' && c.query.includes('context=67'))).toBe(true);
        // its past events too
        const when = within(pane).getByRole('tablist', { name: 'Events in Design Circle' });
        fireEvent.click(within(when).getByRole('tab', { name: 'Past' }));
        expect(await within(pane).findByText('No past events in Design Circle')).toBeTruthy();
        expect(calls.some((c) => c.path === '/events' && c.query.includes('context=67') && c.query.includes('when=past'))).toBe(true);
        fireEvent.click(within(when).getByRole('tab', { name: 'Upcoming' }));
        fireEvent.click(within(await within(pane).findByRole('list', { name: 'Upcoming events in Design Circle, soonest first' })).getByRole('button', { name: /^Critique Evening, / }));
        expect(routeToPath(history.current)).toBe('/events?event=829');
        const event = await pageRegion('Critique Evening');
        fireEvent.click(await within(event).findByRole('button', { name: 'Design Circle' }));
        expect(routeToPath(history.current)).toBe('/groups?group=67');
    });

    it('lists the events a person made on their profile’s Events tab, upcoming and past', async () => {
        const { api, calls } = site();
        renderApp({ list: profilePage('212', 'events'), detail: null }, api);
        const pane = await pageRegion('Kenji Watanabe');
        const tabs = await within(pane).findByRole('tablist', { name: 'Kenji Watanabe’s profile' });
        expect(within(tabs).getByRole('tab', { name: 'Events' }).getAttribute('aria-selected')).toBe('true');
        const list = await within(pane).findByRole('list', { name: 'Upcoming events by Kenji Watanabe, soonest first' });
        expect(within(list).getByRole('button', { name: /^Night Walk, / })).toBeTruthy();
        expect(calls.some((c) => c.path === '/events' && c.query.includes('author=212') && c.query.includes('when=upcoming'))).toBe(true);
        fireEvent.click(within(within(pane).getByRole('tablist', { name: 'Events by Kenji Watanabe' })).getByRole('tab', { name: 'Past' }));
        expect(within(await within(pane).findByRole('list', { name: 'Past events by Kenji Watanabe, the latest first' })).getByRole('button', { name: /^Pumpkin Night, / })).toBeTruthy();
    });

    it('finds an event known by its id only, before the site says its modules', async () => {
        const { api, calls } = site();
        const c = await fetchAnyContext(api, '823');
        expect([c.display_name, answeredKind(c)]).toEqual(['Night Walk', 'event']);
        expect(calls.filter((x) => x.method === 'GET').map((x) => x.path)).toEqual(['/groups/823', '/spaces/823', '/events/823']);
        // a site without Spaces: not asked
        setSiteModules(MODULES);
        calls.length = 0;
        await fetchAnyContext(api, '823');
        expect(calls.map((x) => x.path)).toEqual(['/groups/823', '/events/823']);
    });

    it('has an Events search tab where the site has Events, and none where it does not', async () => {
        const { api } = site();
        renderApp({ list: { section: 'search', q: 'night', tab: 'events' }, detail: null }, api);
        const list = await screen.findByRole('list', { name: 'Events matching “night”' });
        expect(within(list).getByRole('button', { name: /^Night Walk, / })).toBeTruthy();
        cleanup();
        const without = site({ events: false });
        renderApp({ list: { section: 'search', q: 'night' }, detail: null }, without.api);
        await waitFor(() => expect(without.calls.some((c) => c.path === '/')).toBe(true));
        await screen.findByRole('tab', { name: /People/ });
        expect(screen.queryByRole('tab', { name: /Events/ })).toBeNull();
        expect(without.calls.some((c) => c.path === '/search/events')).toBe(false);
    });
});
