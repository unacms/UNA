/**
 * The rich editor and what reads HTML with its schema (Tiptap and ProseMirror, a third of the
 * app's script), as one part loaded after the app starts (lazy.tsx). Nothing outside this folder
 * imports these files directly: they go through lazy.tsx.
 */
export { RichEditor } from './rich-editor';
export { survivesEditor } from './round-trip';
export { htmlToDoc, normalizeHtml } from './schema';
