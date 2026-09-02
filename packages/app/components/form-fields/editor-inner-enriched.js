'use client'
import { useFormContext } from 'react-hook-form'
import { useState, useRef, useEffect, useMemo, useCallback, Component } from 'react'
import { Platform } from 'react-native'
import { EnrichedTextInput } from 'react-native-enriched-html'
import { View } from 'app/design/view'
import { EditorToolbar, useEnrichedToolbar } from 'app/lib/editor-toolbar'
import { useThemeValue } from 'app/design/theme'
import { appSetting, cn } from 'app/lib/util'
import { commitEditorHtml, normalizeEditorHtml } from 'app/lib/editor-form'
import { useEditorFormField } from 'app/lib/hooks/use-form-field'
import emitter from 'app/context/emitter'
import { mentionsToUnaLinks, unaLinksToMentions, linkifyHtml } from './editor-mention-html'
import { useEditorMentions } from 'app/lib/use-editor-mentions'
import { MentionSuggestionsDropdown } from 'app/lib/mention-suggestions-dropdown'
import {
    MENTION_INDICATORS,
    getTextBeforeCursorFromTiptap,
    insertMentionInTiptap,
    mentionAttributesForUser,
    parseMentionTrigger,
} from 'app/lib/editor-mention-shared'
import {
    getTiptapEditorFromContainer,
    isCommentEditorEnterKey,
    isCommentEditorNewlineEnter,
} from 'app/lib/comment-editor-keyboard'
import { useIsDesktop } from 'app/context/measure'
import { fitInlineImageSize, getEditorPasteImagesMode } from 'app/lib/editor-paste-images'

const inputSettings = appSetting('theme', 'inputs')

const mentionColors = {
    light: 'rgba(37, 99, 235, 1)',
    dark: 'rgba(59, 130, 246, 1)',
}

class EnrichedEditorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { gen: 0 }
    }
    static getDerivedStateFromError() {
        return {}
    }
    componentDidCatch() {
        this.setState((state) => ({ gen: Math.min(state.gen + 1, 3) }))
    }
    render() {
        if (this.state.gen >= 3) return null
        return <View key={this.state.gen}>{this.props.children}</View>
    }
}

