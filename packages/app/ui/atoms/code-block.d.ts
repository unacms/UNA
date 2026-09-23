// Shared contract for code-block.native.tsx / code-block.web.tsx (there is no
// base file, so TypeScript resolves `./code-block` to this declaration).

export type CodeBlockProps = {
    code: string
    language?: string | null
}

/** One shiki token; `fontStyle` is a bitmask: 1 italic, 2 bold, 4 underline, 8 strikethrough. */
export type HighlightToken = {
    content: string
    color?: string
    fontStyle?: number
}

export default function CodeBlock(props: CodeBlockProps): React.JSX.Element
