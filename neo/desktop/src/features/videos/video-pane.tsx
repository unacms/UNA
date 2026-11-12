import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { problemMessage, type Schema } from 'una-api';

import { longTime, useContextGroup } from '../../components/activity-card';
import { Icon } from '../../components/icon';
import { ProfileBadges } from '../../components/profile-badges';
import { RichText } from '../../components/rich-text';
import { ApiError, ensureOk, isGone, retryOnce, unwrap } from '../../lib/api';
import { useWindowAnnounce } from '../../lib/announce';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { t } from '../../lib/i18n';
import { useMediaSrc, usePicture } from '../../lib/media';
import { confirmAction, openExternal } from '../../lib/native';
import { useNavigation } from '../../lib/navigation';
import { DetailShell, focusMoreButton } from '../../shell/detail-shell';
import { useCopyLink } from '../../lib/copy-link';
import { useAnnouncer } from '../feed/feed-list';
import { ReactionButton, ReactionCount } from '../feed/reaction-button';
import { ProfileAvatar, ProfileName } from '../profile/profile-link';
import { EditTitleText } from '../photos/edit-title-text';
import { commentBoxId, CommentTree } from '../thread/comment-tree';
import { dropVideo, fromLists, mediaState, playable, putVideo, thumbnail, type Video, videoAspect, videoKey, viewsText } from './videos';

type Activity = Schema<'Activity'>;

/** How often a video being converted is asked about again. */
export const PROCESSING_POLL_MS = 15_000;

/**
 * The player: the MP4 copy with its still, in a box of the video's shape before anything loads.
 * While the site converts the upload, or when that failed, the same box says so (never the upload
 * itself). A video on another site shows its preview and plays there, in the browser: the app
 * opens no other site's player inside its own window.
 */
export function VideoPlayer({ video: v, onError }: { video: Video; onError?: (message: string) => void }) {
    const allowed = useMediaSrc();
    const source = playable(v, allowed);
    const state = mediaState(v);
    const still = usePicture(v.embed_url ? thumbnail(v, allowed) : null);
    const style = { aspectRatio: videoAspect(v.media) };
    if (v.embed_url) {
        const host = v.links?.[0]?.host || (() => {
            try {
                return new URL(v.embed_url ?? '').host;
            } catch {
                return '';
            }
        })();
        const url = v.embed_url;
        return (
            <button type="button" className="video-player video-embed" style={style} onClick={() => void openExternal(url).catch((e: unknown) => onError?.(t('Could not open your browser: {{reason}}', { reason: errorMessage(e) })))} aria-label={host ? t('Play “{{title}}” on {{host}} (opens in your browser)', { title: v.title, host }) : t('Play “{{title}}” on its site (opens in your browser)', { title: v.title })}>
                {still.src ? <img src={still.src} alt="" onError={still.onError} onLoad={still.onLoad} /> : null}
                <span className="media-play" aria-hidden="true">
                    <Icon name="play" size={20} strong />
                </span>
                <span className="video-embed-host" aria-hidden="true">
                    <Icon name="external-link" size={12} strong /> {host}
                </span>
            </button>
        );
    }
    if (source)
        return (
            <div className="video-player" style={style}>
                <video src={source.src} poster={source.poster} controls playsInline preload="metadata" aria-label={v.title} />
            </div>
        );
    return (
        <div className="video-player media-note" style={style} data-media-state={state ?? 'failed'}>
            {state === 'processing' ? <span className="spinner" aria-hidden="true" /> : <Icon name="circle-alert" size={20} />}
            <span>{state === 'processing' ? t('Processing video… It plays here once the network has converted it.') : t('This video could not be played.')}</span>
        </div>
    );
}

/**
 * A video in the detail pane (or a window of its own): the player, its title, who added it,
 * when and where, its text, its reactions and its comments (the comment tree of its Item, with
 * the comment box docked at the bottom). Its author, and moderators, edit its title and text in
 * place and delete it from the More menu. A video being converted is asked about again until it
 * plays.
 */
