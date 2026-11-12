import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { MouseEvent, ReactNode } from 'react';

import { EmptyState } from '../../components/empty-state';
import { Icon } from '../../components/icon';
import { badgeNames, ProfileBadges } from '../../components/profile-badges';
import { InlineError, SkeletonRows } from '../../components/skeleton';
import { ago } from '../../lib/api';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { locale, t } from '../../lib/i18n';
import { useMediaSrc, usePicture } from '../../lib/media';
import { useNavigation, useRoute } from '../../lib/navigation';
import { isWindowGesture, isWindowKey, useOpenInWindow } from '../../lib/open-in-window';
import { emptyListText, useFillEmptyPages } from '../../lib/paging';
import { durationText, fetchVideos, mediaState, thumbnail, type Video, videoKey, videoListKey, type VideosOf, viewsText } from './videos';

/** The still of a row: a 16:9 box (drawn before the picture loads), the length over it. */
function Thumbnail({ video: v }: { video: Video }) {
    const allowed = useMediaSrc();
    const picture = usePicture(thumbnail(v, allowed));
    const state = mediaState(v);
    const length = durationText(v.media?.duration_ms);
    return (
        <span className="video-thumb" aria-hidden="true">
            {picture.src ? <img src={picture.src} alt="" loading="lazy" decoding="async" onError={picture.onError} onLoad={picture.onLoad} /> : <Icon name="film" size={20} />}
            {state === 'processing' ? <span className="video-thumb-note">{t('Processing…')}</span> : state === 'failed' ? <span className="video-thumb-note">{t('Failed')}</span> : null}
            {length ? <span className="video-length">{length}</span> : null}
            {!state && picture.src ? (
                <span className="video-thumb-play">
                    <Icon name="play" size={12} strong />
                </span>
            ) : null}
        </span>
    );
}

/**
 * What a row says of a video to screen readers after its title: converting, its length, by whom
 * with their badges after the name, when, and its views (all the row shows).
 */
export function videoRowText(v: Video): string {
    const state = mediaState(v);
    const by = v.author ? [t('by {{name}}', { name: v.author.display_name }), ...badgeNames(v.author.badges)].join(', ') : null;
    const parts = [state === 'processing' ? t('processing') : state === 'failed' ? t('could not be processed') : null, durationText(v.media?.duration_ms), by, ago(v.created_at), viewsText(v.stats.views)];
    return `, ${parts.filter(Boolean).join(', ')}`;
}

/**
 * One video in a list: its still and title open it beside the list (Cmd+click, Cmd+Enter or a
 * double-click: in a window of its own), who added it with their badges after the name, when,
 * and its views.
 */
export function VideoRow({ video: v, selected }: { video: Video; selected: boolean }) {
    const { openDetail } = useNavigation();
    const openInWindow = useOpenInWindow();
    const queryClient = useQueryClient();
    const detail = { kind: 'video', id: v.id } as const;
    const open = (m?: { metaKey: boolean; ctrlKey: boolean; altKey: boolean; shiftKey: boolean }) => {
        if (openInWindow && m && isWindowGesture(m)) {
            openInWindow(detail);
            return;
        }
        // the detail shows it at once while it loads its own copy (with its text)
        if (!queryClient.getQueryData(videoKey(v.id))) queryClient.setQueryData(videoKey(v.id), v, { updatedAt: 0 });
        openDetail(detail);
    };
    const onDoubleClick = (m: MouseEvent<HTMLElement>) => {
        if (!openInWindow || (m.target as Element).closest('button:not([data-open]), a')) return;
        window.getSelection()?.removeAllRanges();
        openInWindow(detail);
    };
    return (
        <li className="list-row video-row" data-selected={selected || undefined} onDoubleClick={onDoubleClick}>
            <span className="video-thumb-link" onClick={(m) => open(m)}>
                <Thumbnail video={v} />
            </span>
            <div className="list-main">
                <button
                    type="button"
                    className="profile-link strong video-title"
                    data-open=""
                    aria-current={selected ? 'true' : undefined}
                    onClick={(m) => open(m)}
                    onKeyDown={(k) => {
                        if (!openInWindow || !isWindowKey(k)) return;
                        k.preventDefault();
                        openInWindow(detail);
                    }}
                >
                    <bdi>{v.title}</bdi>
                    <span className="sr-only">{videoRowText(v)}</span>
                </button>
                <span className="row-sub" aria-hidden="true">
                    {v.author ? (
                        <span className={v.author.badges?.length ? 'with-badges' : undefined}>
                            <bdi className="truncate">{v.author.display_name}</bdi>
                            <ProfileBadges badges={v.author.badges} />
                        </span>
                    ) : null}
                </span>
                <span className="row-sub" aria-hidden="true">
                    <time dateTime={v.created_at} title={new Date(v.created_at).toLocaleString(locale())}>
                        {ago(v.created_at)}
                    </time>
                    <span>·</span>
                    <span>{viewsText(v.stats.views)}</span>
                </span>
            </div>
        </li>
    );
}

