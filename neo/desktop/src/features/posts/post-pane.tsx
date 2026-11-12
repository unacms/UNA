import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { audienceText, longTime, useContextGroup } from '../../components/activity-card';
import { Icon } from '../../components/icon';
import { ProfileBadges } from '../../components/profile-badges';
import { RichText } from '../../components/rich-text';
import { ApiError, ensureOk, isGone, retryOnce, unwrap } from '../../lib/api';
import { useWindowAnnounce } from '../../lib/announce';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { t } from '../../lib/i18n';
import { rich } from '../../lib/i18n-rich';
import { useMediaSrc, usePicture } from '../../lib/media';
import { confirmAction } from '../../lib/native';
import { useNavigation } from '../../lib/navigation';
import { DetailShell, focusMoreButton } from '../../shell/detail-shell';
import { useCopyLink } from '../../lib/copy-link';
import { paneHeadingId } from '../../shell/pane';
import { dropFromFeeds } from '../feed/cache';
import { useAnnouncer } from '../feed/feed-list';
import { MediaGrid } from '../feed/media';
import { EntryActions, EntryComments, useEntryItem } from '../photos/entry-item';
import { ProfileAvatar, ProfileName } from '../profile/profile-link';
import { EditPost } from './edit-post';
import { dropPost, isWebUrl, type Post, postFromLists, postKey, postTime, putPost, readingText, stateText } from './posts';

/** The cover across the top of the post: its large copy, else a smaller one. */
function PostCover({ post }: { post: Post }) {
    const allowed = useMediaSrc();
    const v = post.cover?.variants;
    const picture = usePicture(allowed(v?.large?.url) ?? allowed(v?.medium?.url) ?? allowed(v?.thumb?.url) ?? null);
    if (!picture.src) return null;
    const w = post.cover?.width;
    const h = post.cover?.height;
    return <img className="article-cover" src={picture.src} alt="" decoding="async" width={w ?? undefined} height={h ?? undefined} onError={picture.onError} onLoad={picture.onLoad} />;
}

/**
 * A post of the Posts module in the detail pane (or a window of its own): its cover, its title
 * (the hero the toolbar title follows), who wrote it with their badges after the name, when, how
 * long it reads, where it is and who sees it, its whole text, its photos and videos, and the
 * reactions and comments of its Item (the same thread as a feed post's). More has Open in New
 * Window, Copy Link and, for who may (`viewer.can_edit`, `viewer.can_delete`), Edit Post, which
 * puts the form in place of the post (edit-post.tsx), and Delete.
 */
