'use client'
import { useCallback, useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { isCommentEditorEnterKey, isCommentEditorNewlineEnter, isSubmitModEnter } from 'app/lib/editor/comment-editor-keyboard'
import { deleteWholeMention } from 'app/lib/editor/editor-mention-shared'

const isWeb = Platform.OS === 'web'

/**
 * Arrow/Enter/Escape while the mention list is open. Returns true when the key
 * was consumed. `h` is the mention handlers snapshot (`handlersRef.current`).
 */
function handleMentionNavKey(key: string, h: any, insertMention: any) {
    if (!h?.suggestions?.length) return false
    switch (key) {
        case 'ArrowDown':
            h.moveSelected('down')
            return true
        case 'ArrowUp':
            h.moveSelected('up')
            return true
        case 'Enter': {
            const sel = h.selectedSuggestion || h.suggestions[0]
            if (sel) insertMention(sel)
            return true
        }
        case 'Escape':
            h.clearTrigger()
            return true
        default:
            return false
    }
}

/**
 * A new line, as plain Enter makes it in newline mode: the editor's own Enter
 * shortcuts (a new list item, leaving a quote, a new paragraph).
 */
function insertNewline(tipTap: any) {
    if (tipTap.commands.keyboardShortcut?.('Enter')) return
    tipTap.chain().focus().splitBlock().run()
}

/**
 * Enter/mention key routing for the enriched editor.
 *
 * Comment composers run the library in `newline` mode and route Enter
 * themselves: with `submitOnEnter` (messenger) Shift/Option+Enter inserts a
 * break and plain Enter submits. Any editor with `onEnterSubmit` but without
 * `submitOnEnter` (comments, feed posts) submits on Cmd/Ctrl+Enter and keeps
 * plain Enter as a newline. While the mention list is open Enter/arrows/Escape
 * drive the list.
 *
 * - native: via the library's `onKeyPress` (returned here);
 * - web: via a capture-phase keydown on the ProseMirror root so TipTap's own
 *   Enter handling never sees the event. Shift/Option+Enter is a new line in
 *   every editor on web: ProseMirror binds no Shift-Enter and swallows it, so
 *   without this it did nothing wherever Enter isn't routed (tablet and phone
 *   widths, editors that don't submit on Enter).
 */
export function useEnrichedKeyboard({
    tipTap,
    isCommentsEditor,
    submitOnEnter,
    handlersRef,
    insertMention,
    onEnterSubmit,
}: { tipTap: any; isCommentsEditor: any; submitOnEnter: any; handlersRef: any; insertMention: any; onEnterSubmit: any }) {
    const onEnterSubmitRef = useRef(onEnterSubmit)
    useEffect(() => {
        onEnterSubmitRef.current = onEnterSubmit
    }, [onEnterSubmit])

    const routesEnter = submitOnEnter && isCommentsEditor
    const routesModEnter = !submitOnEnter && !!onEnterSubmit

    const onKeyPress = useCallback((e: any) => {
        const nativeEvent = e?.nativeEvent
        const h = handlersRef.current

        if (routesModEnter && isCommentEditorEnterKey(nativeEvent) && isSubmitModEnter(nativeEvent)
            && !h?.suggestions?.length) {
            onEnterSubmitRef.current?.()
            return
        }

        if (routesEnter && isCommentEditorEnterKey(nativeEvent)) {
            if (isCommentEditorNewlineEnter(nativeEvent)) return
            if (h?.suggestions?.length) {
                if (h.selectedSuggestion) insertMention(h.selectedSuggestion)
                return
            }
            onEnterSubmitRef.current?.()
            return
        }

        handleMentionNavKey(nativeEvent?.key, h, insertMention)
    }, [routesEnter, routesModEnter, handlersRef, insertMention])

    useEffect(() => {
        if (!isWeb || !tipTap?.view?.dom) return undefined
        const dom = tipTap.view.dom

        const stopKey = (event: any) => {
            event.preventDefault()
            event.stopImmediatePropagation()
        }

        const onKeyDownCapture = (event: any) => {
            if (!event.isComposing && !event.metaKey && !event.ctrlKey && !event.altKey
                && deleteWholeMention(tipTap, event.key)) {
                stopKey(event)
                return
            }

            // Shift/Option+Enter with the list open is still a newline, not a pick.
            const isNewlineEnter = event.key === 'Enter' && isCommentEditorNewlineEnter(event)
            if (!isNewlineEnter && handleMentionNavKey(event.key, handlersRef.current, insertMention)) {
                stopKey(event)
                return
            }

            if (routesModEnter && isCommentEditorEnterKey(event) && isSubmitModEnter(event)) {
                stopKey(event)
                onEnterSubmitRef.current?.()
                return
            }

            if (!isCommentEditorEnterKey(event) || event.isComposing) return
            if (isCommentEditorNewlineEnter(event) && !event.metaKey && !event.ctrlKey) {
                stopKey(event)
                insertNewline(tipTap)
                return
            }
            if (!routesEnter) return
            stopKey(event)
            onEnterSubmitRef.current?.()
        }

        dom.addEventListener('keydown', onKeyDownCapture, true)
        return () => dom.removeEventListener('keydown', onKeyDownCapture, true)
    }, [tipTap, routesEnter, routesModEnter, handlersRef, insertMention])

    return isWeb ? undefined : onKeyPress
}
