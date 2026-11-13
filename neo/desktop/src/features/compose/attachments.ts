import { useCallback, useEffect, useReducer, useRef, useState } from 'react';

import type { Schema, UnaApi } from 'una-api';

import { isGone, unwrap } from '../../lib/api';
import type { DraftMedia } from '../../lib/drafts';
import { errorMessage } from '../../lib/errors';
import { num, t, tn } from '../../lib/i18n';
import { type MediaKind, type Picked, type Staging, UploadError, type Uploader } from '../../lib/uploads';

type Media = Schema<'Media'>;

/** What the API takes in one post (NewFeedPost.media_ids). */
export const MAX_ATTACHMENTS = 20;

/** A photo or video of the post being written, from the moment it is added. */
export type Attachment = {
    /** Local id, stable while the attachment is in the tray. */
    key: string;
    name: string;
    kind: MediaKind;
    size: number;
    /** What is sent; gone once uploaded (or for an upload a draft brought back). */
    picked?: Picked;
    /** A local picture of the file (a blob: URL) until the site's copy is there. */
    preview?: string;
    status: 'uploading' | 'done' | 'failed';
    sent: number;
    total: number;
    media?: Media;
    uploadedAt?: number;
    error?: string;
};

export type AttachmentAction =
    | { type: 'add'; items: Attachment[]; max?: number }
    | { type: 'progress'; key: string; sent: number; total: number }
    | { type: 'done'; key: string; media: Media; at: number }
    | { type: 'failed'; key: string; error: string }
    | { type: 'retry'; key: string }
    | { type: 'remove'; key: string }
    | { type: 'media'; key: string; media: Media }
    | { type: 'reset'; items: Attachment[] };

export function attachmentsReducer(state: Attachment[], action: AttachmentAction): Attachment[] {
    const patch = (key: string, fn: (a: Attachment) => Attachment) => state.map((a) => (a.key === key ? fn(a) : a));
    switch (action.type) {
        case 'add':
            return [...state, ...action.items].slice(0, action.max ?? MAX_ATTACHMENTS);
        case 'progress':
            // a late progress message never moves a finished upload back
            return patch(action.key, (a) => (a.status === 'uploading' ? { ...a, sent: Math.min(action.sent, action.total), total: action.total } : a));
        case 'done':
            return patch(action.key, (a) => ({ ...a, status: 'done', sent: a.total || a.size, media: action.media, uploadedAt: action.at, picked: undefined, error: undefined }));
        case 'failed':
            return patch(action.key, (a) => (a.status === 'uploading' ? { ...a, status: 'failed', error: action.error } : a));
        case 'retry':
            return patch(action.key, (a) => (a.status === 'failed' && a.picked ? { ...a, status: 'uploading', sent: 0, error: undefined } : a));
        case 'remove':
            return state.filter((a) => a.key !== action.key);
        case 'media':
            // the site's answer about a finished upload (a video converted)
            return patch(action.key, (a) => (a.status === 'done' ? { ...a, media: action.media } : a));
        case 'reset':
            return action.items;
    }
}

/** Whether the post can be sent with these, and why not. */
export function postBlocker(items: readonly Attachment[]): string | null {
    if (items.some((a) => a.status === 'uploading')) return t('Wait until the uploads are done');
    if (items.some((a) => a.status === 'failed')) return t('Remove or retry the upload that failed');
    return null;
}

/** The uploads the post takes, in tray order. */
export function mediaIds(items: readonly Attachment[]): string[] {
    return items.flatMap((a) => (a.status === 'done' && a.media ? [a.media.id] : []));
}

/** The finished uploads a draft keeps. */
export function draftMedia(items: readonly Attachment[]): DraftMedia[] {
    return items.flatMap((a) => (a.status === 'done' && a.media ? [{ media: a.media, name: a.name, uploadedAt: a.uploadedAt ?? Date.now() }] : []));
}

/** Attachments for the uploads a draft kept. */
export function fromDraft(media: readonly DraftMedia[]): Attachment[] {
    return media.map((m) => ({
        key: `draft-${m.media.id}`,
        name: m.name,
        kind: m.media.kind === 'video' ? 'video' : 'image',
        size: m.media.size ?? 0,
        status: 'done',
        sent: 1,
        total: 1,
        media: m.media,
        uploadedAt: m.uploadedAt,
    }));
}