export default function RftTextEnriched(props) {
    const {
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
    } = props

    const { name, field, readOnly } = useEditorFormField(props)
    const { resetField, formState } = useFormContext()
    const isDisabled = !!(disabled || readOnly)

    const editorRef = useRef(null)
    const containerRef = useRef(null)
    const dropdownRef = useRef(null)
    const isWeb = Platform.OS === 'web'
    const isDesktop = useIsDesktop()
    const isToolBar = html == 2 || html == 1
    const isPlainText = html == 3
    const isCommentsEditor = container_class === 'comments'
    const themeKey = useThemeValue('light', 'dark')
    const mentionColorFallback = useThemeValue(mentionColors.light, mentionColors.dark)

    const [styleState, setStyleState] = useState(null)
    const [selection, setSelection] = useState({ start: 0, end: 0, text: '' })
    // Web: viewport-fixed dropdown placement { top } or { bottom } — prefer above
    // the typed line so the list never covers the @query / gets clipped below.
    const [caretPos, setCaretPos] = useState(null)

    // Shared mention pipeline (same fetch/recents/nav as tentap).
    const {
        indicator: mentionIndicator,
        suggestions,
        setTrigger,
        clearTrigger,
        moveSelected,
        selectedSuggestion,
        recordMention,
        handlersRef,
    } = useEditorMentions({ fieldName: name, mentions: props.mentions })

    // ---- initial / external value ----
    // EnrichedTextInput's web build puts `defaultValue` in useEditor deps, so a
    // changing defaultValue destroys/recreates TipTap. After destroy, schema is
    // null and getHTML() throws ("Cannot read properties of null (reading 'cached')").
    // Keep defaultValue stable for the component lifetime; push later updates via setValue.
    const initialDefaultValue = useRef(unaLinksToMentions(value || ''))
    const lastSetValue = useRef(value)
    const callEditor = (method, ...args) => {
        try {
            editorRef.current?.[method]?.(...args)
        } catch {
            // Web TipTap handle exists before editor.commands is ready.
        }
    }
    useEffect(() => {
        if (editorRef.current && value !== lastSetValue.current) {
            lastSetValue.current = value
            callEditor('setValue', unaLinksToMentions(value || ''))
        }
    }, [value])
    useEffect(() => {
        if (!autofocus || !isWeb) return undefined
        const timer = setTimeout(() => callEditor('focus'), 80)
        return () => clearTimeout(timer)
    }, [!!autofocus, isWeb])

    // ---- emitter (focus/blur/set_content), same as tentap version ----
    useEffect(() => {
        const sub = emitter.addListener('editor', (data) => {
            if (!editorRef.current) return
            if (data.action === 'blur') {
                data.timeout
                    ? setTimeout(() => callEditor('blur'), data.timeout)
                    : callEditor('blur')
            }
            if (data.action === 'focus') {
                if (isWeb) {
                    callEditor('focus')
                } else {
                    // iOS: after the keyboard is dismissed the native input can keep a
                    // stale first-responder state, so a plain focus() no-ops. Blur first
                    // to clear it, then focus to reliably re-summon the keyboard.
                    callEditor('blur')
                    setTimeout(() => callEditor('focus'), 50)
                }
            }
            if (data.action === 'set_content') {
                lastSetValue.current = data.value
                callEditor('setValue', unaLinksToMentions(data.value || ''))
            }
            if (data.action === 'insert_inline_image') {
                if (data.form_name && form_name && data.form_name !== form_name) return
                if (!data.src || isPlainText) return
                const size = fitInlineImageSize(data.width, data.height)
                callEditor('setImage', data.src, size.width, size.height)
            }
        })
        return () => sub.remove()
    }, [form_name, isPlainText])

    useEffect(() => {
        if (formState.isSubmitted && kb_stay_open != true) {
            editorRef.current?.blur?.()
        }
    }, [formState.isSubmitted])

    const insertMention = useCallback((user) => {
        const indicator = mentionIndicator || '@'
        let inserted = false

        if (isWeb) {
            // Prefer direct TipTap insert (same @-token parse as tentap). Library
            // setMention no-ops when blur ended the MentionPlugin trigger.
            const tipTap = getTiptapEditorFromContainer(containerRef.current)
            if (tipTap) inserted = insertMentionInTiptap(tipTap, user, indicator)
        }

        if (!inserted) {
            editorRef.current?.setMention?.(
                indicator,
                user.label.trim(),
                mentionAttributesForUser(user)
            )
        }

        recordMention(user)
        clearTrigger()
        setCaretPos(null)
    }, [mentionIndicator, isWeb, recordMention, clearTrigger])

    // Fixed to the viewport so feed/card overflow:hidden cannot clip the list.
    // Prefer ABOVE the caret; flip below only when the viewport has room under
    // the caret and not enough above (comment fields sit near the screen bottom).
    const DROPDOWN_MAX_H = 160
    const DROPDOWN_MIN_H = 72
    const DROPDOWN_GAP = 6
    const DROPDOWN_MAX_W = 448 // max-w-md
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
            const vpAbove = Math.max(0, rect.top)
            const vpBelow = Math.max(0, window.innerHeight - rect.bottom)
            const needed = DROPDOWN_MAX_H + DROPDOWN_GAP
            const canFitAbove = vpAbove >= needed
            const canFitBelow = vpBelow >= needed
            // Prefer above. Flip below only when above cannot fit and below can,
            // or when neither fits but below has clearly more room.
            const placeBelow =
                (!canFitAbove && canFitBelow) ||
                (!canFitAbove && !canFitBelow && vpBelow > vpAbove + 24)

            const left = Math.max(8, Math.min(cRect.left, window.innerWidth - DROPDOWN_MAX_W - 8))
            const width = Math.min(cRect.width || DROPDOWN_MAX_W, DROPDOWN_MAX_W, window.innerWidth - left - 8)

            if (placeBelow) {
                setCaretPos({
                    position: 'fixed',
                    top: rect.bottom + DROPDOWN_GAP,
                    left,
                    width,
                    maxHeight: Math.min(
                        DROPDOWN_MAX_H,
                        Math.max(DROPDOWN_MIN_H, vpBelow - DROPDOWN_GAP)
                    ),
                })
            } else {
                setCaretPos({
                    position: 'fixed',
                    bottom: Math.max(0, window.innerHeight - rect.top + DROPDOWN_GAP),
                    left,
                    width,
                    maxHeight: Math.min(
                        DROPDOWN_MAX_H,
                        Math.max(DROPDOWN_MIN_H, vpAbove - DROPDOWN_GAP)
                    ),
                })
            }
        } catch {
            // Selection not available — keep previous / fall back to bottom-0.
        }
    }, [isWeb])

    // Reposition whenever the suggestion list appears or the query changes.
    useEffect(() => {
        if (!isWeb || !suggestions.length) {
            setCaretPos(null)
            return
        }
        requestAnimationFrame(computeCaretPosition)
        const onReposition = () => requestAnimationFrame(computeCaretPosition)
        window.addEventListener('resize', onReposition)
        // Capture scroll from nested feed/modals so fixed coords stay on the caret.
        window.addEventListener('scroll', onReposition, true)
        return () => {
            window.removeEventListener('resize', onReposition)
            window.removeEventListener('scroll', onReposition, true)
        }
    }, [isWeb, suggestions.length, mentionIndicator, computeCaretPosition])

    // Web: drive mention trigger from TipTap with the same text-before-cursor
    // rule as tentap, so suggestions work even when library mention events miss.
    useEffect(() => {
        if (!isWeb) return

        let editor = null
        let cancelled = false
        let intervalId = null

        const syncTrigger = () => {
            if (!editor || editor.isDestroyed) return
            const parsed = parseMentionTrigger(getTextBeforeCursorFromTiptap(editor))
            if (parsed) {
                setTrigger(parsed.term, parsed.indicator)
                requestAnimationFrame(computeCaretPosition)
            } else {
                setTrigger('', '')
                setCaretPos(null)
            }
        }

        const attach = () => {
            editor = getTiptapEditorFromContainer(containerRef.current)
            if (!editor || editor.isDestroyed) return false
            editor.on('transaction', syncTrigger)
            editor.on('selectionUpdate', syncTrigger)
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
            if (editor && !editor.isDestroyed) {
                editor.off('transaction', syncTrigger)
                editor.off('selectionUpdate', syncTrigger)
            }
        }
    }, [isWeb, setTrigger, computeCaretPosition])

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
    const isInitialHtmlEmission = useRef(true)
    const onChangeHtml = useCallback((e) => {
        // Library wraps TipTap HTML in <html>...</html>; strip so RHF value matches
        // UNA content and doesn't look like an external edit to the value effect.
        let raw = e?.nativeEvent?.value ?? ''
        raw = raw.replace(/^<html>/i, '').replace(/<\/html>$/i, '')
        // Convert mentions to UNA links, then auto-link any plain URLs/emails the
        // editor didn't catch itself (web has the library's autolink disabled), so
        // saved content has real <a> links on every platform.
        const html = linkifyHtml(mentionsToUnaLinks(raw))
        if (onFocus && html) onFocus()
        const next = normalizeEditorHtml(html, { isPlainText })
        commitEditorHtml({
            next,
            field,
            name,
            resetField,
            isInitialRef: isInitialHtmlEmission,
        })
        lastSetValue.current = next
    }, [field, isPlainText, name, onFocus, resetField])

    // ---- image paste (library onPasteImages: blob: on web, file:// on native) ----
    const onPasteImages = useCallback((e) => {
        const imgs = e?.nativeEvent?.images || []
        if (!imgs.length || !form_name || isPlainText) return
        if (getEditorPasteImagesMode(form_name) === 'off') return
        const images = imgs.map((img, index) => {
            const mimeType = img.type || 'image/png'
            const ext = mimeType.split('/')[1] || 'png'
            return {
                uri: img.uri,
                fileName: `pasted-${Date.now()}-${index}.${ext}`,
                mimeType,
                width: img.width,
                height: img.height,
            }
        })
        emitter.emit(`form_${form_name}`, { action: 'pasted_images', images })
    }, [form_name, isPlainText])

    // ---- submit on enter (desktop only; mobile Enter inserts newline) ----
    const submitOnEnter = isDesktop && (
        isCommentsEditor
            ? (enableSubmitOnEnter || appSetting('comments', 'submit_comment_on_enter'))
            : enableSubmitOnEnter
    )

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
    const onKeyPress = useCallback((e) => {
        const nativeEvent = e?.nativeEvent
        const key = nativeEvent?.key

        // Native comment editor: newline mode inserts breaks; route submit vs newline.
        if (!isWeb && submitOnEnter && isCommentsEditor && isCommentEditorEnterKey(nativeEvent)) {
            if (isCommentEditorNewlineEnter(nativeEvent)) return
            if (suggestions.length) {
                if (selectedSuggestion) insertMention(selectedSuggestion)
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
            if (selectedSuggestion) insertMention(selectedSuggestion)
        }
    }, [isWeb, submitOnEnter, isCommentsEditor, suggestions, selectedSuggestion, insertMention, moveSelected])

    // Web: capture Enter on TipTap (splitBlock for Shift/Option; submit otherwise).
    useEffect(() => {
        if (!isWeb) return

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
                            const sel = h.selectedSuggestion || h.suggestions[0]
                            if (sel) insertMention(sel)
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
                            h.clearTrigger()
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
    }, [isWeb, submitOnEnter, isCommentsEditor, handlersRef, insertMention])

    // ---- styles (htmlStyle) from theme ----
    const htmlStyle = useMemo(() => {
        const mentionCfg = appSetting('editor', 'mention') || {}
        const color = mentionCfg.editor_color?.[themeKey] || mentionColorFallback
        const backgroundColor = mentionCfg.editor_background?.[themeKey] || 'transparent'
        return {
            // No underline on links/mentions/tags — color alone marks them (the
            // library default underlines <a>, so override it explicitly).
            a: { color, textDecorationLine: 'none' },
            mention: { color, backgroundColor, textDecorationLine: 'none' },
        }
    }, [themeKey, mentionColorFallback])

    const editorTextColor = useThemeValue('rgba(30,40,55,1)', 'rgba(225,230,240,1)')

    // Web: clicks on padding / empty chrome around ProseMirror (toolbar field
    // padding, areas outside the stretched contenteditable) should still focus.
    const onContainerMouseDown = useCallback((e) => {
        if (!isWeb || isDisabled) return
        const target = e?.target
        if (!target?.closest) return
        if (target.closest('.ProseMirror')) return
        if (target.closest('a, button, [role="button"]')) return
        if (dropdownRef.current?.contains?.(target)) return
        e.preventDefault?.()
        callEditor('focus')
    }, [isWeb, isDisabled])

    // Native library callbacks (web uses TipTap sync above; keep these as a
    // fallback and for platforms where the native enriched input fires them).
    const onStartMention = useCallback((indicator) => {
        if (!isWeb) setTrigger('', indicator)
    }, [isWeb, setTrigger])
    const onChangeMention = useCallback((e) => {
        if (!isWeb) setTrigger(e.text, e.indicator)
    }, [isWeb, setTrigger])
    const onEndMention = useCallback(() => {
        if (!isWeb) clearTrigger()
    }, [isWeb, clearTrigger])

    const { items: toolbarItems, linkBar } = useEnrichedToolbar({
        editorRef,
        containerRef,
        styleState,
        selection,
        enabled: isToolBar,
    })

    const shellClass = 'relative flex-auto web:cursor-text overflow-visible'
    const surfaceClass = isToolBar
        ? ' px-3 py-2 bg-input/60 shadow-input-outline dark:shadow-input-outline-deep rounded-xl flex-auto overflow-hidden text-card-foreground '
        : (bg == 'transparent' ? '' : cn(inputSettings.base, inputSettings.size.regular))

    return (
        <View
            ref={containerRef}
            onMouseDown={isWeb ? onContainerMouseDown : undefined}
            className={shellClass}
        >
            <MentionSuggestionsDropdown
                suggestions={suggestions}
                onSelect={insertMention}
                dropdownRef={dropdownRef}
                className={caretPos?.position === 'fixed' ? 'fixed' : caretPos ? '' : 'bottom-0'}
                style={
                    caretPos
                        ? {
                            position: caretPos.position,
                            left: caretPos.left,
                            width: caretPos.width,
                            maxHeight: caretPos.maxHeight,
                            ...(caretPos.top != null
                                ? { top: caretPos.top }
                                : { bottom: caretPos.bottom }),
                        }
                        : undefined
                }
            />

            <View className={surfaceClass}>
                <EnrichedEditorBoundary>
                <EnrichedTextInput
                    ref={editorRef}
                    defaultValue={initialDefaultValue.current}
                    placeholder={placeholder}
                    placeholderTextColor="rgba(120,130,145,1)"
                    editable={!isDisabled}
                    autoFocus={isWeb ? false : !!autofocus}
                    autoCapitalize="none"
                    mentionIndicators={MENTION_INDICATORS}
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
                    onChangeSelection={(e) => setSelection(e.nativeEvent || { start: 0, end: 0, text: '' })}
                    onStartMention={onStartMention}
                    onChangeMention={onChangeMention}
                    onEndMention={onEndMention}
                    onPasteImages={onPasteImages}
                    onSubmitEditing={onSubmitEditing}
                    onKeyPress={onKeyPress}
                    onFocus={() => { if (onFocus) onFocus() }}
                />
                </EnrichedEditorBoundary>

                {isToolBar ? (
                    <EditorToolbar items={toolbarItems} linkBar={linkBar} />
                ) : null}
            </View>
        </View>
    )
}
