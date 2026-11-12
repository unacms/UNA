import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { problemMessage } from 'una-api';

import { longTime, useContextGroup } from '../../components/activity-card';
import { EmptyState } from '../../components/empty-state';
import { ProfileBadges } from '../../components/profile-badges';
import { RichText } from '../../components/rich-text';
import { SkeletonRows } from '../../components/skeleton';
import { ApiError, ensureOk, isGone, retryOnce, unwrap } from '../../lib/api';
import { useWindowAnnounce } from '../../lib/announce';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { t, tn } from '../../lib/i18n';
import { confirmAction } from '../../lib/native';
import { useNavigation } from '../../lib/navigation';
import { useFillEmptyPages } from '../../lib/paging';
import type { Uploader } from '../../lib/uploads';
import { DetailShell, focusMoreButton } from '../../shell/detail-shell';
import { useCopyLink } from '../../lib/copy-link';
import { ToolbarButton } from '../../shell/pane';
import { useAnnouncer } from '../feed/feed-list';
import { ProfileAvatar, ProfileName } from '../profile/profile-link';
import { Lightbox } from '../thread/lightbox';
import { viewsText } from '../videos/videos';
import { EditTitleText } from './edit-title-text';
import { EntryActions, EntryComments, useEntryItem } from './entry-item';
import { PhotoGrid } from './photo-grid';
import { MoreButton } from './photo-list';
import { PhotoDropZone, usePhotoUploads } from './photo-uploads';
import { afterAddedToAlbum, type Album, albumFromLists, albumItemsKey, albumKey, dropAlbum, fetchAlbumItems, itemsText, putAlbum } from './photos';

/**
 * Adding photos to the album: they upload as they are picked or dropped, then go in at its end.
 * Esc or Cancel closes it (the uploads nothing took are deleted). Photos still being made ready
 * hold Add as ones that are uploading; while they are being added it takes no photo and lets
 * none go (Esc and Cancel wait too, as the other forms' fields do), and a request that got no
 * answer leaves it as it was, to send again. Left through the pane meanwhile (Close, another
 * album), the request keeps its uploads and its answer does nothing to what is shown then.
 */
function AddPhotos({ album, uploader, onDone, announce }: { album: Album; uploader?: Uploader; onDone: (added: number, read?: Promise<void>) => void; announce: (text: string) => void }) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const id = useId();
    const uploads = usePhotoUploads({ purpose: 'album', uploader, announce });
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const n = uploads.ids.length;

    // the button that opened it is gone (it shows only while this is closed): focus goes to choosing the photos
    useEffect(() => {
        document.getElementById(`${id}-pick`)?.focus();
    }, [id]);

    const submit = async () => {
        if (sending) return;
        // files being made ready (picked or dropped, not in the tray yet) hold it as ones that are
        // uploading: sent now, it would go without them
        const blocker = uploads.staging() ? t('Wait until the uploads are done') : (uploads.blocker ?? (n ? null : t('Choose the photos to add.')));
        if (blocker) {
            setError(blocker);
            document.getElementById(`${id}-pick`)?.focus();
            return;
        }
        setSending(true);
        setError(null);
        let result;
        try {
            result = await uploads.claim(api.POST('/albums/{id}/items', { params: { path: { id: album.id } }, body: { media_ids: uploads.ids } }), (r) => r.error === undefined && !!r.data);
        } catch (e) {
            if (uploads.gone()) return;
            setSending(false);
            setError(t('The photos were not added: {{reason}}', { reason: errorMessage(e) }));
            return;
        }
        if (result.error !== undefined || !result.data) {
            if (uploads.gone()) return;
            setSending(false);
            setError(problemMessage(result.error, t('The photos were not added')));
            return;
        }
        // the album is read again without the panel waiting for it (nor being there: the pane may
        // show another album by now): the photos are in it, and a site slow to answer the reading
        // would keep a panel that Cancel and Esc can't close
        const read = afterAddedToAlbum(queryClient, album.id);
        if (!uploads.gone()) onDone(result.data.length, read);
    };

    const cancel = () => {
        if (sending) return;
        onDone(0);
    };

    return (
        <section
            className="album-add"
            aria-labelledby={`${id}-heading`}
            onKeyDown={(e) => {
                if (e.key !== 'Escape') return;
                e.preventDefault();
                e.stopPropagation();
                cancel();
            }}
        >
            <h3 id={`${id}-heading`} className="section-title">
                {t('Add photos to {{name}}', { name: album.title })}
            </h3>
            <PhotoDropZone uploads={uploads} pickId={`${id}-pick`} describedBy={error ? `${id}-error` : undefined} held={sending} />
            {error ? (
                <p id={`${id}-error`} className="error small" role="alert">
                    {error}
                </p>
            ) : null}
            <div className="settings-actions">
                <button type="button" className="btn" onClick={cancel} aria-disabled={sending || undefined}>
                    {t('Cancel')}
                </button>
                <button type="button" className="btn btn-primary" onClick={() => void submit()} aria-disabled={sending || undefined} aria-busy={sending || undefined}>
                    {n > 1 ? tn(n, 'Add {{count}} photo', 'Add {{count}} photos') : t('Add to album')}
                </button>
            </div>
        </section>
    );
}