/** A list of videos: newest first, a page at a time, the open one marked. */
export function VideosPages({ of, label, empty, hint, selectedId, action }: { of: VideosOf; label: string; empty: string; hint?: string; selectedId: string | null; action?: ReactNode }) {
    const { api } = useApp();
    const query = useInfiniteQuery({
        queryKey: videoListKey(of),
        queryFn: async ({ pageParam }) => fetchVideos(api, of, pageParam as string | undefined),
        getNextPageParam: (last) => last.next_cursor ?? undefined,
    });
    useFillEmptyPages(query);
    const items = query.data?.pages.flatMap((p) => p.items) ?? [];
    const emptyText = emptyListText(query, items.length, empty);
    return (
        <>
            <SkeletonRows loading={query.isLoading} />
            {query.isError ? <InlineError message={errorMessage(query.error)} onRetry={() => void query.refetch()} busy={query.isFetching} /> : null}
            <EmptyState shown={!!emptyText} icon="film" title={emptyText || empty} hint={emptyText === empty ? hint : undefined} actions={emptyText === empty ? action : undefined} />
            {items.length ? (
                <ul className="list rows video-list" aria-label={label}>
                    {items.map((v) => (
                        <VideoRow key={v.id} video={v} selected={selectedId === v.id} />
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
                    {t('More videos')}
                </button>
            ) : null}
        </>
    );
}

/**
 * A Videos tab: a group's, space's or event's videos (GET /videos?context=), with Add video for
 * those who may post there, or the videos a profile added (`author`).
 */
export function VideosOfTab({ of, name, canAdd = false }: { of: { context: string } | { author: string }; name: string; canAdd?: boolean }) {
    const route = useRoute();
    const { openDetail } = useNavigation();
    const base = 'context' in of ? `context-${of.context}` : `author-${of.author}`;
    const headingId = `${base}-videos`;
    const add = 'context' in of && canAdd ? () => openDetail({ kind: 'new-video', contextId: of.context }) : null;
    return (
        <section className="connections context-videos" aria-labelledby={headingId}>
            <h3 id={headingId} className="sr-only">
                {t('Videos')}
            </h3>
            {add ? (
                <div className="tab-actions">
                    <button type="button" className="btn" onClick={add}>
                        <Icon name="upload" size={16} />
                        <span>{t('Add video')}</span>
                    </button>
                </div>
            ) : null}
            <VideosPages
                of={of}
                label={'context' in of ? t('Videos in {{name}}, newest first', { name }) : t('Videos by {{name}}, newest first', { name })}
                empty={'context' in of ? t('No videos in {{name}} yet', { name }) : t('{{name}} hasn’t added videos', { name })}
                selectedId={route.detail?.kind === 'video' ? route.detail.id : null}
            />
        </section>
    );
}
