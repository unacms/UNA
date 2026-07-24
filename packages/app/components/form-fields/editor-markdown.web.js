'use client'
import Field, { getValidationRules } from './_field'
import { useController, useFormContext } from 'react-hook-form'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
    MDXEditor,
    UndoRedo,
    BoldItalicUnderlineToggles,
    StrikeThroughSupSubToggles,
    CodeToggle,
    ListsToggle,
    BlockTypeSelect,
    CreateLink,
    Separator,
    headingsPlugin,
    listsPlugin,
    quotePlugin,
    thematicBreakPlugin,
    markdownShortcutPlugin,
    linkPlugin,
    linkDialogPlugin,
    toolbarPlugin,
    tablePlugin,
    codeBlockPlugin,
    codeMirrorPlugin,
    frontmatterPlugin,
    diffSourcePlugin,
    DiffSourceToggleWrapper,
} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'
import { View } from 'app/design/view'
import { appSetting, cn } from 'app/lib/util'
import emitter from 'app/context/emitter'
import Loading from 'app/ui/atoms/loading'

const inputSettings = appSetting('theme', 'inputs')

/**
 * Wiki Markdown form field (web) — @mdxeditor/editor.
 * Native resolves `editor-markdown.js` (EnrichedMarkdownTextInput).
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
        props?.attrs?.readonly == true ||
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
    maxHeight = 400,
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
    const initialMarkdown = useRef(externalValue)
    const lastWrittenRef = useRef(externalValue)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (externalValue === lastWrittenRef.current) return
        lastWrittenRef.current = externalValue
        setValue(name, externalValue)
        if (mounted) {
            editorRef.current?.setMarkdown(externalValue || '')
        }
    }, [externalValue, name, setValue, mounted])

    useEffect(() => {
        if (!mounted) return undefined
        const sub = emitter.addListener('editor', (data) => {
            if (!editorRef.current) return
            if (data.action === 'focus') {
                editorRef.current.focus()
            }
            if (data.action === 'set_content') {
                const next = data.value || ''
                lastWrittenRef.current = next
                editorRef.current.setMarkdown(next)
                field.onChange(next)
            }
        })
        return () => sub.remove()
    }, [field, mounted])

    // readOnly: edit off, scroll/select still work. Hide toolbar when locked.
    const toolbarVisible = showToolbar && !disabled

    const plugins = useMemo(() => {
        const list = [
            headingsPlugin({ allowedHeadingLevels: [1, 2, 3, 4, 5, 6] }),
            listsPlugin(),
            quotePlugin(),
            thematicBreakPlugin(),
            markdownShortcutPlugin(),
            linkPlugin(),
            linkDialogPlugin(),
            tablePlugin(),
            frontmatterPlugin(),
            codeBlockPlugin({ defaultCodeBlockLanguage: '' }),
            codeMirrorPlugin({
                codeBlockLanguages: {
                    '': 'Plain text',
                    js: 'JavaScript',
                    ts: 'TypeScript',
                    jsx: 'JavaScript (React)',
                    tsx: 'TypeScript (React)',
                    css: 'CSS',
                    html: 'HTML',
                    json: 'JSON',
                    md: 'Markdown',
                    bash: 'Bash',
                    php: 'PHP',
                },
            }),
            diffSourcePlugin({ viewMode: 'rich-text' }),
        ]
        if (toolbarVisible) {
            list.push(
                toolbarPlugin({
                    toolbarContents: () => (
                        <DiffSourceToggleWrapper>
                            <UndoRedo />
                            <Separator />
                            <BoldItalicUnderlineToggles />
                            <StrikeThroughSupSubToggles options={['Strikethrough']} />
                            <CodeToggle />
                            <Separator />
                            <ListsToggle />
                            <Separator />
                            <BlockTypeSelect />
                            <Separator />
                            <CreateLink />
                        </DiffSourceToggleWrapper>
                    ),
                }),
            )
        }
        return list
    }, [toolbarVisible])

    // overflow-hidden + maxHeight clips content; in readOnly use overflow-y-auto so it scrolls.
    const surfaceClassName =
        bg === 'transparent'
            ? cn('flex-auto min-w-0', disabled ? 'overflow-y-auto' : 'overflow-hidden')
            : cn(
                'flex-auto min-w-0',
                disabled ? 'overflow-y-auto' : 'overflow-hidden',
                inputSettings.base,
                inputSettings.rounded.default,
            )

    if (!mounted) {
        return (
            <View className={surfaceClassName} style={{ minHeight: initialHeight }}>
                <Loading />
            </View>
        )
    }

    return (
        <View
            className={surfaceClassName}
            style={{ minHeight: initialHeight, maxHeight }}
        >
            <MDXEditor
                ref={editorRef}
                markdown={initialMarkdown.current}
                placeholder={placeholder}
                readOnly={!!disabled}
                autoFocus={!disabled && !!autofocus}
                onChange={(markdown, initialMarkdownNormalize) => {
                    if (disabled) return
                    const next = markdown ?? ''
                    lastWrittenRef.current = next
                    if (initialMarkdownNormalize) return
                    field.onChange(next)
                }}
                onBlur={field.onBlur}
                plugins={plugins}
                contentEditableClassName="prose prose-sm dark:prose-invert max-w-none min-h-[7rem] px-1 py-1 text-card-foreground outline-none"
                className="mdxeditor-wiki w-full bg-transparent text-card-foreground"
            />
        </View>
    )
}
