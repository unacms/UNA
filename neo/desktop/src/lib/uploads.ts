/**
 * Uploads for a post (POST /uploads). In the app, Rust sends them (src-tauri/src/upload.rs): it
 * streams the file with the access token attached there and reports progress over a channel.
 * The page never names a file on disk: it gets a handle for a file picked in the dialog Rust
 * opens, for files dropped on the window (Rust recorded the drop), or for bytes it has itself (a
 * pasted image). In a plain browser tab the page sends the file itself.
 */
import { Channel, invoke } from '@tauri-apps/api/core';

import { problemMessage, type Schema, type UnaApi } from 'una-api';

import { sessionOf } from './api';
import { t } from './i18n';
import { inApp, type Session } from './native';

type Media = Schema<'Media'>;
/** image or video; `file` for anything else, which only a Files upload takes. */
export type MediaKind = 'image' | 'video' | 'file';

/** A file ready to upload: a handle on the Rust side, or the File itself in a browser. */
export type Picked = {
    handle?: string;
    file?: File;
    name: string;
    size: number;
    mime: string;
    kind: MediaKind;
};

/** Files to attach, and the names of those that are not photos or videos. */
export type Staging = { files: Picked[]; refused: string[] };

/** An upload that failed: the site's status (0 when it was not reached) and problem code. */
export class UploadError extends Error {
    constructor(
        message: string,
        readonly status: number,
        readonly code: string,
    ) {
        super(message);
        this.name = 'UploadError';
    }
}

/**
 * What takes an upload (the API's UploadForm.purpose): a feed post, a reply in a conversation
 * (`message`), the message that starts one (`conversation`) or the acting profile's picture or
 * cover (`profile`, PATCH /profiles/{id}), new photos (`photo`, POST /photos) or an album's
 * (`album`, POST /albums and its items), photos only, a new video (`video`, POST /videos), videos only,
 * or new files (`file`, POST /files), any type.
 */
export type UploadPurpose = 'post' | 'message' | 'conversation' | 'profile' | 'video' | 'photo' | 'album' | 'file' | 'post_cover' | 'inline';

export interface Uploader {
    /** The system's file dialog for photos and videos (photos only, for a message; videos only, for a new video; any file, for Files). */
    pick(options?: { photosOnly?: boolean; videosOnly?: boolean; anyFiles?: boolean }): Promise<Staging>;
    /** Files the page has: pasted, or dropped in a browser (any file, for Files). */
    fromFiles(files: readonly File[], options?: { anyFiles?: boolean }): Promise<Staging>;
    /** Paths of a drop on the app window (Rust only takes paths it saw dropped; any file, for Files). */
    fromPaths(paths: readonly string[], options?: { anyFiles?: boolean }): Promise<Staging>;
    upload(file: Picked, onProgress: (sent: number, total: number) => void, purpose?: UploadPurpose): Promise<Media>;
    /** Stop an upload on its way (it rejects with code `cancelled`). */
    cancel(file: Picked): void;
    /** The file is not needed any more (taken off the post). */
    release(file: Picked): void;
}

const IMAGE_EXT = /\.(jpe?g|jpe|png|gif|webp|heic|heif|avif|bmp)$/i;
const VIDEO_EXT = /\.(mp4|m4v|mov|webm|mkv|avi|3gp|mpe?g|wmv)$/i;

/** image or video, from the type or else the name; null for anything else. */
export function kindOf(name: string, mime: string): MediaKind | null {
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    if (IMAGE_EXT.test(name)) return 'image';
    if (VIDEO_EXT.test(name)) return 'video';
    return null;
}

/** What the dialog or a drop offers: photos and videos. */
export const ACCEPT = 'image/*,video/*';

function toUploadError(e: unknown): UploadError {
    if (e instanceof UploadError) return e;
    if (e && typeof e === 'object' && 'message' in e) {
        const o = e as { message: unknown; status?: unknown; code?: unknown };
        return new UploadError(String(o.message), typeof o.status === 'number' ? o.status : 0, typeof o.code === 'string' ? o.code : 'error');
    }
    return new UploadError(typeof e === 'string' ? e : t('The upload failed'), 0, 'error');
}

type RustStaged = { handle: string; name: string; size: number; mime: string; kind: MediaKind };

