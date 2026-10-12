'use client'
import { useMemo } from 'react'
import Html from 'app/ui/atoms/html'
import { markdownTableToHtml } from 'app/lib/editor/markdown-table'
import type { InlineTableProps } from './inline-table.types'

/** Table block of a post body: a real <table>, styled by `.u-vanilla-html table`; wide tables scroll. */
export default function InlineTable({ markdown }: InlineTableProps) {
    const html = useMemo(() => markdownTableToHtml(markdown), [markdown])
    if (!html) return null
    return (
        <div className="my-4 max-w-full overflow-x-auto">
            <Html data={html} />
        </div>
    )
}
