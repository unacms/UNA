import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { EmptyState } from '../../components/empty-state';
import { Icon } from '../../components/icon';
import { InlineError, SkeletonRows } from '../../components/skeleton';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { t } from '../../lib/i18n';
import { useNavigation, useRoute } from '../../lib/navigation';
import { useOpenInWindow } from '../../lib/open-in-window';
import { emptyListText, useFillEmptyPages } from '../../lib/paging';
import { PhotoGrid } from './photo-grid';
import { fetchPhotos, type MediaOf, photoKey, photoListKey } from './photos';

/** The button that loads a list's next page. */
export function MoreButton({ shown, busy, onMore, children }: { shown: boolean; busy: boolean; onMore: () => void; children: ReactNode }) {
    if (!shown) return null;
    return (
        <button
            type="button"
            className="btn btn-wide"
            onClick={() => {
                if (!busy) onMore();
            }}
            aria-disabled={busy || undefined}
            aria-busy={busy}
        >
            {children}
        </button>
    );
}

/**
 * A grid of photos, the newest first, a page at a time: one opens beside it (Cmd+Enter, Cmd+click
 * or a double-click: in a window of its own), the open one marked.
 */
export function PhotosPages({ of, label, empty, hint, action }: { of: MediaOf; label: string; empty: string; hint?: string; action?: ReactNode }) {
    const { api } = useApp();
    const route = useRoute();
    const { openDetail } = useNavigation();
    const openInWindow = useOpenInWindow();
    const queryClient = useQueryClient();
    const query = useInfiniteQuery({
        queryKey: photoListKey(of),
        queryFn: async ({ pageParam }) => fetchPhotos(api, of, pageParam as string | undefined),
        getNextPageParam: (last) => last.next_cursor ?? undefined,
    });
    useFillEmptyPages(query);
    const items = query.data?.pages.flatMap((p) => p.items) ?? [];
    const emptyText = emptyListText(query, items.length, empty);
    const open = (i: number) => {
        const p = items[i];
        if (!p) return;
        // the detail shows it at once while it loads its own copy (with its text)
        if (!queryClient.getQueryData(photoKey(p.id))) queryClient.setQueryData(photoKey(p.id), p, { updatedAt: 0 });
        openDetail({ kind: 'photo', id: p.id });
    };
    return (
        <>
            <SkeletonRows loading={query.isLoading} />
            {query.isError ? <InlineError message={errorMessage(query.error)} onRetry={() => void query.refetch()} busy={query.isFetching} /> : null}
            <EmptyState shown={!!emptyText} icon="image" title={emptyText || empty} hint={emptyText === empty ? hint : undefined} actions={emptyText === empty ? action : undefined} />
            {items.length ? (
                <PhotoGrid
                    items={items}
                    label={label}
                    ownerId={'author' in of ? of.author : undefined}
                    selectedId={route.detail?.kind === 'photo' ? route.detail.id : null}
                    onOpen={open}
                    onOpenWindow={
                        openInWindow
                            ? (i) => {
                                  const p = items[i];
                                  if (p) openInWindow({ kind: 'photo', id: p.id });
                              }
                            : undefined
                    }
                />
            ) : null}
            <MoreButton shown={!!query.hasNextPage} busy={query.isFetchingNextPage} onMore={() => void query.fetchNextPage()}>
                {t('More photos')}
            </MoreButton>
        </>
    );
}

/**
 * A Photos tab: a group's, space's or event's photos (GET /photos?context=), with Add photos for
 * those who may post there, or the photos a profile added (`author`).
 */
export function PhotosOfTab({ of, name, canAdd = false }: { of: { context: string } | { author: string }; name: string; canAdd?: boolean }) {
    const { openDetail } = useNavigation();
    const base = 'context' in of ? `context-${of.context}` : `author-${of.author}`;
    const headingId = `${base}-photos`;
    const add = 'context' in of && canAdd ? () => openDetail({ kind: 'new-photos', contextId: of.context }) : null;
    return (
        <section className="connections context-photos" aria-labelledby={headingId}>
            <h3 id={headingId} className="sr-only">
                {t('Photos')}
            </h3>
            {add ? (
                <div className="tab-actions">
                    <button type="button" className="btn" onClick={add}>
                        <Icon name="image-plus" size={16} />
                        <span>{t('Add photos')}</span>
                    </button>
                </div>
            ) : null}
            <PhotosPages of={of} label={'context' in of ? t('Photos in {{name}}, newest first', { name }) : t('Photos by {{name}}, newest first', { name })} empty={'context' in of ? t('No photos in {{name}} yet', { name }) : t('{{name}} hasn’t added photos', { name })} />
        </section>
    );
}
