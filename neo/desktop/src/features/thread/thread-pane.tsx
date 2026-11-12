import { type InfiniteData, type QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import type { Schema } from 'una-api';

import { ActivityCard } from '../../components/activity-card';
import { isGone, retryOnce, unwrap } from '../../lib/api';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { goneWords } from '../../lib/gone';
import { t } from '../../lib/i18n';
import { useMediaSrc } from '../../lib/media';
import { useOpenInWindow } from '../../lib/open-in-window';
import { EmptyState } from '../../components/empty-state';
import { Icon } from '../../components/icon';
import { CloseDetailButton, Pane, ToolbarButton } from '../../shell/pane';
import { dropFromFeeds } from '../feed/cache';
import { photosOf } from '../feed/media';
import { type CommentTarget, CommentTree } from './comment-tree';
import { Lightbox } from './lightbox';

/** The activity as a feed already loaded it, so the detail pane shows it at once. */
function fromFeeds(queryClient: QueryClient, id: string): Schema<'Activity'> | undefined {
    for (const [, data] of queryClient.getQueriesData<InfiniteData<Schema<'Page_Activity'>>>(['feed'])) {
        for (const page of data?.pages ?? []) {
            const found = page.items.find((a) => a.id === id);
            if (found) return found;
        }
    }
    return undefined;
}

/**
 * A post in the detail pane: the whole post (full-size photos in a lightbox), its comments with
 * their replies, and boxes to comment, reply and edit. Opened for a comment (a notification, a
 * link), that comment is shown and focused, its thread opened. Esc closes the pane (the shell sends
 * focus back to the post in the list); in a text box or the lightbox Esc is theirs first.
 */
export function ThreadPane({ id, comment }: { id: string; comment?: CommentTarget }) {
    const { api } = useApp();
    const allowed = useMediaSrc();
    const queryClient = useQueryClient();
    const [photo, setPhoto] = useState<number | null>(null);
    const openInWindow = useOpenInWindow();

    const post = useQuery({
        queryKey: ['activity', id],
        queryFn: async () => unwrap(await api.GET('/activities/{id}', { params: { path: { id } } })),
        initialData: () => fromFeeds(queryClient, id),
        // what a feed had may be old: show it and fetch the current one
        initialDataUpdatedAt: 0,
        retry: retryOnce,
    });
    // Deleted, or no longer visible to this viewer: the copy a feed or an earlier visit left is
    // not shown, and the feeds drop it too. React Query keeps old data after a failed fetch, so
    // the error is what decides.
    const gone = post.isError && isGone(post.error);
    useEffect(() => {
        if (gone) dropFromFeeds(queryClient, id);
    }, [gone, id, queryClient]);

    const shown = gone ? undefined : post.data;
    const item = shown?.object;
    const author = item && !item.anonymous ? (item.author ?? shown.actor ?? null) : null;
    const closePhoto = useCallback(() => setPhoto(null), []);

    const actions = (
        <>
            {openInWindow && shown ? <ToolbarButton icon="app-window" label={t('Open in New Window')} commandId="open-in-window" onClick={() => openInWindow({ kind: 'post', id })} /> : null}
            <CloseDetailButton />
        </>
    );

    return (
        <Pane pane="detail" title={t('Post')} actions={actions} ready={!!shown} busy={post.isLoading}>
            <div className="thread">
                {post.isLoading ? <div className="skeleton" aria-hidden="true" /> : null}
                {post.isLoading ? (
                    <p className="sr-only" role="status">
                        {t('Loading the post…')}
                    </p>
                ) : null}
                {gone ? (
                    <EmptyState {...goneWords(post.error, 'post', 'file-text')} />
                ) : post.isError ? (
                    <div className="inline-error" role="alert">
                        <p className="inline-error-text">
                            <Icon name="circle-alert" size={20} />
                            <span>{errorMessage(post.error)}</span>
                        </p>
                        <button className="btn" onClick={() => void post.refetch()} disabled={post.isFetching} aria-busy={post.isFetching}>
                            {t('Try again')}
                        </button>
                    </div>
                ) : null}
                {shown && item ? (
                    <>
                        <ActivityCard activity={shown} variant="detail" onOpenPhoto={setPhoto} />
                        <CommentTree item={item} target={comment} />
                        <Lightbox images={photosOf(item.media, allowed)} index={photo} onIndex={setPhoto} onClose={closePhoto} label={author ? t('{{name}}’s post', { name: author.display_name }) : t('the post')} />
                    </>
                ) : null}
            </div>
        </Pane>
    );
}
