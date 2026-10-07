// Props shared by code-block.native.tsx / code-block.web.tsx and the lazy wrappers.

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