/** A local picture of a photo the page has the bytes of (pasted, or dropped in a browser). */
function previewOf(picked: Picked): string | undefined {
    if (!picked.file || picked.kind !== 'image' || typeof URL.createObjectURL !== 'function') return undefined;
    return URL.createObjectURL(picked.file);
}

function revoke(url: string | undefined): void {
    if (url && typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(url);
}

let seq = 0;
const nextKey = () => `att-${Date.now().toString(36)}-${++seq}`;

/** How often a video the site is converting is asked about: from the first wait, doubling. */
export const POLL_FIRST_MS = 3000;
export const POLL_MAX_MS = 30000;

/** How big a file is, in words. */
export function sizeText(bytes: number): string {
    if (bytes < 1024) return t('{{size}} B', { size: String(bytes) });
    if (bytes < 1024 * 1024) return t('{{size}} KB', { size: String(Math.round(bytes / 1024)) });
    return t('{{size}} MB', { size: num(bytes / (1024 * 1024), { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false }) });
}

/**
 * The tray's attachments: each upload starts as it is added, progress comes in as it goes,
 * a failed one can be tried again, and taking one off stops it or deletes it on the site.
 */
export function useAttachments({
    uploader,
    api,
    announce,
    forMessage = false,
    limitText,
    refusedText,
    max = MAX_ATTACHMENTS,
}: {
    uploader: Uploader;
    api: UnaApi;
    announce: (text: string) => void;
    /** A message's photos (photoUploader): the words say photos and message, not post. */
    forMessage?: boolean;
    /** What is said when more files come than it takes (new photos, an album's: not a message's words). */
    limitText?: string;
    /** What is said before the names of files left out (new files: not "Not a photo"). */
    refusedText?: string;
    /** How many the tray takes (the request's limit): a post's and a message's 20 by default. */
    max?: number;
}) {
    const [items, dispatch] = useReducer(attachmentsReducer, []);
    const latest = useRef(items);
    // files being made ready (picked, pasted or dropped, not in the tray yet), and whether some
    // were added that the composer is not drawn with yet: what it sends now would go without them
    const making = useRef(0);
    const undrawn = useRef(false);
    useEffect(() => {
        latest.current = items;
        undrawn.current = false;
    }, [items]);

    // The sheet goes away (another profile, sign-out): uploads on their way stop, and files
    // staged for them are let go. Finished uploads stay in the lasting draft.
    const uploaderRef = useRef(uploader);
    useEffect(() => {
        uploaderRef.current = uploader;
    }, [uploader]);
    // gone: files made ready for it after that (a paste or a drop still on its way) are let go
    const gone = useRef(false);
    useEffect(() => {
        const all = latest;
        const up = uploaderRef;
        gone.current = false;
        return () => {
            gone.current = true;
            for (const a of all.current) {
                revoke(a.preview);
                if (!a.picked) continue;
                if (a.status === 'uploading') up.current.cancel(a.picked);
                up.current.release(a.picked);
            }
        };
    }, []);

    const start = useCallback(
        (a: Attachment) => {
            const picked = a.picked;
            if (!picked) return;
            uploader.upload(picked, (sent, total) => dispatch({ type: 'progress', key: a.key, sent, total })).then(
                (media) => {
                    // taken off meanwhile: the site has a file nobody wants
                    if (!latest.current.some((x) => x.key === a.key)) {
                        void api.DELETE('/uploads/{id}', { params: { path: { id: media.id } } }).catch(() => undefined);
                        return;
                    }
                    dispatch({ type: 'done', key: a.key, media, at: Date.now() });
                    uploader.release(picked);
                    announce(media.state === 'processing' ? t('{{name}} uploaded; the site is still converting it', { name: a.name }) : t('{{name}} uploaded', { name: a.name }));
                },
                (e: unknown) => {
                    if (e instanceof UploadError && e.code === 'cancelled') return;
                    const message = errorMessage(e);
                    dispatch({ type: 'failed', key: a.key, error: message });
                    announce(t('{{name}} was not uploaded: {{reason}}', { name: a.name, reason: message }));
                },
            );
        },
        [uploader, api, announce],
    );

    /** Add what was picked, dropped or pasted; says what was left out. */
    const add = useCallback(
        (staging: Staging) => {
            // the tray is gone: nothing shows them, takes them off or sends them
            if (gone.current) {
                for (const file of staging.files) uploader.release(file);
                return 0;
            }
            const room = max - latest.current.length;
            const taken = staging.files.slice(0, Math.max(0, room));
            for (const extra of staging.files.slice(taken.length)) uploader.release(extra);
            const added: Attachment[] = taken.map((picked) => ({
                key: nextKey(),
                name: picked.name,
                kind: picked.kind,
                size: picked.size,
                picked,
                preview: previewOf(picked),
                status: 'uploading',
                sent: 0,
                total: picked.size,
            }));
            if (added.length) {
                undrawn.current = true;
                dispatch({ type: 'add', items: added, max });
                // known at once (not only after the render): the tray going before it is drawn lets them go too
                latest.current = [...latest.current, ...added].slice(0, max);
            }
            added.forEach((item) => start(item));

            const notes: string[] = [];
            if (added.length) notes.push(added.length === 1 ? t('Uploading {{name}}', { name: added[0]?.name ?? '' }) : tn(added.length, 'Uploading {{count}} file', 'Uploading {{count}} files'));
            if (staging.refused.length) {
                const names = staging.refused.join(', ');
                // the caller's words come with the names after them; the tray's own are whole sentences
                notes.push(refusedText !== undefined ? `${refusedText}: ${names}` : forMessage ? t('Not a photo: {{names}}', { names }) : t('Not a photo or video: {{names}}', { names }));
            }
            if (staging.files.length > taken.length) notes.push(limitText ?? (forMessage ? tn(MAX_ATTACHMENTS, 'A message takes up to {{count}} photo', 'A message takes up to {{count}} photos') : tn(MAX_ATTACHMENTS, 'A post takes up to {{count}} photo or video', 'A post takes up to {{count}} photos and videos')));
            if (notes.length) announce(notes.join('. '));
            return added.length;
        },
        [start, uploader, announce, forMessage, limitText, refusedText, max],
    );

    const remove = useCallback(
        (key: string) => {
            const a = latest.current.find((x) => x.key === key);
            if (!a) return;
            dispatch({ type: 'remove', key });
            revoke(a.preview);
            if (a.picked) {
                if (a.status === 'uploading') uploader.cancel(a.picked);
                uploader.release(a.picked);
            }
            // no post took it: the site may delete it now rather than in an hour
            if (a.status === 'done' && a.media) void api.DELETE('/uploads/{id}', { params: { path: { id: a.media.id } } }).catch(() => undefined);
            announce(t('{{name}} removed', { name: a.name }));
        },
        [uploader, api, announce],
    );

    const retry = useCallback(
        (key: string) => {
            const a = latest.current.find((x) => x.key === key);
            if (!a || a.status !== 'failed' || !a.picked) return;
            dispatch({ type: 'retry', key });
            start({ ...a, status: 'uploading', sent: 0 });
        },
        [start],
    );

    /**
     * Start over with these (a draft's uploads, or those a request did not take), or none once
     * the post is sent. A file of one that leaves the tray unsent (on its way, or failed) is let go.
     */
    const reset = useCallback(
        (next: Attachment[] = []) => {
            for (const a of latest.current) {
                if (next.some((x) => x.key === a.key)) continue;
                revoke(a.preview);
                if (!a.picked) continue;
                if (a.status === 'uploading') uploader.cancel(a.picked);
                uploader.release(a.picked);
            }
            dispatch({ type: 'reset', items: next });
            // known at once (not only after the render): a check of these may answer first
            latest.current = next;
        },
        [uploader],
    );

    /**
     * Ask the site about a finished upload: 'gone' when it deleted it (an upload no post took
     * lives only so long), and then it leaves the tray; the site's Media otherwise; null when
     * the site could not be asked (try again later).
     */
    const check = useCallback(
        async (a: Attachment): Promise<Media | 'gone' | null> => {
            if (!a.media) return null;
            try {
                const media = unwrap(await api.GET('/uploads/{id}', { params: { path: { id: a.media.id } } }));
                if (latest.current.some((x) => x.key === a.key)) dispatch({ type: 'media', key: a.key, media });
                return media;
            } catch (e) {
                if (!isGone(e)) return null;
                if (latest.current.some((x) => x.key === a.key)) dispatch({ type: 'remove', key: a.key });
                return 'gone';
            }
        },
        [api],
    );

    /**
     * A draft's uploads, checked with the site: those it deleted meanwhile leave the tray, and
     * which ones is said, so the post never goes out with an id the site no longer has.
     */
    const restore = useCallback(
        (next: Attachment[]) => {
            reset(next);
            void Promise.all(next.map(async (a) => ((await check(a)) === 'gone' ? a.name : null))).then((names) => {
                const gone = names.filter((n): n is string => !!n);
                if (!gone.length) return;
                announce(
                    gone.length === 1
                        ? t('{{name}} is no longer on the site and was taken off the post; add it again', { name: gone[0] ?? '' })
                        : tn(gone.length, '{{count}} upload is no longer on the site and was taken off the post: {{names}}', '{{count}} uploads are no longer on the site and were taken off the post: {{names}}', { names: gone.join(', ') }),
                );
            });
        },
        [reset, check, announce],
    );

    // A video the site is still converting: ask again, less and less often, until it is ready
    // (its poster too), then say so. Stops when it leaves the tray or the sheet goes away.
    const converting = items
        .filter((a) => a.status === 'done' && a.media?.state === 'processing')
        .map((a) => a.key)
        .join(',');
    useEffect(() => {
        if (!converting) return;
        let live = true;
        const timers = new Set<ReturnType<typeof setTimeout>>();
        const poll = (key: string, delay: number) => {
            const timer = setTimeout(() => {
                timers.delete(timer);
                const a = latest.current.find((x) => x.key === key);
                if (!live || !a || a.media?.state !== 'processing') return;
                void check(a).then((result) => {
                    // the answer, not the tray: the tray shows it only after the next render
                    const inTray = latest.current.some((x) => x.key === key);
                    if (result === 'gone') announce(t('{{name}} is no longer on the site and was taken off the post', { name: a.name }));
                    else if (!inTray) return;
                    else if (result?.state === 'ready') announce(t('{{name}} is ready', { name: a.name }));
                    else if (result?.state === 'failed') announce(t('The site could not convert {{name}}', { name: a.name }));
                    else if (live) poll(key, Math.min(delay * 2, POLL_MAX_MS));
                });
            }, delay);
            timers.add(timer);
        };
        for (const key of converting.split(',')) poll(key, POLL_FIRST_MS);
        return () => {
            live = false;
            for (const timer of timers) clearTimeout(timer);
        };
    }, [converting, check, announce]);

    // how many times files on their way stopped being so: who said "wait" for them stops saying
    // it then, the tray changed or not (a dialog closed with nothing chosen, files it refused)
    const [settled, setSettled] = useState(0);

    /**
     * Counts files as on their way while they are made ready (`staging`), until what the caller
     * does with them at once (its own `then` on this promise: `add`) is done, so nothing is
     * between "made ready" and "added, not drawn yet". Answers the same promise.
     */
    const wait = useCallback(<T>(made: Promise<T>): Promise<T> => {
        making.current++;
        const done = () =>
            // after the caller's reactions to the same promise, which are queued behind this one
            queueMicrotask(() => {
                making.current--;
                if (!making.current && !gone.current) setSettled((n) => n + 1);
            });
        made.then(done, done);
        return made;
    }, []);

    /**
     * Takes files that are being made ready (a pick, a paste, a drop) once they are: into the
     * tray, or let go when the form is `held` by then (it began to be sent: its request left
     * without them, so no upload is started and nothing keeps them).
     */
    const stage = useCallback(
        (made: Promise<Staging>, held: () => boolean = () => false) => {
            void wait(made).then((staging) => {
                if (held()) for (const file of staging.files) uploader.release(file);
                else add(staging);
            });
        },
        [wait, add, uploader],
    );

    /**
     * Whether files are on their way into the tray: being made ready, or added and not drawn
     * yet. What is sent now would go without them (`postBlocker` says nothing of them yet).
     */
    const staging = useCallback(() => making.current > 0 || undrawn.current, []);

    return { items, add, remove, retry, reset, restore, wait, stage, staging, settled };
}
