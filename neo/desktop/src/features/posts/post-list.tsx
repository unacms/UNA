import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { type MouseEvent, useId } from 'react';

import { EmptyState } from '../../components/empty-state';
import { Icon } from '../../components/icon';
import { ProfileBadges } from '../../components/profile-badges';
import { SegmentedTabs } from '../../components/segmented-tabs';
import { InlineError, SkeletonRows } from '../../components/skeleton';
import { ago } from '../../lib/api';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { locale, t } from '../../lib/i18n';
import { useMediaSrc, usePicture } from '../../lib/media';
import { useNavigation, useRoute } from '../../lib/navigation';
import { isWindowGesture, isWindowKey, useOpenInWindow } from '../../lib/open-in-window';
import { emptyListText, useFillEmptyPages } from '../../lib/paging';
import { categoryPage } from '../../lib/router';
import { Pane, ToolbarButton } from '../../shell/pane';
import { CategoryFilter, PageColumns } from '../page-blocks/page-blocks';
import { SECTION_PAGES } from '../page-blocks/page-layout';
import { usePostCategories } from './new-post';
import { commentsText, FEED_LABELS, fetchPosts, type Post, postKey, postListKey, postRowText, type PostsFeed, POSTS_FEEDS, postsFeed, type PostsOf, postTime, readingText, stateText } from './posts';

/** A post's cover in its row: the small copy, 3:2, or nothing for a post without one. */
function Cover({ post }: { post: Post }) {
    const allowed = useMediaSrc();
    const v = post.cover?.variants;
    const picture = usePicture(allowed(v?.thumb?.url) ?? allowed(v?.medium?.url) ?? null);
    if (!picture.src) return null;
    return (
        <span className="article-thumb" aria-hidden="true">
            <img src={picture.src} alt="" loading="lazy" decoding="async" onError={picture.onError} onLoad={picture.onLoad} />
        </span>
    );
}

/**
 * One post in a list, flat between hairlines: its title opens it beside the list (Cmd+click,
 * Cmd+Enter or a double-click: in a window of its own), its summary, who wrote it with their
 * badges after the name, when, how long it reads and its comments, and its cover at the end.
 */
export function PostRow({ post: p, selected }: { post: Post; selected: boolean }) {
    const { openDetail } = useNavigation();
    const openInWindow = useOpenInWindow();
    const queryClient = useQueryClient();
    const detail = { kind: 'article', id: p.id } as const;
    const open = (m?: { metaKey: boolean; ctrlKey: boolean; altKey: boolean; shiftKey: boolean }) => {
        if (openInWindow && m && isWindowGesture(m)) {
            openInWindow(detail);
            return;
        }
        // the detail shows it at once while it loads its own copy (with its text)
        if (!queryClient.getQueryData(postKey(p.id))) queryClient.setQueryData(postKey(p.id), p, { updatedAt: 0 });
        openDetail(detail);
    };
    const onDoubleClick = (m: MouseEvent<HTMLElement>) => {
        if (!openInWindow || (m.target as Element).closest('button:not([data-open]), a')) return;
        window.getSelection()?.removeAllRanges();
        openInWindow(detail);
    };
    const when = postTime(p);
    const state = stateText(p);
    const summaryId = useId();
    return (
        <li className="list-row article-row" data-selected={selected || undefined} data-cover={p.cover ? '' : undefined} onDoubleClick={onDoubleClick}>
            <div className="list-main">
                <button
                    type="button"
                    className="profile-link strong article-row-title"
                    data-open=""
                    aria-current={selected ? 'true' : undefined}
                    aria-describedby={p.summary ? summaryId : undefined}
                    onClick={(m) => open(m)}
                    onKeyDown={(k) => {
                        if (!openInWindow || !isWindowKey(k)) return;
                        k.preventDefault();
                        openInWindow(detail);
                    }}
                >
                    <bdi>{p.title}</bdi>
                    <span className="sr-only">{postRowText(p)}</span>
                </button>
                {p.summary ? (
                    <span id={summaryId} className="article-row-summary" dir="auto" aria-hidden="true">
                        {p.summary}
                    </span>
                ) : null}
                <span className="row-sub" aria-hidden="true">
                    {p.author ? (
                        <span className={p.author.badges?.length ? 'with-badges' : undefined}>
                            <bdi className="truncate">{p.author.display_name}</bdi>
                            <ProfileBadges badges={p.author.badges} />
                        </span>
                    ) : p.anonymous ? (
                        <span>{t('Anonymous')}</span>
                    ) : null}
                    {p.author || p.anonymous ? <span>·</span> : null}
                    <time dateTime={when} title={new Date(when).toLocaleString(locale())}>
                        {ago(when)}
                    </time>
                    <span>·</span>
                    <span>{readingText(p.reading_minutes)}</span>
                    {p.stats.comments ? (
                        <>
                            <span>·</span>
                            <span>{commentsText(p.stats.comments)}</span>
                        </>
                    ) : null}
                </span>
                {state ? (
                    <span className="row-sub article-row-state" aria-hidden="true">
                        <Icon name={p.state === 'scheduled' ? 'clock' : 'eye-off'} size={12} strong />
                        <span>{state}</span>
                    </span>
                ) : null}
            </div>
            <Cover post={p} />
        </li>
    );
}

