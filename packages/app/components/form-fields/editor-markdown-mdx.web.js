'use client'
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
 * Wiki Markdown editor for web — @mdxeditor/editor.
 * Form value stays Markdown end-to-end (`markdown` / `onChange` / `setMarkdown`).
 */
export default function MdxMarkdownEditor({
    field,
    externalValue,
    lastWrittenRef,
    initialHeight = 120,
    maxHeight = 400,
    placeholder,
    autofocus,
    disabled,
    bg,
    showToolbar = true,
}) {
    const editorRef = useRef(null)
    const initialMarkdown = useRef(externalValue || '')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // External/server value → editor (do not bind `markdown` to live RHF value).
    useEffect(() => {
        if (!mounted) return
        if (externalValue === lastWrittenRef.current) return
        lastWrittenRef.current = externalValue
        editorRef.current?.setMarkdown(externalValue || '')
    }, [externalValue, lastWrittenRef, mounted])

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
    }, [field, lastWrittenRef, mounted])

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
        if (showToolbar) {
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
    }, [showToolbar])

    const surfaceClassName =
        bg === 'transparent'
            ? 'flex-auto overflow-hidden min-w-0'
            : cn(
                'flex-auto overflow-hidden min-w-0',
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
                autoFocus={!!autofocus}
                onChange={(markdown, initialMarkdownNormalize) => {
                    const next = markdown ?? ''
                    lastWrittenRef.current = next
                    // Parser normalize on mount — don't mark the form dirty.
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
