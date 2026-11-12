import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { createUnaApi, type Schema, type UnaApi } from 'una-api';

import { ActivityCard } from '../../components/activity-card';
import { AnnounceContext } from '../../lib/announce';
import { AppContext, type AppContextValue } from '../../lib/context';
import { RouterProvider } from '../../lib/navigation';
import { opensInWindow } from '../../lib/open-in-window';
import { parseRoute, type Route, RouteHistory, routeToPath } from '../../lib/router';
import { setSiteModules } from '../../lib/site-modules';
import { ComposeProvider, pollBlocker, useCompose } from '../compose/compose-sheet';
import { contextTabs } from '../groups/group-view';
import { PollCard, resultsWords } from './poll-card';
import { PollsOfTab } from './poll-list';
import { PollPane } from './poll-pane';
import { percents, type Poll, pollRowText, votersText, withVote } from './polls';
import { setRichText } from '../../components/rich-editor/test-utils';

const lily: Schema<'Profile'> = { id: '4', kind: 'person', module: 'bx_persons', display_name: 'Lily Carter', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const marcus: Schema<'Profile'> = { id: '12', kind: 'person', module: 'bx_persons', display_name: 'Marcus Reed', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z', badges: [{ id: '9', name: 'Top contributor', color: null, icon: null }] };
const me = { account: { id: '3', email: 'lily@example.com' }, active_profile_id: '4', profiles: [lily] } as unknown as Schema<'Me'>;

function poll(over: Partial<Poll> = {}): Poll {
    return {
        id: '2',
        content_id: '7630',
        module: 'bx_polls',
        question: 'Which night works best for the open workshop?',
        text_html: null,
        options: [
            { id: '5', title: 'Tuesday', votes: 1 },
            { id: '6', title: 'Wednesday', votes: 1 },
            { id: '7', title: 'Thursday', votes: 3 },
        ],
        voters: 5,
        hidden_results: false,
        results_visible: true,
        image: null,
        author: marcus,
        audience: 'context',
        context_id: '725',
        state: 'published',
        moderation: 'approved',
        stats: { comments: 2, reactions: 1, views: 30 },
        url: 'https://community.example/view-poll/2',
        viewer: { voted: null, can_vote: true, can_delete: false },
        published_at: '2026-11-06T10:00:00Z',
        created_at: '2026-11-06T10:00:00Z',
        updated_at: '2026-11-06T10:00:00Z',
        ...over,
    };
}

describe('what a poll says', () => {
    it('gives whole percents that add up to 100, the largest remainders rounded up', () => {
        expect(percents([{ votes: 1 }, { votes: 1 }, { votes: 1 }])).toEqual([34, 33, 33]);
        expect(percents([{ votes: 1 }, { votes: 1 }, { votes: 3 }])).toEqual([20, 20, 60]);
        expect(percents([{ votes: 2 }, { votes: 0 }, { votes: 1 }])).toEqual([67, 0, 33]);
        expect(percents([{ votes: 0 }, { votes: null }])).toEqual([0, 0]);
    });

    it('says how many voted, and when results wait for a vote', () => {
        expect(votersText(poll())).toBe('5 people voted');
        expect(votersText(poll({ voters: 1 }))).toBe('1 person voted');
        expect(votersText(poll({ voters: 0 }))).toBe('No votes yet');
        expect(votersText(poll({ hidden_results: true, results_visible: false }))).toBe('5 people voted · Results show once you vote');
        expect(pollRowText(poll())).toBe(', by Marcus Reed, 5 people voted, not voted yet');
        expect(pollRowText(poll({ viewer: { voted: '7', can_vote: false } }))).toBe(', by Marcus Reed, 5 people voted, you voted');
        expect(resultsWords(poll())).toBe('Tuesday 20%, 1 vote; Wednesday 20%, 1 vote; Thursday 60%, 3 votes.');
    });

    it('counts one’s vote before the site answers, hidden results staying hidden', () => {
        const after = withVote(poll(), '6');
        expect([after.voters, after.options.map((o) => o.votes), after.viewer]).toEqual([6, [1, 2, 3], { voted: '6', can_vote: false, can_delete: false }]);
        const hidden = withVote(poll({ hidden_results: true, results_visible: false, options: [{ id: '5', title: 'A', votes: null }] }), '5');
        expect(hidden.options[0]?.votes).toBeNull();
    });

    it('is a poll beside a list and in a window of its own, with a Polls tab where the site lets polls in', () => {
        const route: Route = { list: { section: 'spaces', group: '725', groupTab: 'polls' }, detail: { kind: 'poll', id: '2' } };
        expect(routeToPath(route)).toBe('/spaces/poll/2?space=725&tab=polls');
        expect(parseRoute('/spaces/poll/2?space=725&tab=polls')).toEqual(route);
        expect(parseRoute('/profile/poll/2?id=12&tab=polls')).toEqual({ list: { section: 'profile', profile: '12', profileTab: 'polls' }, detail: { kind: 'poll', id: '2' } });
        expect(parseRoute('/spaces/poll/x')).toBeNull();
        expect(opensInWindow({ kind: 'poll', id: '2' })).toBe(true);
        expect(contextTabs({ content_visible: true, content_kinds: ['polls', 'albums', 'discussions'] }, 'group')).toEqual(['posts', 'albums', 'polls', 'discussions', 'members', 'about']);
    });

    it('keeps New poll back until it can be posted, and says why', () => {
        const ok = { pollsRefused: false, audienceOk: true, attached: 0, question: 'Tea or coffee?', filled: ['Yes', 'No'] };
        expect(pollBlocker(ok)).toBeNull();
        expect(pollBlocker({ ...ok, question: '' })).toBe('Ask a question first.');
        expect(pollBlocker({ ...ok, filled: ['Yes'] })).toBe('Add at least 2 answers.');
        expect(pollBlocker({ ...ok, filled: ['Yes', 'yes'] })).toBe('Each answer can be given once.');
        expect(pollBlocker({ ...ok, attached: 1 })).toMatch(/takes no photos/);
        expect(pollBlocker({ ...ok, audienceOk: false })).toMatch(/can’t have this audience/);
        expect(pollBlocker({ ...ok, pollsRefused: true, contextName: 'Night Owls' })).toBe('Polls can’t be added in Night Owls.');
    });
});

type Call = { method: string; path: string; query: string; body: string; key?: string | null };

/** The site's Problem for a refused vote. */
const refusals = {
    409: { type: 'urn:una:problem:already_voted', title: 'Conflict', status: 409, code: 'already_voted', detail: 'The viewer has voted in this poll' },
    403: { type: 'urn:una:problem:forbidden', title: 'Forbidden', status: 403, code: 'forbidden', detail: 'Your membership level does not allow this action' },
    500: { type: 'about:blank', title: 'Internal Server Error', status: 500, detail: 'The vote could not be saved' },
};

function site({ refuse, hidden = false, votedElsewhere = '6' }: { refuse?: keyof typeof refusals; hidden?: boolean; votedElsewhere?: string | null } = {}) {
    const calls: Call[] = [];
    const answer = (c: Call): { status: number; body?: unknown } | null => {
        // the poll as the site has it: voted in another window, or (not open) with no vote to cast
        if (c.path === '/polls/2' && c.method === 'GET') {
            const base = poll();
            return { status: 200, body: votedElsewhere ? { ...base, voters: 6, options: base.options.map((o) => (o.id === votedElsewhere ? { ...o, votes: (o.votes ?? 0) + 1 } : o)), viewer: { voted: votedElsewhere, can_vote: false, can_delete: false } } : refuse === 409 ? { ...base, viewer: { voted: null, can_vote: false, can_delete: false } } : base };
        }
        if (c.path === '/polls/2/vote' && c.method === 'PUT') {
            if (refuse) return { status: refuse, body: refusals[refuse] };
            const { option_id } = JSON.parse(c.body) as { option_id: string };
            const base = poll();
            return { status: 200, body: { ...base, voters: 6, options: base.options.map((o) => (o.id === option_id ? { ...o, votes: (o.votes ?? 0) + 1 } : hidden ? { ...o } : o)), results_visible: true, viewer: { voted: option_id, can_vote: false, can_delete: false } } };
        }
        if (c.path === '/polls' && c.method === 'GET') return { status: 200, body: { items: [poll(), poll({ id: '3', content_id: null, question: 'Tea or coffee?', viewer: { voted: '9', can_vote: false } })], next_cursor: null } };
        return null;
    };
    const api: UnaApi = createUnaApi({
        siteUrl: 'https://community.example',
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            const request = input instanceof Request ? input : new Request(input, init);
            const url = new URL(request.url);
            const c = { method: request.method, path: url.pathname.replace(/^\/api\/v2/, '') || '/', query: url.search, body: request.method === 'GET' ? '' : await request.text(), key: request.headers.get('Idempotency-Key') };
            calls.push(c);
            const a = answer(c);
            if (!a) return new Promise<Response>(() => {});
            return a.body === undefined ? new Response(null, { status: a.status }) : new Response(JSON.stringify(a.body), { status: a.status, headers: { 'Content-Type': 'application/json' } });
        },
    });
    return { api, calls };
}

function renderWith(node: ReactNode, api: UnaApi, route: Route = { list: { section: 'home' }, detail: null }) {
    const said: string[] = [];
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } }, logger: { log: () => {}, warn: () => {}, error: () => {} } });
    const ctx: AppContextValue = { api, siteUrl: 'https://community.example', me, signOut: () => {}, signingOut: false, messageTo: () => {} };
    render(
        <QueryClientProvider client={client}>
            <AppContext.Provider value={ctx}>
                <AnnounceContext.Provider value={(t) => said.push(t)}>
                    <RouterProvider history={new RouteHistory(route)}>{node}</RouterProvider>
                </AnnounceContext.Provider>
            </AppContext.Provider>
        </QueryClientProvider>,
    );
    return { said, client };
}

