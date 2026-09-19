import { stripTags, stripTagsWithLinks } from 'app/lib/util'
import { stripInlinePresentation } from 'app/lib/html-helpers'

const LIMITED_HTML_TAGS = ['a', 'p', 'br', 'span']

/**
 * Normalize editor HTML before writing it to RHF.
 * `html == 3` is a rich field without a toolbar: keep a small tag allowlist
 * (no inline `<img>`). Both modes strip paste presentation.
 */
export function normalizeEditorHtml(html, { isLimitedHtml } = {}) {
    const source = html ?? ''
    return stripInlinePresentation(
        isLimitedHtml ? stripTagsWithLinks(source, LIMITED_HTML_TAGS) : source
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
