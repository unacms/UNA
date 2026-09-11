/**
 * Comment composer Enter-key policy (web / DOM KeyboardEvent).
 * Shift/Option+Enter: newline; plain Enter and Cmd/Ctrl+Enter: submit.
 */

export function isCommentEditorNewlineEnter(event) {
    return !!(event?.shiftKey || event?.altKey);
}

export function isCommentEditorEnterKey(event) {
    const key = event?.key ?? event?.code;
    return key === 'Enter' || key === 'LineFeed';
}

/** TipTap stores the editor on the ProseMirror root (`dom.editor`). */
export function getTiptapEditorFromContainer(container) {
    if (!container?.querySelector) return null;
    const surface =
        container.querySelector('.ProseMirror.tiptap') ??
        container.querySelector('.ProseMirror') ??
        container.querySelector('.tiptap');
    const editor = surface?.editor;
    return editor && !editor.isDestroyed ? editor : null;
}
