'use client'

import { lazy, Suspense } from 'react'
import { resolveLanguage } from 'app/lib/syntax-highlighter/languages'
import type { CodeBlockProps } from './code-block.types'

const CodeBlock = lazy(() => import('./code-block'))

function CodeBlockFallback({ code, language }: CodeBlockProps) {
    return (
        <pre
            aria-label={language ? `${language} code block` : 'Code block'}
            className="not-prose my-3 max-w-full overflow-x-auto rounded-lg border border-border bg-muted/50 p-3 font-mono text-sm leading-5 text-foreground"
            data-language={language || undefined}
            tabIndex={0}
        >
            <code style={{ whiteSpace: 'pre' }}>{code}</code>
        </pre>
    )
}

export default function LazyCodeBlock(props: CodeBlockProps) {
    const language = resolveLanguage(props.language, props.code)
    if (!language) {
        return <CodeBlockFallback {...props} />
    }

    return (
        <Suspense fallback={<CodeBlockFallback {...props} />}>
            <CodeBlock {...props} language={language} />
        </Suspense>
    )
}
