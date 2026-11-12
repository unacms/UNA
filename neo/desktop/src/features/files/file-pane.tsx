import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { problemMessage } from 'una-api';

import { longTime, useContextGroup } from '../../components/activity-card';
import { Icon } from '../../components/icon';
import { ProfileBadges } from '../../components/profile-badges';
import { RichText } from '../../components/rich-text';
import { ApiError, ensureOk, isGone, retryOnce, sessionOf, unwrap } from '../../lib/api';
import { useWindowAnnounce } from '../../lib/announce';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { t } from '../../lib/i18n';
import { useMediaSrc, usePicture } from '../../lib/media';
import { confirmAction, DownloadError, saveDownload } from '../../lib/native';
import { useNavigation } from '../../lib/navigation';
import { DetailShell, focusMoreButton } from '../../shell/detail-shell';
import { useCopyLink } from '../../lib/copy-link';
import { ToolbarButton } from '../../shell/pane';
import { useAnnouncer } from '../feed/feed-list';
import { EditTitleText } from '../photos/edit-title-text';
import { EntryActions, EntryComments, useEntryItem } from '../photos/entry-item';
import { ProfileAvatar, ProfileName } from '../profile/profile-link';
import { viewsText } from '../videos/videos';
import { FileTypeIcon } from './file-list';
import { downloadName, dropFile, type FileEntry, fileFromLists, fileKey, filePreview, fileSizeText, fileType, putFile } from './files';

/**
 * What a file shows of itself: an image's copy, a converted video's player, an audio player,
 * or (a document, an archive, a video not converted yet) its type's icon with its name. The site
 * makes no still of a PDF, so a PDF is its icon. A private file's link lasts a few minutes: when
 * the audio player finds it no longer good, it asks for the file again (onStale) and plays the
 * fresh link, once.
 */
function FilePreview({ file: f, onStale }: { file: FileEntry; onStale: () => Promise<unknown> }) {
    const allowed = useMediaSrc();
    const preview = filePreview(f.media, allowed);
    const picture = usePicture(preview?.kind === 'image' ? preview.src : null);
    const name = f.title || t('the file');
    const audio = useRef<HTMLAudioElement>(null);
    const audioSrc = preview?.kind === 'audio' ? preview.src : null;
    // the link that failed, while a fresh one is asked for (it plays once that comes); one retry per link
    const stale = useRef<string | null>(null);
    const retried = useRef<string | null>(null);
    useEffect(() => {
        if (!stale.current || !audioSrc || audioSrc === stale.current) return;
        stale.current = null;
        void audio.current?.play()?.catch(() => undefined);
    }, [audioSrc]);
    const audioFailed = () => {
        if (!audioSrc || retried.current === audioSrc) return;
        retried.current = audioSrc;
        stale.current = audioSrc;
        void onStale();
    };
    if (preview?.kind === 'image' && picture.src)
        return (
            <div className="file-preview file-preview-image">
                <img src={picture.src} alt={f.title ? t('Preview of {{name}}', { name: f.title }) : t('Preview of the file')} decoding="async" onError={picture.onError} onLoad={picture.onLoad} />
            </div>
        );
    if (preview?.kind === 'video')
        return (
            <div className="video-player">
                <video src={preview.src} poster={preview.poster} controls playsInline preload="metadata" aria-label={name} />
            </div>
        );
    if (preview?.kind === 'audio')
        return (
            <div className="file-preview file-preview-audio">
                <FileTypeIcon file={f} size={48} />
                <audio ref={audio} src={preview.src} controls preload="none" aria-label={name} onError={audioFailed} />
            </div>
        );
    return (
        <div className="file-preview file-preview-icon">
            <FileTypeIcon file={f} size={64} />
            <span className="small muted">{noPreviewText(f)}</span>
        </div>
    );
}

/** What Download says while it runs: how far it is where the site gave the size. */
function downloadingText(d: { received: number; total: number }): string {
    return d.total ? t('Downloading, {{percent}}%', { percent: Math.min(100, Math.floor((100 * d.received) / d.total)) }) : t('Downloading…');
}

