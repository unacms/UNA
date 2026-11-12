import { getCurrentWebview } from '@tauri-apps/api/webview';
import { type DragEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Icon, type IconName } from '../../components/icon';
import { useApp } from '../../lib/context';
import { saysNothingOfFirstSending } from '../../lib/idempotency';
import { t, tn } from '../../lib/i18n';
import { inApp } from '../../lib/native';
import { isOverDropTarget } from '../../components/rich-editor/images';
import { claimWindowDrops, fileUploader, makeUploader, photoUploader, type Staging, type Uploader } from '../../lib/uploads';
import { AttachmentTray } from '../compose/attachment-tray';
import { mediaIds, postBlocker, useAttachments } from '../compose/attachments';
import { MAX_FILES } from '../files/files';
import { MAX_ALBUM_PHOTOS, MAX_PHOTOS } from './photos';
import { takenOf } from './upload-answers';

/**
 * Whether an answer says nothing of what the site took of the uploads its request names: the
 * first sending still runs (409), the rate limit answered before the Idempotency-Key was looked
 * at (429: a first sending with this key may still run), or a server error (a gateway's 502 or
 * 504 while the site works on, a 500 after part of the work). The same answers a form keeps its
 * Idempotency-Key on (`settleIdempotency`), by one rule: what says nothing of the first sending
 * says nothing of its uploads, and an upload deleted under a running request loses the file.
 */
export function saysNothingOfUploads(status: number): boolean {
    return saysNothingOfFirstSending(status);
}

/**
 * The photos a form uploads (new photos, a new album, photos added to an album), or the files of
 * new files (`file`: any type): each upload starts as it is picked or dropped, with the form's
 * purpose; Retry and Remove as in a post's tray. Uploads nothing took are deleted on the site
 * when the form goes, but for those a request names that is in flight, or named and said nothing
 * of (`claim`).
 */
export function usePhotoUploads({ purpose, uploader: given, announce }: { purpose: 'photo' | 'album' | 'file' | 'post_cover'; uploader?: Uploader; announce: (text: string) => void }) {
    const { api } = useApp();
    const uploader = useMemo(() => (purpose === 'file' ? fileUploader(given ?? makeUploader(api)) : photoUploader(given ?? makeUploader(api), purpose)), [given, api, purpose]);
    // the request's own limit: POST /photos and POST /files take 20, an album 50 at a time, a post one cover
    const max = purpose === 'album' ? MAX_ALBUM_PHOTOS : purpose === 'file' ? MAX_FILES : purpose === 'post_cover' ? 1 : MAX_PHOTOS;
    const uploads = useAttachments({ uploader, api, announce, forMessage: purpose !== 'file', max, limitText: purpose === 'post_cover' ? t('A post has one cover: remove this one to choose another') : purpose === 'file' ? tn(max, 'Up to {{count}} file at a time', 'Up to {{count}} files at a time') : tn(max, 'Up to {{count}} photo at a time', 'Up to {{count}} photos at a time'), refusedText: purpose === 'file' ? t('Can’t be added') : undefined });

    const latest = useRef(uploads.items);
    // files being made ready (picked or dropped, not in the tray yet), and whether some were added
    // that the form is not drawn with yet: its `blocker` does not know of either
    const making = useRef(0);
    const undrawn = useRef(false);
    useEffect(() => {
        latest.current = uploads.items;
        undrawn.current = false;
    }, [uploads.items]);
    // the uploads a request in flight names: the form going does not delete them under it (the
    // request's answer says which it took), and whether the form is gone
    const claimed = useRef<readonly string[]>([]);
    const gone = useRef(false);
    // the uploads a request named that said nothing of what the site took (no answer, or one
    // that tells nothing): the site may be taking them, now or later, so nothing here deletes
    // them again, whatever a later request is told (only Remove does, which the site refuses for
    // one it took)
    const unknown = useRef<ReadonlySet<string>>(new Set());
    const drop = useCallback((id: string) => void api.DELETE('/uploads/{id}', { params: { path: { id } } }).catch(() => undefined), [api]);
    useEffect(() => {
        gone.current = false;
        return () => {
            gone.current = true;
            for (const a of latest.current) if (a.status === 'done' && a.media && !claimed.current.includes(a.media.id) && !unknown.current.has(a.media.id)) drop(a.media.id);
        };
    }, [drop]);

    const { add, reset } = uploads;
    const claim = useCallback(
        <T extends { response: { status: number } }>(request: Promise<T>, took: (answer: T) => boolean | readonly string[]): Promise<T> => {
            const named = mediaIds(latest.current);
            claimed.current = named;
            // null: the request said nothing of what the site took
            const settle = (answer: boolean | readonly string[] | null) => {
                claimed.current = [];
                // they stay as they are: in the tray to send again, and never deleted here
                if (answer === null) {
                    unknown.current = new Set([...unknown.current, ...named]);
                    return;
                }
                const taken = takenOf(answer, named);
                // the form went meanwhile: what the request named and did not take is deleted now
                if (gone.current) {
                    for (const id of named) if (!taken.includes(id) && !unknown.current.has(id)) drop(id);
                    return;
                }
                if (!taken.length) return;
                const left = latest.current.filter((a) => !(a.media && taken.includes(a.media.id)));
                latest.current = left;
                reset(left);
            };
            return request.then(
                (answer) => {
                    settle(saysNothingOfUploads(answer.response.status) ? null : took(answer));
                    return answer;
                },
                (e: unknown) => {
                    settle(null);
                    throw e;
                },
            );
        },
        [drop, reset],
    );

    const stage = useCallback(
        (made: Promise<Staging>, held: () => boolean) => {
            making.current++;
            void made
                .then((staging) => {
                    // the form began to be sent while they were made ready: its request left without
                    // them, so no upload is started and nothing keeps them
                    if (held()) for (const file of staging.files) uploader.release(file);
                    else if (add(staging)) undrawn.current = true;
                })
                .finally(() => {
                    making.current--;
                });
        },
        [add, uploader],
    );

    return {
        ...uploads,
        uploader,
        /**
         * Takes files that are being made ready (a pick, a drop) once they are: into the tray, or
         * let go when the form is `held` by then.
         */
        stage,
        /**
         * Whether files are on their way into the tray: being made ready, or added and not drawn
         * yet. A form sent now would go without them (`blocker` says nothing of them yet).
         */
        staging: () => making.current > 0 || undrawn.current,
        /** The uploads the request takes, in their order. */
        ids: mediaIds(uploads.items),
        /** Why the request can't go yet (uploads on their way or failed), or null. */
        blocker: postBlocker(uploads.items),
        /**
         * The request that takes the uploads (`ids`), from when it is sent: until it is answered
         * the form going does not delete them. `took` says what its answer took: all it named
         * (true), none (false: the site refused it), or those of these upload ids. Those it took
         * leave the tray and are never deleted here; those it did not take stay, to send again or
         * remove, or are deleted once when the form is gone by then. A request that threw (no
         * answer) or whose answer tells nothing (`saysNothingOfUploads`) says nothing of what
         * the site took, and `took` is not asked: its uploads stay in the tray and are never
         * deleted here again, with the form, after it, or when a later request that names them
         * is refused (that one's answer tells nothing of the first, which may still run). They
         * leave the tray when a later request takes them, or by Remove, which still deletes one
         * (the site refuses for one it took, and deletes those nothing took after its ghost
         * lifetime).
         */
        claim,
        /**
         * Whether the form is gone (closed, or another item opened in its place): what is left of
         * a submit after its request must not act on it then.
         */
        gone: () => gone.current,
    };
}

