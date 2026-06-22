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

    // Веб-реализация enriched-html построена на Tiptap, который падает при SSR
    // (immediatelyRender нельзя пробросить через публичный API). На вебе ждём
    // монтирования на клиенте; на нативе рендерим сразу.
    const [mounted, setMounted] = useState(Platform.OS !== 'web')
    useEffect(() => { setMounted(true) }, [])

    const [styleState, setStyleState] = useState(null)
    // [text, indicator]
    const [mention, setMention] = useState(['', ''])
    // Web: caret-anchored dropdown position { top, left, width } (null = fall back
    // to the default anchored placement, e.g. on native).
    const [caretPos, setCaretPos] = useState(null)

    // ---- mention fetch url (как в tentap-версии) ----
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

    // ---- начальное/внешнее значение ----
    const lastSetValue = useRef(value)
    useEffect(() => {
        if (editorRef.current && value !== lastSetValue.current) {
            lastSetValue.current = value
            editorRef.current.setValue(unaLinksToMentions(value || ''))
        }
    }, [value])

    // ---- emitter (focus/blur/set_content), как в tentap-версии ----
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

    // ---- web: drive the dropdown from the keyboard without leaking keys to the editor ----
    // Captured before ProseMirror so Enter selects the mention instead of inserting a
    // newline (the editor's keymap runs its own split-block command, which a late
    // preventDefault via onKeyPress cannot stop), and arrows navigate the list instead
    // of moving the caret.
    useEffect(() => {
        if (!isWeb) return
        const node = containerRef.current
        if (!node?.addEventListener) return
        const onKeyDownCapture = (e) => {
            const h = handlersRef.current
            if (!h?.suggestions?.length) return
            switch (e.key) {
                case 'Enter': {
                    e.preventDefault(); e.stopPropagation()
                    const sel = h.suggestions.find((x) => x.selected) || h.suggestions[0]
                    if (sel) h.insertMention(sel)
                    break
                }
                case 'ArrowDown':
                    e.preventDefault(); e.stopPropagation(); h.moveSelected('down'); break
                case 'ArrowUp':
                    e.preventDefault(); e.stopPropagation(); h.moveSelected('up'); break
                case 'Escape':
                    e.preventDefault(); e.stopPropagation(); h.close(); break
                default:
                    break
            }
        }
        node.addEventListener('keydown', onKeyDownCapture, true)
        return () => node.removeEventListener('keydown', onKeyDownCapture, true)
    }, [isWeb, mounted])

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

    // ---- вставка изображений (paste) ----
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
        ? appSetting('comments', 'submit_comment_on_enter')
        : enableSubmitOnEnter

    const onSubmitEditing = useCallback(() => {
        if (onEnterSubmit) onEnterSubmit()
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
        // Web drives the dropdown via a capture-phase listener (see effect above)
        // so it can stop the editor's own Enter/arrow handling.
        if (isWeb) return
        const key = e?.nativeEvent?.key
        if (!suggestions.length) return
        if (key === 'ArrowDown') moveSelected('down')
        else if (key === 'ArrowUp') moveSelected('up')
        else if (key === 'Enter') {
            const sel = suggestions.find((x) => x.selected) || suggestions[0]
            if (sel) insertMention(sel)
        }
    }, [isWeb, suggestions, insertMention])

    // ---- стили (htmlStyle) из темы ----
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

    // До монтирования на клиенте (web SSR) рендерим плейсхолдер нужной высоты,
    // чтобы не инициализировать Tiptap на сервере и избежать hydration mismatch.
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
                submitBehavior={submitOnEnter ? 'submit' : 'newline'}
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