/**
 * The app: Rust stages and sends the files, to the site of the page's session only (with its
 * generation, as its API requests are): a file picked in one network is never sent to another one
 * switched to meanwhile.
 */
export function tauriUploader(session: Session | undefined): Uploader {
    const stageBytes = async (file: File): Promise<Picked> => {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const staged = await invoke<RustStaged>('stage_bytes', bytes, {
            headers: { 'x-file-name': encodeURIComponent(file.name || 'pasted'), 'x-file-type': file.type },
        });
        // the File stays with it, for a local picture until the site's copy is there
        return { ...staged, file };
    };
    return {
        pick: (options) => invoke<Staging>('pick_files', { photosOnly: options?.photosOnly ?? false, videosOnly: options?.videosOnly ?? false, anyFiles: options?.anyFiles ?? false }),
        fromPaths: (paths, options) => invoke<Staging>('stage_dropped', { paths, anyFiles: options?.anyFiles ?? false }),
        fromFiles: async (files) => {
            const staging: Staging = { files: [], refused: [] };
            for (const file of files) {
                // bytes the page has go to Rust as a pasted photo or video only (any other file is picked or dropped)
                if (!kindOf(file.name, file.type)) {
                    staging.refused.push(file.name || t('A file'));
                    continue;
                }
                try {
                    staging.files.push(await stageBytes(file));
                } catch (e) {
                    staging.refused.push(`${file.name || t('A file')} (${toUploadError(e).message})`);
                }
            }
            return staging;
        },
        upload: async (file, onProgress, purpose) => {
            if (!file.handle) throw new UploadError(t('This file is no longer there to send'), 0, 'not_staged');
            if (!session) throw new UploadError(t('Sign in to upload'), 401, 'session_over');
            const channel = new Channel<{ sent: number; total: number }>();
            channel.onmessage = (p) => onProgress(p.sent, p.total);
            try {
                return await invoke<Media>('upload_file', {
                    handle: file.handle,
                    purpose: purpose ?? null,
                    siteUrl: session.siteUrl,
                    generation: session.generation,
                    onProgress: channel,
                });
            } catch (e) {
                throw toUploadError(e);
            }
        },
        cancel: (file) => {
            if (file.handle) void invoke('cancel_upload', { handle: file.handle }).catch(() => undefined);
        },
        release: (file) => {
            if (file.handle) void invoke('release_file', { handle: file.handle }).catch(() => undefined);
        },
    };
}

/** A plain browser tab: a file input to pick, and the API client to send. */
export function browserUploader(api: UnaApi): Uploader {
    const controllers = new Map<File, AbortController>();
    const stage = (files: readonly File[], anyFiles = false): Staging => {
        const staging: Staging = { files: [], refused: [] };
        for (const file of files) {
            const kind = kindOf(file.name, file.type) ?? (anyFiles ? 'file' : null);
            if (kind) staging.files.push({ file, name: file.name, size: file.size, mime: file.type, kind });
            else staging.refused.push(file.name || t('A file'));
        }
        return staging;
    };
    return {
        pick: (options) =>
            new Promise<Staging>((resolve) => {
                const input = document.createElement('input');
                input.type = 'file';
                if (!options?.anyFiles) input.accept = options?.photosOnly ? 'image/*' : options?.videosOnly ? 'video/*' : ACCEPT;
                input.multiple = true;
                input.addEventListener('change', () => resolve(stage(Array.from(input.files ?? []), options?.anyFiles)));
                input.addEventListener('cancel', () => resolve({ files: [], refused: [] }));
                input.click();
            }),
        fromFiles: async (files, options) => stage(files, options?.anyFiles),
        fromPaths: async () => ({ files: [], refused: [] }),
        upload: async (picked, onProgress, purpose) => {
            const file = picked.file;
            if (!file) throw new UploadError(t('This file is no longer there to send'), 0, 'not_staged');
            const body = new FormData();
            // a picture for a text has its own path, which takes the file alone
            if (purpose && purpose !== 'post' && purpose !== 'inline') body.append('purpose', purpose);
            body.append('file', file, file.name);
            const controller = new AbortController();
            controllers.set(file, controller);
            onProgress(0, file.size);
            try {
                const options = { bodySerializer: (b: unknown) => b as FormData, signal: controller.signal };
                const result =
                    purpose === 'inline'
                        ? await api.POST('/uploads/inline', { ...options, body: body as unknown as Schema<'InlineUploadForm'> })
                        : await api.POST('/uploads', { ...options, body: body as unknown as Schema<'UploadForm'> });
                if (result.error !== undefined || !result.response.ok) {
                    const code = (result.error as { code?: unknown } | undefined)?.code;
                    throw new UploadError(problemMessage(result.error, t('The site answered {{status}}', { status: String(result.response.status) })), result.response.status, typeof code === 'string' ? code : 'http_error');
                }
                onProgress(file.size, file.size);
                return result.data as Media;
            } catch (e) {
                if (controller.signal.aborted) throw new UploadError(t('The upload was stopped'), 0, 'cancelled');
                throw toUploadError(e);
            } finally {
                controllers.delete(file);
            }
        },
        cancel: (picked) => {
            if (picked.file) controllers.get(picked.file)?.abort();
        },
        release: () => undefined,
    };
}

