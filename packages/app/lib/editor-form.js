import { stripTags, stripTagsWithLinks } from 'app/lib/util'
import { stripInlinePresentation } from 'app/lib/html-helper'

const PLAIN_TEXT_TAGS = ['a', 'p', 'br', 'span']

/**
 * Normalize editor HTML before writing it to RHF.
 * `html == 3` keeps a small tag allowlist; both modes strip paste presentation.
 */
export function normalizeEditorHtml(html, { isPlainText } = {}) {
    const source = html ?? ''
    return stripInlinePresentation(
        isPlainText ? stripTagsWithLinks(source, PLAIN_TEXT_TAGS) : source
    )
}

/**
 * First editor emission is usually a normalized version of the initial value
 * (`<p>` wrappers, empty `<p></p>`). Re-baseline instead of onChange so an
 * untouched form is not dirty. Later emissions go through `field.onChange`.
 *
 * @returns {boolean} true when the RHF value was changed via onChange
 */
export function commitEditorHtml({
    next,
    field,
    name,
    resetField,
    isInitialRef,
}) {
    if (isInitialRef.current) {
        isInitialRef.current = false
        if ((stripTags(next) || '') === (stripTags(field.value) || '')) {
            resetField(name, { defaultValue: next })
            return false
        }
    }
    field.onChange(next)
    return true
}
