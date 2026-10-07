import { appSetting } from 'app/lib/util'

const DEFAULT_MODE = 'attachments'
const INLINE_MAX_WIDTH = 720

/**
 * Resolve paste-image destination for a form.
 * `editor.paste_images` is the default (`off` | `attachments` | `inline`).
 * `editor.paste_images_forms` overrides by exact form name or `key_` prefix
 * (e.g. `bx_tasks` matches `bx_tasks_entry_add`). Longest key wins.
 * `editorDefault` replaces the global default for one editor kind (toolbar
 * editors pass `inline`); a global `off` still wins over it.
 */
export function getEditorPasteImagesMode(formName: string, editorDefault?: string) {
    const globalMode = appSetting('editor', 'paste_images')
    const fallback = (globalMode !== 'off' && editorDefault) || globalMode || DEFAULT_MODE
    const forms = appSetting('editor', 'paste_images_forms')
    if (!formName || !forms || typeof forms !== 'object') return fallback

    if (forms[formName]) return forms[formName]

    let bestKey = ''
    let bestMode
    for (const [key, mode] of Object.entries(forms)) {
        if (!key || !mode) continue
        if (formName === key || formName.startsWith(`${key}_`)) {
            if (key.length >= bestKey.length) {
                bestKey = key
                bestMode = mode
            }
        }
    }
    return bestMode || fallback
}

export function isInlineImagePaste(formName: string) {
    return getEditorPasteImagesMode(formName) === 'inline'
}

export function fitInlineImageSize(width: number, height: number, maxWidth = INLINE_MAX_WIDTH) {
    const w = Number(width)
    const h = Number(height)
    if (!Number.isFinite(w) || w <= 0 || !Number.isFinite(h) || h <= 0) {
        return { width: maxWidth, height: Math.round(maxWidth * 0.75) }
    }
    if (w <= maxWidth) return { width: Math.round(w), height: Math.round(h) }
    const scale = maxWidth / w
    return { width: Math.round(w * scale), height: Math.round(h * scale) }
}

export function revokePastedBlobUri(uri: string) {
    if (typeof URL === 'undefined' || !uri || typeof uri !== 'string') return
    if (!uri.startsWith('blob:')) return
    try {
        URL.revokeObjectURL(uri)
    } catch {
        // ignore
    }
}