/** A feed item of a poll, in the cache as a feed has it, so a vote changes it there. */
function activityOf(p: Poll): Schema<'Activity'> {
    return {
        id: '7630',
        verb: 'posted',
        actor: marcus,
        owner_id: '725',
        object: {
            id: '7630',
            kind: 'poll',
            module: 'bx_polls',
            author: marcus,
            anonymous: false,
            audience: 'context',
            context_id: null,
            card: { title: p.question, text: '', body_html: null, url: p.url },
            media: [],
            links: [],
            stats: { comments: 2, reactions: 1, reposts: 0, views: 0 },
            published_at: '2026-11-06T10:00:00Z',
            viewer: { reaction: null, favorited: false, can_react: false, can_comment: true, can_edit: false, can_delete: false },
            poll: p,
            version: 'v1',
        },
        pinned: false,
        sticky: false,
        promoted: false,
        viewer: { reposted: false, can_repost: false },
        created_at: '2026-11-06T10:00:00Z',
        version: 'v1',
    };
}

/** A feed post as a feed renders it: from the cache, so what a vote changes there shows. */
function CachedCard({ client }: { client: QueryClient }) {
    const a = client.getQueryData<Schema<'Activity'>>(['activity', '7630']);
    return a ? <ActivityCard activity={a} /> : null;
}

