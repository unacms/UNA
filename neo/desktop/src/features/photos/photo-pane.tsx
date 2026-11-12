import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { problemMessage } from 'una-api';

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
import { confirmAction } from '../../lib/native';
import { useNavigation } from '../../lib/navigation';
import { DetailShell, focusMoreButton } from '../../shell/detail-shell';
import { useCopyLink } from '../../lib/copy-link';
import { useAnnouncer } from '../feed/feed-list';
import { pictureOf } from '../feed/media';
import { ProfileAvatar, ProfileName } from '../profile/profile-link';
import { Lightbox } from '../thread/lightbox';
import { viewsText } from '../videos/videos';
import { EditTitleText } from './edit-title-text';
import { EntryActions, EntryComments, useEntryItem } from './entry-item';
import { dropPhoto, type Photo, photoFromLists, photoKey, photoSiblings, putPhoto, viewerLabel } from './photos';

/** The picture of a photo, in a box of its shape: a button that shows it full size. */
export function PhotoPicture({ photo: p, onView }: { photo: Photo; onView: () => void }) {
    const allowed = useMediaSrc();
    const picture = usePicture(p.media ? pictureOf(p.media, 'large', allowed) : null);
    const ratio = p.media?.width && p.media.height ? `${p.media.width} / ${p.media.height}` : undefined;
    return (
        <button type="button" className="photo-picture" style={ratio ? { aspectRatio: ratio } : undefined} onClick={onView} aria-label={p.title ? t('View “{{title}}” full size', { title: p.title }) : t('View “the photo” full size')} aria-haspopup="dialog">
            {picture.src ? <img src={picture.src} alt="" decoding="async" onError={picture.onError} onLoad={picture.onLoad} /> : <Icon name="image" size={28} />}
            <span className="photo-picture-zoom" aria-hidden="true">
                <Icon name="maximize-2" size={14} />
            </span>
        </button>
    );
}

/**
 * A photo in the detail pane (or a window of its own): the picture (full size in the viewer,
 * where ← and → go through the photos of the list it was opened from, Esc closing it and focus
 * going back to the picture), its title, who added it
 * with their badges, when and where, its text, its reactions and its comments (its Item's). Its
 * author, and moderators, edit its title and text in place and delete it from More.
 */
