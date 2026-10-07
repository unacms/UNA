// Wrapper around @tiptap/react that always sets `immediatelyRender`.
//
// On Next.js, `window.next` exists on the client, so @tiptap/react treats the
// runtime as SSR and (if the option is omitted) creates the editor in useEffect.
// We keep `false` on purpose: `true` races with TipTap's 1ms scheduleDestroy and
// can null out `commandManager`.
//
// enriched-html hooks then see `editor === null` on the first client frame and
// call `editor.on(...)`. Those hooks are wrapped by webpack shims in
// next.config.js (not patch-package) so a clean Vercel install still works.
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
