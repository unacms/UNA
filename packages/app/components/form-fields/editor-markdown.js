'use client'
import Field, { getValidationRules } from './_field'
import { useController, useFormContext } from 'react-hook-form'
import { useEffect, useMemo, useRef, useState } from 'react'
import { EnrichedMarkdownTextInput } from 'react-native-enriched-markdown'
import { Button } from 'app/design/controls'
import { View } from 'app/design/view'
import { useTheme, useThemeName } from 'app/design/theme'
import { useCSSVariable } from 'uniwind'
import { appSetting, cn } from 'app/lib/util'
import emitter from 'app/context/emitter'

const inputSettings = appSetting('theme', 'inputs')

/**
 * Wiki Markdown form field (native) — EnrichedMarkdownTextInput.
 * Web resolves `editor-markdown.web.js` (@mdxeditor/editor).
 */
export default function FormFieldMarkdownEditor(props) {
    const formContext = useFormContext()
    const placeholder = props.use_caption_as_placeholder
        ? props.caption
        : props.placeholder
    const isCommentsForm = props.container_class === 'comments'
    const initialHeight = props.height || (isCommentsForm ? 48 : 120)
    const rules = useMemo(() => getValidationRules(props), [
        props.checker,
        props.required,
        props.name,
    ])
    const disabled =
        props?.attrs?.readonly == 'readonly' ||
        props?.attrs?.disabled == 'disabled' ||
        !!props.disabled

    return (
        <Field {...props} error2={formContext.formState.errors[props.name]}>
            <MarkdownTextInput
                name={props.name}
                value={props.value}
                bg={props.bg}
                disabled={disabled}
                autofocus={props.autofocus}
                onFocus={props.onFocus}
                placeholder={placeholder}
                initialHeight={initialHeight}
                maxHeight={props.maxHeight || 400}
                showToolbar={props.showToolbar !== false}
                rules={rules}
            />
        </Field>
    )
}

export function MarkdownTextInput({
    name,
    value: valueProp,
    initialHeight = 120,
    maxHeight = 300,
    onFocus,
    bg,
    placeholder,
    autofocus,
    disabled,
    showToolbar = true,
    rules = {},
}) {
    const externalValue = valueProp ?? ''
    const { field } = useController({
        name,
        rules,
        defaultValue: externalValue,
    })
    const { setValue } = useFormContext()
    const editorRef = useRef(null)
    const { colors } = useTheme()
    const themeName = useThemeName() || 'light'
    const [styleState, setStyleState] = useState(null)
    const [foregroundToken] = useCSSVariable(['--color-card-foreground'])

    const initialDefaultValue = useRef(externalValue)
    const lastWrittenRef = useRef(externalValue)

    useEffect(() => {
        if (externalValue === lastWrittenRef.current) return
        lastWrittenRef.current = externalValue
        setValue(name, externalValue)
        editorRef.current?.setValue?.(externalValue)
    }, [externalValue, name, setValue])

    useEffect(() => {
        const sub = emitter.addListener('editor', (data) => {
            if (!editorRef.current) return
            if (data.action === 'focus') {
                editorRef.current.focus()
            }
            if (data.action === 'set_content') {
                const next = data.value || ''
                lastWrittenRef.current = next
                editorRef.current.setValue(next)
                field.onChange(next)
            }
        })
        return () => sub.remove()
    }, [field])

    const onMarkdownChange = (markdown) => {
        const next = markdown ?? ''
        lastWrittenRef.current = next
        field.onChange(next)
    }

    const surfaceClassName =
        bg === 'transparent'
            ? 'flex-auto overflow-hidden'
            : cn(
                'flex-auto overflow-hidden',
                inputSettings.base,
                inputSettings.rounded.default,
                inputSettings.size.regular,
            )

    const editorTextColor = foregroundToken || colors.default
    const linkColor = themeName === 'dark'
        ? 'rgba(59, 130, 246, 1)'
        : 'rgba(37, 99, 235, 1)'

    const markdownStyle = useMemo(
        () => ({
            strong: { color: editorTextColor },
            em: { color: editorTextColor },
            link: { color: linkColor, underline: true },
        }),
        [editorTextColor, linkColor],
    )

    return (
        <View className={surfaceClassName}>
            <EnrichedMarkdownTextInput
                ref={editorRef}
                defaultValue={initialDefaultValue.current}
                placeholder={placeholder}
                placeholderTextColor="rgba(120,130,145,1)"
                editable={!disabled}
                autoFocus={!!autofocus}
                multiline
                scrollEnabled
                markdownStyle={markdownStyle}
                style={{
                    minHeight: initialHeight,
                    maxHeight,
                    color: editorTextColor,
                    fontSize: 16,
                    backgroundColor: 'transparent',
                }}
                onChangeMarkdown={onMarkdownChange}
                onChangeState={setStyleState}
                onFocus={() => {
                    if (onFocus) onFocus()
                }}
                onBlur={field.onBlur}
            />

            {showToolbar && !disabled && styleState ? (
                <View className="mt-2 flex-row flex-wrap gap-1">
                    <ToolbarButton
                        label="B"
                        active={styleState.bold?.isActive}
                        onPress={() => editorRef.current?.toggleBold()}
                    />
                    <ToolbarButton
                        label="I"
                        active={styleState.italic?.isActive}
                        onPress={() => editorRef.current?.toggleItalic()}
                    />
                    <ToolbarButton
                        label="U"
                        active={styleState.underline?.isActive}
                        onPress={() => editorRef.current?.toggleUnderline()}
                    />
                    <ToolbarButton
                        label="S"
                        active={styleState.strikethrough?.isActive}
                        onPress={() => editorRef.current?.toggleStrikethrough()}
                    />
                    <ToolbarButton
                        label="Link"
                        active={styleState.link?.isActive}
                        onPress={() => {
                            if (styleState.link?.isActive) {
                                editorRef.current?.removeLink()
                                return
                            }
                            editorRef.current?.insertLink('link', 'https://')
                        }}
                    />
                </View>
            ) : null}
        </View>
    )
}

function ToolbarButton({ label, active, onPress }) {
    return (
        <Button
            variant="text"
            size="xs"
            pressed={!!active}
            title={label}
            onPress={onPress}
        />
    )
}