export function PostPane({ id }: { id: string }) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const { forget } = useNavigation();
    const announceInWindow = useWindowAnnounce();
    const [announcement, announce] = useAnnouncer();
    const [editing, setEditing] = useState(false);
    const post = useQuery({
        queryKey: postKey(id),
        queryFn: async () => unwrap(await api.GET('/posts/{id}', { params: { path: { id } } })),
        initialData: () => postFromLists(queryClient, id),
        // what a list had is old and without its text: show it and fetch the current one
        initialDataUpdatedAt: 0,
        retry: retryOnce,
    });
    const fresh = post.isSuccess && post.isFetchedAfterMount && !post.isFetching;
    const gone = post.isError && isGone(post.error);
    const p = gone ? undefined : post.data;
    const itemId = p?.content_id ?? null;
    const activity = useEntryItem(itemId, p?.stats.comments, postKey(id));
    const group = useContextGroup(p ?? { context_id: null, audience: 'public' });

    const remove = async () => {
        if (!p) return;
        const ok = await confirmAction({ title: t('Delete this post?'), message: t('It is deleted for everyone, with its comments. This cannot be undone.'), okLabel: t('Delete') });
        if (!ok) return;
        try {
            ensureOk(await api.DELETE('/posts/{id}', { params: { path: { id } } }));
        } catch (e) {
            if (!(e instanceof ApiError && e.status === 404)) {
                announce(t('Could not delete it: {{reason}}', { reason: errorMessage(e) }));
                return;
            }
        }
        announceInWindow(t('Post deleted'));
        if (p.content_id) dropFromFeeds(queryClient, p.content_id);
        dropPost(queryClient, id);
        forget({ kind: 'article', id });
    };

    const copyLink = useCopyLink(announce);

    const when = p ? postTime(p) : null;
    const state = p ? stateText(p) : null;
    // links the browser opens: never another scheme, whatever the site keeps
    const links = p ? p.links.filter((l) => isWebUrl(l.url)) : [];
    const audience = p ? audienceText(p.audience) : null;

    return (
        <DetailShell
            detail={{ kind: 'article', id }}
            noun="post"
            icon="newspaper"
            query={post}
            item={p}
            title={p?.title || t('Post')}
            inContext={!!post.data?.context_id}
            announcement={announcement}
            announce={announce}
            className="thread article-detail"
            // while it is edited the hero's title is gone, so the toolbar's shows
            heroTitle={!editing}
            more={(shown) => ({
                link: shown.url,
                own: [
                    // edited only as the site answered in this view: a list's row has no text, and a copy
                    // kept from before (the cache is persisted) may be older than what the site has
                    ...(shown.viewer?.can_edit && shown.body_html !== null && fresh ? [{ text: t('Edit Post'), run: () => setEditing(true) }] : []),
                    ...(shown.viewer?.can_delete ? [{ text: t('Delete Post…'), run: () => void remove() }] : []),
                ],
            })}
        >
            {(p) =>
                editing ? (
                    <EditPost
                        post={p}
                        announce={announce}
                        onDone={(saved) => {
                            setEditing(false);
                            if (saved) {
                                putPost(queryClient, saved);
                                announce(t('Post saved'));
                            }
                            focusMoreButton('post');
                        }}
                    />
                ) : (
                    <>
                        <article className="video-post article-post" aria-labelledby={paneHeadingId('detail')}>
                            <PostCover post={p} />
                            {/* the hero (the toolbar shows the title once it is scrolled under); screen readers have the pane's heading */}
                            <div className="profile-name video-heading article-heading" aria-hidden="true" dir="auto">
                                {p.title}
                            </div>
                            <header className="poll-by article-by">
                                <ProfileAvatar profile={p.author ?? null} size={36} />
                                <span>
                                    <span className={p.author?.badges?.length ? 'with-badges' : undefined}>
                                        {p.author ? <ProfileName profile={p.author} className="strong" /> : <strong>{p.anonymous ? t('Anonymous') : t('Someone')}</strong>}
                                        <ProfileBadges badges={p.author?.badges} />
                                    </span>
                                    <span className="muted small article-meta">
                                        {when ? <time dateTime={when}>{longTime(when)}</time> : null}
                                        <span aria-hidden="true">·</span>
                                        <span>{readingText(p.reading_minutes)}</span>
                                        {group ? (
                                            <>
                                                <span aria-hidden="true">·</span>
                                                <span>
                                                    {rich(t('in <bdi>{{name}}</bdi>', { name: group.display_name }), { bdi: (text) => <bdi>{text}</bdi> })}
                                                </span>
                                            </>
                                        ) : audience ? (
                                            <>
                                                <span aria-hidden="true">·</span>
                                                <span>{audience}</span>
                                            </>
                                        ) : null}
                                    </span>
                                </span>
                            </header>
                            {state ? (
                                <p className="small article-state" role="note">
                                    <Icon name={p.state === 'scheduled' ? 'clock' : 'eye-off'} size={14} strong />
                                    <span>{state}</span>
                                </p>
                            ) : null}
                            {p.body_html ? <RichText html={p.body_html} className="article-body" /> : p.summary ? <p className="article-body">{p.summary}</p> : null}
                            <MediaGrid media={p.media} large by={p.author?.display_name} />
                            {links.length ? (
                                <ul className="article-links" aria-label={t('Links')}>
                                    {links.map((l) => (
                                        <li key={l.id}>
                                            <a href={l.url} target="_blank" rel="noreferrer noopener" aria-label={t('{{title}} (opens in your browser)', { title: l.title || l.host })}>
                                                <Icon name="link" size={14} />
                                                <span>{l.title || l.host}</span>
                                            </a>
                                            <span className="muted small">{l.host}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
                            <EntryActions activity={activity.data} url={p.url} onCopyLink={copyLink} onError={announce} />
                        </article>
                        <EntryComments itemId={itemId} activity={activity.data} error={activity.error} loading={activity.isLoading} />
                    </>
                )
            }
        </DetailShell>
    );
}
