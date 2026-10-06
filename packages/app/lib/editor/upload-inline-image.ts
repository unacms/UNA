import { uploadImage } from 'app/lib/util/upload'
import { genRnd } from 'app/lib/util/misc'

const INLINE_STORAGE = 'sys_images_editor'

/**
 * Upload one body image the way UNA's Quill does (`storage.php?a=upload`): straight into
 * the public editor storage with the ghost record dropped, so the URL is permanent and the
 * file never becomes a post attachment. Resolves the image URL, or `null` on failure.
 */
export function uploadInlineImage(image: {
    uri: string
    fileName?: string
    mimeType?: string
}): Promise<string | null> {
    const url = '/api.php?r=system/get_data_api/TemplUploaderServices/&params[]='
        + '&a=upload_inline&uo=sys_html5'
        + `&so=${INLINE_STORAGE}&o=${INLINE_STORAGE}&t=${INLINE_STORAGE}&uid=${genRnd(8)}`

    return new Promise((resolve) => {
        uploadImage(
            image.uri,
            url,
            ({ result }) => resolve(result?.data?.link || result?.link || null),
            { fileName: image.fileName, mimeType: image.mimeType },
        )
            .catch((err) => {
                console.warn('[editor] inline image upload failed', err)
                resolve(null)
            })
    })
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Replace the placeholder image `from` with `to`, or remove it when `to` is null.
 * Web edits the TipTap node in place (keeps the caret); native round-trips the HTML.
 */
export async function swapEditorImageSrc(editorRef: any, tipTap: any, from: string, to: string | null) {
    if (tipTap?.state && tipTap?.view) {
        const { state } = tipTap
        let tr = state.tr
        const hits: Array<{ pos: number; node: any }> = []
        state.doc.descendants((node: any, pos: number) => {
            if (node.type?.name?.toLowerCase().includes('image') && node.attrs?.src === from) hits.push({ pos, node })
        })
        // Back to front so earlier positions stay valid on delete.
        hits.reverse().forEach(({ pos, node }) => {
            tr = to
                ? tr.setNodeMarkup(pos, undefined, { ...node.attrs, src: to })
                : tr.delete(pos, pos + node.nodeSize)
        })
        if (hits.length) {
            tipTap.view.dispatch(tr)
            return
        }
    }

    const ed = editorRef?.current
    if (!ed?.getHTML) return
    try {
        let html = String(await ed.getHTML())
        if (!html.includes(from)) return
        html = to
            ? html.split(from).join(to)
            : html.replace(new RegExp(`<img[^>]*src="${escapeRegExp(from)}"[^>]*>`, 'g'), '')
        ed.setValue(html.replace(/^<html>/i, '').replace(/<\/html>$/i, ''))
    } catch {
        // editor unmounted mid-upload
    }
}
