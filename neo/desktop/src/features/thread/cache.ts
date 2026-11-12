/**
 * Comments in React Query's cache: the top-level comments of an item (['comments', itemId]) and
 * the replies under one top-level comment (['replies', commentId]), both infinite pages. A
 * comment's id is global (the API's unique comment id), so one helper finds it in any list.
 */
import type { InfiniteData, QueryClient } from '@tanstack/react-query';

import type { Schema } from 'una-api';

type Comment = Schema<'Comment'>;
type Page = Schema<'Page_Comment'>;
export type CommentsData = InfiniteData<Page>;

export const commentsKey = (itemId: string) => ['comments', itemId] as const;
export const repliesKey = (commentId: string) => ['replies', commentId] as const;

/** Each comment once, in page order: pages counted by offset can overlap after a change. */
export function commentItems(data: CommentsData | undefined): Comment[] {
    const seen = new Set<string>();
    const items: Comment[] = [];
    for (const page of data?.pages ?? []) {
        for (const c of page.items) {
            if (seen.has(c.id)) continue;
            seen.add(c.id);
            items.push(c);
        }
    }
    return items;
}

/** `fn` applied to each comment of the pages (null drops it); the same object when nothing changed. */
export function mapComments(data: CommentsData | undefined, fn: (c: Comment) => Comment | null): CommentsData | undefined {
    if (!data) return data;
    let changed = false;
    const pages = data.pages.map((page) => {
        let pageChanged = false;
        const items: Comment[] = [];
        for (const c of page.items) {
            const next = fn(c);
            if (next !== c) pageChanged = true;
            if (next) items.push(next);
        }
        if (!pageChanged) return page;
        changed = true;
        return { ...page, items };
    });
    return changed ? { ...data, pages } : data;
}

function mapAll(queryClient: QueryClient, fn: (c: Comment) => Comment | null): void {
    for (const prefix of ['comments', 'replies']) queryClient.setQueriesData<CommentsData>([prefix], (data) => mapComments(data, fn));
}

/** A comment as the site now has it (after an edit) replaces the cached copy. */
export function putComment(queryClient: QueryClient, fresh: Comment): void {
    mapAll(queryClient, (c) => (c.id === fresh.id ? fresh : c));
}

/**
 * A deleted comment leaves every list, with the replies under it (a moderator's delete takes
 * them along, and their replies too), and the comment it answered has one reply less.
 *
 * Lists page by offset: a list that lost a comment and has more pages would skip one when the
 * next page is asked for, so such a list is loaded again.
 */
export function dropComment(queryClient: QueryClient, gone: Comment): void {
    const lists = [...queryClient.getQueriesData<CommentsData>(['comments']), ...queryClient.getQueriesData<CommentsData>(['replies'])];
    const cached = lists.flatMap(([, data]) => commentItems(data));
    const ids = new Set([gone.id]);
    for (let grew = true; grew; ) {
        grew = false;
        for (const c of cached) {
            if (c.parent_id && ids.has(c.parent_id) && !ids.has(c.id)) {
                ids.add(c.id);
                grew = true;
            }
        }
    }
    const shifted = lists.filter(([, data]) => !!data?.pages[data.pages.length - 1]?.next_cursor && commentItems(data).some((c) => ids.has(c.id))).map(([key]) => key);

    mapAll(queryClient, (c) => {
        if (ids.has(c.id)) return null;
        if (c.id === gone.parent_id) return { ...c, replies: Math.max(0, c.replies - 1) };
        return c;
    });
    for (const id of ids) queryClient.removeQueries(repliesKey(id), { exact: true });
    for (const key of shifted) void queryClient.invalidateQueries(key, { exact: true });
}

/** A reply was just written to `parentId`: one more reply there. */
export function countReply(queryClient: QueryClient, parentId: string): void {
    mapAll(queryClient, (c) => (c.id === parentId ? { ...c, replies: c.replies + 1 } : c));
}

/** A new comment goes at the end of a list whose last page is loaded; otherwise the list reloads when shown. */
export function appendComment(queryClient: QueryClient, key: readonly unknown[], created: Comment): void {
    const data = queryClient.getQueryData<CommentsData>(key);
    const last = data?.pages[data.pages.length - 1];
    if (!data || !last) {
        void queryClient.invalidateQueries(key, { exact: true });
        return;
    }
    if (last.next_cursor) {
        void queryClient.invalidateQueries(key, { exact: true });
        return;
    }
    queryClient.setQueryData<CommentsData>(key, {
        ...data,
        pages: [...data.pages.slice(0, -1), { ...last, items: [...last.items.filter((c) => c.id !== created.id), created] }],
    });
}
