/** Web: a hidden `<input type=file>`. Native counterpart in pick-image.native.js. */

import { CHAT_IMAGE_TYPES, pickedFromFile } from './chat-images';

function openFileDialog() {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = CHAT_IMAGE_TYPES.join(',');
        const finish = (file) => {
            input.onchange = null;
            input.oncancel = null;
            resolve(file);
        };
        input.onchange = () => finish(input.files?.[0] || null);
        // `cancel` is Chrome 113+ / Safari 16.4+; older browsers simply never resolve
        // a dismissed dialog, which leaves nothing pending but the promise itself.
        input.oncancel = () => finish(null);
        input.click();
    });
}

/**
 * Let the user choose one image. Resolves to `null` when they dismiss the dialog.
 * @returns {Promise<import('./chat-images').PickedImage|null>}
 * @throws {Error & {code: 'too_large'}} when the file exceeds CHAT_IMAGE_MAX_BYTES.
 */
export async function pickAgentChatImage() {
    const file = await openFileDialog();
    return pickedFromFile(file);
}
