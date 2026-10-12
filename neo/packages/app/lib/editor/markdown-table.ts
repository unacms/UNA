import { Marked, type Tokens } from 'marked'
import { UNA_URL } from 'app/config'
import { toTableImageSrc } from './inline-video'

/*
 * Tables in the post body. The editors have no table node (web or native), so a
 * table is an atomic image — UNA's table-na.png carrying the table's GFM Markdown
 * (`toTableImageSrc`) — and the post view draws the real table from that Markdown.
 *
 * The Markdown sits encoded in the image URL, out of reach of UNA's HTML purifier,
 * so it is rendered here with no raw HTML (escaped as text), no images (their alt
 * text) and only http(s) / mailto / site-relative links. Render the result with
 * `<Html preprocess={false}>`: entity decoding would turn escaped text back into tags.
 */

/** Placeholder size: table-na.png is 1280x720, inserted media is at most 720px wide. */
const PLACEHOLDER = { width: 720, height: 405 }

export type TableAlign = 'left' | 'center' | 'right' | null

/** A parsed table; cells are inline HTML (bold, links, code). */
export type MarkdownTable = { align: TableAlign[]; header: string[]; rows: string[][] }

const escapeHtml = (text: string) => text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const SAFE_HREF = /^(https?:\/\/|mailto:|\/(?!\/))/i

const tableMarked = new Marked({
    gfm: true,
    async: false,
    renderer: {
        html: ({ text }) => escapeHtml(text),
        image: ({ text }) => escapeHtml(text),
        link({ href, title, tokens }) {
            const text = this.parser.parseInline(tokens)
            if (!SAFE_HREF.test(href.trim())) return text
            return `<a href="${escapeHtml(href.trim())}"${title ? ` title="${escapeHtml(title)}"` : ''}>${text}</a>`
        },
    },
})

const findTable = (markdown: string) =>
    tableMarked.lexer(markdown).find((t) => t.type === 'table') as Tokens.Table | undefined

const inline = (text: string) => tableMarked.parseInline(text) as string

/** The first GFM table of `markdown`, `null` when it has none. */
export function parseMarkdownTable(markdown: string): MarkdownTable | null {
    const token = findTable(markdown)
    if (!token) return null
    return {
        align: token.align,
        header: token.header.map((cell) => inline(cell.text)),
        rows: token.rows.map((row) => row.map((cell) => inline(cell.text))),
    }
}

/** The table as HTML (web post view and the web editor preview). */
export function markdownTableToHtml(markdown: string) {
    const token = findTable(markdown)
    return token ? (tableMarked.parser([token]) as string) : ''
}

/** Body HTML for a table: its placeholder image in a paragraph of its own. */
export function tableImageHtml(markdown: string) {
    const src = toTableImageSrc(`${UNA_URL}/template/images/table-na.png`, markdown.trim())
    return `<p><img src="${escapeHtml(src)}" width="${PLACEHOLDER.width}" height="${PLACEHOLDER.height}" alt=""></p>`
}