export function PhotoPane({ id }: { id: string }) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const { forget } = useNavigation();
    const announceInWindow = useWindowAnnounce();
    const [announcement, announce] = useAnnouncer();
    const [editing, setEditing] = useState(false);
    const [viewing, setViewing] = useState<{ photos: Photo[]; index: number; label: string } | null>(null);

    const photo = useQuery({
        queryKey: photoKey(id),
        queryFn: async () => unwrap(await api.GET('/photos/{id}', { params: { path: { id } } })),
        initialData: () => photoFromLists(queryClient, id),
        // what a list had is old and without its text: show it and fetch the current one
        initialDataUpdatedAt: 0,
        retry: retryOnce,
    });
    const gone = photo.isError && isGone(photo.error);
    const p = gone ? undefined : photo.data;
    const itemId = p?.content_id ?? null;
    const activity = useEntryItem(itemId, p?.stats.comments, photoKey(id));
    const group = useContextGroup(p ?? { context_id: null, audience: 'public' });

    // the viewer goes through the photos of the list it came from (this one alone otherwise)
    const view = () => {
        if (!p) return;
        const list = photoSiblings(queryClient, id);
        const siblings = list.photos.filter((x) => x.media);
        const inList = siblings.some((x) => x.id === id);
        const photos = inList ? siblings : [p];
        setViewing({ photos, index: Math.max(0, photos.findIndex((x) => x.id === id)), label: viewerLabel(inList ? list.of : null, p, group?.display_name) });
    };
    const closeViewer = useCallback(() => setViewing(null), []);

    const remove = async () => {
        if (!p) return;
        const ok = await confirmAction({ title: t('Delete this photo?'), message: t('It is deleted for everyone, with its comments. This cannot be undone.'), okLabel: t('Delete') });
        if (!ok) return;
        try {
            ensureOk(await api.DELETE('/photos/{id}', { params: { path: { id } } }));
        } catch (e) {
            if (!(e instanceof ApiError && e.status === 404)) {
                announce(t('Could not delete it: {{reason}}', { reason: errorMessage(e) }));
                return;
            }
        }
        announceInWindow(t('Photo deleted'));
        dropPhoto(queryClient, id);
        forget({ kind: 'photo', id });
    };

    const copyLink = useCopyLink(announce);

    return (
        <DetailShell
            detail={{ kind: 'photo', id }}
            noun="photo"
            icon="image"
            query={photo}
            item={p}
            title={p?.title || t('Photo')}
            inContext={!!photo.data?.context_id}
            heroTitle={!editing}
            announcement={announcement}
            announce={announce}
            className="thread photo-detail"
            more={(shown) => ({
                link: shown.url,
                own: [...(shown.viewer?.can_edit ? [{ text: t('Edit Photo'), run: () => setEditing(true) }] : []), ...(shown.viewer?.can_delete ? [{ text: t('Delete Photo…'), run: () => void remove() }] : [])],
            })}
        >
            {(p) => (
                    <>
                        <article className="video-post" aria-labelledby="detail-title">
                            <PhotoPicture photo={p} onView={view} />
                            {editing ? (
                                <EditTitleText
                                    noun="photo"
                                    title={p.title}
                                    html={p.text_html}
                                    save={async (body) => {
                                        const result = await api.PATCH('/photos/{id}', { params: { path: { id } }, body });
                                        return result.error !== undefined || !result.data ? { error: problemMessage(result.error, t('It was not saved')) } : { saved: result.data };
                                    }}
                                    onDone={(saved: Photo | null) => {
                                        setEditing(false);
                                        if (saved) {
                                            putPhoto(queryClient, saved);
                                            announce(t('Photo saved'));
                                        }
                                        focusMoreButton('photo');
                                    }}
                                />
                            ) : (
                                <>
                                    <div className="profile-name video-heading" aria-hidden="true" dir="auto">
                                        {p.title}
                                    </div>
                                    <div className="discussion-by">
                                        <ProfileAvatar profile={p.author} size={44} />
                                        <div className="activity-head-detail">
                                            {p.author ? (
                                                <span className={`activity-by${p.author.badges?.length ? ' with-badges' : ''}`}>
                                                    <ProfileName profile={p.author} className="strong" />
                                                    <ProfileBadges badges={p.author.badges} />
                                                </span>
                                            ) : (
                                                <strong className="activity-by">{t('Someone')}</strong>
                                            )}
                                            <p className="activity-meta">
                                                <time dateTime={p.created_at} title={longTime(p.created_at)}>
                                                    {longTime(p.created_at)}
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
                                    {p.text_html ? <RichText html={p.text_html} className="discussion-body" /> : null}
                                    <p className="activity-stats">{viewsText(p.stats.views)}</p>
                                    <EntryActions activity={activity.data} url={p.url} onCopyLink={copyLink} onError={announce} />
                                </>
                            )}
                        </article>
                        <EntryComments itemId={itemId} activity={activity.data} error={activity.error} loading={activity.isLoading} />
                        <Lightbox
                            images={(viewing?.photos ?? []).flatMap((x) => (x.media ? [x.media] : []))}
                            names={(viewing?.photos ?? []).flatMap((x) => (x.media ? [x.title] : []))}
                            index={viewing ? viewing.index : null}
                            onIndex={(index) => setViewing((v) => (v ? { ...v, index } : v))}
                            onClose={closeViewer}
                            label={viewing?.label ?? t('the photo')}
                        />
                    </>
            )}
        </DetailShell>
    );
}
