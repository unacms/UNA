'use client'
/**
 * Universal editor toolbar — Enriched visual (flat text buttons), Tentap-parity commands.
 * Shared UI + enriched adapter. Tentap adapter lives in `editor-toolbar-tentap.ts`
 * so enriched does not pull `@10play/tentap-editor`.
 */
import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Platform, TextInput } from 'react-native'
import { View } from 'app/design/view'
import { NeoButton } from 'app/design/controls'
import { appSetting, cn } from 'app/lib/util'
import { fetcher } from 'app/lib/fetcher'
import { getTiptapEditorFromContainer } from 'app/lib/editor/comment-editor-keyboard'
import { useTranslation } from 'react-i18next'
import { toEmbedImageSrc } from 'app/lib/editor/inline-video'
import { UNA_URL } from 'app/config'
import DropdownMenu from 'app/ui/atoms/dropdown-menu'

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
    'align',
    'image',
    'video',
]

/** Accessible names of the toolbar buttons (every button shows an icon). */
export const COMMAND_LABELS: Record<string, string> = {
    bold: 'Bold',
    italic: 'Italic',
    link: 'Link',
    checklist: 'Checklist',
    code: 'Code',
    underline: 'Underline',
    strikethrough: 'Strikethrough',
    quote: 'Quote',
    bullet: 'Bulleted list',
    ordered: 'Numbered list',
    indent: 'Indent',
    outdent: 'Outdent',
    undo: 'Undo',
    redo: 'Redo',
    image: 'Image',
    video: 'Video',
    embed: 'Embed',
    align: 'Align',
}

/** Formatting buttons show their letter in that style (Lucide's letter icons look cramped at mini size). */
const COMMAND_GLYPHS: Record<string, { text: string; className: string }> = {
    bold: { text: 'B', className: 'font-bold' },
    italic: { text: 'I', className: 'font-normal italic font-serif' },
    underline: { text: 'U', className: 'font-normal underline' },
    strikethrough: { text: 'S', className: 'font-normal line-through' },
    quote: { text: '“', className: 'font-bold font-serif text-xl leading-none' },
}

/** Lucide icons shown instead of the text label (the label stays as the a11y name). */
export const COMMAND_ICONS: Record<string, string> = {
    bullet: 'List',
    ordered: 'ListOrdered',
    indent: 'ListIndentIncrease',
    outdent: 'ListIndentDecrease',
    undo: 'Undo2',
    redo: 'Redo2',
    checklist: 'ListTodo',
    code: 'Braces',
    image: 'Image',
    video: 'Video',
    embed: 'CodeXml',
}

/** Paragraph alignments of the align menu; `left` clears it (`auto`). */
const ALIGNMENTS = [
    { id: 'left', title: 'Align left', icon: 'TextAlignStart' },
    { id: 'center', title: 'Align center', icon: 'TextAlignCenter' },
    { id: 'right', title: 'Align right', icon: 'TextAlignEnd' },
]

/** Width presets for a selected body image / video / embed (web); inserted media is at most 720px. */
const MEDIA_SIZES = [
    { id: 'size-s', label: 'S', width: 240 },
    { id: 'size-m', label: 'M', width: 360 },
    { id: 'size-l', label: 'L', width: 540 },
    { id: 'size-xl', label: 'XL', width: 720 },
]

type SelectedMedia = { pos: number; width: number; height: number }

/** Menu row: text only (the trigger shows the icon); `selected` marks the current choice. */
type ToolbarMenuItem = { id: string; title: string; selected?: boolean }

/** Toolbar item: a button, or (with `menu`) a dropdown whose choice goes to `onSelect`. */
type ToolbarItem = {
    id: string
    disabled?: boolean
    active?: boolean
    onPress?: () => void
    label?: string
    icon?: string
    menu?: ToolbarMenuItem[]
    onSelect?: (id: string) => void
}

/** Web: the image node TipTap has selected (a click on it), `null` otherwise. */
function useSelectedMedia(tipTap: any): SelectedMedia | null {
    const [media, setMedia] = useState<SelectedMedia | null>(null)
    const lastKey = useRef('')

    useEffect(() => {
        if (!tipTap?.on) return undefined
        const update = () => {
            const sel = tipTap.state?.selection
            const node = sel?.node
            const next = node?.type?.name?.toLowerCase().includes('image')
                ? { pos: sel.from, width: Number(node.attrs?.width) || 0, height: Number(node.attrs?.height) || 0 }
                : null
            const key = next ? `${next.pos}:${next.width}:${next.height}` : ''
            if (key === lastKey.current) return
            lastKey.current = key
            setMedia(next)
        }
        update()
        tipTap.on('selectionUpdate', update)
        tipTap.on('update', update)
        return () => {
            tipTap.off('selectionUpdate', update)
            tipTap.off('update', update)
        }
    }, [tipTap])

    return media
}

