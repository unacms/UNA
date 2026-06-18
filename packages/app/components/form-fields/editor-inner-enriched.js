'use client'
import { useController, useFormContext } from 'react-hook-form'
import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Platform } from 'react-native'
import { EnrichedTextInput } from 'react-native-enriched-html'
import { View, ScrollView } from 'app/design/view'
import { Button } from 'app/design/controls'
import { useFilesData } from 'app/context/files'
import { useThemeName } from 'app/design/theme'
import { getAlert, stripTagsWithLinks, appSetting, cn } from 'app/lib/util'
import { fetcher } from 'app/lib/fetcher'
import emitter from 'app/context/emitter'
import { mentionsToUnaLinks, unaLinksToMentions } from './editor-mention-html'

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
    const isToolBar = html == 2 || html == 1
    const isPlainText = html == 3
    const isCommentsEditor = container_class === 'comments'

    const { field } = useController({ name, rules: {}, defaultValue: value })
    const formContext = useFormContext()
    const { filesData, setFilesData } = useFilesData()
    const themeName = useThemeName() || 'light'

    // Веб-реализация enriched-html построена на Tiptap, который падает при SSR
    // (immediatelyRender нельзя пробросить через публичный API). На вебе ждём
    // монтирования на клиенте; на нативе рендерим сразу.
    const [mounted, setMounted] = useState(Platform.OS !== 'web')
    useEffect(() => { setMounted(true) }, [])

    const [styleState, setStyleState] = useState(null)
    const [suggestions, setSuggestions] = useState([])
    // [text, indicator]
    const [mention, setMention] = useState(['', ''])

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
                data.timeout
                    ? setTimeout(() => editorRef.current?.blur(), data.timeout)
                    : editorRef.current.blur()
            }
            if (data.action === 'focus') editorRef.current.focus()
            if (data.action === 'set_content') {
                lastSetValue.current = data.value
                editorRef.current.setValue(unaLinksToMentions(data.value || ''))
            }
        })
        return () => sub.remove()
    }, [])

    // ---- mention suggestions fetch ----
    useEffect(() => {
        if (mention[1] === '') {
            setSuggestions([])
            return
        }
        const run = async () => {
            const symbol = mention[1] === '#' ? '%23' : '%40'
            const result = await fetcher(`${mentionUrl}&symbol=${symbol}&term=${mention[0]}`)
            const list = (result || [])
                .map((k, index) => ({ ...k, index, ...(index === 0 && { selected: true }) }))
                .slice(0, 4)
            setSuggestions(list)
        }
        run()
    }, [mention])

    const insertMention = useCallback((user) => {
        const indicator = mention[1] || '@'
        editorRef.current?.setMention(indicator, user.label.trim(), {
            'data-profile-id': String(user.value),
            href: user.url,
            class: `bx-mention-link ${user.classname || ''}`.trim(),
        })
        setSuggestions([])
        setMention(['', ''])
    }, [mention])

    // ---- HTML -> react-hook-form ----
    const onChangeHtml = useCallback((e) => {
        const raw = e?.nativeEvent?.value ?? ''
        const value = mentionsToUnaLinks(raw)
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
        const key = e?.nativeEvent?.key
        if (!suggestions.length) return
        if (key === 'ArrowDown') moveSelected('down')
        else if (key === 'ArrowUp') moveSelected('up')
        else if (key === 'Enter') {
            const sel = suggestions.find((x) => x.selected) || suggestions[0]
            if (sel) insertMention(sel)
        }
    }, [suggestions, insertMention])

    // ---- стили (htmlStyle) из темы ----
    const htmlStyle = useMemo(() => {
        const color = themeName === 'dark' ? mentionColors.dark : mentionColors.light
        return {
            a: { color },
            mention: { color, backgroundColor: 'transparent', textDecorationLine: 'none' },
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

    return (
        <View
            className={`flex-auto ${isToolBar
                ? ' px-3 py-2 bg-input/60 shadow-input-outline dark:shadow-input-outline-deep rounded-lg flex-auto overflow-hidden text-card-foreground '
                : (bg == 'transparent' ? '' : cn(inputSettings.base, inputSettings.rounded.default, inputSettings.size.default))
                }`}
        >
            {suggestions.length > 0 && (
                <View
                    className="absolute max-h-[130px] w-full max-w-md bottom-0 left-0 p-1 z-50 rounded-xl border-border border bg-card"
                >
                    <ScrollView keyboardShouldPersistTaps="always">
                        {suggestions.map((user) => (
                            <Button
                                key={user.url}
                                variant="text"
                                pressed={user.selected}
                                fullWidth
                                align="left"
                                size="xs"
                                title={user.label}
                                onPress={() => insertMention(user)}
                            />
                        ))}
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
                    fontSize: isCommentsEditor ? 14 : 16,
                    backgroundColor: 'transparent',
                }}
                onChangeHtml={onChangeHtml}
                onChangeState={(e) => setStyleState(e.nativeEvent)}
                onStartMention={(indicator) => setMention(['', indicator])}
                onChangeMention={(e) => setMention([e.text, e.indicator])}
                onEndMention={() => { setMention(['', '']); setSuggestions([]) }}
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
