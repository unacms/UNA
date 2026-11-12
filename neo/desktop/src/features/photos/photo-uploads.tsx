import { getCurrentWebview } from '@tauri-apps/api/webview';
import { type DragEvent, useEffect, useMemo, useRef, useState } from 'react';

import { Icon, type IconName } from '../../components/icon';
import { useApp } from '../../lib/context';
import { t, tn } from '../../lib/i18n';
import { inApp } from '../../lib/native';
import { isOverDropTarget } from '../../components/rich-editor/images';
import { claimWindowDrops, fileUploader, makeUploader, photoUploader, type Uploader } from '../../lib/uploads';
import { AttachmentTray } from '../compose/attachment-tray';
import { mediaIds, postBlocker, useAttachments } from '../compose/attachments';
import { MAX_FILES } from '../files/files';
import { MAX_ALBUM_PHOTOS, MAX_PHOTOS } from './photos';

/**
 * The photos a form uploads (new photos, a new album, photos added to an album), or the files of
 * new files (`file`: any type): each upload starts as it is picked or dropped, with the form's
 * purpose; Retry and Remove as in a post's tray. Uploads nothing took are deleted on the site
 * when the form goes.
 */
export function usePhotoUploads({ purpose, uploader: given, announce }: { purpose: 'photo' | 'album' | 'file' | 'post_cover'; uploader?: Uploader; announce: (text: string) => void }) {
    const { api } = useApp();
    const uploader = useMemo(() => (purpose === 'file' ? fileUploader(given ?? makeUploader(api)) : photoUploader(given ?? makeUploader(api), purpose)), [given, api, purpose]);
    // the request's own limit: POST /photos and POST /files take 20, an album 50 at a time, a post one cover
    const max = purpose === 'album' ? MAX_ALBUM_PHOTOS : purpose === 'file' ? MAX_FILES : purpose === 'post_cover' ? 1 : MAX_PHOTOS;
    const uploads = useAttachments({ uploader, api, announce, forMessage: purpose !== 'file', max, limitText: purpose === 'post_cover' ? t('A post has one cover: remove this one to choose another') : purpose === 'file' ? tn(max, 'Up to {{count}} file at a time', 'Up to {{count}} files at a time') : tn(max, 'Up to {{count}} photo at a time', 'Up to {{count}} photos at a time'), refusedText: purpose === 'file' ? t('Can’t be added') : undefined });

    const latest = useRef(uploads.items);
    useEffect(() => {
        latest.current = uploads.items;
    }, [uploads.items]);
    useEffect(
        () => () => {
            for (const a of latest.current) if (a.status === 'done' && a.media) void api.DELETE('/uploads/{id}', { params: { path: { id: a.media.id } } }).catch(() => undefined);
        },
        [api],
    );

    return {
        ...uploads,
        uploader,
        /** The uploads the request takes, in their order. */
        ids: mediaIds(uploads.items),
        /** Why the request can't go yet (uploads on their way or failed), or null. */
        blocker: postBlocker(uploads.items),
        /**
         * The site took them (all, or those of these upload ids): they leave the tray, and the
         * form going no longer deletes them. Those it did not take stay, to send again or remove.
         */
        markTaken: (taken?: readonly string[]) => {
            const left = taken ? uploads.items.filter((a) => !(a.media && taken.includes(a.media.id))) : [];
            latest.current = left;
            uploads.reset(left);
        },
    };
}

type Uploads = ReturnType<typeof usePhotoUploads>;

/**
 * Where a form takes its photos (or files): a button for the system's dialog (photos only, or any file), a drop zone
 * (the app window's drops come here while it is shown), and the tray of uploads.
 */
export function PhotoDropZone({ uploads, pickId, describedBy, label = t('Choose photos…'), icon = 'image-plus', dropHint = t('or drop them here') }: { uploads: Uploads; pickId: string; describedBy?: string; label?: string; icon?: IconName; dropHint?: string }) {
    const [dragging, setDragging] = useState(false);
    const { uploader, add } = uploads;

    const addRef = useRef(add);
    useEffect(() => {
        addRef.current = add;
    });
    useEffect(() => {
        if (!inApp) return;
        const release = claimWindowDrops();
        let stop: (() => void) | null = null;
        let live = true;
        void getCurrentWebview()
            .onDragDropEvent((e) => {
                const p = e.payload;
                if (p.type === 'enter') setDragging(true);
                else if (p.type === 'leave') setDragging(false);
                else if (p.type === 'drop') {
                    setDragging(false);
                    // a drop on a text box that takes pictures itself (a post's text) is the box's
                    if (isOverDropTarget(p.position)) return;
                    void uploader.fromPaths(p.paths).then((s) => addRef.current(s));
                }
            })
            .then(
                (fn) => {
                    if (live) stop = fn;
                    else fn();
                },
                (err: unknown) => console.error('drag and drop', err),
            );
        return () => {
            live = false;
            release();
            stop?.();
        };
    }, [uploader]);

    const dropProps = inApp
        ? {}
        : {
              onDragOver: (e: DragEvent) => {
                  if (!e.dataTransfer.types.includes('Files')) return;
                  e.preventDefault();
                  setDragging(true);
              },
              onDragLeave: (e: DragEvent) => {
                  if (e.currentTarget === e.target) setDragging(false);
              },
              onDrop: (e: DragEvent) => {
                  if (!e.dataTransfer.files.length) return;
                  e.preventDefault();
                  setDragging(false);
                  void uploader.fromFiles(Array.from(e.dataTransfer.files)).then(add);
              },
          };

    return (
        <>
            <div className="video-drop" data-dragging={dragging || undefined} {...dropProps}>
                <Icon name={icon} size={20} />
                <button type="button" id={pickId} className="btn" onClick={() => void uploader.pick().then(add)} aria-describedby={[describedBy, `${pickId}-hint`].filter(Boolean).join(' ')}>
                    {label}
                </button>
                <span id={`${pickId}-hint`} className="small muted">
                    {dropHint}
                </span>
            </div>
            <AttachmentTray items={uploads.items} onRemove={uploads.remove} onRetry={uploads.retry} fallbackFocusId={pickId} />
        </>
    );
}