/** Why a file shows its icon: a video the network converts plays later, any other is a download. */
function noPreviewText(f: Pick<FileEntry, 'media'>): string {
    if (f.media?.kind === 'video' && f.media.state === 'processing') return t('It plays here once the network has converted it.');
    if (f.media?.kind === 'video' && f.media.state === 'failed') return t('The network could not convert it: download it to open it.');
    return t('No preview: download it to open it.');
}

/**
 * A file in the detail pane (or a window of its own): its preview where it has one, its title,
 * its type, size and name, who added it with their badges, when and where, Download (the
 * system's save dialog asks where: Rust saves it), its description, its reactions and its
 * comments (its Item's). Its author, and moderators, edit its title and description in place
 * and delete it from More.
 */
export function FilePane({ id }: { id: string }) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const { forget } = useNavigation();
    const announceInWindow = useWindowAnnounce();
    const [announcement, announce] = useAnnouncer();
    const [editing, setEditing] = useState(false);
    const [downloading, setDownloading] = useState<{ received: number; total: number } | null>(null);
    const [downloadError, setDownloadError] = useState<string | null>(null);

    const file = useQuery({
        queryKey: fileKey(id),
        queryFn: async () => unwrap(await api.GET('/files/{id}', { params: { path: { id } } })),
        initialData: () => fileFromLists(queryClient, id),
        // what a list had is old and without its description: show it and fetch the current one
        initialDataUpdatedAt: 0,
        retry: retryOnce,
    });
    const gone = file.isError && isGone(file.error);
    const f = gone ? undefined : file.data;
    const itemId = f?.content_id ?? null;
    const activity = useEntryItem(itemId, f?.stats.comments, fileKey(id));
    const group = useContextGroup(f ?? { context_id: null, audience: 'public' });

    const download = async () => {
        if (!f) return;
        if (downloading) {
            announce(downloadingText(downloading));
            return;
        }
        setDownloadError(null);
        setDownloading({ received: 0, total: f.media?.size ?? 0 });
        try {
            // a fresh link: a private file's token lasts a few minutes
            const fresh = unwrap(await api.GET('/files/{id}', { params: { path: { id } } }));
            putFile(queryClient, fresh);
            const url = fresh.media?.download_url || fresh.media?.url;
            if (!url) throw new DownloadError(t('The network no longer has this file'), 404, 'gone');
            const name = downloadName(fresh);
            const saved = await saveDownload(url, name, sessionOf(api), (received, total) => setDownloading({ received, total }));
            if (saved.saved) announce(t('Saved {{name}}', { name: saved.name }));
        } catch (e) {
            const message = e instanceof ApiError && e.status === 404 ? t('This file is gone') : errorMessage(e);
            setDownloadError(t('Could not download it: {{reason}}', { reason: message }));
        } finally {
            setDownloading(null);
        }
    };

    const remove = async () => {
        if (!f) return;
        const ok = await confirmAction({ title: t('Delete this file?'), message: t('It is deleted for everyone, with its comments. This cannot be undone.'), okLabel: t('Delete') });
        if (!ok) return;
        try {
            ensureOk(await api.DELETE('/files/{id}', { params: { path: { id } } }));
        } catch (e) {
            if (!(e instanceof ApiError && e.status === 404)) {
                announce(t('Could not delete it: {{reason}}', { reason: errorMessage(e) }));
                return;
            }
        }
        announceInWindow(t('File deleted'));
        dropFile(queryClient, id);
        forget({ kind: 'file', id });
    };

    const copyLink = useCopyLink(announce);

    const type = f ? fileType(f) : null;
    const size = fileSizeText(f?.media?.size);
    const busyText = downloading ? downloadingText(downloading) : null;

    return (
        <DetailShell
            detail={{ kind: 'file', id }}
            noun="file"
            icon="file"
            query={file}
            item={f}
            title={f?.title || t('File')}
            inContext={!!file.data?.context_id}
            heroTitle={!editing}
            announcement={announcement}
            announce={announce}
            className="thread file-detail"
            tools={f?.media ? <ToolbarButton icon="download" label={busyText ?? t('Download')} disabled={!!downloading} note={busyText ? t('It is being downloaded') : undefined} onClick={() => void download()} /> : null}
            more={(shown) => ({
                link: shown.url,
                lead: [{ text: t('Download…'), run: () => void download() }],
                own: [...(shown.viewer?.can_edit ? [{ text: t('Edit File'), run: () => setEditing(true) }] : []), ...(shown.viewer?.can_delete ? [{ text: t('Delete File…'), run: () => void remove() }] : [])],
            })}
        >
            {(f) => (
                    <>
                        <article className="video-post" aria-labelledby="detail-title">
                            <FilePreview file={f} onStale={() => file.refetch()} />
                            {editing ? (
                                <EditTitleText
                                    noun="file"
                                    title={f.title}
                                    html={f.text_html}
                                    save={async (body) => {
                                        const result = await api.PATCH('/files/{id}', { params: { path: { id } }, body });
                                        return result.error !== undefined || !result.data ? { error: problemMessage(result.error, t('It was not saved')) } : { saved: result.data };
                                    }}
                                    onDone={(saved: FileEntry | null) => {
                                        setEditing(false);
                                        if (saved) {
                                            putFile(queryClient, saved);
                                            announce(t('File saved'));
                                        }
                                        focusMoreButton('file');
                                    }}
                                />
                            ) : (
                                <>
                                    <div className="profile-name video-heading" aria-hidden="true" dir="auto">
                                        {f.title}
                                    </div>
                                    <p className="file-facts">
                                        <span>{type?.label}</span>
                                        {size ? <span>{size}</span> : null}
                                        {f.media?.original_name && f.media.original_name !== f.title ? (
                                            <bdi className="truncate" title={f.media.original_name}>
                                                {f.media.original_name}
                                            </bdi>
                                        ) : null}
                                    </p>
                                    {f.media ? (
                                        <div className="file-download">
                                            <button type="button" className="btn btn-primary" onClick={() => void download()} aria-disabled={downloading ? true : undefined} aria-busy={downloading ? true : undefined}>
                                                <Icon name="download" size={16} />
                                                <span>{busyText ?? t('Download')}</span>
                                            </button>
                                            {downloading && downloading.total ? <progress className="file-progress" max={downloading.total} value={downloading.received} aria-label={t('Downloading {{name}}', { name: f.title })} /> : null}
                                            {downloadError ? (
                                                <p className="error small" role="alert">
                                                    {downloadError}
                                                </p>
                                            ) : null}
                                        </div>
                                    ) : null}
                                    <div className="discussion-by">
                                        <ProfileAvatar profile={f.author} size={44} />
                                        <div className="activity-head-detail">
                                            {f.author ? (
                                                <span className={`activity-by${f.author.badges?.length ? ' with-badges' : ''}`}>
                                                    <ProfileName profile={f.author} className="strong" />
                                                    <ProfileBadges badges={f.author.badges} />
                                                </span>
                                            ) : (
                                                <strong className="activity-by">{t('Someone')}</strong>
                                            )}
                                            <p className="activity-meta">
                                                <time dateTime={f.created_at} title={longTime(f.created_at)}>
                                                    {longTime(f.created_at)}
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
                                    {f.text_html ? <RichText html={f.text_html} className="discussion-body" /> : null}
                                    <p className="activity-stats">{viewsText(f.stats.views)}</p>
                                    <EntryActions activity={activity.data} url={f.url} onCopyLink={copyLink} onError={announce} />
                                </>
                            )}
                        </article>
                        <EntryComments itemId={itemId} activity={activity.data} error={activity.error} loading={activity.isLoading} />
                    </>
            )}
        </DetailShell>
    );
}
