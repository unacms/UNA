/**
 * Activities in React Query's cache: every loaded feed (['feed', ...], infinite pages), the last
 * poll of each feed's first page (['feed-head', ...], one page, see use-feed.ts) and each post
 * opened in the detail pane (['activity', id]). Cards render straight from this data, so a change
 * made here shows everywhere the item is.
 *
 * Every helper changes the polled first pages too: they decide the "new posts" pill, and showing
 * the new posts puts the polled page in the list, so a stale copy there would bring back a
 * deleted post or undo a reaction.
 */
import type { InfiniteData, QueryClient } from '@tanstack/react-query';

import type { Schema } from 'una-api';

type Activity = Schema<'Activity'>;
type Item = Schema<'Item'>;
type ItemViewer = Schema<'ItemViewer'>;
type Page = Schema<'Page_Activity'>;
export type FeedData = InfiniteData<Page>;

/** The polled first page of the feed whose pages are under `feedKey`. */
export const headKeyOf = (feedKey: readonly unknown[]): unknown[] => ['feed-head', ...feedKey.slice(1)];

/** One page with `fn` applied to each activity (null drops it); the same object when nothing changed. */
export function mapPage(page: Page, fn: (a: Activity) => Activity | null): Page {
    let changed = false;
    const items: Activity[] = [];
    for (const a of page.items) {
        const next = fn(a);
        if (next !== a) changed = true;
        if (next) items.push(next);
    }
    return changed ? { ...page, items } : page;
}

function mapFeed(data: FeedData | undefined, fn: (a: Activity) => Activity | null): FeedData | undefined {
    if (!data) return data;
    const pages = data.pages.map((page) => mapPage(page, fn));
    return pages.some((page, i) => page !== data.pages[i]) ? { ...data, pages } : data;
}

/**
 * `fn` applied to every loaded feed and every polled first page. A poll on its way was asked
 * before this change, so its answer would undo it: it is called off, and the next poll asks again.
 */
function mapFeeds(queryClient: QueryClient, fn: (a: Activity) => Activity | null): void {
    void queryClient.cancelQueries(['feed-head']);
    queryClient.setQueriesData<FeedData>(['feed'], (data) => mapFeed(data, fn));
    queryClient.setQueriesData<Page>(['feed-head'], (page) => (page ? mapPage(page, fn) : page));
}

/** An activity that is gone (deleted, or hidden from this viewer) leaves every loaded feed. */
export function dropFromFeeds(queryClient: QueryClient, id: string): void {
    mapFeeds(queryClient, (a) => (a.id === id ? null : a));
}

/** A fresh copy of an activity replaces the one in every feed and in the detail cache. */
export function putActivity(queryClient: QueryClient, fresh: Activity): void {
    queryClient.setQueryData(['activity', fresh.id], fresh);
    mapFeeds(queryClient, (a) => (a.id === fresh.id ? fresh : a));
}

/**
 * Change an item wherever it is shown: one item (a post) can be the object of several
 * activities (the post and its reposts), in feeds and in the detail pane.
 */
export function updateItem(queryClient: QueryClient, itemId: string, fn: (item: Item) => Item): void {
    const apply = (a: Activity): Activity => {
        if (a.object.id !== itemId) return a;
        const object = fn(a.object);
        return object === a.object ? a : { ...a, object };
    };
    mapFeeds(queryClient, apply);
    queryClient.setQueriesData<Activity>(['activity'], (data) => (data ? apply(data) : data));
}

/** A post just made goes on top of the feed under `feedKey`, in its pages and in its polled first page. */
export function prependToFeed(queryClient: QueryClient, feedKey: readonly unknown[], created: Activity): void {
    const add = (page: Page): Page => ({ ...page, items: [created, ...page.items.filter((a) => a.id !== created.id)] });
    void queryClient.cancelQueries(headKeyOf(feedKey), { exact: true });
    queryClient.setQueryData<FeedData>(feedKey, (data) => (data?.pages[0] ? { ...data, pages: [add(data.pages[0]), ...data.pages.slice(1)] } : data));
    queryClient.setQueryData<Page>(headKeyOf(feedKey), (page) => (page ? add(page) : page));
}

/** What a guest may do with an item: nothing. The site sends no viewer to guests (null). */
export const NO_VIEWER: ItemViewer = { reaction: null, favorited: false, can_react: false, can_comment: false, can_edit: false, can_delete: false };

/** The viewer's part of an item, all false where the site sent none (a guest's). */
export function viewerOf(item: Pick<Item, 'viewer'>): ItemViewer {
    return item.viewer ?? NO_VIEWER;
}

/** The item as it is once the viewer reacts with `kind`, or takes the reaction back (null). */
export function withReaction(item: Item, kind: string | null): Item {
    const viewer = viewerOf(item);
    const had = viewer.reaction ?? null;
    if (had === kind) return item;
    const delta = had === null ? 1 : kind === null ? -1 : 0;
    return {
        ...item,
        viewer: { ...viewer, reaction: kind },
        stats: { ...item.stats, reactions: Math.max(0, item.stats.reactions + delta) },
    };
}

/** Each activity once, in page order: pages counted by offset can overlap after a refetch. */
export function feedItems(data: FeedData | undefined): Activity[] {
    const seen = new Set<string>();
    const items: Activity[] = [];
    for (const page of data?.pages ?? []) {
        for (const a of page.items) {
            if (seen.has(a.id)) continue;
            seen.add(a.id);
            items.push(a);
        }
    }
    return items;
}