/**
 * An album in the detail pane (or a window of its own): its title, who made it with their
 * badges, when and where, how many photos, its text, its photos as a grid (the arrow keys move
 * between them; one opens full size in the viewer, where ← and → go through them, Esc closes it
 * and focus goes back to its tile), its reactions and comments (its Item's). Who may edit it adds
 * photos, edits its title and text and deletes it from More.
 */
export function AlbumPane({ id, uploader }: { id: string; uploader?: Uploader }) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const { forget } = useNavigation();
    const announceInWindow = useWindowAnnounce();
    const [announcement, announce] = useAnnouncer();
    const [editing, setEditing] = useState(false);
    const [adding, setAdding] = useState(false);
    const [viewing, setViewing] = useState<number | null>(null);
    // the album photos were just added to, until it is read again: what is shown of it meanwhile
    // is from before them, and must not say it has none
    const [reading, setReading] = useState<string | null>(null);
    // which reading that is: one from an earlier add ends (or is given up for the next) while
    // the latest is still on its way
    const rereads = useRef(0);

    const album = useQuery({
        queryKey: albumKey(id),
        queryFn: async () => unwrap(await api.GET('/albums/{id}', { params: { path: { id } } })),
        initialData: () => albumFromLists(queryClient, id),
        initialDataUpdatedAt: 0,
        retry: retryOnce,
    });
    const gone = album.isError && isGone(album.error);
    const a = gone ? undefined : album.data;
    const items = useInfiniteQuery({
        queryKey: albumItemsKey(id),
        queryFn: async ({ pageParam }) => fetchAlbumItems(api, id, pageParam as string | undefined),
        getNextPageParam: (last) => last.next_cursor ?? undefined,
        enabled: !!a,
        retry: retryOnce,
    });
    useFillEmptyPages(items);
    const photos = items.data?.pages.flatMap((p) => p.items) ?? [];
    const shown = photos.filter((p) => p.media);
    const awaited = reading === id && !photos.length;

    const itemId = a?.content_id ?? null;
    const activity = useEntryItem(itemId, a?.stats.comments, albumKey(id));
    const group = useContextGroup(a ?? { context_id: null, audience: 'public' });
    const closeViewer = useCallback(() => setViewing(null), []);

    const remove = async () => {
        if (!a) return;
        const ok = await confirmAction({ title: t('Delete this album?'), message: tn(a.stats.items, 'It is deleted for everyone with its {{count}} photo and their comments. This cannot be undone.', 'It is deleted for everyone with its {{count}} photos and their comments. This cannot be undone.'), okLabel: t('Delete') });
        if (!ok) return;
        try {
            ensureOk(await api.DELETE('/albums/{id}', { params: { path: { id } } }));
        } catch (e) {
            if (!(e instanceof ApiError && e.status === 404)) {
                announce(t('Could not delete it: {{reason}}', { reason: errorMessage(e) }));
                return;
            }
        }
        announceInWindow(t('Album deleted'));
        dropAlbum(queryClient, id);
        forget({ kind: 'album', id });
    };

    const copyLink = useCopyLink(announce);

    return (
        <DetailShell
            detail={{ kind: 'album', id }}
            noun="album"
            icon="images"
            query={album}
            item={a}
            title={a?.title || t('Album')}
            inContext={!!album.data?.context_id}
            heroTitle={!editing}
            announcement={announcement}
            announce={announce}
            className="thread album-detail"
            tools={a?.viewer?.can_edit && !adding ? <ToolbarButton icon="image-plus" label={t('Add Photos')} onClick={() => setAdding(true)} /> : null}
            more={(shown) => ({
                link: shown.url,
                own: [
                    ...(shown.viewer?.can_edit ? [{ text: t('Add Photos…'), run: () => setAdding(true) }, { text: t('Edit Album'), run: () => setEditing(true) }] : []),
                    ...(shown.viewer?.can_delete ? [{ text: t('Delete Album…'), run: () => void remove() }] : []),
                ],
            })}
        >
            {(a) => (
                    <>
                        <article className="video-post" aria-labelledby="detail-title">
                            {editing ? (
                                <EditTitleText
                                    noun="album"
                                    title={a.title}
                                    html={a.text_html}
                                    save={async (body) => {
                                        const result = await api.PATCH('/albums/{id}', { params: { path: { id } }, body });
                                        return result.error !== undefined || !result.data ? { error: problemMessage(result.error, t('It was not saved')) } : { saved: result.data };
                                    }}
                                    onDone={(saved: Album | null) => {
                                        setEditing(false);
                                        if (saved) {
                                            putAlbum(queryClient, saved);
                                            announce(t('Album saved'));
                                        }
                                        focusMoreButton('album');
                                    }}
                                />
                            ) : (
                                <>
                                    <div className="profile-name video-heading" aria-hidden="true" dir="auto">
                                        {a.title}
                                    </div>
                                    <div className="discussion-by">
                                        <ProfileAvatar profile={a.author} size={44} />
                                        <div className="activity-head-detail">
                                            {a.author ? (
                                                <span className={`activity-by${a.author.badges?.length ? ' with-badges' : ''}`}>
                                                    <ProfileName profile={a.author} className="strong" />
                                                    <ProfileBadges badges={a.author.badges} />
                                                </span>
                                            ) : (
                                                <strong className="activity-by">{t('Someone')}</strong>
                                            )}
                                            <p className="activity-meta">
                                                <time dateTime={a.created_at} title={longTime(a.created_at)}>
                                                    {longTime(a.created_at)}
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
                                    {a.text_html ? <RichText html={a.text_html} className="discussion-body" /> : null}
                                    <p className="activity-stats">
                                        {itemsText(a.stats.items)} · {viewsText(a.stats.views)}
                                    </p>
                                </>
                            )}
                            {adding ? (
                                <AddPhotos
                                    album={a}
                                    uploader={uploader}
                                    announce={announce}
                                    onDone={(added, read) => {
                                        setAdding(false);
                                        if (added && read) {
                                            const mine = ++rereads.current;
                                            const done = () => {
                                                if (rereads.current === mine) setReading(null);
                                            };
                                            setReading(id);
                                            void read.then(done, done);
                                        }
                                        if (added) announce(tn(added, 'A photo was added to the album', '{{count}} photos were added to the album'));
                                        focusMoreButton('album');
                                    }}
                                />
                            ) : null}
                            <section className="album-photos" aria-label={t('Photos in {{name}}', { name: a.title })} aria-busy={items.isLoading || awaited || undefined}>
                                <SkeletonRows loading={items.isLoading || awaited} />
                                {items.isError ? (
                                    <p className="error small" role="alert">
                                        {t('Its photos can’t be shown: {{reason}}', { reason: errorMessage(items.error) })}
                                    </p>
                                ) : null}
                                {!items.isLoading && !items.isError && !photos.length && !awaited ? (
                                    <EmptyState
                                        icon="images"
                                        title={t('No photos in this album yet')}
                                        actions={
                                            a.viewer?.can_edit && !adding ? (
                                                <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
                                                    {t('Add photos')}
                                                </button>
                                            ) : undefined
                                        }
                                    />
                                ) : null}
                                {shown.length ? <PhotoGrid items={shown} label={t('Photos in {{name}}, in the album’s order', { name: a.title })} total={a.stats.items} ownerId={a.author?.id} onOpen={setViewing} /> : null}
                                <MoreButton shown={!!items.hasNextPage} busy={items.isFetchingNextPage} onMore={() => void items.fetchNextPage()}>
                                    {t('More photos')}
                                </MoreButton>
                            </section>
                            {!editing ? <EntryActions activity={activity.data} url={a.url} onCopyLink={copyLink} onError={announce} /> : null}
                        </article>
                        <EntryComments itemId={itemId} activity={activity.data} error={activity.error} loading={activity.isLoading} />
                        <Lightbox images={shown.flatMap((p) => (p.media ? [p.media] : []))} names={shown.flatMap((p) => (p.media ? [p.title] : []))} index={viewing} onIndex={setViewing} onClose={closeViewer} label={a.title} />
                    </>
            )}
        </DetailShell>
    );
}
