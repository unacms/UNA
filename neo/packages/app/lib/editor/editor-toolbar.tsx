'use client'
/**
 * Universal editor toolbar — Enriched visual (flat text buttons), Tentap-parity commands.
 * Shared UI + enriched adapter. Tentap adapter lives in `editor-toolbar-tentap.ts`
 * so enriched does not pull `@10play/tentap-editor`.
 */
import { useState, useCallback, useMemo } from 'react'
import { Platform, TextInput } from 'react-native'
import { View } from 'app/design/view'
import { NeoButton } from 'app/design/controls'
import { appSetting, cn } from 'app/lib/util'
import { fetcher } from 'app/lib/fetcher'
import { getTiptapEditorFromContainer } from 'app/lib/editor/comment-editor-keyboard'
import { useTranslation } from 'react-i18next'
import { toEmbedImageSrc } from 'app/lib/editor/inline-video'
import { UNA_URL } from 'app/config'

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
    'image',
    'video',
]

export const COMMAND_LABELS: Record<string, string> = {
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
    image: 'Image',
    video: 'Video',
    embed: 'Embed',
}

/** Lucide icons shown instead of the text label (the label stays as the a11y name). */
export const COMMAND_ICONS: Record<string, string> = {
    checklist: 'ListTodo',
    code: 'Braces',
    image: 'Image',
    video: 'Video',
    embed: 'CodeXml',
}

/**
 * Flat Enriched-style toolbar (+ optional inline link bar).
 */
export function EditorToolbar({ items = [], linkBar, className }: { items?: any[]; linkBar?: any; className?: string }) {
    // Keep editor selection when clicking toolbar chrome (not the link URL input).
    const onMouseDown =
        Platform.OS === 'web'
            ? (e: any) => {
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
                    placeholder={linkBar.placeholder}
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
            className={cn('flex-row flex-wrap items-center gap-2 mt-2', className)}
        >
            {items.map((item) => (
                <ToolbarButton
                    key={item.id}
                    label={item.label ?? COMMAND_LABELS[item.id] ?? item.id}
                    icon={COMMAND_ICONS[item.id]}
                    active={!!item.active}
                    disabled={!!item.disabled}
                    onPress={item.onPress}
                />
            ))}
        </View>
    )
}

function ToolbarButton({ label, icon, active, disabled, onPress }: { label: string; icon?: string; active?: boolean; disabled?: boolean; onPress?: () => void }) {
    return (
        <NeoButton
            style="borderless"
            controlSize="mini"
            selected={!!active}
            disabled={!!disabled}
            {...(icon ? { image: icon, accessibilityLabel: label } : { label })}
            onPress={onPress}
            haptics={false}
        />
    )
}

