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
