// Wrapper around @tiptap/react that always sets `immediatelyRender`.
//
// On Next.js, `window.next` exists on the client, so @tiptap/react treats the
// runtime as SSR. Creating the editor during render then races with destroy
// (`commandManager` becomes null) and throws:
//   Cannot read properties of null (reading 'commands')
//
// Default to false so the editor is created in useEffect. The enriched-html
// patch null-guards hooks/handles that used to crash when editor was null.
//
// Real module is aliased as '@tiptap-react-real' (see next.config.js).
export * from '@tiptap-react-real';
import { useEditor as realUseEditor } from '@tiptap-react-real';

export function useEditor(options = {}, deps = []) {
    const opts =
        options && options.immediatelyRender !== undefined
            ? options
            : { ...(options || {}), immediatelyRender: false };
    return realUseEditor(opts, deps);
}
