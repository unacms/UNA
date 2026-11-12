import { useQuery, useQueryClient } from '@tanstack/react-query';

import { longTime } from '../../components/activity-card';
import { ProfileBadges } from '../../components/profile-badges';
import { ApiError, ensureOk, isGone, retryOnce, unwrap } from '../../lib/api';
import { useWindowAnnounce } from '../../lib/announce';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { t } from '../../lib/i18n';
import { usePicture, useMediaSrc } from '../../lib/media';
import { confirmAction } from '../../lib/native';
import { useNavigation } from '../../lib/navigation';
import { DetailShell } from '../../shell/detail-shell';
import { useCopyLink } from '../../lib/copy-link';
import { paneHeadingId } from '../../shell/pane';
import { dropFromFeeds } from '../feed/cache';
import { useAnnouncer } from '../feed/feed-list';
import { EntryActions, EntryComments, useEntryItem } from '../photos/entry-item';
import { ProfileAvatar, ProfileName } from '../profile/profile-link';
import { PollCard } from './poll-card';
import { type Poll, pollFromCache, pollKey } from './polls';

/** The picture its author chose for it: the large copy, else a smaller one. */
function PollImage({ poll }: { poll: Poll }) {
    const allowed = useMediaSrc();
    const v = poll.image?.variants;
    const picture = usePicture(allowed(v?.large?.url) ?? allowed(v?.medium?.url) ?? allowed(v?.thumb?.url) ?? null);
    if (!picture.src) return null;
    return <img className="poll-image" src={picture.src} alt="" decoding="async" onError={picture.onError} onLoad={picture.onLoad} />;
}

/**
 * A poll in the detail pane (or a window of its own): who asked (badges after the name) and
 * when, its picture, its answers to vote in or its results (PollCard), and the reactions and
 * comments of its Item. More has Open in New Window, Copy Link and, for who may, Delete.
 */
export function PollPane({ id }: { id: string }) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const { forget } = useNavigation();
    const announceInWindow = useWindowAnnounce();
    const [announcement, announce] = useAnnouncer();
    const poll = useQuery({
        queryKey: pollKey(id),
        queryFn: async () => unwrap(await api.GET('/polls/{id}', { params: { path: { id } } })),
        initialData: () => pollFromCache(queryClient, id),
        // what a list had is old: show it and fetch the current one
        initialDataUpdatedAt: 0,
        retry: retryOnce,
    });
    const gone = poll.isError && isGone(poll.error);
    const p = gone ? undefined : poll.data;
    const itemId = p?.content_id ?? null;
    const activity = useEntryItem(itemId, p?.stats?.comments, pollKey(id));

    const remove = async () => {
        if (!p) return;
        const ok = await confirmAction({ title: t('Delete this poll?'), message: t('It is deleted for everyone, with its votes and comments. This cannot be undone.'), okLabel: t('Delete') });
        if (!ok) return;
        try {
            ensureOk(await api.DELETE('/polls/{id}', { params: { path: { id } } }));
        } catch (e) {
            if (!(e instanceof ApiError && e.status === 404)) {
                announce(t('Could not delete it: {{reason}}', { reason: errorMessage(e) }));
                return;
            }
        }
        announceInWindow(t('Poll deleted'));
        if (p.content_id) dropFromFeeds(queryClient, p.content_id);
        queryClient.removeQueries(pollKey(id), { exact: true });
        void queryClient.invalidateQueries(['polls', 'list']);
        forget({ kind: 'poll', id });
    };

    const copyLink = useCopyLink(announce);

    return (
        <DetailShell
            detail={{ kind: 'poll', id }}
            noun="poll"
            icon="vote"
            query={poll}
            item={p}
            title={p?.question || t('Poll')}
            inContext={!!poll.data?.context_id}
            announcement={announcement}
            announce={announce}
            className="thread poll-detail"
            more={(shown) => ({ link: shown.url, own: shown.viewer?.can_delete ? [{ text: t('Delete Poll…'), run: () => void remove() }] : [] })}
        >
            {(p) => (
                    <>
                        <article className="video-post" aria-labelledby={paneHeadingId('detail')}>
                            {/* the hero (the toolbar shows the title once it is scrolled under); screen readers have the pane's heading */}
                            <div className="profile-name video-heading poll-heading" aria-hidden="true" dir="auto">
                                {p.question}
                            </div>
                            <header className="poll-by">
                                <ProfileAvatar profile={p.author ?? null} size={36} />
                                <span>
                                    <span className={p.author?.badges?.length ? 'with-badges' : undefined}>
                                        {p.author ? <ProfileName profile={p.author} className="strong" /> : <strong>{t('Someone')}</strong>}
                                        <ProfileBadges badges={p.author?.badges} />
                                    </span>
                                    {p.created_at ? (
                                        <span className="muted small poll-by-time">
                                            <time dateTime={p.created_at}>{longTime(p.created_at)}</time>
                                        </span>
                                    ) : null}
                                </span>
                            </header>
                            <PollImage poll={p} />
                            <PollCard poll={p} labelledBy={paneHeadingId('detail')} />
                            <EntryActions activity={activity.data} url={p.url} onCopyLink={copyLink} onError={announce} />
                        </article>
                        <EntryComments itemId={itemId} activity={activity.data} error={activity.error} loading={activity.isLoading} />
                    </>
            )}
        </DetailShell>
    );
}