afterEach(() => {
    cleanup();
    localStorage.clear();
    setSiteModules(null);
});

describe('a poll in place', () => {
    it('votes with its radio group and Vote, then shows the results with the answer marked, and says so', async () => {
        const { api, calls } = site();
        const { said } = renderWith(<PollCard poll={poll()} />, api);
        const group = screen.getByRole('group', { name: 'Which night works best for the open workshop?' });
        const vote = screen.getByRole('button', { name: 'Vote' }) as HTMLButtonElement;
        expect(vote.disabled).toBe(true);
        fireEvent.click(within(group).getByRole('radio', { name: 'Thursday' }));
        expect(vote.disabled).toBe(false);
        fireEvent.click(vote);
        await waitFor(() => expect(said).toEqual(['Voted for Thursday. Tuesday 17%, 1 vote; Wednesday 16%, 1 vote; Thursday 67%, 4 votes.']));
        expect(calls.find((c) => c.method === 'PUT')).toMatchObject({ path: '/polls/2/vote', body: '{"option_id":"7"}' });
        expect(calls.find((c) => c.method === 'PUT')?.key).toMatch(/^[\w-]{16,}$/);
    });

    it('shows the poll as it is when one had voted already (another window, the site), not the form again', async () => {
        const { api, calls } = site({ refuse: 409 });
        const { said, client } = renderWith(<PollCard poll={poll()} />, api);
        client.setQueryData(['poll', '2'], poll());
        fireEvent.click(screen.getByRole('radio', { name: 'Thursday' }));
        fireEvent.click(screen.getByRole('button', { name: 'Vote' }));
        expect((await screen.findByRole('alert')).textContent).toBe('You had already voted in this poll.');
        expect(calls.filter((c) => c.method === 'PUT')).toHaveLength(1);
        expect(calls.some((c) => c.method === 'GET' && c.path === '/polls/2')).toBe(true);
        // the site's poll, in the cache: the answer given elsewhere is the one marked
        expect(client.getQueryData<Poll>(['poll', '2'])?.viewer?.voted).toBe('6');
        expect(said).toEqual([]);
    });

    it('says a poll is not open, and why one can’t vote with one’s membership, keeping the form away', async () => {
        const closed = site({ refuse: 409, votedElsewhere: null });
        const first = renderWith(<PollCard poll={poll()} />, closed.api);
        first.client.setQueryData(['poll', '2'], poll());
        fireEvent.click(screen.getByRole('radio', { name: 'Thursday' }));
        fireEvent.click(screen.getByRole('button', { name: 'Vote' }));
        expect((await screen.findByRole('alert')).textContent).toBe('You can’t vote in this poll.');
        expect(first.client.getQueryData<Poll>(['poll', '2'])?.viewer?.can_vote).toBe(false);
        cleanup();

        const level = site({ refuse: 403 });
        const second = renderWith(<PollCard poll={poll()} />, level.api);
        second.client.setQueryData(['poll', '2'], poll());
        fireEvent.click(screen.getByRole('radio', { name: 'Thursday' }));
        fireEvent.click(screen.getByRole('button', { name: 'Vote' }));
        expect((await screen.findByRole('alert')).textContent).toBe('You can’t vote in polls with your membership.');
        expect(second.client.getQueryData<Poll>(['poll', '2'])?.viewer).toMatchObject({ voted: null, can_vote: false });
    });

    it('sends a vote again with the key it went with when the site did not answer it', async () => {
        const { api, calls } = site({ refuse: 500 });
        renderWith(<PollCard poll={poll()} />, api);
        fireEvent.click(screen.getByRole('radio', { name: 'Thursday' }));
        fireEvent.click(screen.getByRole('button', { name: 'Vote' }));
        expect((await screen.findByRole('alert')).textContent).toMatch(/^Your vote was not counted: /);
        // the form is back, to try again
        fireEvent.click(screen.getByRole('radio', { name: 'Thursday' }));
        fireEvent.click(screen.getByRole('button', { name: 'Vote' }));
        await waitFor(() => expect(calls.filter((c) => c.method === 'PUT')).toHaveLength(2));
        const [a, b] = calls.filter((c) => c.method === 'PUT');
        expect(a?.key).toBeTruthy();
        expect(b?.key).toBe(a?.key);
    });

    it('is named by the pane’s title in the detail pane, the question drawn once as its hero', async () => {
        const { api } = site({ votedElsewhere: null });
        renderWith(<PollPane id="2" />, api, { list: { section: 'home' }, detail: { kind: 'poll', id: '2' } });
        const group = await screen.findByRole('group', { name: 'Which night works best for the open workshop?' });
        expect(group.getAttribute('aria-labelledby')).toBe('detail-title');
        expect(screen.getAllByRole('heading', { name: 'Which night works best for the open workshop?' })).toHaveLength(1);
        const hero = document.querySelector('.profile-name');
        expect([hero?.textContent, hero?.getAttribute('aria-hidden')]).toEqual(['Which night works best for the open workshop?', 'true']);
    });

    it('shows the results of a poll one voted in, the bars hidden from screen readers and the answer said as one’s own', () => {
        const { api } = site();
        renderWith(<PollCard poll={poll({ voters: 5, viewer: { voted: '7', can_vote: false } })} />, api);
        const list = screen.getByRole('list', { name: 'Which night works best for the open workshop?' });
        const rows = within(list).getAllByRole('listitem');
        expect(rows.map((r) => r.textContent?.trim())).toEqual(['Tuesday20%· 1 vote', 'Wednesday20%· 1 vote', 'Thursday, your answer60%· 3 votes']);
        expect(rows[2]?.hasAttribute('data-mine')).toBe(true);
        expect(rows[2]?.querySelector('.poll-bar')?.getAttribute('aria-hidden')).toBe('true');
        expect((rows[2]?.querySelector('.poll-bar-fill') as HTMLElement).style.width).toBe('60%');
        expect(screen.queryByRole('button', { name: 'Vote' })).toBeNull();
        expect(screen.getByText('5 people voted')).toBeTruthy();
    });

    it('keeps the counts of a poll that hides them until one votes', () => {
        const { api } = site();
        renderWith(<PollCard poll={poll({ hidden_results: true, results_visible: false, options: [{ id: '5', title: 'Tuesday', votes: null }, { id: '7', title: 'Thursday', votes: null }], viewer: null })} />, api);
        expect(screen.getAllByRole('listitem').map((r) => r.textContent)).toEqual(['Tuesday', 'Thursday']);
        expect(document.querySelector('.poll-bar')).toBeNull();
        expect(screen.getByText('5 people voted · Results show once you vote')).toBeTruthy();
    });

    it('votes in place on a feed post, the post showing the change, and puts it back with the reason when the site refuses', async () => {
        const { api } = site({ refuse: 500 });
        const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        client.setQueryData(['activity', '7630'], activityOf(poll()));
        const said: string[] = [];
        const ctx: AppContextValue = { api, siteUrl: 'https://community.example', me, signOut: () => {}, signingOut: false, messageTo: () => {} };
        const { rerender } = render(
            <QueryClientProvider client={client}>
                <AppContext.Provider value={ctx}>
                    <AnnounceContext.Provider value={(t) => said.push(t)}>
                        <RouterProvider history={new RouteHistory({ list: { section: 'home' }, detail: null })}>
                            <CachedCard client={client} />
                        </RouterProvider>
                    </AnnounceContext.Provider>
                </AppContext.Provider>
            </QueryClientProvider>,
        );
        // the question is the poll's heading, not the card's title too
        expect(screen.getAllByText('Which night works best for the open workshop?')).toHaveLength(1);
        fireEvent.click(screen.getByRole('radio', { name: 'Tuesday' }));
        fireEvent.click(screen.getByRole('button', { name: 'Vote' }));
        // counted at once in the cached post
        expect(client.getQueryData<Schema<'Activity'>>(['activity', '7630'])?.object.poll?.viewer?.voted).toBe('5');
        await waitFor(() => expect(client.getQueryData<Schema<'Activity'>>(['activity', '7630'])?.object.poll?.viewer?.voted).toBeNull());
        rerender(
            <QueryClientProvider client={client}>
                <AppContext.Provider value={ctx}>
                    <AnnounceContext.Provider value={(t) => said.push(t)}>
                        <RouterProvider history={new RouteHistory({ list: { section: 'home' }, detail: null })}>
                            <CachedCard client={client} />
                        </RouterProvider>
                    </AnnounceContext.Provider>
                </AppContext.Provider>
            </QueryClientProvider>,
        );
        expect(screen.getByRole('radio', { name: 'Tuesday' })).toBeTruthy();
        expect(said).toEqual([]);
    });
});

