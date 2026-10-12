/**
 * Composer Enter-key policy (web / DOM KeyboardEvent).
 * Submit on Enter (messenger): Shift/Option+Enter is a newline, plain Enter submits.
 * Submit on Cmd/Ctrl+Enter (comments, feed posts): plain Enter stays a newline.
 */

export function isCommentEditorNewlineEnter(event: any) {
    return !!(event?.shiftKey || event?.altKey);
}

export function isSubmitModEnter(event: any) {
    return !!(event?.metaKey || event?.ctrlKey);
}

export function isCommentEditorEnterKey(event: any) {
    const key = event?.key ?? event?.code;
    return key === 'Enter' || key === 'LineFeed';
}

/** TipTap stores the editor on the ProseMirror root (`dom.editor`). */
export function getTiptapEditorFromContainer(container: any) {
    if (!container?.querySelector) return null;
    const surface =
        container.querySelector('.ProseMirror.tiptap') ??
        container.querySelector('.ProseMirror') ??
        container.querySelector('.tiptap');
    const editor = surface?.editor;
    return editor && !editor.isDestroyed ? editor : null;
}
