/**
 * Discussions (the bx_forum module, GET /discussions and the paths under it): the query keys,
 * whether the site has them, the words a row says and what changes in the cache when one is
 * started, edited or deleted. A discussion's replies are the comments of its Item
 * (`content_id`), so the thread's comment tree shows them unchanged.
 */
import { type InfiniteData, type QueryClient, useQuery } from '@tanstack/react-query';

import type { Schema } from 'una-api';

import { ApiError, unwrap } from '../../lib/api';
import { useApp } from '../../lib/context';
import { t, tn } from '../../lib/i18n';
import type { FeedName } from '../../lib/router';
import { useSiteModules } from '../../lib/site-modules';

export type Discussion = Schema<'Discussion'>;
export type DiscussionPage = Schema<'Page_Discussion'>;
export type DiscussionSort = 'latest' | 'new';

export const discussionListKey = (sort: DiscussionSort, groupId?: string | null, category?: string | null) => ['discussions', 'list', sort, groupId ?? '', category ?? ''] as const;
/** The categories and whether the viewer may start one; null on a site without the module. */
export const DISCUSSION_SETUP_KEY = ['discussions', 'setup'] as const;
export const discussionKey = (id: string) => ['discussion', id] as const;

/** How many a page of the list loads. */
export const DISCUSSIONS_PAGE = 30;

/** The sort a list route asks for: Active (the latest reply first) unless it says New. */
export function discussionSort(feed: FeedName | undefined): DiscussionSort {
    return feed === 'new' ? 'new' : 'latest';
}

export const SORT_LABELS: Record<DiscussionSort, string> = { latest: t('Active'), new: t('New') };

/**
 * GET /discussions/categories: the categories, and whether the viewer may start one. Null
 * (no error) on a site without Discussions, whose API has no such path, so Refresh does not
 * fail on it. Whether the site has Discussions is useHasDiscussions.
 */
export function useDiscussionSetup(enabled = true) {
    const { api } = useApp();
    return useQuery({
        enabled,
        queryKey: DISCUSSION_SETUP_KEY,
        queryFn: async (): Promise<Schema<'DiscussionCategories'> | null> => {
            try {
                return unwrap(await api.GET('/discussions/categories'));
            } catch (e) {
                if (e instanceof ApiError && e.status === 404) return null;
                throw e;
            }
        },
        staleTime: 5 * 60_000,
    });
}

/**
 * Whether the site has Discussions (the sidebar's row, Search's tab, the palette's entry): as
 * GET /api/v2 `modules` says, null until it answered. Only a site that sends no module list is
 * asked GET /discussions/categories for it (404: none).
 */
export function useHasDiscussions(): boolean | null {
    const modules = useSiteModules().data;
    const setup = useDiscussionSetup(modules === null);
    if (modules === undefined) return null;
    if (modules === null) return setup.data === undefined ? null : setup.data !== null;
    return modules.some((m) => m.tag === 'discussions');
}

/** "3 replies", "1 reply", "No replies". */
export function repliesText(n: number): string {
    if (!n) return t('No replies');
    return tn(n, '{{count}} reply', '{{count}} replies');
}

/** When the discussion last moved: its last reply, else when it was started. */
export function lastActivity(d: Pick<Discussion, 'last_reply_at' | 'created_at'>): string {
    return d.last_reply_at ?? d.created_at;
}

/**
 * The second line of a row: who started it and its category ("Lily Carter · General"), and
 * the group it is in when there is one.
 */
export function startedLine(d: Discussion, groupName?: string | null): string {
    const parts = [d.anonymous ? t('Anonymous') : (d.author?.display_name ?? t('Someone')), d.category?.title, groupName ? t('in {{group}}', { group: groupName }) : null];
    return parts.filter(Boolean).join(' · ');
}

/** The third line: the replies, and who replied last ("3 replies, last from Lily"). */
export function repliesLine(d: Discussion, myIds: ReadonlySet<string>): string {
    const by = d.last_reply_by;
    if (!d.stats.replies || !by) return repliesText(d.stats.replies);
    if (myIds.has(by.id)) return tn(d.stats.replies, '{{count}} reply, last from you', '{{count}} replies, last from you');
    return tn(d.stats.replies, '{{count}} reply, last from {{name}}', '{{count}} replies, last from {{name}}', { name: by.display_name.split(/\s+/)[0] ?? by.display_name });
}

/** What a row's state adds to its name for screen readers: pinned, closed to replies. */
export function stateText(d: Pick<Discussion, 'sticky' | 'locked' | 'resolved'>): string {
    const out: string[] = [];
    if (d.sticky) out.push(t('pinned'));
    if (d.locked) out.push(t('closed to replies'));
    if (d.resolved === true) out.push(t('answered'));
    return out.length ? `, ${out.join(', ')}` : '';
}

type Pages = InfiniteData<DiscussionPage>;

/** A discussion as a list already loaded it, so the detail shows it at once. */
export function fromLists(queryClient: QueryClient, id: string): Discussion | undefined {
    for (const [, data] of queryClient.getQueriesData<Pages>(['discussions', 'list'])) {
        for (const page of data?.pages ?? []) {
            const found = page.items.find((d) => d.id === id);
            if (found) return found;
        }
    }
    return undefined;
}

/** A discussion as the site has it now: in its detail and wherever a list shows it. */
export function putDiscussion(queryClient: QueryClient, fresh: Discussion): void {
    queryClient.setQueryData(discussionKey(fresh.id), fresh);
    queryClient.setQueriesData<Pages>(['discussions', 'list'], (data) =>
        data ? { ...data, pages: data.pages.map((p) => ({ ...p, items: p.items.map((d) => (d.id === fresh.id ? fresh : d)) })) } : data,
    );
}

/** A discussion that is gone: out of every list, its detail forgotten. */
export function dropDiscussion(queryClient: QueryClient, id: string): void {
    queryClient.removeQueries(discussionKey(id));
    queryClient.setQueriesData<Pages>(['discussions', 'list'], (data) =>
        data ? { ...data, pages: data.pages.map((p) => ({ ...p, items: p.items.filter((d) => d.id !== id) })) } : data,
    );
}
