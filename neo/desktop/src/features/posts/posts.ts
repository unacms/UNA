/**
 * Posts of the Posts module (bx_posts, GET /posts and the paths under it): long posts with a
 * title, a summary and a cover, not the Timeline's feed posts. The query keys, the lists (the
 * Posts section, a context's or a profile's Posts tab, one's own), what a row says, and where a
 * feed item of a post opens: its Item names the post (`Item.entry_id`), so the card opens the
 * post's own view. Its comments and reactions are those of its Item (`content_id`).
 */
import type { InfiniteData, QueryClient } from '@tanstack/react-query';

import type { Schema, UnaApi } from 'una-api';

import { ago, unwrap } from '../../lib/api';
import { locale, t, tn } from '../../lib/i18n';
import type { DetailRoute, FeedName } from '../../lib/router';

export type Post = Schema<'Post'>;
export type PostPage = Schema<'Page_Post'>;
type Activity = Schema<'Activity'>;

/** How many a page of a list loads. */
export const POSTS_PAGE = 20;
/** The title lengths the site's post form takes (the API's NewPost). */
export const TITLE_MIN = 3;
export const TITLE_MAX = 160;
export const SUMMARY_MAX = 5000;
/** The most the site keeps of a post's text, counted in characters of its HTML. */
export const TEXT_MAX = 100000;

/** The Posts section's tabs: the newest, the most viewed, one's own in every state. */
export type PostsFeed = Extract<FeedName, 'latest' | 'popular' | 'mine'>;
export const POSTS_FEEDS: readonly PostsFeed[] = ['latest', 'popular', 'mine'];
export const FEED_LABELS: Record<PostsFeed, string> = { latest: t('Latest'), popular: t('Popular'), mine: t('Mine') };

/** Whose posts a list shows: the section's (a sort, or one's own), a context's or a profile's. */
export type PostsOf = { feed: PostsFeed; category?: string | null } | { context: string } | { author: string };

export const postListKey = (of: PostsOf) =>
    'feed' in of
        ? (['posts', 'list', 'feed', of.feed, of.category ?? ''] as const)
        : 'context' in of
          ? (['posts', 'list', 'context', of.context] as const)
          : (['posts', 'list', 'author', of.author] as const);
export const postKey = (id: string) => ['article', id] as const;
export const postCategoriesKey = ['posts', 'categories'] as const;

/** The feed of the Posts section a list route names; Latest when it names none of them. */
export function postsFeed(feed: FeedName | undefined): PostsFeed {
    return (POSTS_FEEDS as readonly string[]).includes(feed ?? '') ? (feed as PostsFeed) : 'latest';
}

/** A page of a list of posts: the newest first or the most viewed (of one category, maybe), or one's own in every state. */
export async function fetchPosts(api: UnaApi, of: PostsOf, cursor: string | undefined, limit = POSTS_PAGE): Promise<PostPage> {
    if ('feed' in of && of.feed === 'mine') return unwrap(await api.GET('/me/posts', { params: { query: { cursor, limit } } }));
    const query =
        'feed' in of
            ? { sort: of.feed === 'popular' ? ('popular' as const) : ('recent' as const), ...(of.category ? { category: of.category } : {}) }
            : 'context' in of
              ? { context: of.context }
              : { author: of.author };
    return unwrap(await api.GET('/posts', { params: { query: { ...query, cursor, limit } } }));
}

/** A post as a list loaded it (no text), so its view shows it at once while it loads its own. */
export function postFromLists(queryClient: QueryClient, id: string): Post | undefined {
    for (const [, data] of queryClient.getQueriesData<InfiniteData<PostPage>>(['posts', 'list'])) {
        const found = data?.pages.flatMap((p) => p.items).find((p) => p.id === id);
        if (found) return found;
    }
    return undefined;
}

/**
 * A post as the site has it now (saved): in its view's cache whole, and in every list that shows
 * it as lists have one (no text, photos or link previews). The lists and the feeds are read again
 * too: its category may have moved it between lists, and its feed item shows its title and summary.
 */
export function putPost(queryClient: QueryClient, fresh: Post): void {
    queryClient.setQueryData(postKey(fresh.id), fresh);
    const row: Post = { ...fresh, body_html: null, media: [], links: [] };
    queryClient.setQueriesData<InfiniteData<PostPage>>(['posts', 'list'], (data) => (data ? { ...data, pages: data.pages.map((p) => ({ ...p, items: p.items.map((x) => (x.id === fresh.id ? row : x)) })) } : data));
    void queryClient.invalidateQueries(['posts', 'list']);
    void queryClient.invalidateQueries(['feed']);
    if (fresh.content_id) void queryClient.invalidateQueries(['activity', fresh.content_id]);
}

/** A post gone (deleted): out of its view's cache and every list. */
export function dropPost(queryClient: QueryClient, id: string): void {
    queryClient.removeQueries(postKey(id), { exact: true });
    queryClient.setQueriesData<InfiniteData<PostPage>>(['posts', 'list'], (data) => (data ? { ...data, pages: data.pages.map((p) => ({ ...p, items: p.items.filter((x) => x.id !== id) })) } : data));
}

/**
 * Where a feed item opens: the post's own view for an item of the Posts module that names its
 * post (`entry_id`), the thread of the activity otherwise.
 */
export function activityDetail(activity: Pick<Activity, 'id'> & { object: Pick<Activity['object'], 'kind' | 'module' | 'entry_id'> }): DetailRoute {
    const item = activity.object;
    return item.kind === 'post' && item.module === 'bx_posts' && item.entry_id ? { kind: 'article', id: item.entry_id } : { kind: 'post', id: activity.id };
}

/** "4 min read". */
export function readingText(minutes: number): string {
    return tn(Math.max(1, minutes), '{{count}} min read', '{{count}} min read');
}

/** "1 comment", "12 comments". */
export function commentsText(n: number): string {
    return tn(n, '{{count}} comment', '{{count}} comments');
}

/** What a post of one's own is when it is not simply published: shown in its row and its view. */
export function stateText(post: Pick<Post, 'state' | 'moderation' | 'publish_at'>): string | null {
    if (post.state === 'scheduled') return post.publish_at ? t('Scheduled for {{when}}', { when: new Date(post.publish_at).toLocaleString(locale(), { dateStyle: 'medium', timeStyle: 'short' }) }) : t('Scheduled');
    if (post.state === 'processing') return t('Its video is being processed');
    if (post.state === 'hidden') return t('Hidden');
    if (post.moderation === 'pending') return t('Waiting for approval');
    if (post.moderation === 'rejected') return t('Not approved');
    return null;
}

/** When a post came out: its publishing time, else when it was written. */
export function postTime(post: Pick<Post, 'published_at' | 'created_at'>): string {
    return post.published_at ?? post.created_at;
}

/** What a list row says of a post to screen readers after its title (its summary is its description). */
export function postRowText(post: Post): string {
    const by = post.author ? t('by {{name}}', { name: post.author.display_name }) : post.anonymous ? t('anonymous') : null;
    const state = stateText(post);
    const comments = post.stats.comments ? commentsText(post.stats.comments) : null;
    return `, ${[by, ago(postTime(post)), state, readingText(post.reading_minutes), comments].filter(Boolean).join(', ')}`;
}

/** Whether a link may be a link in the app: http and https only (the browser opens it). */
export function isWebUrl(url: string): boolean {
    return /^https?:\/\//i.test(url);
}
