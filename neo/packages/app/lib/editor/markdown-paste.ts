'use client'
import { useEffect } from 'react'
import { marked, type Token, type Links } from 'marked'
import { tableImageHtml } from './markdown-table'

/*
 * Markdown paste for the enriched editor (web). Plain text that reads as Markdown
 * (`## Title`, lists, quotes, `**bold**`, links, fenced code, GFM tables) is
 * converted to HTML (tables as table blocks) and pasted through ProseMirror's own
 * pipeline, so the library's paste normalizer and mention handling still apply.
 */

// Block syntax at the start of a line.
const MD_BLOCK = /^(#{1,6}\s+\S|>\s?\S|[-*+]\s+\S|\d+[.)]\s+\S|```|~~~|\|.*\|\s*$)/m
// Inline syntax: **bold**, __bold__, [text](http…), `code`.
const MD_INLINE = /(\*\*[^*\n]+\*\*|__[^_\n]+__|\[[^\]\n]+\]\(https?:\/\/[^)\s]+\)|`[^`\n]+`)/
// Clipboard HTML that already carries structure (a web page, Docs, Word): keep it.
const SEMANTIC_HTML = /<(h[1-6]|ul|ol|li|table|blockquote|pre|strong|b|em|i|a)\b/i

export function looksLikeMarkdown(text: string) {
    return MD_BLOCK.test(text) || MD_INLINE.test(text)
}

/**
 * Rows of a table copied from a rendered page often arrive separated by blank
 * lines, which ends a GFM table after its first row. Join consecutive `|…|` rows.
 */
function joinTableRows(text: string) {
    return text.replace(/^(\|.*\|)[ \t]*\n(?:[ \t]*\n)+(?=\|)/gm, '$1\n')
}

/**
 * A table block keeps only its own Markdown, so reference links (`[Docs][docs]`,
 * `[docs][]`, `[docs]`) defined elsewhere in the paste become inline links.
 * Code spans are kept as they are.
 */
function inlineReferenceLinks(raw: string, links: Links) {
    return raw.replace(/(`+)[^`]*?\1|\[([^\]\n]+)\]\[([^\]\n]*)\]|\[([^\]\n]+)\](?![([:])/g, (match, code, text, label, short) => {
        if (code) return match
        const key = String(label || text || short).toLowerCase().replace(/\s+/g, ' ').trim()
        const def = links[key]
        if (!def?.href) return match
        // A raw `|` would split the table cell, `>` would end the <…> destination.
        const href = def.href.replace(/\|/g, '%7C').replace(/>/g, '%3E')
        const title = def.title ? ` "${def.title.replace(/["|]/g, '')}"` : ''
        return `[${text ?? short}](<${href}>${title})`
    })
}

/**
 * Markdown → body HTML. Tables become table blocks (an atomic image the post view
 * draws as the table, see markdown-table.ts); everything else is plain HTML.
 */
export function markdownToHtml(text: string) {
    const tokens = marked.lexer(joinTableRows(text.replace(/\r\n?/g, '\n')), { gfm: true })
    const parse = (list: Token[]) => marked.parser(Object.assign(list, { links: tokens.links }), { gfm: true, breaks: false, async: false }) as string
    let html = ''
    let run: Token[] = []
    for (const token of tokens) {
        if (token.type !== 'table') {
            run.push(token)
            continue
        }
        if (run.length) html += parse(run)
        run = []
        html += tableImageHtml(inlineReferenceLinks(token.raw, tokens.links))
    }
    if (run.length) html += parse(run)
    return html
}

/** Web: paste Markdown text into the TipTap editor as formatted content. */
export function useMarkdownPaste(tipTap: any, enabled = true) {
    useEffect(() => {
        const view = tipTap?.view
        const dom: HTMLElement | undefined = view?.dom
        if (!enabled || !dom || typeof view.pasteHTML !== 'function') return undefined

        const onPaste = (event: ClipboardEvent) => {
            const data = event.clipboardData
            if (!data || Array.from(data.files || []).length) return
            const text = data.getData('text/plain')
            if (!text || !looksLikeMarkdown(text)) return
            if (SEMANTIC_HTML.test(data.getData('text/html') || '')) return
            event.preventDefault()
            event.stopPropagation()
            // No event: ProseMirror builds an empty one, so this listener doesn't re-enter.
            view.pasteHTML(markdownToHtml(text))
        }

        // Capture: runs before ProseMirror's own paste handler on the same element.
        dom.addEventListener('paste', onPaste, true)
        return () => dom.removeEventListener('paste', onPaste, true)
    }, [tipTap, enabled])
}