/** A list of posts, a page at a time, the open one marked. */
function PostPages({ of, label, empty, hint, selectedId }: { of: PostsOf; label: string; empty: string; hint?: string; selectedId: string | null }) {
    const { api } = useApp();
    const query = useInfiniteQuery({
        queryKey: postListKey(of),
        queryFn: async ({ pageParam }) => fetchPosts(api, of, pageParam as string | undefined),
        getNextPageParam: (last) => last.next_cursor ?? undefined,
    });
    useFillEmptyPages(query);
    const items = query.data?.pages.flatMap((p) => p.items) ?? [];
    const emptyText = emptyListText(query, items.length, empty);
    return (
        <>
            <SkeletonRows loading={query.isLoading} />
            {query.isError ? <InlineError message={errorMessage(query.error)} onRetry={() => void query.refetch()} busy={query.isFetching} /> : null}
            <EmptyState shown={!!emptyText} icon="newspaper" title={emptyText || empty} hint={emptyText === empty ? hint : undefined} />
            {items.length ? (
                <ul className="list rows article-list" aria-label={label}>
                    {items.map((p) => (
                        <PostRow key={p.id} post={p} selected={selectedId === p.id} />
                    ))}
                </ul>
            ) : null}
            {query.hasNextPage ? (
                <button
                    type="button"
                    className="btn btn-wide"
                    onClick={() => {
                        if (!query.isFetchingNextPage) void query.fetchNextPage();
                    }}
                    aria-disabled={query.isFetchingNextPage || undefined}
                    aria-busy={query.isFetchingNextPage}
                >
                    {t('More posts')}
                </button>
            ) : null}
        </>
    );
}

const PANEL_ID = 'posts-panel';
const feedTabId = (feed: PostsFeed) => `posts-feed-${feed}`;
const LIST_LABELS: Record<PostsFeed, string> = { latest: t('Posts, newest first'), popular: t('Posts, most viewed first'), mine: t('Your posts, newest first') };

/**
 * Posts in the content pane: the Posts module's posts (long reads with a title, a summary and a
 * cover, not the feed), Latest, Popular or Mine (one's own in every state, scheduled ones too).
 * One opens beside the list (features/posts/post-pane.tsx); New post is in the toolbar.
 */
export function Posts() {
    const route = useRoute();
    const { history, openDetail } = useNavigation();
    const feed = postsFeed(route.list.feed);
    // one category's (Latest and Popular), as the site's Categories block opens it
    const category = feed === 'mine' ? null : (route.list.category ?? null);
    const categories = usePostCategories();
    const categoryName = category ? (categories.isSuccess ? (categories.data.find((c) => c.id === category)?.name ?? null) : undefined) : undefined;
    const selected = route.detail?.kind === 'article' ? route.detail.id : null;
    return (
        <Pane
            pane="list"
            title={t('Posts')}
            scope={
                <SegmentedTabs
                    label={t('Show')}
                    values={POSTS_FEEDS}
                    labels={FEED_LABELS}
                    current={feed}
                    onChange={(f) => history.push({ list: categoryPage('posts', category, f), detail: history.current.detail })}
                    panelId={PANEL_ID}
                    tabId={feedTabId}
                />
            }
            actions={<ToolbarButton icon="square-pen" label={t('New post')} onClick={() => openDetail({ kind: 'new-article' })} />}
        >
            {/* the site's posts page: its Categories and Featured Posts beside the list (PageColumns) */}
            <PageColumns path={SECTION_PAGES.posts} title={t('Posts')} ended>
                <div className="column article-column" id={PANEL_ID} role="tabpanel" aria-labelledby={feedTabId(feed)}>
                    {category ? <CategoryFilter name={categoryName} all={t('All posts')} onAll={() => history.push({ list: categoryPage('posts', null, feed), detail: history.current.detail })} /> : null}
                    <PostPages
                        key={`${feed}/${category ?? ''}`}
                        of={{ feed, category }}
                        label={category && categoryName ? (feed === 'popular' ? t('Posts, most viewed first, in {{category}}', { category: categoryName }) : t('Posts, newest first, in {{category}}', { category: categoryName })) : LIST_LABELS[feed]}
                        empty={feed === 'mine' ? t('You haven’t written any posts yet') : category ? t('No posts in this category yet') : t('No posts yet')}
                        hint={feed === 'mine' ? t('A post has a title, a cover and as much text as it needs.') : undefined}
                        selectedId={selected}
                    />
                </div>
            </PageColumns>
        </Pane>
    );
}

/**
 * A Posts tab (the Posts module's posts, next to the feed): a group's, space's or event's posts
 * (GET /posts?context=), with New post for those who may post there, or the posts a profile wrote
 * (`author`). Newest first, a page at a time, the open one marked.
 */
export function PostsOfTab({ of, name, canAdd = false }: { of: { context: string } | { author: string }; name: string; canAdd?: boolean }) {
    const route = useRoute();
    const { openDetail } = useNavigation();
    const base = 'context' in of ? `context-${of.context}` : `author-${of.author}`;
    const headingId = `${base}-articles`;
    const selectedId = route.detail?.kind === 'article' ? route.detail.id : null;
    return (
        <section className="connections context-articles" aria-labelledby={headingId}>
            <h3 id={headingId} className="sr-only">
                {t('Posts')}
            </h3>
            {'context' in of && canAdd ? (
                <div className="tab-actions">
                    <button type="button" className="btn" onClick={() => openDetail({ kind: 'new-article', contextId: of.context })}>
                        <Icon name="square-pen" size={16} />
                        <span>{t('New post')}</span>
                    </button>
                </div>
            ) : null}
            <PostPages
                of={of}
                label={'context' in of ? t('Posts in {{name}}, newest first', { name }) : t('Posts by {{name}}, newest first', { name })}
                empty={'context' in of ? t('No posts in {{name}} yet', { name }) : t('{{name}} hasn’t written any posts yet', { name })}
                selectedId={selectedId}
            />
        </section>
    );
}