function LinkBar({ initialUrl = '', placeholder, onSubmit, onCancel, className }: { initialUrl?: string; placeholder?: string; onSubmit?: (value: string) => void; onCancel?: () => void; className?: string }) {
    const { t } = useTranslation()
    const [url, setUrl] = useState(initialUrl || '')
    const value = url.trim()
    const canSubmit = /^https?:\/\/\S+\.\S+/i.test(value)
    const submit = () => {
        if (canSubmit) onSubmit?.(value)
    }

    return (
        <View className={cn('flex-row items-center gap-2 mt-2', className)}>
            <View className="flex-1 min-w-0 flex-row items-center rounded-lg border border-border bg-background px-3 h-9">
                <TextInput
                    value={url}
                    onChangeText={setUrl}
                    placeholder={placeholder || 'https://'}
                    placeholderTextColor="rgba(120,130,145,1)"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    autoFocus
                    onSubmitEditing={submit}
                    className="flex-1 min-w-0 w-full text-sm text-foreground bg-transparent"
                    style={Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : undefined}
                />
            </View>
            <NeoButton
                style="borderedProminent"
                controlSize="small"
                label={t('Insert')}
                disabled={!canSubmit}
                onPress={submit}
                haptics={false}
                classNames={{ root: 'self-center' }}
            />
            <NeoButton
                style="borderless"
                controlSize="small"
                image="X"
                accessibilityLabel={t('Cancel')}
                onPress={onCancel}
                haptics={false}
                classNames={{ root: 'self-center' }}
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
    tipTap: tipTapProp = null,
    styleState,
    selection,
    enabled = true,
    onInsertImage,
    onInsertVideo,
    embeds = false,
}: { editorRef: any; containerRef: any; tipTap?: any; styleState: any; selection: any; enabled?: boolean; onInsertImage?: () => void; onInsertVideo?: () => void; embeds?: boolean }) {
    const { t } = useTranslation()
    const [linkOpen, setLinkOpen] = useState(false)
    const [embedOpen, setEmbedOpen] = useState(false)
    const isWeb = Platform.OS === 'web'

    // Prefer the instance resolved by `useTiptapEditor`; fall back to a DOM
    // lookup per styleState change for callers that only pass a container.
    const tipTap = useMemo(() => {
        if (!isWeb || !enabled) return null
        if (tipTapProp) return tipTapProp
        return getTiptapEditorFromContainer(containerRef?.current)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isWeb, enabled, tipTapProp, styleState, containerRef])

    const closeLink = useCallback(() => setLinkOpen(false), [])

    const submitLink = useCallback((url: string) => {
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

    // Embed: an image at the caret (atomic on every platform) — the page image from UNA,
    // else UNA's embed-na.png — carrying the URL (toEmbedImageSrc); the post view renders
    // it as an embed card / player (see splitInlineMedia).
    const closeEmbed = useCallback(() => setEmbedOpen(false), [])
    const submitEmbed = useCallback(async (url: string) => {
        setEmbedOpen(false)
        if (!editorRef?.current || !/^https?:\/\/\S+$/i.test(url)) return
        let image = ''
        try {
            const res = await fetcher(
                `/api.php?r=${appSetting('urls', 'embeds_new')}${encodeURIComponent(url)}`,
                false,
                { maxAttempts: 1, silent: true },
            )
            image = String(res?.data?.image || '').trim()
        } catch {
            // placeholder below
        }
        if (!/^https?:\/\//i.test(image)) image = `${UNA_URL}/template/images/embed-na.png`
        editorRef?.current?.setImage?.(toEmbedImageSrc(image, url), 720, 405)
    }, [editorRef])

    const items = useMemo(() => {
        if (!enabled || !styleState) return []
        const s = styleState
        const ed = () => editorRef?.current

        const run = (fn: (...args: any[]) => any) => () => {
            fn()
            ed()?.focus?.()
        }

        const tip = tipTap
        const canUndo = !!(tip?.can?.()?.undo?.())
        const canRedo = !!(tip?.can?.()?.redo?.())
        const canSink = !!(tip?.can?.()?.sinkListItem?.('listItem'))
        const canLift = !!(tip?.can?.()?.liftListItem?.('listItem'))

        const defs: Array<{ id: string; disabled?: boolean; active?: boolean; onPress: () => void; label?: string }> = [
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

        // Picker → upload → inserted into the body (handlers live in the editor).
        if (onInsertImage) {
            defs.push({ id: 'image', onPress: onInsertImage })
        }
        if (onInsertVideo) {
            defs.push({ id: 'video', onPress: onInsertVideo })
        }
        if (embeds) {
            defs.push({ id: 'embed', onPress: () => setEmbedOpen(true) })
        }

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
    }, [enabled, styleState, editorRef, tipTap, isWeb, selection, onInsertImage, onInsertVideo, embeds])

    const linkBar = linkOpen || embedOpen
        ? {
            visible: true,
            placeholder: embedOpen ? t('Paste a link to embed') : undefined,
            initialUrl: '',
            onSubmit: embedOpen ? submitEmbed : submitLink,
            onCancel: embedOpen ? closeEmbed : closeLink,
        }
        : null

    return { items, linkBar }
}
