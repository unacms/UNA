'use client'
/**
 * Tentap adapter for the universal EditorToolbar.
 * Kept separate so enriched builds do not import `@10play/tentap-editor`.
 */
import { useState, useCallback, useMemo } from 'react'
import { useBridgeState } from '@10play/tentap-editor'

export function useTentapToolbar({ editor, enabled = true }: { editor: any; enabled?: boolean }) {
    const editorState = useBridgeState(editor)
    const [linkOpen, setLinkOpen] = useState(false)

    const closeLink = useCallback(() => setLinkOpen(false), [])

    const submitLink = useCallback((url: string) => {
        if (!editor) return
        editor.setLink(url || null)
        setLinkOpen(false)
        editor.focus?.()
    }, [editor])

    const items = useMemo(() => {
        if (!enabled || !editor || !editorState) return []
        const s = editorState

        const run = (fn: (...args: any[]) => any) => () => {
            fn()
            editor.focus?.()
        }

        return [
            {
                id: 'bold',
                active: s.isBoldActive,
                disabled: !s.canToggleBold,
                onPress: run(() => editor.toggleBold()),
            },
            {
                id: 'italic',
                active: s.isItalicActive,
                disabled: !s.canToggleItalic,
                onPress: run(() => editor.toggleItalic()),
            },
            // Link — временно отключён
            // {
            //     id: 'link',
            //     active: s.isLinkActive,
            //     disabled: !s.isLinkActive && !s.canSetLink,
            //     onPress: () => {
            //         if (s.isLinkActive) {
            //             editor.setLink(null)
            //             editor.focus?.()
            //         } else {
            //             setLinkOpen(true)
            //         }
            //     },
            // },
            {
                id: 'checklist',
                active: s.isTaskListActive,
                disabled: !s.canToggleTaskList,
                onPress: run(() => editor.toggleTaskList()),
            },
            {
                id: 'code',
                active: s.isCodeActive,
                disabled: !s.canToggleCode,
                onPress: run(() => editor.toggleCode()),
            },
            {
                id: 'underline',
                active: s.isUnderlineActive,
                disabled: !s.canToggleUnderline,
                onPress: run(() => editor.toggleUnderline()),
            },
            {
                id: 'strikethrough',
                active: s.isStrikeActive,
                disabled: !s.canToggleStrike,
                onPress: run(() => editor.toggleStrike()),
            },
            {
                id: 'quote',
                active: s.isBlockquoteActive,
                disabled: !s.canToggleBlockquote,
                onPress: run(() => editor.toggleBlockquote()),
            },
            {
                id: 'bullet',
                active: s.isBulletListActive,
                disabled: !s.canToggleBulletList,
                onPress: run(() => editor.toggleBulletList()),
            },
            {
                id: 'ordered',
                active: s.isOrderedListActive,
                disabled: !s.canToggleOrderedList,
                onPress: run(() => editor.toggleOrderedList()),
            },
            {
                id: 'indent',
                disabled: !s.canSink && !s.canSinkTaskListItem,
                onPress: run(() =>
                    s.canSink ? editor.sink() : editor.sinkTaskListItem()
                ),
            },
            {
                id: 'outdent',
                disabled: !s.canLift && !s.canLiftTaskListItem,
                onPress: run(() =>
                    s.canLift ? editor.lift() : editor.liftTaskListItem()
                ),
            },
            {
                id: 'undo',
                disabled: !s.canUndo,
                onPress: run(() => editor.undo()),
            },
            {
                id: 'redo',
                disabled: !s.canRedo,
                onPress: run(() => editor.redo()),
            },
        ]
    }, [enabled, editor, editorState])

    const linkBar = linkOpen
        ? {
            visible: true,
            initialUrl: editorState?.activeLink || '',
            onSubmit: submitLink,
            onCancel: closeLink,
        }
        : null

    return { items, linkBar }
}