type Uploads = ReturnType<typeof usePhotoUploads>;

/**
 * Where a form takes its photos (or files): a button for the system's dialog (photos only, or any file), a drop zone
 * (the app window's drops come here while it is shown), and the tray of uploads. While `held`
 * (the form is being sent) it takes no photo and lets none go: the buttons keep their place and
 * the keyboard (aria-disabled), a drop does nothing and the zone does not show itself as a place
 * to drop on; files that were being made ready when it began are let go, not added.
 */
export function PhotoDropZone({ uploads, pickId, describedBy, label = t('Choose photos…'), icon = 'image-plus', dropHint = t('or drop them here'), held = false }: { uploads: Uploads; pickId: string; describedBy?: string; label?: string; icon?: IconName; dropHint?: string; held?: boolean }) {
    const [dragging, setDragging] = useState(false);
    const { uploader, stage } = uploads;

    const stageRef = useRef(stage);
    const heldRef = useRef(held);
    useEffect(() => {
        stageRef.current = stage;
        heldRef.current = held;
    });
    const isHeld = () => heldRef.current;
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
                    if (isOverDropTarget(p.position) || heldRef.current) return;
                    stageRef.current(uploader.fromPaths(p.paths), isHeld);
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
                  // always the zone's: left to the browser, a file dropped here opens in place of the app
                  e.preventDefault();
                  // held: no place to drop on (the cursor says so, no highlight)
                  if (held) e.dataTransfer.dropEffect = 'none';
                  else setDragging(true);
              },
              onDragLeave: (e: DragEvent) => {
                  if (e.currentTarget === e.target) setDragging(false);
              },
              onDrop: (e: DragEvent) => {
                  if (!e.dataTransfer.files.length) return;
                  e.preventDefault();
                  setDragging(false);
                  if (held) return;
                  stage(uploader.fromFiles(Array.from(e.dataTransfer.files)), isHeld);
              },
          };

    return (
        <>
            <div className="video-drop" data-dragging={(dragging && !held) || undefined} {...dropProps}>
                <Icon name={icon} size={20} />
                <button type="button" id={pickId} className="btn" aria-disabled={held || undefined} onClick={() => (held ? undefined : stage(uploader.pick(), isHeld))} aria-describedby={[describedBy, `${pickId}-hint`].filter(Boolean).join(' ')}>
                    {label}
                </button>
                <span id={`${pickId}-hint`} className="small muted">
                    {dropHint}
                </span>
            </div>
            <AttachmentTray items={uploads.items} onRemove={uploads.remove} onRetry={uploads.retry} fallbackFocusId={pickId} held={held} />
        </>
    );
}
