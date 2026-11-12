/**
 * Polls (the bx_polls module, GET /polls and the paths under it): the query keys, the lists (a
 * context's or a profile's Polls tab), voting, what the results say, and what changes in the
 * cache when one votes. A poll shows in the feeds as its Item with `Item.poll`, so a vote changes
 * that item wherever it is shown, as well as the poll's own answer and its lists. Its comments
 * and reactions are those of its Item (`content_id`).
 */
import type { InfiniteData, QueryClient } from '@tanstack/react-query';

import type { Schema, UnaApi } from 'una-api';

import { unwrap } from '../../lib/api';
import { t, tn } from '../../lib/i18n';
import { updateItem } from '../feed/cache';

export type Poll = Schema<'Poll'>;
export type PollOption = Schema<'PollOption'>;
export type PollPage = Schema<'Page_Poll'>;

/** How many a page of a list loads. */
export const POLLS_PAGE = 20;
/** How many answers a new poll may have (the API's NewPoll). */
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 10;
export const OPTION_MAX_LENGTH = 255;

/** Whose polls a list shows: a context's (`context`) or a profile's (`author`). */
export type PollsOf = { context: string } | { author: string };

export const pollListKey = (of: PollsOf) => ('context' in of ? (['polls', 'list', 'context', of.context] as const) : (['polls', 'list', 'author', of.author] as const));
export const pollKey = (id: string) => ['poll', id] as const;

/** A page of a list of polls, the newest first. */
export async function fetchPolls(api: UnaApi, of: PollsOf, cursor: string | undefined, limit = POLLS_PAGE): Promise<PollPage> {
    const filter = 'context' in of ? { context: of.context } : { author: of.author };
    return unwrap(await api.GET('/polls', { params: { query: { ...filter, cursor, limit } } }));
}

/** PUT /polls/{id}/vote: the poll with the vote counted. */
/** A vote; a retry of one whose answer never came sends the key it went with. */
export async function votePoll(api: UnaApi, id: string, optionId: string, idempotencyKey?: string): Promise<Poll> {
    return unwrap(await api.PUT('/polls/{id}/vote', { params: { path: { id }, header: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined }, body: { option_id: optionId } }));
}

/** The poll as it is now (after the site refused a vote the card thought it could cast). */
export async function fetchPoll(api: UnaApi, id: string): Promise<Poll> {
    return unwrap(await api.GET('/polls/{id}', { params: { path: { id } } }));
}

/**
 * The poll as it is now, everywhere it is shown: its feed item (the posts and reposts of it, in
 * every feed and in the thread), its own answer and the lists it is in.
 */
export function putPoll(queryClient: QueryClient, poll: Poll): void {
    if (poll.content_id) updateItem(queryClient, poll.content_id, (item) => (item.poll?.id === poll.id ? { ...item, poll: { ...poll, text_html: item.poll.text_html ?? null } } : item));
    queryClient.setQueryData<Poll>(pollKey(poll.id), (old) => (old ? { ...poll, text_html: poll.text_html ?? old.text_html ?? null } : old));
    queryClient.setQueriesData<InfiniteData<PollPage>>(['polls', 'list'], (data) =>
        data ? { ...data, pages: data.pages.map((page) => (page.items.some((p) => p.id === poll.id) ? { ...page, items: page.items.map((p) => (p.id === poll.id ? { ...poll, text_html: null } : p)) } : page)) } : data,
    );
}

/** The poll as one voted for this answer, before the site answers: counted, the results shown. */
export function withVote(poll: Poll, optionId: string): Poll {
    return {
        ...poll,
        voters: poll.voters + 1,
        // hidden results stay hidden until the site sends them with the vote
        options: poll.options.map((o) => (o.id === optionId && o.votes !== null ? { ...o, votes: o.votes + 1 } : o)),
        viewer: poll.viewer ? { ...poll.viewer, voted: optionId, can_vote: false } : poll.viewer,
    };
}

/** A poll found in the cache: its own answer, a list's row or a feed item's. */
export function pollFromCache(queryClient: QueryClient, id: string): Poll | undefined {
    const own = queryClient.getQueryData<Poll>(pollKey(id));
    if (own) return own;
    for (const [, data] of queryClient.getQueriesData<InfiniteData<PollPage>>(['polls', 'list'])) {
        const found = data?.pages.flatMap((p) => p.items).find((p) => p.id === id);
        if (found) return found;
    }
    return undefined;
}

/** Each answer's share of the votes, whole percent, summing to 100 (largest remainders). */
export function percents(options: readonly Pick<PollOption, 'votes'>[]): number[] {
    const votes = options.map((o) => o.votes ?? 0);
    const total = votes.reduce((a, b) => a + b, 0);
    if (!total) return votes.map(() => 0);
    const exact = votes.map((v) => (v * 100) / total);
    const out = exact.map(Math.floor);
    let left = 100 - out.reduce((a, b) => a + b, 0);
    const order = exact.map((x, i) => [x - Math.floor(x), i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
    for (const [, i] of order) {
        if (left <= 0) break;
        if (votes[i]) {
            out[i] = (out[i] ?? 0) + 1;
            left -= 1;
        }
    }
    return out;
}

/** "1 vote", "12 votes". */
export function votesText(n: number): string {
    return tn(n, '{{count}} vote', '{{count}} votes');
}

/** What the poll's foot says: how many voted, and when results wait for a vote. */
export function votersText(poll: Pick<Poll, 'voters' | 'results_visible' | 'hidden_results'>): string {
    const n = poll.voters ? tn(poll.voters, '{{count}} person voted', '{{count}} people voted') : t('No votes yet');
    return poll.hidden_results && !poll.results_visible ? `${n} · ${t('Results show once you vote')}` : n;
}

/** What a list row says of a poll to screen readers after its question. */
export function pollRowText(poll: Poll): string {
    const by = poll.author ? t('by {{name}}', { name: poll.author.display_name }) : null;
    const voted = poll.viewer?.voted ? t('you voted') : poll.viewer?.can_vote ? t('not voted yet') : null;
    return `, ${[by, votersText(poll), voted].filter(Boolean).join(', ')}`;
}
