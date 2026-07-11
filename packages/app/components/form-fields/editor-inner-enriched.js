'use client'
import { useController, useFormContext } from 'react-hook-form'
import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Platform } from 'react-native'
import { EnrichedTextInput } from 'react-native-enriched-html'
import { View, ScrollView, Pressable } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import { useFilesData } from 'app/context/files'
import { useCurrentUser } from 'app/context/user'
import { useThemeName } from 'app/design/theme'
import { useTranslation } from 'react-i18next'
import Profile from 'app/ui/molecules/profile'
import Badges from 'app/ui/molecules/badges'
import { getAlert, stripTagsWithLinks, appSetting, cn } from 'app/lib/util'
import emitter from 'app/context/emitter'
import { mentionsToUnaLinks, unaLinksToMentions, linkifyHtml } from './editor-mention-html'
import { useMentionSuggestions } from './use-mention-suggestions'
import {
    getTiptapEditorFromContainer,
    isCommentEditorEnterKey,
    isCommentEditorNewlineEnter,
} from 'app/lib/comment-editor-keyboard'

const MENTION_TYPE_LABELS = {
    bx_persons: 'People',
    bx_organizations: 'Organizations',
    other: 'Other',
}

function MentionSuggestionItem({ user, selected, onSelect }) {
    return (
        <Pressable
            onPress={onSelect}
            className={`flex-row items-center gap-2 px-2 py-1.5 rounded-lg ${selected ? 'bg-accent/60' : 'web:hover:bg-muted'}`}
        >
            <View className="flex-none">
                <Profile
                    id={user.value}
                    display_name={user.label}
                    url_avatar={user.url_avatar}
                    displayType="unit_wo_info"
                    displaySize="sm"
                    showLinks={false}
                />
            </View>
            <View className="flex-1 min-w-0">
                <View className="flex-row items-center gap-1 min-w-0">
                    <Text numberOfLines={1} className="shrink min-w-0 text-sm font-medium text-card-foreground">
                        {user.label}
                    </Text>
                    {!!user.badges?.length && (
                        <View className="flex-none flex-row items-center">
                            <Badges badges={user.badges} size="2xs" />
                        </View>
                    )}
                </View>
                {!!user.slug && (
                    <Text numberOfLines={1} className="text-xs text-muted-foreground">
                        {user.slug}
                    </Text>
                )}
            </View>
        </Pressable>
    )
}

const inputSettings = appSetting('theme', 'inputs')

const mentionColors = {
    light: 'rgba(37, 99, 235, 1)',
    dark: 'rgba(59, 130, 246, 1)',
}