export function VideoPane({ id }: { id: string }) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const { forget } = useNavigation();
    const announceInWindow = useWindowAnnounce();
    const [announcement, announce] = useAnnouncer();
    const [editing, setEditing] = useState(false);

    const video = useQuery({
        queryKey: videoKey(id),
        queryFn: async () => unwrap(await api.GET('/videos/{id}', { params: { path: { id } } })),
        initialData: () => fromLists(queryClient, id),
        // what a list had is old and without its text: show it and fetch the current one
        initialDataUpdatedAt: 0,
        retry: retryOnce,
        refetchInterval: (data) => (data && mediaState(data) === 'processing' ? PROCESSING_POLL_MS : false),
    });
    const gone = video.isError && isGone(video.error);
    const v = gone ? undefined : video.data;
    const itemId = v?.content_id ?? null;

    // converted meanwhile: said once, and the lists show it too
    const state = v ? mediaState(v) : null;
    const [was, setWas] = useState(state);
    if (state !== was) {
        setWas(state);
        if (was === 'processing' && v && !state) {
            announce(t('The video is ready to play'));
            putVideo(queryClient, v);
        }
    }

    // its Item, whose comments and reactions are the video's: the same cache entry as a post's thread
    const activity = useQuery({
        queryKey: ['activity', itemId ?? ''],
        queryFn: async (): Promise<Activity> => unwrap(await api.GET('/activities/{id}', { params: { path: { id: itemId ?? '' } } })),
        enabled: !!itemId,
        retry: retryOnce,
    });
    const item = activity.data?.object;

    // a comment posted or deleted here changes the count the lists show
    const comments = item?.stats.comments;
    const known = v?.stats.comments;
    useEffect(() => {
        if (comments === undefined || known === undefined || comments === known) return;
        void queryClient.invalidateQueries(videoKey(id));
    }, [comments, known, id, queryClient]);

    const group = useContextGroup(v ?? { context_id: null, audience: 'public' });

    const remove = async () => {
        if (!v) return;
        const ok = await confirmAction({ title: t('Delete this video?'), message: t('It is deleted for everyone, with its comments. This cannot be undone.'), okLabel: t('Delete') });
        if (!ok) return;
        try {
            ensureOk(await api.DELETE('/videos/{id}', { params: { path: { id } } }));
        } catch (e) {
            if (!(e instanceof ApiError && e.status === 404)) {
                announce(t('Could not delete it: {{reason}}', { reason: errorMessage(e) }));
                return;
            }
        }
        // said by the window: this pane and its live region go now
        announceInWindow(t('Video deleted'));
        dropVideo(queryClient, id);
        forget({ kind: 'video', id });
    };

    const copyLink = useCopyLink(announce);

    return (
        <DetailShell
            detail={{ kind: 'video', id }}
            noun="video"
            icon="film"
            query={video}
            item={v}
            title={v?.title ?? t('Video')}
            inContext={!!video.data?.context_id}
            heroTitle={!editing}
            announcement={announcement}
            announce={announce}
            className="thread video-detail"
            more={(shown) => ({
                link: shown.url,
                own: [...(shown.viewer?.can_edit ? [{ text: t('Edit Video'), run: () => setEditing(true) }] : []), ...(shown.viewer?.can_delete ? [{ text: t('Delete Video…'), run: () => void remove() }] : [])],
            })}
            // said while it loads (the skeleton is hidden from screen readers)
            before={
                video.isLoading ? (
                    <p className="sr-only" role="status">
                        {t('Loading the video…')}
                    </p>
                ) : null
            }
        >
            {(v) => (
                    <>
                        <article className="video-post" aria-labelledby="detail-title">
                            <VideoPlayer video={v} onError={announce} />
                            {editing ? (
                                <EditTitleText
                                    noun="video"
                                    title={v.title}
                                    html={v.text_html}
                                    save={async (body) => {
                                        const result = await api.PATCH('/videos/{id}', { params: { path: { id: v.id } }, body });
                                        return result.error !== undefined || !result.data ? { error: problemMessage(result.error, t('It was not saved')) } : { saved: result.data };
                                    }}
                                    onDone={(saved: Video | null) => {
                                        setEditing(false);
                                        if (saved) {
                                            putVideo(queryClient, saved);
                                            announce(t('Video saved'));
                                        }
                                        focusMoreButton('video');
                                    }}
                                />
                            ) : (
                                <>
                                    {/* the pane's heading names it (and shows once this has scrolled away) */}
                                    <div className="profile-name video-heading" aria-hidden="true" dir="auto">
                                        {v.title}
                                    </div>
                                    <div className="discussion-by">
                                        <ProfileAvatar profile={v.author} size={44} />
                                        <div className="activity-head-detail">
                                            {v.author ? (
                                                <span className={`activity-by${v.author.badges?.length ? ' with-badges' : ''}`}>
                                                    <ProfileName profile={v.author} className="strong" />
                                                    <ProfileBadges badges={v.author.badges} />
                                                </span>
                                            ) : (
                                                <strong className="activity-by">{t('Someone')}</strong>
                                            )}
                                            <p className="activity-meta">
                                                <time dateTime={v.created_at} title={longTime(v.created_at)}>
                                                    {longTime(v.created_at)}
                                                </time>
                                                {group ? (
                                                    <>
                                                        <span aria-hidden="true">·</span>
                                                        <span>{t('in {{name}}', { name: group.display_name })}</span>
                                                    </>
                                                ) : null}
                                            </p>
                                        </div>
                                    </div>
                                    {v.text_html ? <RichText html={v.text_html} className="discussion-body" /> : null}
                                    <p className="activity-stats">{viewsText(v.stats.views)}</p>
                                    <footer className="activity-actions activity-actions-detail">
                                        {item && activity.data ? (
                                            item.viewer?.can_react ? (
                                                <ReactionButton activityId={activity.data.id} item={item} onError={(e) => (e ? announce(e) : undefined)} />
                                            ) : (
                                                <ReactionCount count={item.stats.reactions} />
                                            )
                                        ) : null}
                                        {item?.viewer?.can_comment ? (
                                            <button type="button" className="act-btn act-labelled" onClick={() => document.getElementById(commentBoxId(item.id))?.focus()}>
                                                <Icon name="message-square" />
                                                <span>{t('Comment')}</span>
                                            </button>
                                        ) : null}
                                        {v.url ? (
                                            <button type="button" className="act-btn act-labelled" onClick={() => copyLink(v.url ?? '')}>
                                                <Icon name="link" />
                                                <span>{t('Copy link')}</span>
                                            </button>
                                        ) : null}
                                    </footer>
                                </>
                            )}
                        </article>
                        {item ? (
                            <CommentTree item={item} />
                        ) : activity.isError ? (
                            <p className="muted small discussion-note" role="status">
                                {t('Its comments can’t be shown: {{reason}}', { reason: errorMessage(activity.error) })}
                            </p>
                        ) : !itemId ? (
                            <p className="muted small discussion-note">{state === 'processing' ? t('Comments open once the video is ready.') : t('Its comments are on the network’s site only.')}</p>
                        ) : (
                            <p className="muted small discussion-note">{t('Loading comments…')}</p>
                        )}
                    </>
            )}
        </DetailShell>
    );
}
