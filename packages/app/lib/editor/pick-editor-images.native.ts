/** Native: expo-image-picker. Web counterpart in pick-editor-images.ts. */
import * as ImagePicker from 'expo-image-picker'

export type EditorImage = {
    uri: string
    fileName: string
    mimeType: string
    width?: number
    height?: number
}

/** Resolves to `[]` when the user cancels or denies the permission. */
export async function pickEditorImages(): Promise<EditorImage[]> {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm?.granted) return []
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.9,
        allowsMultipleSelection: true,
    })
    if (result?.canceled) return []
    return (result?.assets || []).map((asset, index) => {
        const mimeType = asset.mimeType || 'image/jpeg'
        return {
            uri: asset.uri,
            fileName: asset.fileName || `image-${Date.now()}-${index}.${mimeType.split('/')[1] || 'jpg'}`,
            mimeType,
            width: asset.width,
            height: asset.height,
        }
    })
}

/** One video from the library; resolves `null` on cancel or denied permission. */
export async function pickEditorVideo(): Promise<EditorImage | null> {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm?.granted) return null
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsMultipleSelection: false,
    })
    const asset = result?.canceled ? null : result?.assets?.[0]
    if (!asset) return null
    const mimeType = asset.mimeType || 'video/mp4'
    return {
        uri: asset.uri,
        fileName: asset.fileName || `video-${Date.now()}.${mimeType.split('/')[1] || 'mp4'}`,
        mimeType,
        width: asset.width,
        height: asset.height,
    }
}
