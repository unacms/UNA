import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import type { Schema } from 'una-api';

import { Icon } from '../../components/icon';
import { retryOnce, unwrap } from '../../lib/api';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { t } from '../../lib/i18n';
import { ReactionButton, ReactionCount } from '../feed/reaction-button';
import { commentBoxId, CommentTree } from '../thread/comment-tree';

type Activity = Schema<'Activity'>;

/**
 * The Item of an entry (`content_id`) whose comments and reactions are the entry's: the same cache
 * entry as a post's thread. A comment posted or deleted here changes the count `entryKey`'s
 * answer has, so that one loads again.
 */
export function useEntryItem(itemId: string | null, knownComments: number | undefined, entryKey: readonly [string, string]) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const activity = useQuery({
        queryKey: ['activity', itemId ?? ''],
        queryFn: async (): Promise<Activity> => unwrap(await api.GET('/activities/{id}', { params: { path: { id: itemId ?? '' } } })),
        enabled: !!itemId,
        retry: retryOnce,
    });
    const comments = activity.data?.object.stats.comments;
    const [kind, id] = entryKey;
    useEffect(() => {
        if (comments === undefined || knownComments === undefined || comments === knownComments) return;
        void queryClient.invalidateQueries([kind, id]);
    }, [comments, knownComments, queryClient, kind, id]);
    return activity;
}

/**
 * Reactions, Comment and Copy link under an entry, as under a post: the Item's reactions where
 * the viewer may react (its count otherwise), and Comment where they may comment.
 */
export function EntryActions({ activity, url, onCopyLink, onError }: { activity: Activity | undefined; url: string | null | undefined; onCopyLink: (url: string) => void; onError: (message: string) => void }) {
    const item = activity?.object;
    return (
        <footer className="activity-actions activity-actions-detail">
            {item && activity ? item.viewer?.can_react ? <ReactionButton activityId={activity.id} item={item} onError={(e) => (e ? onError(e) : undefined)} /> : <ReactionCount count={item.stats.reactions} /> : null}
            {item?.viewer?.can_comment ? (
                <button type="button" className="act-btn act-labelled" onClick={() => document.getElementById(commentBoxId(item.id))?.focus()}>
                    <Icon name="message-square" />
                    <span>{t('Comment')}</span>
                </button>
            ) : null}
            {url ? (
                <button type="button" className="act-btn act-labelled" onClick={() => onCopyLink(url)}>
                    <Icon name="link" />
                    <span>{t('Copy link')}</span>
                </button>
            ) : null}
        </footer>
    );
}

/** The comments of the entry's Item, or why there are none here. */
export function EntryComments({ itemId, activity, error, loading }: { itemId: string | null; activity: Activity | undefined; error: unknown; loading: boolean }) {
    const item = activity?.object;
    if (item) return <CommentTree item={item} />;
    if (error)
        return (
            <p className="muted small discussion-note" role="status">
                {t('Its comments can’t be shown: {{reason}}', { reason: errorMessage(error) })}
            </p>
        );
    if (!itemId) return <p className="muted small discussion-note">{t('Its comments are on the network’s site only.')}</p>;
    return loading ? <p className="muted small discussion-note">{t('Loading comments…')}</p> : null;
}
