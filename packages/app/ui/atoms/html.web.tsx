'use client'
// Web renderer for the `Html` atom.
//
// On web we let the browser render UNA HTML directly via `dangerouslySetInnerHTML`
// instead of re-implementing an HTML parser in JS (that path lives in html.tsx for
// native, where innerHTML isn't available). Typography/link/mention styling comes
// from the `.u-vanilla-html` CSS in design/styles. Links are handled with a single
// delegated click handler so internal routes use the SPA router while external
// links, mailto/tel and `target="_blank"` fall through to native browser behavior.
import { useCallback, useMemo, type MouseEvent } from 'react'
import type { HtmlProps } from './html.types'
import { useRouter } from 'app/lib/hooks/router'
import { sanitazeUrl, isExternalUrl } from 'app/lib/util'
import emitter, { EVENTS } from 'app/context/emitter'
import { preprocessHtml, sanitizeHtml, flattenNestedAnchors, normalizeRenderedHref } from 'app/lib/html-helpers'

/**
 * `target="_blank" rel="noopener noreferrer"` on every anchor that does not set a
 * target of its own. Runs after sanitizing (which keeps `target`), so the delegated
 * click handler below sees `_blank` and lets the browser open the tab.
 */
function openAnchorsInNewTab(html: string) {
    return html.replace(/<a\b(?![^>]*\btarget\s*=)([^>]*)>/gi, '<a target="_blank" rel="noopener noreferrer"$1>')
}

export default function ElementHtml({ customClassName, data, className = '', innerRef, linksInNewTab = false }: HtmlProps) {
    const router = useRouter()

    const html = useMemo(() => {
        if (!data) return ''
        const clean = sanitizeHtml(flattenNestedAnchors(preprocessHtml(data)))
        return linksInNewTab ? openAnchorsInNewTab(clean) : clean
    }, [data, linksInNewTab])

    const handleClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
        const anchor = (event.target as Element | null)?.closest?.('a')
        if (!anchor) return

        const rawHref = anchor.getAttribute('href')
        if (!rawHref) return

        emitter.emit(EVENTS.link, { action: 'pressed' })

        const href = normalizeRenderedHref(rawHref)
        // Bare UNA hrefs (email / domain without a scheme) must not be left to
        // the browser — it would resolve them as in-app relative paths.
        if (href !== rawHref) {
            event.preventDefault()
            if (/^(mailto:|tel:|#)/i.test(href) || isExternalUrl(href) || /^(https?:)/i.test(href)) {
                window.location.assign(href)
                return
            }
            const rewritten = sanitazeUrl(href)
            if (rewritten) router.push(rewritten)
            return
        }

        // Let the browser handle mail/phone, new-tab, and external links.
        if (/^(mailto:|tel:|#)/i.test(rawHref)) return
        if (anchor.target === '_blank') return
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
