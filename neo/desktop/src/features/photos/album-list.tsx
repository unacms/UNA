import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { MouseEvent, ReactNode } from 'react';

import type { Schema } from 'una-api';

import { EmptyState } from '../../components/empty-state';
import { Icon } from '../../components/icon';
import { ProfileBadges } from '../../components/profile-badges';
import { InlineError, SkeletonRows } from '../../components/skeleton';
import { ago } from '../../lib/api';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { locale, t } from '../../lib/i18n';
import { useMediaSrc, usePicture } from '../../lib/media';
import { useNavigation, useRoute } from '../../lib/navigation';
import { isWindowGesture, isWindowKey, useOpenInWindow } from '../../lib/open-in-window';
import { emptyListText, useFillEmptyPages } from '../../lib/paging';
import { MoreButton } from './photo-list';
import { type Album, albumCardText, albumKey, albumListKey, fetchAlbums, itemsText, type MediaOf, tileSrc } from './photos';

type Media = Schema<'Media'>;

function Still({ media }: { media: Media | undefined }) {
    const allowed = useMediaSrc();
    const picture = usePicture(tileSrc(media, allowed));
    return picture.src ? <img src={picture.src} alt="" loading="lazy" decoding="async" onError={picture.onError} onLoad={picture.onLoad} /> : <span className="album-still-empty" />;
}

/** An album's cover: its first picture large, the next three beside it, or a mark for an empty one. */
export function AlbumCover({ preview }: { preview: readonly Media[] }) {
    if (!preview.length)
        return (
            <span className="album-cover album-cover-empty" aria-hidden="true">
                <Icon name="images" size={28} />
            </span>
        );
    return (
        <span className="album-cover" data-count={Math.min(preview.length, 4)} aria-hidden="true">
            {preview.slice(0, 4).map((m) => (
                <span key={m.id} className="album-still">
                    <Still media={m} />
                </span>
            ))}
        </span>
    );
}

/**
 * One album as a rounded card: its cover, its title (which opens it beside the list; Cmd+click,
 * Cmd+Enter or a double-click: in a window of its own), how many photos, who made it with their
 * badges after the name, and when.
 */
export function AlbumCard({ album: a, selected }: { album: Album; selected: boolean }) {
    const { openDetail } = useNavigation();
    const openInWindow = useOpenInWindow();
    const queryClient = useQueryClient();
    const detail = { kind: 'album', id: a.id } as const;
    const open = (m?: { metaKey: boolean; ctrlKey: boolean; altKey: boolean; shiftKey: boolean }) => {
        if (openInWindow && m && isWindowGesture(m)) {
            openInWindow(detail);
            return;
        }
        if (!queryClient.getQueryData(albumKey(a.id))) queryClient.setQueryData(albumKey(a.id), a, { updatedAt: 0 });
        openDetail(detail);
    };
    const onDoubleClick = (m: MouseEvent<HTMLElement>) => {
        if (!openInWindow || (m.target as Element).closest('button:not([data-open]), a')) return;
        window.getSelection()?.removeAllRanges();
        openInWindow(detail);
    };
    return (
        <li className="album-card" data-selected={selected || undefined} onDoubleClick={onDoubleClick}>
            <span className="album-cover-link" aria-hidden="true" onClick={(m) => open(m)}>
                <AlbumCover preview={a.preview} />
            </span>
            <div className="album-card-text">
                <button
                    type="button"
                    className="profile-link strong album-title"
                    data-open=""
                    aria-current={selected ? 'true' : undefined}
                    onClick={(m) => open(m)}
                    onKeyDown={(k) => {
                        if (!openInWindow || !isWindowKey(k)) return;
                        k.preventDefault();
                        openInWindow(detail);
                    }}
                >
                    <bdi>{a.title}</bdi>
                    <span className="sr-only">{albumCardText(a)}</span>
                </button>
                <span className="row-sub" aria-hidden="true">
                    <span>{itemsText(a.stats.items)}</span>
                    <span>·</span>
                    <time dateTime={a.created_at} title={new Date(a.created_at).toLocaleString(locale())}>
                        {ago(a.created_at)}
                    </time>
                </span>
                {a.author ? (
                    <span className="row-sub" aria-hidden="true">
                        <span className={a.author.badges?.length ? 'with-badges' : undefined}>
                            <bdi className="truncate">{a.author.display_name}</bdi>
                            <ProfileBadges badges={a.author.badges} />
                        </span>
                    </span>
                ) : null}
            </div>
        </li>
    );
}

/** Albums as cards, the newest first, a page at a time, the open one marked. */
export function AlbumsPages({ of, label, empty, hint, action }: { of: MediaOf; label: string; empty: string; hint?: string; action?: ReactNode }) {
    const { api } = useApp();
    const route = useRoute();
    const query = useInfiniteQuery({
        queryKey: albumListKey(of),
        queryFn: async ({ pageParam }) => fetchAlbums(api, of, pageParam as string | undefined),
        getNextPageParam: (last) => last.next_cursor ?? undefined,
    });
    useFillEmptyPages(query);
    const items = query.data?.pages.flatMap((p) => p.items) ?? [];
    const emptyText = emptyListText(query, items.length, empty);
    const selected = route.detail?.kind === 'album' ? route.detail.id : null;
    return (
        <>
            <SkeletonRows loading={query.isLoading} />
            {query.isError ? <InlineError message={errorMessage(query.error)} onRetry={() => void query.refetch()} busy={query.isFetching} /> : null}
            <EmptyState shown={!!emptyText} icon="images" title={emptyText || empty} hint={emptyText === empty ? hint : undefined} actions={emptyText === empty ? action : undefined} />
            {items.length ? (
                <ul className="album-cards" aria-label={label}>
                    {items.map((a) => (
                        <AlbumCard key={a.id} album={a} selected={selected === a.id} />
                    ))}
                </ul>
            ) : null}
            <MoreButton shown={!!query.hasNextPage} busy={query.isFetchingNextPage} onMore={() => void query.fetchNextPage()}>
                {t('More albums')}
            </MoreButton>
        </>
    );
}

/**
 * An Albums tab: a group's, space's or event's albums (GET /albums?context=), with New album for
 * those who may post there, or the albums a profile made (`author`).
 */
export function AlbumsOfTab({ of, name, canAdd = false }: { of: { context: string } | { author: string }; name: string; canAdd?: boolean }) {
    const { openDetail } = useNavigation();
    const base = 'context' in of ? `context-${of.context}` : `author-${of.author}`;
    const headingId = `${base}-albums`;
    const add = 'context' in of && canAdd ? () => openDetail({ kind: 'new-album', contextId: of.context }) : null;
    return (
        <section className="connections context-albums" aria-labelledby={headingId}>
            <h3 id={headingId} className="sr-only">
                {t('Albums')}
            </h3>
            {add ? (
                <div className="tab-actions">
                    <button type="button" className="btn" onClick={add}>
                        <Icon name="plus" size={16} />
                        <span>{t('New album')}</span>
                    </button>
                </div>
            ) : null}
            <AlbumsPages of={of} label={'context' in of ? t('Albums in {{name}}, newest first', { name }) : t('Albums by {{name}}, newest first', { name })} empty={'context' in of ? t('No albums in {{name}} yet', { name }) : t('{{name}} hasn’t made albums', { name })} />
        </section>
    );
}
