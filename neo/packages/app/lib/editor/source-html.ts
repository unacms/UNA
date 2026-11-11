// HTML typed or pasted into the editor's HTML source view, turned into what the editor
// can hold. No imports, so `node --test packages/app/lib/editor/source-html.test.ts` runs it.
//
// The editor has a code block of paragraphs (`<codeblock><p>…</p></codeblock>`) and no
// table node: tables are placeholder images that carry GFM Markdown (markdown-table.ts).
// Without this, loading the source back into the editor joins a <pre>'s lines into one
// paragraph and flattens a table into run-on text.

const PRE_RE = /<pre\b[^>]*>([\s\S]*?)<\/pre\s*>/gi
const TABLE_RE = /<table\b[^>]*>[\s\S]*?<\/table\s*>/gi
const ROW_RE = /<tr\b[^>]*>([\s\S]*?)<\/tr\s*>/gi
const CELL_RE = /<(t[hd])\b([^>]*)>([\s\S]*?)<\/t[hd]\s*>/gi

// One tag. `[^<>]` can't run past the next tag, so splitting on it never backtracks.
const TAG_RE = /(<[^<>]*>)/
const tagName = (tag: string) => /^<\/?([a-zA-Z][a-zA-Z0-9]*)/.exec(tag)?.[1]?.toLowerCase() ?? ''
const isClose = (tag: string) => tag.startsWith('</')

/** Text of an HTML fragment: tags dropped (`<br>` is a newline), entities kept. */
function fragmentText(html: string) {
    return html.split(TAG_RE).map((part) => {
        if (!part.startsWith('<')) return part
        return tagName(part) === 'br' ? '\n' : ''
    }).join('')
}

/** `<pre>` (with or without `<code>`) as a code block, one paragraph per line. */
export function preToCodeBlock(html: string) {
    return html.replace(PRE_RE, (_, inner: string) => {
        const lines = fragmentText(inner).replaceAll('\r\n', '\n').replaceAll('\r', '\n').split('\n')
        // The newline right after <pre> and the one before </pre> aren't content.
        if (lines.length > 1 && lines[0] === '') lines.shift()
        if (lines.length > 1 && lines.at(-1) === '') lines.pop()
        // A blank line is a no-break space: UNA drops empty paragraphs (and <p><br></p>) from post HTML.
        return `<codeblock>${lines.map((line) => `<p>${line === '' ? '&nbsp;' : line}</p>`).join('')}</codeblock>`
    })
}

/** Plain text in a Markdown table cell: characters Markdown would read as syntax are escaped. */
const escapeMarkdown = (text: string) => text.replace(/[\\`*_[\]|<>~]/g, String.raw`\$&`)

/** Code text from HTML: Markdown shows entities in a code span as written, so decode the basic ones. */
const decodeCodeEntities = (html: string) => html
    .replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&amp;', '&')

/** A code span that holds `html`'s text as it is: a backtick fence longer than any run inside. */
function codeSpan(html: string) {
    const text = decodeCodeEntities(html)
    const longest = Math.max(0, ...(text.match(/`+/g) ?? []).map((run) => run.length))
    const fence = '`'.repeat(longest + 1)
    const pad = text.startsWith('`') || text.endsWith('`') ? ' ' : ''
    // Pipes end a table cell even inside a code span, so they stay escaped there too.
    return `${fence}${pad}${text.replaceAll('|', String.raw`\|`)}${pad}${fence}`
}

const INLINE_MARK: Record<string, string> = { strong: '**', b: '**', em: '*', i: '*' }

/** Inline HTML of a table cell as GFM Markdown: bold, italic, code and links kept, other tags dropped. */
function cellMarkdown(html: string) {
    let out = ''
    let code: string | null = null
    const links: string[] = []
    for (const part of html.split(TAG_RE)) {
        if (!part.startsWith('<')) {
            if (code === null) out += escapeMarkdown(part)
            else code += part
            continue
        }
        const name = tagName(part)
        if (name === 'code') {
            if (isClose(part) && code !== null) { out += codeSpan(code); code = null }
            else if (!isClose(part)) code = ''
        } else if (code !== null) {
            continue
        } else if (name === 'br') {
            out += ' '
        } else if (INLINE_MARK[name]) {
            out += INLINE_MARK[name]
        } else if (name === 'a' && isClose(part)) {
            const href = links.pop()
            out += href === undefined ? '' : `](${href})`
        } else if (name === 'a') {
            const href = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(part)
            const url = (href?.[1] ?? href?.[2] ?? '').replace(/[()\s]/g, encodeURIComponent)
            if (url) { links.push(url); out += '[' }
        }
    }
    if (code !== null) out += codeSpan(code)
    return out.replace(/\s+/g, ' ').trim()
}

const cellAlign = (attrs: string) => {
    const align = /text-align\s*:\s*(left|center|right)/i.exec(attrs)?.[1] ?? /\balign\s*=\s*["']?(left|center|right)/i.exec(attrs)?.[1]
    return align?.toLowerCase() as 'left' | 'center' | 'right' | undefined
}

const ALIGN_RULE: Record<string, string> = { center: ':---:', right: '---:', left: ':---' }

/** An HTML table as GFM Markdown; the first row is the header. `null` for a table without rows. */
export function htmlTableToMarkdown(table: string): string | null {
    const rows: { cells: string[]; aligns: (string | undefined)[] }[] = []
    for (const row of table.matchAll(ROW_RE)) {
        const cells: string[] = []
        const aligns: (string | undefined)[] = []
        for (const cell of (row[1] ?? '').matchAll(CELL_RE)) {
            cells.push(cellMarkdown(cell[3] ?? ''))
            aligns.push(cellAlign(cell[2] ?? ''))
        }
        if (cells.length) rows.push({ cells, aligns })
    }
    const [head, ...body] = rows
    if (!head) return null
    const width = Math.max(...rows.map((r) => r.cells.length))
    const pad = (cells: string[]) => [...cells, ...new Array<string>(width - cells.length).fill('')]
    const line = (cells: string[]) => `| ${pad(cells).join(' | ')} |`
    const rule = pad(head.aligns.map((a) => a ?? '')).map((a) => ALIGN_RULE[a] ?? '---')
    return [line(head.cells), `| ${rule.join(' | ')} |`, ...body.map((r) => line(r.cells))].join('\n')
}

/**
 * Source-view HTML ready for the editor: code blocks keep their lines, and each table
 * becomes `tableHtml(markdown)` (the placeholder image, `tableImageHtml`).
 */
export function sourceToEditorHtml(html: string, tableHtml: (markdown: string) => string) {
    if (!html || typeof html !== 'string') return html || ''
    return preToCodeBlock(html).replace(TABLE_RE, (table) => {
        const markdown = htmlTableToMarkdown(table)
        return markdown ? tableHtml(markdown) : ''
    })
}