/**
 * An uploader for photos (a message's, new photos, an album's): every upload has the purpose, the dialog offers photos
 * only, and videos among dropped or pasted files are refused (and let go) like other files.
 */
export function photoUploader(base: Uploader, purpose: Exclude<UploadPurpose, 'post'>): Uploader {
    const photos = (staging: Staging): Staging => {
        const files: Picked[] = [];
        const refused = [...staging.refused];
        for (const f of staging.files) {
            if (f.kind === 'image') files.push(f);
            else {
                base.release(f);
                refused.push(f.name);
            }
        }
        return { files, refused };
    };
    return {
        pick: () => base.pick({ photosOnly: true }).then(photos),
        fromFiles: (files) => base.fromFiles(files).then(photos),
        fromPaths: (paths) => base.fromPaths(paths).then(photos),
        upload: (file, onProgress) => base.upload(file, onProgress, purpose),
        cancel: (file) => base.cancel(file),
        release: (file) => base.release(file),
    };
}

/**
 * An uploader for a new video (POST /videos): every upload has the purpose `video`, the dialog
 * offers videos only, and photos among dropped files are refused (and let go).
 */
export function videoUploader(base: Uploader): Uploader {
    const videos = (staging: Staging): Staging => {
        const files: Picked[] = [];
        const refused = [...staging.refused];
        for (const f of staging.files) {
            if (f.kind === 'video') files.push(f);
            else {
                base.release(f);
                refused.push(f.name);
            }
        }
        return { files, refused };
    };
    return {
        pick: () => base.pick({ videosOnly: true }).then(videos),
        fromFiles: (files) => base.fromFiles(files).then(videos),
        fromPaths: (paths) => base.fromPaths(paths).then(videos),
        upload: (file, onProgress) => base.upload(file, onProgress, 'video'),
        cancel: (file) => base.cancel(file),
        release: (file) => base.release(file),
    };
}

/**
 * An uploader for new files (POST /files): every upload has the purpose `file`, and the dialog
 * and drops take any file (the site's storage decides which types it takes).
 */
export function fileUploader(base: Uploader): Uploader {
    return {
        pick: () => base.pick({ anyFiles: true }),
        fromFiles: (files) => base.fromFiles(files, { anyFiles: true }),
        fromPaths: (paths) => base.fromPaths(paths, { anyFiles: true }),
        upload: (file, onProgress) => base.upload(file, onProgress, 'file'),
        cancel: (file) => base.cancel(file),
        release: (file) => base.release(file),
    };
}

/**
 * Files dropped on the app window go to the post composer, unless a form that takes files of its
 * own (a new video) is shown: it claims them while it is mounted.
 */
let dropClaims = 0;
export function claimWindowDrops(): () => void {
    dropClaims++;
    let released = false;
    return () => {
        if (released) return;
        released = true;
        dropClaims--;
    };
}
export function windowDropsClaimed(): boolean {
    return dropClaims > 0;
}

/** The uploader for where the page runs. */
export function makeUploader(api: UnaApi): Uploader {
    return inApp ? tauriUploader(sessionOf(api)) : browserUploader(api);
}
