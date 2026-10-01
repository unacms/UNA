'use client'
import { useFormContext } from 'react-hook-form'
import { useState, useRef, useEffect, useMemo, useCallback, Component } from 'react'
import { Platform } from 'react-native'
import { EnrichedTextInput } from 'react-native-enriched-html'
import { View } from 'app/design/view'
import { EditorToolbar, useEnrichedToolbar } from 'app/lib/editor/editor-toolbar'
import { useThemeValue } from 'app/design/theme'
import { appSetting, cn } from 'app/lib/util'
import { commitEditorHtml, normalizeEditorHtml } from 'app/lib/editor/editor-form'
import { useEditorFormField } from 'app/lib/form/use-form-field'
import emitter, { EVENTS } from 'app/context/emitter'
import { mentionsToUnaLinks, unaLinksToMentions, linkifyHtml } from './editor-mention-html'
import { useEditorMentions } from 'app/lib/editor/use-editor-mentions'
import { MentionSuggestionsDropdown } from 'app/lib/editor/mention-suggestions-dropdown'
import {
    MENTION_INDICATORS,
    insertMentionInTiptap,
    mentionAttributesForUser,
} from 'app/lib/editor/editor-mention-shared'
import { useTiptapEditor } from 'app/lib/editor/use-tiptap-editor'
import { useEnrichedMentionDropdown } from 'app/lib/editor/use-enriched-mention-dropdown'
import { useEnrichedKeyboard } from 'app/lib/editor/use-enriched-keyboard'
import { useIsDesktop } from 'app/context/measure'
import { fitInlineImageSize, getEditorPasteImagesMode } from 'app/lib/editor/editor-paste-images'

const isWeb = Platform.OS === 'web'
const inputSettings = appSetting('theme', 'inputs')

const mentionColors = {
    light: 'rgba(37, 99, 235, 1)',
    dark: 'rgba(59, 130, 246, 1)',
}

const EMPTY_SELECTION = { start: 0, end: 0, text: '' }

