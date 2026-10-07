/**
 * Image attachments for the agent composer: limits, upload, and the multimodal
 * message shape `@tanstack/ai-client` expects. Picking is platform-specific and
 * lives in pick-image.js / pick-image.native.js.
 */

import { fetcher } from 'app/lib/fetcher';
import { isWeb } from 'app/lib/util';

export const CHAT_IMAGE_MAX_BYTES = 8 * 1024 * 1024;
export const CHAT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
/** Images per turn when the agent row has no `max_images`. */
export const CHAT_IMAGES_MAX_DEFAULT = 4;

/**
 * @typedef {object} PickedImage An image the user chose but has not sent yet.
 * @property {File|{uri: string, name: string, type: string}} file Web `File`, or the RN FormData part.
 * @property {string} preview Local URL for the thumbnail (`blob:` on web, file uri on native).
 * @property {string} name
 * @property {string} mime
 * @property {UploadedImage} [uploaded] Set once the upload succeeded, so a retry skips it.
 */

/**
 * @typedef {object} UploadedImage
 * @property {string} url Public URL UNA stored the image at.
 * @property {string} mime
 * @property {string|number} [file_id] UNA storage id.
 */

export function imageTooLargeError() {
    const error = new Error('Image is too large');
    error.code = 'too_large';
    return error;
}

const CHAT_IMAGE_TYPE_SET = new Set(CHAT_IMAGE_TYPES);
const CHAT_IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i;

function mimeFromName(name) {
    const ext = String(name || '').split('.').pop()?.toLowerCase();
    if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
    if (ext === 'png') return 'image/png';
    if (ext === 'gif') return 'image/gif';
    if (ext === 'webp') return 'image/webp';
    return '';
}

/** True when a paste/picker File is a type the agent composer accepts. */
export function isChatImageFile(file) {
    if (!file) return false;
    const mime = String(file.type || '').toLowerCase();
    if (CHAT_IMAGE_TYPE_SET.has(mime) || mime === 'image/jpg' || mime === 'image/pjpeg') return true;
    if (mime.startsWith('image/') && !mime.includes('svg')) return true;
    return !mime && CHAT_IMAGE_EXT.test(file.name || '');
}

/**
 * Turn a web `File` into a pending composer attachment. `null` when it is not an
 * image we accept. Throws `too_large` past CHAT_IMAGE_MAX_BYTES.
 *
 * @param {File|{uri: string, name: string, type: string}} file
 * @returns {PickedImage|null}
 */
export function pickedFromFile(file) {
    if (!file || !isChatImageFile(file)) return null;
    const size = Number(file.size) || 0;
    if (size > CHAT_IMAGE_MAX_BYTES) throw imageTooLargeError();
    const mime = file.type || mimeFromName(file.name) || 'image/png';
    const name = file.name || `pasted.${mime.split('/')[1] || 'png'}`;
    let preview = '';
    try {
        if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
            preview = URL.createObjectURL(file);
        }
    } catch {
        preview = '';
    }
    return { file, preview, name, mime };
}

/**
 * Image files from a paste or drop. Prefers `items` (clipboard) and falls back
 * to `files` (drag-and-drop). Same source the post editor reads in editor-inner.
 *
 * @param {DataTransfer|null|undefined} data
 * @returns {File[]}
 */
export function imageFilesFromDataTransfer(data) {
    if (!data) return [];
    const out = [];
    const add = (file) => {
        if (file && isChatImageFile(file) && !out.includes(file)) out.push(file);
    };
    const items = data.items;
    if (items?.length) {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item?.kind === 'file') add(item.getAsFile());
        }
    }
    if (!out.length && data.files?.length) {
        for (let i = 0; i < data.files.length; i++) add(data.files[i]);
    }
    return out;
}

/** Free a web `blob:` preview once it is no longer shown. No-op elsewhere. */
export function revokePickedPreview(picked) {
    const preview = picked?.preview;
    if (isWeb && typeof preview === 'string' && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
    }
}

/** `sendMessage` payload: text part first, then one image part per upload. */
export function chatImageParts(text, uploaded) {
    const content = [];
    if (text) content.push({ type: 'text', content: text });
    for (const image of uploaded) {
        content.push({
            type: 'image',
            source: { type: 'url', value: image.url, mimeType: image.mime },
            ...(image.file_id ? { metadata: { file_id: image.file_id } } : null),
        });
    }
    return content;
}

/**
 * Upload one picked image to UNA and resolve to where it landed.
 * Already-uploaded images (a retry after a later one failed) resolve immediately.
 *
 * @param {string} agentId
 * @param {PickedImage} picked
 * @returns {Promise<UploadedImage>}
 */
export async function uploadAgentChatImage(agentId, picked) {
    if (picked.uploaded) return picked.uploaded;

    const formData = new FormData();
    formData.append('file', picked.file);
    const result = await fetcher(
        [`/api.php?r=system/ai_chat_upload/TemplServices&params[]=${encodeURIComponent(agentId)}`, null, formData],
        false,
        { timeoutMs: 300000 }
    );
    const data = result?.data && typeof result.data === 'object' ? result.data : result;
    const url = String(data?.url || '');
    if (!url) {
        throw new Error(data?.error || data?.msg || result?.error || 'Upload failed');
    }
    return {
        url,
        mime: String(data.mime || picked.mime || 'image/jpeg'),
        file_id: data.file_id,
    };
}
