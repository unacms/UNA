import { useMemo } from 'react'
import { ScrollView, View, Row } from 'app/design/view'
import Html from 'app/ui/atoms/html'
import { parseMarkdownTable, type TableAlign } from 'app/lib/editor/markdown-table'
import type { InlineTableProps } from './inline-table.types'

/** Fixed column width: native has no auto table layout, wide tables scroll sideways. */
const COLUMN_WIDTH = 160

const cellHtml = (html: string, align: TableAlign, header: boolean) => {
    const body = header ? `<b>${html}</b>` : html
    return align && align !== 'left' ? `<p style="text-align: ${align}">${body}</p>` : `<p>${body}</p>`
}

/** Table block of a post body (native): a grid of cells, each rendered as HTML. */
export default function InlineTable({ markdown }: InlineTableProps) {
    const table = useMemo(() => parseMarkdownTable(markdown), [markdown])
    if (!table) return null

    const row = (cells: string[], key: string, header: boolean) => (
        <Row key={key} className={header ? 'border-b-2 border-border bg-muted/50' : 'border-b border-border'}>
            {cells.map((cell, i) => (
                <View key={i} className="px-3 py-2" style={{ width: COLUMN_WIDTH }}>
                    <Html data={cellHtml(cell, table.align[i] ?? null, header)} customClassName="u-vanilla-html-small" preprocess={false} />
                </View>
            ))}
        </Row>
    )

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="my-4 -mx-1" contentContainerClassName="px-1">
            <View>
                {row(table.header, 'h', true)}
                {table.rows.map((cells, i) => row(cells, `r${i}`, false))}
            </View>
        </ScrollView>
    )
}
