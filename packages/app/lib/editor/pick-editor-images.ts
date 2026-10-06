/**
 * Web: hidden `<input type=file>` → blob: URIs in the same shape as pasted images
 * (files.js revokes them after upload). Native counterpart in pick-editor-images.native.ts.
 */
import type { EditorImage } from './pick-editor-images.native'

function readSize(uri: string): Promise<{ width?: number; height?: number }> {
    return new Promise((resolve) => {
        const img = new window.Image()
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
        img.onerror = () => resolve({})
        img.src = uri
    })
}

function openFileDialog(accept: string, multiple: boolean): Promise<File[]> {
    return new Promise((resolve) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = accept
        input.multiple = multiple
        // `cancel` is Chrome 113+ / Safari 16.4+; older browsers never resolve a dismissed dialog.
        input.onchange = () => resolve(Array.from(input.files || []))
        input.oncancel = () => resolve([])
        input.click()
    })
}

export async function pickEditorImages(): Promise<EditorImage[]> {
    const files = (await openFileDialog('image/*', true)).filter((file) => file.type.startsWith('image/'))
    return Promise.all(files.map(async (file) => {
        const uri = URL.createObjectURL(file)
        return {
            uri,
            fileName: file.name,
            mimeType: file.type,
            ...(await readSize(uri)),
        }
    }))
}

/** One video file; resolves `null` when the dialog is dismissed. */
export async function pickEditorVideo(): Promise<EditorImage | null> {
    const file = (await openFileDialog('video/*', false)).find((f) => f.type.startsWith('video/'))
    if (!file) return null
    return { uri: URL.createObjectURL(file), fileName: file.name, mimeType: file.type }
}
