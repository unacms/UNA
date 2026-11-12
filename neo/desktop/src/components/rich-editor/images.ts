/**
 * Pictures pasted or dropped into a rich editor. A mini editor (feed posts, comments, messages)
 * gives them to its composer's attachments, as the text boxes did. A full one (posts,
 * discussions) puts them in the text through `uploadInline`; phase 2 adds the route behind it,
 * so until then a full editor attaches them where the form has attachments and otherwise says
 * pictures can't go in the text yet. A paste (files the page has) and a drop on the app window
 * (paths Rust saw) take the same path: the uploader makes a Staging of them, and `placeImages`
 * decides.
 */
import type { Schema } from 'una-api';

import { t } from '../../lib/i18n';
import type { Picked, Staging, Uploader } from '../../lib/uploads';

/** A picture in the text: the site's copy (its editor storage, `sys_images_editor`). */
export type InlineImage = { src: string; width?: number; height?: number; alt?: string };

/**
 * Upload one picture for the text (POST /uploads/inline: the site's editor storage, answering
 * the stored picture's URL and size) and resolve to it; reject with the site's reason.
 */
export type InlineUploader = (file: Picked, onProgress?: (sent: number, total: number) => void) => Promise<InlineImage>;

/** POST /uploads/inline through the app's uploader (Rust in the app, fetch in a browser tab). */
export function inlineUploader(uploader: Uploader): InlineUploader {
    return async (file, onProgress) => {
        const image = (await uploader.upload(file, onProgress ?? (() => undefined), 'inline')) as unknown as Schema<'InlineImage'>;
        return { src: image.url, width: image.width ?? undefined, height: image.height ?? undefined };
    };
}

/** Where a composer's pictures go. */
export type ImageSink = {
    /** Makes files of a paste or a drop ready to upload; without one, pictures are refused. */
    uploader?: Uploader;
    /** The composer's attachments (its tray): mini mode, and full mode until uploadInline exists. */
    attach?: (staging: Staging) => void;
    /** Full mode: pictures go in the text. */
    uploadInline?: InlineUploader;
    /** Said when the pictures can go nowhere (a comment, or a post's text before phase 2). */
    refusal?: string;
};

export type Placement = 'inline' | 'attach' | 'none';

/** Where pictures go in this editor. */
export function placementOf(mode: 'mini' | 'full', sink: ImageSink | undefined): Placement {
    if (!sink?.uploader) return 'none';
    if (mode === 'full' && sink.uploadInline) return 'inline';
    return sink.attach ? 'attach' : 'none';
}

export const DEFAULT_REFUSAL = t('Pictures can’t be added to this text yet.');

// ---- drops on the app window over an editor ----

const targets = new Set<HTMLElement>();

/** An editor that takes window drops over it (its own drop handler); returns the release. */
export function registerDropTarget(el: HTMLElement): () => void {
    targets.add(el);
    return () => targets.delete(el);
}

/**
 * Whether a window drop at this point (Tauri's physical pixels) is over a registered editor:
 * the other takers of window drops (a form's photo zone) leave it to the editor.
 */
export function isOverDropTarget(position: { x: number; y: number } | undefined): boolean {
    if (!position) return false;
    const ratio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const x = position.x / ratio;
    const y = position.y / ratio;
    for (const el of targets) {
        if (!el.isConnected) continue;
        const r = el.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return true;
    }
    return false;
}