export default function RftTextEnriched({
    name,
    value = '',
    initialHeight = 120,
    maxHeight = 300,
    onFocus,
    html,
    bg,
    enableSubmitOnEnter = false,
    placeholder,
    form_name,
    container_class,
    kb_stay_open,
    onEnterSubmit,
    disabled,
    classes,
    autofocus,
}) {
    const editorRef = useRef(null)
    const containerRef = useRef(null)
    const dropdownRef = useRef(null)
    // Latest mention handlers/state for the web capture-phase key listener.
    const handlersRef = useRef(null)
    const isWeb = Platform.OS === 'web'
    const isToolBar = html == 2 || html == 1
    const isPlainText = html == 3
    const isCommentsEditor = container_class === 'comments'

    const { field } = useController({ name, rules: {}, defaultValue: value })
    const formContext = useFormContext()
    const { currentUser } = useCurrentUser()
    const { filesData, setFilesData } = useFilesData()
    const { t } = useTranslation()
    const themeName = useThemeName() || 'light'

    // The web enriched-html build uses Tiptap, which crashes during SSR
    // (immediatelyRender cannot be passed through the public API). On web we wait
    // for client mount; on native we render immediately.
    const [mounted, setMounted] = useState(Platform.OS !== 'web')
    useEffect(() => { setMounted(true) }, [])

    const [styleState, setStyleState] = useState(null)
    // [text, indicator]
    const [mention, setMention] = useState(['', ''])
    // Web: caret-anchored dropdown position { top, left, width } (null = fall back
    // to the default anchored placement, e.g. on native).
    const [caretPos, setCaretPos] = useState(null)

    // ---- mention fetch url (same as tentap version) ----
    const object_privacy_view =
        formContext.watch('object_privacy_view') ||
        formContext.watch('cmt_privacy_view')
    const object_id = formContext.watch('id')
    const m = name == 'cmt_text' ? 'sys_cmts' : 'bx_timeline'
    let mentionUrl = '/searchExtended.php?action=get_mention'
    if (m) mentionUrl += '&m=' + m
    if (object_privacy_view) mentionUrl += '&object_privacy_view=' + object_privacy_view
    if (object_id) mentionUrl += '&cid=' + object_id

    // Robust, race-free mention suggestions (debounced + stale-response guarded),
    // seeded from the user's recent mentions on the bare trigger.
    const { suggestions, setSuggestions, reset: resetSuggestions, recordMention } = useMentionSuggestions({
        url: mentionUrl,
        term: mention[0],
        indicator: mention[1],
        userId: currentUser?.id,
    })

    // ---- initial / external value ----
    const lastSetValue = useRef(value)
    useEffect(() => {
        if (editorRef.current && value !== lastSetValue.current) {
            lastSetValue.current = value
            editorRef.current.setValue(unaLinksToMentions(value || ''))
        }
    }, [value])

    // ---- emitter (focus/blur/set_content), same as tentap version ----
    useEffect(() => {
        const sub = emitter.addListener('editor', (data) => {
            if (!editorRef.current) return
            if (data.action === 'blur') {
              /*  data.timeout
                    ? setTimeout(() => editorRef.current?.blur(), data.timeout)
                    : editorRef.current.blur()*/
            }
            if (data.action === 'focus') {
                if (isWeb) {
                    editorRef.current.focus()
                } else {
                    // iOS: after the keyboard is dismissed the native input can keep a
                    // stale first-responder state, so a plain focus() no-ops. Blur first
                    // to clear it, then focus to reliably re-summon the keyboard.
                  //  editorRef.current.blur?.()
                  //  setTimeout(() => editorRef.current?.focus(), 50)
                }
            }
            if (data.action === 'set_content') {
                lastSetValue.current = data.value
                editorRef.current.setValue(unaLinksToMentions(data.value || ''))
            }
        })
        return () => sub.remove()
    }, [])

    const insertMention = useCallback((user) => {
        const indicator = mention[1] || '@'
        editorRef.current?.setMention(indicator, user.label.trim(), {
            'data-profile-id': String(user.value),
            href: user.url,
            class: `bx-mention-link ${user.classname || ''}`.trim(),
        })
        recordMention(user)
        resetSuggestions()
        setMention(['', ''])
        setCaretPos(null)
    }, [mention, resetSuggestions, recordMention])

    // ---- web: anchor the dropdown right under the line where "@" is typed ----
    const computeCaretPosition = useCallback(() => {
        if (!isWeb || typeof window === 'undefined') return
        try {
            const sel = window.getSelection?.()
            const container = containerRef.current
            if (!sel || sel.rangeCount === 0 || !container?.getBoundingClientRect) return
            const range = sel.getRangeAt(0)
            let rect = range.getBoundingClientRect()
            if (!rect || (rect.top === 0 && rect.left === 0 && rect.width === 0 && rect.height === 0)) {
                const rects = range.getClientRects()
                if (rects?.length) rect = rects[rects.length - 1]
            }
            if (!rect) return
            const cRect = container.getBoundingClientRect()
            // Follow the caret vertically only; the dropdown stays left-aligned and
            // full-width so it sits directly under the line (anchoring to the caret's
            // x would push it right and cover the text near the field's right edge).
            const GAP = 6
            // Keep in sync with the dropdown's `max-h-*` class below.
            const MAX_H = 160
            const caretTop = rect.top - cRect.top
            const caretBottom = rect.bottom - cRect.top
            const spaceBelow = cRect.height - caretBottom
            const spaceAbove = caretTop
            // Place on whichever side has more room and cap the height to fit, so the
            // list never covers the typed line and is never clipped by the container.
            let top, maxHeight
            if (spaceBelow >= spaceAbove) {
                top = caretBottom + GAP
                maxHeight = Math.min(MAX_H, Math.max(0, spaceBelow - GAP))
            } else {
                maxHeight = Math.min(MAX_H, Math.max(0, spaceAbove - GAP))
                top = Math.max(0, caretTop - maxHeight - GAP)
            }
            setCaretPos({ top, maxHeight })
        } catch {
            // Selection not available — keep previous/fallback placement.
        }
    }, [isWeb])

    // ---- web: keep the editor focused while interacting with the dropdown ----
    // Clicking a suggestion would otherwise blur the editor, which ends the mention
    // trigger (setMention then no-ops) and clears the list before the click lands.
    // Preventing mousedown's default keeps focus + the active trigger so onPress fires.
    useEffect(() => {
        if (!isWeb) return
        const node = dropdownRef.current
        if (!node?.addEventListener) return
        const onMouseDown = (e) => e.preventDefault()
        node.addEventListener('mousedown', onMouseDown)
        return () => node.removeEventListener('mousedown', onMouseDown)
    }, [isWeb, suggestions.length > 0])

    // ---- HTML -> react-hook-form ----
    const onChangeHtml = useCallback((e) => {
        const raw = e?.nativeEvent?.value ?? ''
        // Convert mentions to UNA links, then auto-link any plain URLs/emails the
        // editor didn't catch itself (web has the library's autolink disabled), so
        // saved content has real <a> links on every platform.
        const value = linkifyHtml(mentionsToUnaLinks(raw))
        if (onFocus && value) onFocus()
        if (isPlainText) {
            field.onChange(stripTagsWithLinks(value, ['a', 'p', 'br', 'span']))
        } else {
            field.onChange(value)
        }
    }, [isPlainText])

    // ---- image paste ----
    const onPasteImages = useCallback((e) => {
        const imgs = e?.nativeEvent?.images || []
        if (!imgs.length) return
        const images = imgs.map((img) => ({
            uri: img.uri,
            fileName: (img.uri.split('/').pop() || 'image') + '.png',
            mimeType: img.type || 'image/png',
        }))
        setFilesData(getAlert('images:pasted', { images, form_name }))
    }, [form_name])

    // ---- submit on enter ----
    const submitOnEnter = isCommentsEditor
        ? (enableSubmitOnEnter || appSetting('comments', 'submit_comment_on_enter'))
        : enableSubmitOnEnter

    const onSubmitEditing = useCallback(() => {
        // Comment composers use newline mode + explicit Enter routing.
        if (isCommentsEditor && submitOnEnter) return
        if (onEnterSubmit) onEnterSubmit()
    }, [isCommentsEditor, submitOnEnter, onEnterSubmit])

    const onEnterSubmitRef = useRef(onEnterSubmit)
    useEffect(() => {
        onEnterSubmitRef.current = onEnterSubmit
    }, [onEnterSubmit])

    // ---- mention navigation in dropdown ----
    const moveSelected = (dir) => {
        setSuggestions((prev) => {
            const i = prev.findIndex((x) => x.selected)
            if (i === -1) return prev
            const len = prev.length
            const ni = dir === 'up' ? (i - 1 + len) % len : (i + 1) % len
            return prev.map((x, idx) => ({ ...x, selected: idx === ni, index: idx }))
        })
    }

    const onKeyPress = useCallback((e) => {
        const nativeEvent = e?.nativeEvent
        const key = nativeEvent?.key

        // Native comment editor: newline mode inserts breaks; route submit vs newline.
        if (!isWeb && submitOnEnter && isCommentsEditor && isCommentEditorEnterKey(nativeEvent)) {
            if (isCommentEditorNewlineEnter(nativeEvent)) return
            if (suggestions.length) {
                const sel = suggestions.find((x) => x.selected) || suggestions[0]
                if (sel) insertMention(sel)
                return
            }
            onEnterSubmitRef.current?.()
            return
        }

        // Web: mention + Enter routing handled on the TipTap surface (see effect below).
        if (isWeb) return
        if (!suggestions.length) return
        if (key === 'ArrowDown') moveSelected('down')
        else if (key === 'ArrowUp') moveSelected('up')
        else if (key === 'Enter') {
            const sel = suggestions.find((x) => x.selected) || suggestions[0]
            if (sel) insertMention(sel)
        }
    }, [isWeb, submitOnEnter, isCommentsEditor, suggestions, insertMention])

    // Web: capture Enter on TipTap (splitBlock for Shift/Option; submit otherwise).
    useEffect(() => {
        if (!isWeb || !mounted) return

        let dom = null
        let onKeyDownCapture = null
        let cancelled = false
        let intervalId = null

        const stopKey = (event) => {
            event.preventDefault()
            event.stopImmediatePropagation()
        }

        const detach = () => {
            if (dom && onKeyDownCapture) {
                dom.removeEventListener('keydown', onKeyDownCapture, true)
            }
            dom = null
            onKeyDownCapture = null
        }

        const attach = () => {
            const editor = getTiptapEditorFromContainer(containerRef.current)
            if (!editor?.view?.dom || editor.isDestroyed) return false

            detach()
            dom = editor.view.dom

            onKeyDownCapture = (event) => {
                const h = handlersRef.current

                if (h?.suggestions?.length) {
                    switch (event.key) {
                        case 'Enter':
                            if (isCommentEditorNewlineEnter(event)) break
                            stopKey(event)
                            const sel = h.suggestions.find((x) => x.selected) || h.suggestions[0]
                            if (sel) h.insertMention(sel)
                            return
                        case 'ArrowDown':
                            stopKey(event)
                            h.moveSelected('down')
                            return
                        case 'ArrowUp':
                            stopKey(event)
                            h.moveSelected('up')
                            return
                        case 'Escape':
                            stopKey(event)
                            h.close()
                            return
                        default:
                            break
                    }
                }

                if (!submitOnEnter || !isCommentsEditor || !isCommentEditorEnterKey(event)) return

                stopKey(event)
                if (isCommentEditorNewlineEnter(event)) {
                    editor.chain().focus().splitBlock().run()
                } else {
                    onEnterSubmitRef.current?.()
                }
            }

            dom.addEventListener('keydown', onKeyDownCapture, true)
            return true
        }

        if (!attach()) {
            intervalId = setInterval(() => {
                if (cancelled) return
                if (attach()) clearInterval(intervalId)
            }, 50)
        }

        return () => {
            cancelled = true
            if (intervalId) clearInterval(intervalId)
            detach()
        }
    }, [isWeb, mounted, submitOnEnter, isCommentsEditor])

    // ---- styles (htmlStyle) from theme ----
    const htmlStyle = useMemo(() => {
        const isDark = themeName === 'dark'
        const themeKey = isDark ? 'dark' : 'light'
        const mentionCfg = appSetting('editor', 'mention') || {}
        const color =
            mentionCfg.editor_color?.[themeKey] || (isDark ? mentionColors.dark : mentionColors.light)
        const backgroundColor = mentionCfg.editor_background?.[themeKey] || 'transparent'
        return {
            // No underline on links/mentions/tags — color alone marks them (the
            // library default underlines <a>, so override it explicitly).
            a: { color, textDecorationLine: 'none' },
            mention: { color, backgroundColor, textDecorationLine: 'none' },
        }
    }, [themeName])

    const editorTextColor = themeName === 'dark' ? 'rgba(225,230,240,1)' : 'rgba(30,40,55,1)'

    // Before client mount (web SSR), render a placeholder of the right height so
    // we do not initialize Tiptap on the server and avoid a hydration mismatch.
    if (!mounted) {
        return (
            <View
                className={`flex-auto ${isToolBar
                    ? ' px-3 py-2 bg-input/60 shadow-input-outline dark:shadow-input-outline-deep rounded-lg flex-auto overflow-hidden '
                    : (bg == 'transparent' ? '' : cn(inputSettings.base, inputSettings.rounded.default, inputSettings.size.default))
                    }`}
                style={{ minHeight: initialHeight }}
            />
        )
    }

    const dropdownPositioned = isWeb && caretPos

    // Keep the capture-phase key listener pointed at the latest state/handlers.
    handlersRef.current = {
        suggestions,
        insertMention,
        moveSelected,
        close: () => { resetSuggestions(); setMention(['', '']); setCaretPos(null) },
    }

    return (
        <View
            ref={containerRef}
            className={`flex-auto web:cursor-text ${isToolBar
                ? ' px-3 py-2 bg-input/60 shadow-input-outline dark:shadow-input-outline-deep rounded-lg flex-auto overflow-hidden text-card-foreground '
                : (bg == 'transparent' ? '' : cn(inputSettings.base, inputSettings.rounded.default, inputSettings.size.default))
                }`}
        >
            {suggestions.length > 0 && (
                <View
                    ref={dropdownRef}
                    className={`absolute max-h-40 w-full max-w-md left-0 z-50 p-1 rounded-xl bg-popover shadow-card-outline dark:shadow-card-outline-deep ${dropdownPositioned ? '' : 'bottom-0'}`}
                    style={dropdownPositioned ? { top: caretPos.top, maxHeight: caretPos.maxHeight } : undefined}
                >
                    <ScrollView keyboardShouldPersistTaps="always">
                        <View className="gap-0.5">
                            {(() => {
                                const showHeaders = new Set(suggestions.map((s) => s.type)).size > 1
                                let lastType = null
                                return suggestions.map((user) => {
                                    const header =
                                        showHeaders && user.type !== lastType ? (
                                            <Text
                                                key={`h-${user.type}`}
                                                className="px-2 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                                            >
                                                {t(MENTION_TYPE_LABELS[user.type] || MENTION_TYPE_LABELS.other)}
                                            </Text>
                                        ) : null
                                    lastType = user.type
                                    return (
                                        <View key={user.url}>
                                            {header}
                                            <MentionSuggestionItem
                                                user={user}
                                                selected={user.selected}
                                                onSelect={() => insertMention(user)}
                                            />
                                        </View>
                                    )
                                })
                            })()}
                        </View>
                    </ScrollView>
                </View>
            )}

            <EnrichedTextInput
                ref={editorRef}
                defaultValue={unaLinksToMentions(value)}
                placeholder={placeholder}
                placeholderTextColor="rgba(120,130,145,1)"
                editable={!disabled}
                autoFocus={!!autofocus}
                autoCapitalize="none"
                mentionIndicators={['@', '#']}
                htmlStyle={htmlStyle}
                submitBehavior={
                    submitOnEnter && isCommentsEditor
                        ? 'newline'
                        : submitOnEnter
                            ? 'submit'
                            : 'newline'
                }
                style={{
                    minHeight: initialHeight,
                    maxHeight,
                    color: editorTextColor,
                    fontSize: 16,
                    backgroundColor: 'transparent',
                }}
                onChangeHtml={onChangeHtml}
                onChangeState={(e) => setStyleState(e.nativeEvent)}
                onStartMention={(indicator) => { setMention(['', indicator]); requestAnimationFrame(computeCaretPosition) }}
                onChangeMention={(e) => { setMention([e.text, e.indicator]); requestAnimationFrame(computeCaretPosition) }}
                onEndMention={() => { setMention(['', '']); resetSuggestions(); setCaretPos(null) }}
                onPasteImages={onPasteImages}
                onSubmitEditing={onSubmitEditing}
                onKeyPress={onKeyPress}
                onFocus={() => { if (onFocus) onFocus() }}
            />

            {isToolBar && styleState && (
                <View className="flex-row flex-wrap gap-1 mt-2">
                    <ToolbarButton label="B" active={styleState.bold?.isActive} disabled={styleState.bold?.isBlocking} onPress={() => editorRef.current?.toggleBold()} />
                    <ToolbarButton label="I" active={styleState.italic?.isActive} disabled={styleState.italic?.isBlocking} onPress={() => editorRef.current?.toggleItalic()} />
                    <ToolbarButton label="U" active={styleState.underline?.isActive} disabled={styleState.underline?.isBlocking} onPress={() => editorRef.current?.toggleUnderline()} />
                    <ToolbarButton label="S" active={styleState.strikeThrough?.isActive} disabled={styleState.strikeThrough?.isBlocking} onPress={() => editorRef.current?.toggleStrikeThrough()} />
                    <ToolbarButton label="</>" active={styleState.inlineCode?.isActive} disabled={styleState.inlineCode?.isBlocking} onPress={() => editorRef.current?.toggleInlineCode()} />
                    <ToolbarButton label="❝" active={styleState.blockQuote?.isActive} onPress={() => editorRef.current?.toggleBlockQuote()} />
                    <ToolbarButton label="• List" active={styleState.unorderedList?.isActive} onPress={() => editorRef.current?.toggleUnorderedList()} />
                    <ToolbarButton label="1. List" active={styleState.orderedList?.isActive} onPress={() => editorRef.current?.toggleOrderedList()} />
                </View>
            )}
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
        />
    )
}
