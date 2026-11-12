/** Tests: typing into a rich editor and reading it back, as fireEvent.change and .value did for a textarea. */
import type { Editor } from '@tiptap/core';
import { act } from '@testing-library/react';

import { docToText, textToDoc } from '../../lib/rich-html';

/** The Tiptap editor of a rich text box (Tiptap keeps it on the editable element). */
export function editorOf(box: HTMLElement): Editor {
    const editor = (box as HTMLElement & { editor?: Editor }).editor;
    if (!editor) throw new Error('not a rich text box');
    return editor;
}

/** Replace the box's text with plain text (a paragraph per line), as typing it would. */
export function setRichText(box: HTMLElement, text: string): void {
    act(() => void editorOf(box).commands.setContent(textToDoc(text), { emitUpdate: true }));
}

/** Type at the caret. */
export function typeRich(box: HTMLElement, text: string): void {
    act(() => void editorOf(box).commands.insertContent(text));
}

/** The box's text, a line per paragraph. */
export function richText(box: HTMLElement): string {
    return docToText(editorOf(box).getJSON());
}
