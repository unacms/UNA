'use client'
// Web renderer for the `Html` atom.
//
// On web we let the browser render UNA HTML directly via `dangerouslySetInnerHTML`
// instead of re-implementing an HTML parser in JS (that path lives in html.js for
// native, where innerHTML isn't available). Typography/link/mention styling comes
// from the `.u-vanilla-html` CSS in design/styles. Links are handled with a single
// delegated click handler so internal routes use the SPA router while external
// links, mailto/tel and `target="_blank"` fall through to native browser behavior.
import { useCallback, useMemo } from 'react'
import { useRouter } from 'app/lib/hooks/router'
import { sanitazeUrl, isExternalUrl } from 'app/lib/util'
import { normalizeLinkHref } from 'app/components/form-fields/editor-mention-html'
import emitter from 'app/context/emitter'
import { preprocessHtml, sanitizeHtml, flattenNestedAnchors } from 'app/lib/html-helper'

export default function ElementHtml({ customClassName, data, className = '', innerRef }) {
    const router = useRouter()

    const html = useMemo(() => {
        if (!data) return ''
        return sanitizeHtml(flattenNestedAnchors(preprocessHtml(data)))
    }, [data])

    const handleClick = useCallback((event) => {
        const anchor = event.target?.closest?.('a')
        if (!anchor) return

        const rawHref = anchor.getAttribute('href')
        if (!rawHref) return

        emitter.emit('link', { action: 'pressed' })

        // Let the browser handle mail/phone, new-tab, and external links.
        if (/^(mailto:|tel:|#)/i.test(rawHref)) return
        if (anchor.target === '_blank') return

        const href = normalizeLinkHref(rawHref)
        if (isExternalUrl(href)) return

        // Internal link → SPA navigation.
        const url = sanitazeUrl(href)
        if (!url) return
        event.preventDefault()
        router.push(url)
    }, [router])

    if (!data) return null

    const composedClassName = `max-w-full ${customClassName || 'u-vanilla-html'} ${className}`.trim()

    return (
        <div
            ref={innerRef}
            className={composedClassName}
            onClick={handleClick}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    )
}
