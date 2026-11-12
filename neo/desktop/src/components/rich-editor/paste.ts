import DOMPurify from 'dompurify';

import { type EditorMode, PASTE_ATTRS, PASTE_TAGS, SAFE_URI } from '../../lib/rich-html';

/**
 * Rich HTML pasted from elsewhere, down to what the mode keeps before the editor's schema
 * reads it: no styles, scripts, event handlers or links other than http, https and mailto;
 * images only in full mode (the schema then keeps http and https ones). Text of what is
 * removed stays (a pasted table is its text).
 */
export function cleanPastedHtml(html: string, mode: EditorMode): string {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: PASTE_TAGS[mode],
        ALLOWED_ATTR: PASTE_ATTRS,
        ALLOWED_URI_REGEXP: SAFE_URI,
        KEEP_CONTENT: true,
        // only the listed data-profile-id: no other data-* or aria-* attribute of the page it was copied from
        ALLOW_DATA_ATTR: false,
        ALLOW_ARIA_ATTR: false,
        FORBID_TAGS: ['style', 'script', 'template', 'iframe', 'object', 'embed', 'svg', 'math'],
    });
}
