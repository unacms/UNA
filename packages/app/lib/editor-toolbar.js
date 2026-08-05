'use client'
/**
 * Universal editor toolbar — Enriched visual (flat text buttons), Tentap-parity commands.
 * Shared UI + enriched adapter. Tentap adapter lives in `editor-toolbar-tentap.js`
 * so enriched does not pull `@10play/tentap-editor`.
 */
import { useState, useCallback, useMemo } from 'react'
import { Platform, TextInput } from 'react-native'
import { View } from 'app/design/view'
import { Button } from 'app/design/controls'
import { cn } from 'app/lib/util'
import { getTiptapEditorFromContainer } from 'app/lib/comment-editor-keyboard'

export const EDITOR_TOOLBAR_COMMAND_IDS = [
    'bold',
    'italic',
    'link',
    'checklist',
    'code',
    'underline',
    'strikethrough',
    'quote',
    'bullet',
    'ordered',
    'indent',
    'outdent',
    'undo',
    'redo',
]

export const COMMAND_LABELS = {
    bold: 'B',
    italic: 'I',
    link: 'Link',
    checklist: '☐',
    code: '</>',
    underline: 'U',
    strikethrough: 'S',
    quote: '❝',
    bullet: '• List',
    ordered: '1. List',
    indent: '→',
    outdent: '←',
    undo: '↶',
    redo: '↷',
}

/**
 * Flat Enriched-style toolbar (+ optional inline link bar).
 */
export function EditorToolbar({ items = [], linkBar, className }) {
    // Keep editor selection when clicking toolbar chrome (not the link URL input).
    const onMouseDown =
        Platform.OS === 'web'
            ? (e) => {
                const tag = e?.target?.tagName || e?.nativeEvent?.target?.tagName
                if (tag === 'INPUT' || tag === 'TEXTAREA') return
                e.preventDefault?.()
            }
            : undefined

    if (linkBar?.visible) {
        return (
            <View onMouseDown={onMouseDown}>
                <LinkBar
                    initialUrl={linkBar.initialUrl}
                    onSubmit={linkBar.onSubmit}
                    onCancel={linkBar.onCancel}
                    className={className}
                />
            </View>
        )
    }

    if (!items.length) return null

    return (
        <View
            onMouseDown={onMouseDown}
            className={cn('flex-row flex-wrap items-center gap-1 mt-2', className)}
        >
            {items.map((item) => (
                <ToolbarButton
                    key={item.id}
                    label={item.label ?? COMMAND_LABELS[item.id] ?? item.id}
                    active={!!item.active}
                    disabled={!!item.disabled}
                    onPress={item.onPress}
                />
            ))}
        </View>
    )
}

function ToolbarButton({ label, active, disabled, onPress }) {
    return (
        <Button
            variant="text"
            size="xs"
            pressed={!!active}
            disabled={!!disabled}
            title={label}
            onPress={onPress}
            hitarea={false}
        />
    )
}

function LinkBar({ initialUrl = '', onSubmit, onCancel, className }) {
    const [url, setUrl] = useState(initialUrl || '')

    return (
        <View className={cn('flex-row items-center gap-2 mt-2', className)}>
            <TextInput
                value={url}
                onChangeText={setUrl}
                placeholder="https://"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                onSubmitEditing={() => onSubmit?.(url.trim())}
                className="flex-1 min-w-0 text-sm text-foreground bg-transparent border-b border-border py-1 px-1"
                style={Platform.OS === 'web' ? { outlineStyle: 'none' } : undefined}
            />
            <Button
                variant="text"
                size="xs"
                title="Insert"
                onPress={() => onSubmit?.(url.trim())}
                hitarea={false}
            />
            <Button
                variant="text"
                size="xs"
                title="Cancel"
                onPress={onCancel}
                hitarea={false}
            />
        </View>
    )
}

/**
 * Enriched engine: map styleState + ref (+ TipTap on web) → toolbar items.
 */