describe('a Polls tab', () => {
    it('lists a profile’s polls, each row saying who asked, how many voted and whether one did', async () => {
        setSiteModules([{ module: 'bx_polls', tag: 'polls', title: 'Polls', kind: 'poll' }]);
        const { api, calls } = site();
        renderWith(<PollsOfTab of={{ author: '12' }} name="Marcus Reed" />, api);
        const list = await screen.findByRole('list', { name: 'Polls by Marcus Reed, newest first' });
        expect(within(list).getByRole('button', { name: 'Which night works best for the open workshop?, by Marcus Reed, 5 people voted, not voted yet' })).toBeTruthy();
        expect(within(list).getByRole('button', { name: 'Tea or coffee?, by Marcus Reed, 5 people voted, you voted' })).toBeTruthy();
        expect(calls.find((c) => c.path === '/polls')?.query).toContain('author=12');
        // no New poll on a profile's tab
        expect(screen.queryByRole('button', { name: 'New poll' })).toBeNull();
    });
});

function PollOpener() {
    const compose = useCompose();
    return (
        <button type="button" onClick={() => compose?.open(undefined, undefined, { poll: true })}>
            Ask
        </button>
    );
}

describe('New poll in the compose sheet', () => {
    it('asks a question with its answers through POST /polls, Post poll waiting for two different answers', async () => {
        setSiteModules([{ module: 'bx_polls', tag: 'polls', title: 'Polls', kind: 'poll', audiences: ['public', 'friends', 'private'] }]);
        const calls: Call[] = [];
        const api = createUnaApi({
            siteUrl: 'https://community.example',
            fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
                const request = input instanceof Request ? input : new Request(input, init);
                const url = new URL(request.url);
                const c = { method: request.method, path: url.pathname.replace(/^\/api\/v2/, '') || '/', query: url.search, body: request.method === 'GET' ? '' : await request.text() };
                calls.push({ ...c, key: request.headers.get('Idempotency-Key') });
                if (c.path === '/') return new Response(JSON.stringify({ modules: [{ module: 'bx_polls', tag: 'polls', title: 'Polls', kind: 'poll', audiences: ['public', 'friends', 'private'] }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
                // the first answer is lost (a 502 from a proxy); the retry is answered
                if (c.path === '/polls' && c.method === 'POST')
                    return calls.filter((x) => x.method === 'POST').length === 1 ? new Response(null, { status: 502 }) : new Response(JSON.stringify(poll({ id: '30', content_id: null })), { status: 201, headers: { 'Content-Type': 'application/json' } });
                if (c.path === '/me/groups' || c.path === '/me/spaces') return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
                return new Promise<Response>(() => {});
            },
        });
        renderWith(
            <ComposeProvider>
                <PollOpener />
            </ComposeProvider>,
            api,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Ask' }));
        const sheet = await screen.findByRole('dialog', { name: 'New poll' });
        expect(within(sheet).getByRole('button', { name: 'Poll' }).getAttribute('aria-pressed')).toBe('true');
        fireEvent.change(within(sheet).getByRole('textbox', { name: 'Answer 1' }), { target: { value: 'Friday' } });
        fireEvent.change(within(sheet).getByRole('textbox', { name: 'Answer 2' }), { target: { value: 'friday' } });
        const post = within(sheet).getByRole('button', { name: 'Post poll' }) as HTMLButtonElement;
        // no question yet: Post poll is off and says why
        expect(post.disabled).toBe(true);
        expect(document.getElementById(post.getAttribute('aria-describedby') ?? '')?.textContent).toBe('Ask a question first.');
        setRichText(within(sheet).getByRole('textbox', { name: 'Question' }), 'Which day suits you?');
        expect(post.disabled).toBe(true);
        expect(within(sheet).getByText('Each answer can be given once.')).toBeTruthy();
        fireEvent.change(within(sheet).getByRole('textbox', { name: 'Answer 2' }), { target: { value: 'Saturday' } });
        // Enter in the last answer adds one, with focus in it
        fireEvent.keyDown(within(sheet).getByRole('textbox', { name: 'Answer 2' }), { key: 'Enter' });
        await waitFor(() => expect(document.activeElement).toBe(within(sheet).getByRole('textbox', { name: 'Answer 3' })));
        expect(post.disabled).toBe(false);
        fireEvent.click(post);
        await waitFor(() => expect(calls.some((c) => c.method === 'POST' && c.path === '/polls')).toBe(true));
        expect(JSON.parse(calls.find((c) => c.method === 'POST' && c.path === '/polls')?.body ?? '{}')).toEqual({ question: 'Which day suits you?', options: ['Friday', 'Saturday'], hidden_results: false, audience: 'public' });
        // sent again after the answer was lost: the same key, so the site makes one poll
        await waitFor(() => expect(post.disabled).toBe(false));
        fireEvent.click(post);
        await waitFor(() => expect(calls.filter((c) => c.method === 'POST' && c.path === '/polls')).toHaveLength(2));
        const [first, retry] = calls.filter((c) => c.method === 'POST' && c.path === '/polls');
        expect(first?.key).toBeTruthy();
        expect(retry?.key).toBe(first?.key);
        await waitFor(() => expect(screen.queryByRole('dialog', { name: 'New poll' })).toBeNull());
    });
});