/**
 * Flat Enriched-style toolbar (+ optional inline link bar).
 */
export function EditorToolbar({ items = [], linkBar, className }: { items?: ToolbarItem[]; linkBar?: any; className?: string }) {
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
            {items.map((item) => item.menu ? (
                <ToolbarMenu key={item.id} item={item} />
            ) : (
                <ToolbarButton
                    key={item.id}
                    label={item.label ?? COMMAND_LABELS[item.id] ?? item.id}
                    icon={item.icon ?? COMMAND_ICONS[item.id]}
                    glyph={COMMAND_GLYPHS[item.id]}
                    active={!!item.active}
                    disabled={!!item.disabled}
                    onPress={item.onPress}
                />
            ))}
        </View>
    )
}

/** Compact toolbar menus: short labels, no need for the default 256px popup. */
const MENU_MIN_WIDTH = 160

function ToolbarMenu({ item }: { item: ToolbarItem }) {
    const label = item.label ?? COMMAND_LABELS[item.id] ?? item.id
    const icon = item.icon ?? COMMAND_ICONS[item.id]
    return (
        <DropdownMenu
            items={item.menu!}
            onSelect={(choice) => item.onSelect?.(String(choice.id))}
            mode="popup"
            variant="tabs-overflow"
            tabsOverflowSize="sm"
            minPopupWidth={MENU_MIN_WIDTH}
            buttonProps={{
                style: 'borderless',
                controlSize: 'mini',
                selected: !!item.active,
                disabled: !!item.disabled,
                haptics: false,
                ...(icon ? { image: icon, accessibilityLabel: label } : { label }),
            }}
            triggerAccessibilityLabel={label}
        />
    )
}

function ToolbarButton({ label, icon, glyph, active, disabled, onPress }: { label: string; icon?: string; glyph?: { text: string; className: string }; active?: boolean; disabled?: boolean; onPress?: () => void }) {
    const content = glyph
        ? { label: glyph.text, accessibilityLabel: label, classNames: { text: cn('text-base', glyph.className) }, expoUI: false }
        : icon ? { image: icon, accessibilityLabel: label } : { label }
    return (
        <NeoButton
            style="borderless"
            controlSize="mini"
            selected={!!active}
            disabled={!!disabled}
            {...content}
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

    const selectedMedia = useSelectedMedia(tipTap)

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

        const defs: ToolbarItem[] = [
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

        // Paragraph alignment; body media sit in their own paragraph, so it places them too.
        const align = ['center', 'right'].includes(s.alignment) ? s.alignment : 'left'
        defs.push({
            id: 'align',
            label: t('Alignment'),
            icon: ALIGNMENTS.find((a) => a.id === align)?.icon,
            active: align !== 'left',
            menu: ALIGNMENTS.map((a) => ({ id: a.id, title: t(a.title), selected: a.id === align })),
            onSelect: (id) => {
                ed()?.setTextAlignment?.(id === 'left' ? 'auto' : id)
                ed()?.focus?.()
            },
        })

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

        defs.push(
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
        )

        // Size of the selected body media: width preset, height keeps the ratio (web only).
        if (tip && selectedMedia) {
            const { pos, width, height } = selectedMedia
            const current = MEDIA_SIZES.find((size) => size.width === width)
            defs.push({
                id: 'size',
                label: current?.label,
                icon: current ? undefined : 'Scaling',
                menu: MEDIA_SIZES.map((size) => ({ id: size.id, title: `${size.label} · ${size.width}px`, selected: size.width === width })),
                onSelect: (id) => {
                    const size = MEDIA_SIZES.find((item) => item.id === id)
                    if (!size) return
                    tip.chain().focus().command(({ tr }: any) => {
                        const node = tr.doc.nodeAt(pos)
                        if (!node) return false
                        tr.setNodeMarkup(pos, undefined, {
                            ...node.attrs,
                            width: size.width,
                            height: width && height ? Math.round(size.width * height / width) : node.attrs.height,
                        })
                        return true
                    }).setNodeSelection(pos).run()
                },
            })
        }

        // Indent / outdent / undo / redo via TipTap on web only.
        if (isWeb) {
            defs.push(
                {
                    // List item nesting: only the moves possible at the caret.
                    id: 'indent',
                    label: t('Indentation'),
                    disabled: !canSink && !canLift,
                    menu: [
                        ...(canSink ? [{ id: 'indent', title: t('Indent') }] : []),
                        ...(canLift ? [{ id: 'outdent', title: t('Outdent') }] : []),
                    ],
                    onSelect: (id) => {
                        const chain = tip?.chain?.().focus()
                        if (id === 'indent') chain?.sinkListItem('listItem').run()
                        else chain?.liftListItem('listItem').run()
                    },
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
    }, [enabled, styleState, editorRef, tipTap, isWeb, selection, selectedMedia, onInsertImage, onInsertVideo, embeds, t])

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
