import { marked, type Tokens } from 'marked'
import { UNA_URL } from 'app/config'
import { toTableImageSrc } from './inline-video'

/*
 * Tables in the post body. The editors have no table node (web or native), so a
 * table is an atomic image — UNA's table-na.png carrying the table's GFM Markdown
 * (`toTableImageSrc`) — and the post view draws the real table from that Markdown.
 */

/** Placeholder size: table-na.png is 1280x720, inserted media is at most 720px wide. */
const PLACEHOLDER = { width: 720, height: 405 }

export type TableAlign = 'left' | 'center' | 'right' | null

/** A parsed table; cells are inline HTML (bold, links, code). */
export type MarkdownTable = { align: TableAlign[]; header: string[]; rows: string[][] }

const inline = (text: string) => marked.parseInline(text, { gfm: true, async: false }) as string

/** The first GFM table of `markdown`, `null` when it has none. */
export function parseMarkdownTable(markdown: string): MarkdownTable | null {
    const token = marked.lexer(markdown, { gfm: true }).find((t) => t.type === 'table') as Tokens.Table | undefined
    if (!token) return null
    return {
        align: token.align,
        header: token.header.map((cell) => inline(cell.text)),
        rows: token.rows.map((row) => row.map((cell) => inline(cell.text))),
    }
}

/** The table as HTML (web post view and the web editor preview). */
export function markdownTableToHtml(markdown: string) {
    const token = marked.lexer(markdown, { gfm: true }).find((t) => t.type === 'table')
    return token ? (marked.parser([token] as any, { gfm: true, async: false }) as string) : ''
}

/** Body HTML for a table: its placeholder image in a paragraph of its own. */
export function tableImageHtml(markdown: string) {
    const src = toTableImageSrc(`${UNA_URL}/template/images/table-na.png`, markdown.trim())
    const attr = src.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    return `<p><img src="${attr}" width="${PLACEHOLDER.width}" height="${PLACEHOLDER.height}" alt=""></p>`
}