/** Call an imperative method on the library handle, tolerating a not-ready editor. */
function callEditor(editorRef, method, ...args) {
    try {
        editorRef.current?.[method]?.(...args)
    } catch {
        // Web TipTap handle exists before editor.commands is ready.
    }
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
        autofocus,
    } = props

    const { name, field, readOnly } = useEditorFormField(props)
    const { resetField, formState } = useFormContext()
    const isDisabled = !!(disabled || readOnly)

    const editorRef = useRef(null)
    const containerRef = useRef(null)
    const dropdownRef = useRef(null)
    const isDesktop = useIsDesktop()
    const isToolBar = html == 2 || html == 1
    // UNA html=3: rich editor, no toolbar. Images paste into attachments, not <img>.
    const isLimitedHtml = html == 3
    const isCommentsEditor = container_class === 'comments'
    const themeKey = useThemeValue('light', 'dark')
    const mentionColorFallback = useThemeValue(mentionColors.light, mentionColors.dark)
    const editorTextColor = useThemeValue('rgba(30,40,55,1)', 'rgba(225,230,240,1)')

    // Web only; null on native and until the library has mounted TipTap.
    const tipTap = useTiptapEditor(containerRef)

    // Toolbar inputs — only tracked when there is a toolbar to feed.
    const [styleState, setStyleState] = useState(null)
    const [selection, setSelection] = useState(EMPTY_SELECTION)
    const onChangeState = useCallback((e) => setStyleState(e.nativeEvent), [])
    const onChangeSelection = useCallback((e) => setSelection(e.nativeEvent || EMPTY_SELECTION), [])

    // Shared mention pipeline (same fetch/recents/nav as tentap).
    const {
        indicator: mentionIndicator,
        suggestions,
        setTrigger,
        clearTrigger,
        recordMention,
        handlersRef,
    } = useEditorMentions({ fieldName: name, mentions: props.mentions })

    // ---- initial / external value ----
    // EnrichedTextInput's web build puts `defaultValue` in useEditor deps, so a
    // changing defaultValue destroys/recreates TipTap. After destroy, schema is
    // null and getHTML() throws ("Cannot read properties of null (reading 'cached')").
    // Keep defaultValue fixed for the component lifetime; push later updates via setValue.
    const [initialDefaultValue] = useState(() => unaLinksToMentions(value || ''))
    const lastSetValue = useRef(value)
    useEffect(() => {
        if (editorRef.current && value !== lastSetValue.current) {
            lastSetValue.current = value
            callEditor(editorRef, 'setValue', unaLinksToMentions(value || ''))
        }
    }, [value])

    useEffect(() => {
        if (!autofocus || !isWeb) return undefined
        const timer = setTimeout(() => callEditor(editorRef, 'focus'), 80)
        return () => clearTimeout(timer)
    }, [autofocus])

    // ---- emitter (focus/blur/set_content/insert_inline_image), same as tentap ----
    useEffect(() => {
        const sub = emitter.addListener(EVENTS.editor, (data) => {
            if (!editorRef.current) return
            switch (data.action) {
                case 'blur':
                    if (data.timeout) setTimeout(() => callEditor(editorRef, 'blur'), data.timeout)
                    else callEditor(editorRef, 'blur')
                    break
                case 'focus':
                    if (isWeb) {
                        callEditor(editorRef, 'focus')
                    } else {
                        // iOS: after the keyboard is dismissed the native input can keep a
                        // stale first-responder state, so a plain focus() no-ops. Blur first
                        // to clear it, then focus to reliably re-summon the keyboard.
                        callEditor(editorRef, 'blur')
                        setTimeout(() => callEditor(editorRef, 'focus'), 50)
                    }
                    break
                case 'set_content':
                    lastSetValue.current = data.value
                    callEditor(editorRef, 'setValue', unaLinksToMentions(data.value || ''))
                    break
                case 'insert_inline_image': {
                    if (data.form_name && form_name && data.form_name !== form_name) return
                    if (!data.src || isLimitedHtml) return
                    const size = fitInlineImageSize(data.width, data.height)
                    callEditor(editorRef, 'setImage', data.src, size.width, size.height)
                    break
                }
                default:
                    break
            }
        })
        return () => sub.remove()
    }, [form_name, isLimitedHtml])

    useEffect(() => {
        if (formState.isSubmitted && kb_stay_open != true) {
            callEditor(editorRef, 'blur')
        }
    }, [formState.isSubmitted, kb_stay_open])

    // ---- mentions ----
    const insertMention = useCallback((user) => {
        const indicator = mentionIndicator || '@'
        // Web: direct TipTap insert (same @-token parse as tentap). Library
        // setMention no-ops when blur ended the MentionPlugin trigger.
        const inserted = tipTap ? insertMentionInTiptap(tipTap, user, indicator) : false
        if (!inserted) {
            editorRef.current?.setMention?.(
                indicator,
                user.label.trim(),
                mentionAttributesForUser(user)
            )
        }
        recordMention(user)
        clearTrigger()
    }, [mentionIndicator, tipTap, recordMention, clearTrigger])

    const dropdownPos = useEnrichedMentionDropdown({
        tipTap,
        containerRef,
        dropdownRef,
        hasSuggestions: suggestions.length > 0,
        setTrigger,
    })

    // Native library callbacks (web derives the trigger from TipTap above).
    const onStartMention = useCallback((indicator) => {
        if (!isWeb) setTrigger('', indicator)
    }, [setTrigger])
    const onChangeMention = useCallback((e) => {
        if (!isWeb) setTrigger(e.text, e.indicator)
    }, [setTrigger])
    const onEndMention = useCallback(() => {
        if (!isWeb) clearTrigger()
    }, [clearTrigger])

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
        const next = normalizeEditorHtml(html, { isLimitedHtml })
        commitEditorHtml({
            next,
            field,
            name,
            resetField,
            isInitialRef: isInitialHtmlEmission,
        })
        lastSetValue.current = next
    }, [field, isLimitedHtml, name, onFocus, resetField])

    // ---- image paste (library onPasteImages: blob: on web, file:// on native) ----
    const onPasteImages = useCallback((e) => {
        const imgs = e?.nativeEvent?.images || []
        if (!imgs.length || !form_name) return
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
        // html=3 cannot keep <img> in the body; still upload to the files field.
        emitter.emit(EVENTS.form(form_name), {
            action: 'pasted_images',
            images,
            ...(isLimitedHtml ? { inlinePaste: false } : null),
        })
    }, [form_name, isLimitedHtml])

    // ---- Enter routing (desktop only; mobile Enter inserts newline) ----
    const submitOnEnter = isDesktop && (
        isCommentsEditor
            ? (enableSubmitOnEnter || appSetting('comments', 'submit_comment_on_enter'))
            : enableSubmitOnEnter
    )
    // Comment composers stay in newline mode and route Enter in useEnrichedKeyboard.
    const submitBehavior = submitOnEnter && !isCommentsEditor ? 'submit' : 'newline'

    const onSubmitEditing = useCallback(() => {
        if (isCommentsEditor && submitOnEnter) return
        if (onEnterSubmit) onEnterSubmit()
    }, [isCommentsEditor, submitOnEnter, onEnterSubmit])

    const onKeyPress = useEnrichedKeyboard({
        tipTap,
        isCommentsEditor,
        submitOnEnter,
        handlersRef,
        insertMention,
        onEnterSubmit,
    })

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

    const editorStyle = useMemo(() => ({
        minHeight: initialHeight,
        maxHeight,
        color: editorTextColor,
        fontSize: 16,
        backgroundColor: 'transparent',
    }), [initialHeight, maxHeight, editorTextColor])

    const handleFocus = useCallback(() => {
        if (onFocus) onFocus()
    }, [onFocus])

    // Web: clicks on padding / empty chrome around ProseMirror (toolbar field
    // padding, areas outside the stretched contenteditable) should still focus.
    const onContainerMouseDown = useCallback((e) => {
        if (isDisabled) return
        const target = e?.target
        if (!target?.closest) return
        if (target.closest('.ProseMirror')) return
        if (target.closest('a, button, [role="button"]')) return
        if (dropdownRef.current?.contains?.(target)) return
        e.preventDefault?.()
        callEditor(editorRef, 'focus')
    }, [isDisabled])

    const { items: toolbarItems, linkBar } = useEnrichedToolbar({
        editorRef,
        containerRef,
        tipTap,
        styleState,
        selection,
        enabled: isToolBar,
    })

    const surfaceClass = isToolBar
        ? ' px-3 py-2 bg-input/60 shadow-input-outline dark:shadow-input-outline-deep rounded-xl flex-auto overflow-hidden text-card-foreground '
        : (bg == 'transparent' ? '' : cn(inputSettings.base, inputSettings.size.regular))

    return (
        <View
            ref={containerRef}
            onMouseDown={isWeb ? onContainerMouseDown : undefined}
            className="relative flex-auto web:cursor-text overflow-visible"
        >
            <MentionSuggestionsDropdown
                suggestions={suggestions}
                onSelect={insertMention}
                dropdownRef={dropdownRef}
                className={dropdownPos ? '' : 'bottom-0'}
                style={
                    dropdownPos
                        ? {
                            position: 'absolute',
                            left: 0,
                            alignSelf: 'flex-start',
                            maxHeight: dropdownPos.maxHeight,
                            ...(dropdownPos.top != null
                                ? { top: dropdownPos.top }
                                : { bottom: dropdownPos.bottom }),
                        }
                        : undefined
                }
            />

            <View className={surfaceClass}>
                <EnrichedEditorBoundary>
                    <EnrichedTextInput
                        ref={editorRef}
                        defaultValue={initialDefaultValue}
                        placeholder={placeholder}
                        placeholderTextColor="rgba(120,130,145,1)"
                        editable={!isDisabled}
                        autoFocus={isWeb ? false : !!autofocus}
                        autoCapitalize="none"
                        mentionIndicators={MENTION_INDICATORS}
                        htmlStyle={htmlStyle}
                        submitBehavior={submitBehavior}
                        style={editorStyle}
                        onChangeHtml={onChangeHtml}
                        onChangeState={isToolBar ? onChangeState : undefined}
                        onChangeSelection={isToolBar ? onChangeSelection : undefined}
                        onStartMention={onStartMention}
                        onChangeMention={onChangeMention}
                        onEndMention={onEndMention}
                        onPasteImages={onPasteImages}
                        onSubmitEditing={onSubmitEditing}
                        onKeyPress={onKeyPress}
                        onFocus={handleFocus}
                    />
                </EnrichedEditorBoundary>

                {isToolBar ? (
                    <EditorToolbar items={toolbarItems} linkBar={linkBar} />
                ) : null}
            </View>
        </View>
    )
}
