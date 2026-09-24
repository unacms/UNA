'use client'
import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { getTiptapEditorFromContainer } from 'app/lib/editor/comment-editor-keyboard'

const POLL_MS = 50

/**
 * Web: resolve the TipTap instance that react-native-enriched-html mounts
 * inside `containerRef`. The library exposes no editor handle, so we poll the
 * DOM until `.ProseMirror` carries one, then follow `destroy` (error-boundary
 * remount, unmount) back to null so a fresh instance gets picked up.
 *
 * Returns null on native and until the editor is mounted.
 */
export function useTiptapEditor(containerRef: any, enabled = Platform.OS === 'web') {
    const [editor, setEditor] = useState<any>(null)

    useEffect(() => {
        if (!enabled) return undefined
        if (editor) {
            const onDestroy = () => setEditor(null)
            editor.on('destroy', onDestroy)
            return () => editor.off('destroy', onDestroy)
        }

        let cancelled = false
        let intervalId: ReturnType<typeof setInterval> | null = null
        const tick = () => {
            if (cancelled) return
            const found = getTiptapEditorFromContainer(containerRef.current)
            if (!found) return
            clearInterval(intervalId!)
            setEditor(found)
        }
        intervalId = setInterval(tick, POLL_MS)
        queueMicrotask(tick)
        return () => {
            cancelled = true
            clearInterval(intervalId!)
        }
    }, [containerRef, editor, enabled])

    return editor
}
