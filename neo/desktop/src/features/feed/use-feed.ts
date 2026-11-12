/**
 * A feed's data: its loaded pages, and a poll of its first page that brings newer posts.
 *
 * The pages never refetch on their own (no focus or interval refetch), because a refetch moves
 * what the person is reading. Instead a small query polls the first page (cheap with ETags, see
 * etag-fetch.ts): posts already shown get its fresh counts and reactions in place, and posts
 * that are new wait behind the "new posts" pill until the person asks for them.
 *
 * With a sockets server (lib/realtime.ts) the site says when a post was added, edited or
 * removed: the first page is checked at once (at most every few seconds), a removed post leaves
 * the feed, and an edited one that is open loads again. The poll stays, for a site without one.
 */
import { type QueryClient, useInfiniteQuery, type UseInfiniteQueryResult, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';

import type { Schema } from 'una-api';

import { useFillEmptyPages } from '../../lib/paging';
import { coalesce, eventId, useRealtime, useRealtimeStatus } from '../../lib/realtime';
import { dropFromFeeds, type FeedData, feedItems, headKeyOf } from './cache';

type Page = Schema<'Page_Activity'>;
type Activity = Schema<'Activity'>;

export const PAGE_SIZE = 20;
/** How often the first page is checked for newer posts while the window is in front. */
export const POLL_MS = 60_000;
/** Coming back to the window checks again once the last check is this old. */
export const HEAD_STALE_MS = 10_000;
/** A live event checks the first page at most this often (a busy site posts all the time). */
export const LIVE_CHECK_MS = 3_000;

export type FeedSource = {
    /** The pages' query key; it starts with 'feed', where the cache helpers (cache.ts) look. */
    key: readonly ['feed', ...unknown[]];
    load: (cursor: string | undefined) => Promise<Page>;
    enabled?: boolean;
    /**
     * Ordered by rank (Hot, For you), not by time: an older post can rise into the first page,
     * so only posts newer than the newest one shown count as new.
     */
    ranked?: boolean;
    /** Poll the first page for newer posts (the default); search results don't. */
    poll?: boolean;
};

export type Feed = {
    query: UseInfiniteQueryResult<Page>;
    /** The loaded activities, each once, newest first. */
    items: Activity[];
    /** Newer posts the poll found that are not shown yet. */
    newIds: string[];
    newCount: number;
    /** More new posts than the first page holds. */
    manyNew: boolean;
    /** Up to 3 authors of the new posts, for the pill (anonymous posts show none). */
    newAuthors: Schema<'Profile'>[];
    /** Show the newer posts: the list starts over at the polled first page. Returns the first id. */
    showNew: () => string | null;
};

/** Shown activities take the fresh copies from the first page, in place; the order stays. */
export function refreshShown(queryClient: QueryClient, key: readonly unknown[], fresh: readonly Activity[]): void {
    if (!fresh.length) return;
    const byId = new Map(fresh.map((a) => [a.id, a]));
    queryClient.setQueryData<FeedData>(key, (data) =>
        data ? { ...data, pages: data.pages.map((page) => ({ ...page, items: page.items.map((a) => byId.get(a.id) ?? a) })) } : data,
    );
}

/**
 * The first page's activities that are not shown yet. In a ranked feed only those newer than
 * the newest shown post: one that is not shown may just have moved up.
 */
export function findNew(head: readonly Activity[], shown: readonly Activity[], ranked = false): Activity[] {
    const ids = new Set(shown.map((a) => a.id));
    const unseen = head.filter((a) => !ids.has(a.id));
    if (!ranked || !shown.length) return unseen;
    let newest = -Infinity;
    for (const a of shown) newest = Math.max(newest, Date.parse(a.created_at));
    return unseen.filter((a) => Date.parse(a.created_at) > newest);
}

/** How many of the first page's activities are new (see findNew). */
export function countNew(head: readonly Activity[], shown: readonly Activity[], ranked = false): number {
    return findNew(head, shown, ranked).length;
}

/** The first three different authors of the new posts (an anonymous post shows nobody). */
export function newAuthorsOf(fresh: readonly Activity[], max = 3): Schema<'Profile'>[] {
    const out: Schema<'Profile'>[] = [];
    for (const a of fresh) {
        const who = a.object.anonymous ? null : (a.object.author ?? a.actor ?? null);
        if (who && !out.some((p) => p.id === who.id)) out.push(who);
        if (out.length >= max) break;
    }
    return out;
}

export function useFeed(source: FeedSource): Feed {
    const queryClient = useQueryClient();
    const enabled = source.enabled ?? true;
    const { key, load, ranked = false, poll = true } = source;
    const headKey = useMemo(() => headKeyOf(key), [key]);

    const query = useInfiniteQuery({
        queryKey: key,
        queryFn: async ({ pageParam }) => {
            const page = await load(pageParam as string | undefined);
            // a first page just loaded is also the latest poll: no second request for it
            if (pageParam === undefined) queryClient.setQueryData(headKey, page);
            return page;
        },
        getNextPageParam: (last) => last.next_cursor ?? undefined,
        enabled,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
    });
    useFillEmptyPages(query);
    const items = useMemo(() => feedItems(query.data), [query.data]);

    const head = useQuery({
        queryKey: headKey,
        queryFn: () => load(undefined),
        enabled: enabled && poll && !!query.data,
        staleTime: HEAD_STALE_MS,
        refetchInterval: POLL_MS,
        refetchOnWindowFocus: true,
    });

    // the site's word that something changed: check the first page now, not at the next poll
    const live = useRealtimeStatus().channels.activities;
    const checkHead = useMemo(() => coalesce(() => void queryClient.invalidateQueries({ queryKey: headKey, exact: true }), LIVE_CHECK_MS), [queryClient, headKey]);
    useRealtime(enabled && poll ? live : null, (e) => {
        const id = eventId(e);
        if (e.event === 'deleted' && id) dropFromFeeds(queryClient, id);
        else if (e.event === 'edited' && id) void queryClient.invalidateQueries({ queryKey: ['activity', id], exact: true });
        if (query.data) checkHead();
    });

    // a poll's fresh counts and reactions reach the cards already shown
    const headData = head.data;
    const polledAt = head.dataUpdatedAt;
    useEffect(() => {
        if (headData && polledAt > query.dataUpdatedAt) refreshShown(queryClient, key, headData.items);
        // only a new poll answer brings anything
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [polledAt]);

    // Loading the next page leaves the count alone; a refetch from the start (Cmd+R) hides it
    // until the pages are back, since what is shown is about to change.
    const ready = query.isSuccess && (!query.isFetching || query.isFetchingNextPage);
    const fresh = useMemo(() => (ready && headData ? findNew(headData.items, items, ranked) : []), [ready, headData, items, ranked]);
    const newIds = useMemo(() => fresh.map((a) => a.id), [fresh]);
    const newCount = newIds.length;
    const newAuthors = useMemo(() => newAuthorsOf(fresh), [fresh]);
    const manyNew = newCount > 0 && !!headData && newCount === headData.items.length && !!headData.next_cursor;

    const showNew = useCallback((): string | null => {
        const page = queryClient.getQueryData<Page>(headKey);
        if (!page) return null;
        // the list starts over at the polled page; older pages load again by its cursor
        queryClient.setQueryData<FeedData>(key, { pages: [page], pageParams: [undefined] });
        return page.items[0]?.id ?? null;
    }, [queryClient, headKey, key]);

    return { query, items, newIds, newCount, manyNew, newAuthors, showNew };
}
