// Обёртка над @tiptap/react: задаёт `immediatelyRender` в useEditor.
//
// react-native-enriched-html (веб-сборка) вызывает useEditor без этой опции, что
// ломается двумя способами:
//   1) immediatelyRender === undefined → @tiptap/react в dev бросает
//      "SSR has been detected", потому что в Next.js `window.next` есть даже на
//      клиенте (isNext === true).
//   2) immediatelyRender === false → на клиенте первый рендер возвращает
//      editor === null, а внутренний хук пакета useOnEditorChange зовёт
//      editor.getHTML() без проверки → "Cannot read properties of null".
//
// Решение: на сервере false (нет исключения; useEffect на сервере не выполняется,
// так что null-краша нет), на клиенте true (editor создаётся сразу, не null).
//
// Реальный модуль подключается через alias '@tiptap-react-real' (см.
// next.config.js), чтобы избежать рекурсии алиаса '@tiptap/react'.
export * from '@tiptap-react-real';
import { useEditor as realUseEditor } from '@tiptap-react-real';

export function useEditor(options = {}, deps = []) {
    const opts =
        options && options.immediatelyRender !== undefined
            ? options
            : { ...(options || {}), immediatelyRender: typeof window !== 'undefined' };
    return realUseEditor(opts, deps);
}