export function useEnrichedToolbar({
    editorRef,
    containerRef,
    styleState,
    selection,
    enabled = true,
}) {
    const [linkOpen, setLinkOpen] = useState(false)
    const isWeb = Platform.OS === 'web'

    const tipTap = useMemo(() => {
        if (!isWeb || !enabled) return null
        return getTiptapEditorFromContainer(containerRef?.current)
        // Re-resolve when styleState updates (selection/content changed)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isWeb, enabled, styleState, containerRef])

    const closeLink = useCallback(() => setLinkOpen(false), [])

    const submitLink = useCallback((url) => {
        const ed = editorRef?.current
        if (!ed) return
        const start = selection?.start ?? 0
        const end = selection?.end ?? start
        const text = selection?.text || url
        if (!url) {
            ed.removeLink?.(start, end)
        } else {
            ed.setLink?.(start, end, text, url)
        }
        setLinkOpen(false)
        ed.focus?.()
    }, [editorRef, selection])

    const items = useMemo(() => {
        if (!enabled || !styleState) return []
        const s = styleState
        const ed = () => editorRef?.current

        const run = (fn) => () => {
            fn()
            ed()?.focus?.()
        }

        const tip = tipTap
        const canUndo = !!(tip?.can?.()?.undo?.())
        const canRedo = !!(tip?.can?.()?.redo?.())
        const canSink = !!(tip?.can?.()?.sinkListItem?.('listItem'))
        const canLift = !!(tip?.can?.()?.liftListItem?.('listItem'))

        const defs = [
            {
                id: 'bold',
                active: s.bold?.isActive,
                disabled: s.bold?.isBlocking,
                onPress: run(() => ed()?.toggleBold?.()),
            },
            {
                id: 'italic',
                active: s.italic?.isActive,
                disabled: s.italic?.isBlocking,
                onPress: run(() => ed()?.toggleItalic?.()),
            },
            // Link — временно отключён
            // {
            //     id: 'link',
            //     active: s.link?.isActive,
            //     disabled: s.link?.isBlocking,
            //     onPress: () => {
            //         if (s.link?.isActive) {
            //             const start = selection?.start ?? 0
            //             const end = selection?.end ?? start
            //             ed()?.removeLink?.(start, end)
            //             ed()?.focus?.()
            //         } else {
            //             setLinkOpen(true)
            //         }
            //     },
            // },
            {
                id: 'checklist',
                active: s.checkboxList?.isActive,
                disabled: s.checkboxList?.isBlocking,
                onPress: run(() => ed()?.toggleCheckboxList?.(false)),
            },
            {
                id: 'code',
                active: s.inlineCode?.isActive,
                disabled: s.inlineCode?.isBlocking,
                onPress: run(() => ed()?.toggleInlineCode?.()),
            },
            {
                id: 'underline',
                active: s.underline?.isActive,
                disabled: s.underline?.isBlocking,
                onPress: run(() => ed()?.toggleUnderline?.()),
            },
            {
                id: 'strikethrough',
                active: s.strikeThrough?.isActive,
                disabled: s.strikeThrough?.isBlocking,
                onPress: run(() => ed()?.toggleStrikeThrough?.()),
            },
            {
                id: 'quote',
                active: s.blockQuote?.isActive,
                disabled: s.blockQuote?.isBlocking,
                onPress: run(() => ed()?.toggleBlockQuote?.()),
            },
            {
                id: 'bullet',
                active: s.unorderedList?.isActive,
                disabled: s.unorderedList?.isBlocking,
                onPress: run(() => ed()?.toggleUnorderedList?.()),
            },
            {
                id: 'ordered',
                active: s.orderedList?.isActive,
                disabled: s.orderedList?.isBlocking,
                onPress: run(() => ed()?.toggleOrderedList?.()),
            },
        ]

        // Indent / outdent / undo / redo via TipTap on web only.
        if (isWeb) {
            defs.push(
                {
                    id: 'indent',
                    disabled: !canSink,
                    onPress: run(() => tip?.chain?.().focus().sinkListItem('listItem').run()),
                },
                {
                    id: 'outdent',
                    disabled: !canLift,
                    onPress: run(() => tip?.chain?.().focus().liftListItem('listItem').run()),
                },
                {
                    id: 'undo',
                    disabled: !canUndo,
                    onPress: run(() => tip?.chain?.().focus().undo().run()),
                },
                {
                    id: 'redo',
                    disabled: !canRedo,
                    onPress: run(() => tip?.chain?.().focus().redo().run()),
                },
            )
        }

        return defs
    }, [enabled, styleState, editorRef, tipTap, isWeb, selection])

    const linkBar = linkOpen
        ? {
            visible: true,
            initialUrl: '',
            onSubmit: submitLink,
            onCancel: closeLink,
        }
        : null

    return { items, linkBar }
}
