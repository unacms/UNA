/** Native: expo-image-picker. Web counterpart in pick-image.js. */

import * as ImagePicker from 'expo-image-picker';
import { CHAT_IMAGE_MAX_BYTES, imageTooLargeError } from './chat-images';

/** RN `FormData` takes `{ uri, name, type }` in place of a `File`. */
function formDataPart(asset) {
    const uri = String(asset?.uri || '');
    return {
        uri,
        name: String(asset?.fileName || asset?.name || uri.split('/').pop() || 'image.jpg'),
        type: String(asset?.mimeType || asset?.type || 'image/jpeg'),
    };
}

/**
 * Let the user choose one image from the library. Resolves to `null` when they
 * cancel or deny the permission.
 * @returns {Promise<import('./chat-images').PickedImage|null>}
 * @throws {Error & {code: 'too_large'}} when the asset exceeds CHAT_IMAGE_MAX_BYTES.
 */
export async function pickAgentChatImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm?.granted) return null;
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.9,
        allowsMultipleSelection: false,
    });
    const asset = result?.canceled ? null : result?.assets?.[0];
    if (!asset) return null;
    // `fileSize` is not reported on every platform; the server enforces the cap too.
    if (Number(asset.fileSize) > CHAT_IMAGE_MAX_BYTES) throw imageTooLargeError();
    const file = formDataPart(asset);
    return {
        file,
        preview: asset.uri,
        name: file.name,
        mime: file.type,
    };
}
