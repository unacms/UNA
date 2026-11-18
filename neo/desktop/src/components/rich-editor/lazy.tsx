/**
 * The rich editor as the rest of the app takes it: loaded after the app starts (editor-module.ts),
 * so the startup script holds none of Tiptap and ProseMirror.
 *
 * - `RichEditor` draws a box of the editor's size until the editor is there, then the editor.
 * - A component that reads HTML with the editor's schema while it draws (`normalizeHtml` for the
 *   text it starts from) calls `useEditor()` and is wrapped in `withEditor`, which draws nothing
 *   until the editor is there.
 * - Code that runs only once an editor is shown (its callbacks) calls `loadedEditor()`.
 */
import { type ComponentProps, type ComponentType, Suspense } from 'react';

import { lazyModule } from '../../lib/lazy-module';

export type { RichEditorHandle } from './rich-editor';

export const editorChunk = lazyModule(() => import('./editor-module'));

export type EditorModule = Awaited<ReturnType<typeof editorChunk.load>>;

/** The editor's module in a component, which waits (suspends) until it is loaded. */
export function useEditor(): EditorModule {
    return editorChunk.use();
}

/** The editor's module where an editor is shown already. */
export function loadedEditor(): EditorModule {
    return editorChunk.loaded();
}

type Props = ComponentProps<EditorModule['RichEditor']>;

function LoadedEditor(props: Props) {
    const { RichEditor: Editor } = useEditor();
    return <Editor {...props} />;
}

/** The box the editor will be, while it loads: its frame and height, nothing to type in yet. */
function EditorPlaceholder({ mode, rows, className, invalid }: Readonly<Props>) {
    const classes = ['rich-editor', `rich-editor-${mode}`, 'is-loading', invalid ? 'is-invalid' : '', className ?? ''].filter(Boolean).join(' ');
    return (
        <div className={classes} style={{ ['--rich-rows' as string]: rows }} aria-hidden="true">
            <div className="rich-editor-body">
                <div className="rich-editor-text" />
            </div>
        </div>
    );
}

/** The rich text box of the app's composers (rich-editor.tsx), loaded after the app starts. */
export function RichEditor(props: Props) {
    return (
        <Suspense fallback={<EditorPlaceholder {...props} />}>
            <LoadedEditor {...props} />
        </Suspense>
    );
}

/** A component that calls `useEditor()`, drawn once the editor has loaded (nothing until then). */
export function withEditor<P extends object>(Component: ComponentType<P>): ComponentType<P> {
    function WithEditor(props: P) {
        return (
            <Suspense fallback={null}>
                <Component {...props} />
            </Suspense>
        );
    }
    WithEditor.displayName = `WithEditor(${Component.displayName ?? Component.name})`;
    return WithEditor;
}
