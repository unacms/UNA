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
    CodeMirrorEditor,
    frontmatterPlugin,
    diffSourcePlugin,
    DiffSourceToggleWrapper,
    realmPlugin,
    addImportVisitor$,
} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'
// After MDXEditor styles — overrides --basePageBg: white and toolbar chrome.
import './editor-markdown.web.css'
import { EditorView } from '@codemirror/view'
import {
    $createParagraphNode,
    $createTextNode,
    $isRootNode,
} from 'lexical'
import { useThemeName } from 'app/design/theme'
import { appSetting, cn } from 'app/lib/util'
import emitter from 'app/context/emitter'
import Loading from 'app/ui/atoms/loading'

const inputSettings = appSetting('theme', 'inputs')

/**
 * With suppressHtmlProcessing, remark still emits raw `{ type: 'html' }` nodes
 * (e.g. `<br/>`, `</div>`) but MdastHTMLVisitor is not registered — import fails
 * with `{"type":"html","name":"N/A"}`. Keep HTML as literal text instead.
 */
const htmlAsTextPlugin = realmPlugin({
    init(realm) {
        realm.pub(addImportVisitor$, {
            testNode: (node) => node?.type === 'html',
            visitNode({ mdastNode, lexicalParent, actions }) {
                const value = mdastNode?.value ?? ''
                if (!value) return

                const textNode = $createTextNode(value)
                textNode.setFormat(actions.getParentFormatting())
                const style = actions.getParentStyle()
                if (style) textNode.setStyle(style)

                if ($isRootNode(lexicalParent)) {
                    const paragraph = $createParagraphNode()
                    paragraph.append(textNode)
                    lexicalParent.append(paragraph)
                    return
                }

                actions.addAndStepInto(textNode)
            },
            priority: -50,
        })
    },
})

/** CM6 theme — MDXEditor source/code blocks hardcode basicLight; earlier extensions win. */
const neoCmDarkTheme = EditorView.theme(
    {
        '&': {
            backgroundColor: 'transparent',
            color: 'inherit',
        },
        '.cm-content': {
            caretColor: 'currentColor',
        },
        '&.cm-focused .cm-cursor': {
            borderLeftColor: 'currentColor',
        },
        '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
            backgroundColor: 'rgb(var(--primary) / 0.35)',
        },
        '.cm-gutters': {
            backgroundColor: 'transparent',
            color: 'rgb(var(--muted-foreground))',
            border: 'none',
        },
        '.cm-activeLineGutter, .cm-activeLine': {
            backgroundColor: 'rgb(var(--muted) / 0.25)',
        },
    },
    { dark: true },
)

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
    const themeName = useThemeName()
    const isDark = themeName === 'dark'

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
        const cmExtensions = isDark ? [neoCmDarkTheme] : []
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
            htmlAsTextPlugin(),
            codeBlockPlugin({
                defaultCodeBlockLanguage: '',
                // Catch-all so unknown fence languages don't fail import.
                codeBlockEditorDescriptors: [
                    {
                        priority: -10,
                        match: () => true,
                        Editor: CodeMirrorEditor,
                    },
                ],
            }),
            codeMirrorPlugin({
                codeMirrorExtensions: cmExtensions,
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
            diffSourcePlugin({
                viewMode: 'rich-text',
                codeMirrorExtensions: cmExtensions,
            }),
        ]
        if (toolbarVisible) {
            list.push(
                toolbarPlugin({
                    toolbarClassName: 'mdxeditor-wiki-toolbar',
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
    }, [toolbarVisible, isDark])

    // Outer shell clips rounded corners + inset outline; inner pane scrolls.
    // (overflow:auto on the same node as rounded-xl + shadow-input-outline
    // makes sticky toolbar corners look crooked.)
    const shellClassName =
        bg === 'transparent'
            ? 'min-w-0 w-full overflow-hidden'
            : cn(
                'min-w-0 w-full overflow-hidden',
                inputSettings.base,
                inputSettings.rounded.default,
            )

    const scrollStyle = {
        minHeight: initialHeight,
        maxHeight,
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
    }

    if (!mounted) {
        return (
            <div className={shellClassName}>
                <div
                    className="flex w-full items-center justify-center"
                    style={scrollStyle}
                >
                    <Loading />
                </div>
            </div>
        )
    }

    return (
        <div className={shellClassName}>
            <div className="w-full" style={scrollStyle}>
                <MDXEditor
                    ref={editorRef}
                    markdown={initialMarkdown.current}
                    placeholder={placeholder}
                    readOnly={!!disabled}
                    autoFocus={!disabled && !!autofocus}
                    // Wiki markdown is not MDX — HTML/`<br/>`/`</tag>`/`<https://…>` must not
                    // go through mdast-util-mdx-jsx or rich-text parse fails (see emails-notifications).
                    suppressHtmlProcessing
                    onChange={(markdown, initialMarkdownNormalize) => {
                        if (disabled) return
                        const next = markdown ?? ''
                        lastWrittenRef.current = next
                        if (initialMarkdownNormalize) return
                        field.onChange(next)
                    }}
                    onBlur={field.onBlur}
                    plugins={plugins}
                    contentEditableClassName="prose prose-sm dark:prose-invert max-w-none min-h-[7rem] px-3 py-2 outline-none"
                    className={cn(
                        'mdxeditor mdxeditor-wiki w-full text-card-foreground',
                        isDark && 'dark-theme',
                    )}
                />
            </div>
        </div>
    )
}
