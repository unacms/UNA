'use client'

import { useThemeValue } from 'app/design/theme'
import { useHighlightedCode } from 'app/lib/syntax-highlighter/use-highlighted-code'
import type { CodeBlockProps, HighlightToken } from './code-block.types'

function tokenStyle(token: HighlightToken) {
    const flags = token.fontStyle ?? 0
    const decoration: string[] = []
    if (flags & 4) decoration.push('underline')
    if (flags & 8) decoration.push('line-through')

    return {
        color: token.color,
        fontStyle: flags & 1 ? 'italic' : undefined,
        fontWeight: flags & 2 ? 700 : undefined,
        textDecoration: decoration.length ? decoration.join(' ') : undefined,
    }
}

export default function CodeBlock({ code, language }: CodeBlockProps) {
    const themeName = useThemeValue('light', 'dark')
    const tokens = useHighlightedCode(code, language, themeName) as HighlightToken[][] | null

    return (
        <pre
            aria-label={language ? `${language} code block` : 'Code block'}
            className="not-prose my-3 max-w-full overflow-x-auto rounded-lg border border-border bg-muted/50 p-3 font-mono text-sm leading-5 text-foreground"
            data-language={language || undefined}
            tabIndex={0}
        >
            <code style={{ whiteSpace: 'pre' }}>
                {tokens
                    ? tokens.map((line, lineIndex) => (
                        <span key={`line-${lineIndex}`}>
                            {line.map((token, tokenIndex) => (
                                <span
                                    key={`token-${lineIndex}-${tokenIndex}`}
                                    style={tokenStyle(token)}
                                >
                                    {token.content}
                                </span>
                            ))}
                            {lineIndex < tokens.length - 1 ? '\n' : ''}
                        </span>
                    ))
                    : code}
            </code>
        </pre>
    )
}
