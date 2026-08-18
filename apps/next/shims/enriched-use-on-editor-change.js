// Wraps react-native-enriched-html's useOnEditorChange.
// The stock hook does editor.on() when a handler is passed, even if editor is
// still null (Next.js immediatelyRender: false). Drop the handler until the
// editor exists so a clean Vercel install does not need patch-package.
import { useOnEditorChange as realUseOnEditorChange } from '@enriched-use-on-editor-change-real';

export const useOnEditorChange = (editor, handler, getValue) =>
    realUseOnEditorChange(
        editor,
        editor && !editor.isDestroyed ? handler : undefined,
        getValue
    );
