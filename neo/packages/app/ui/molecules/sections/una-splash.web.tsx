'use client'
// UNA's guest splash code on web (Studio > Designer > Splash; `data.splash.code`).
// The page around it (header options, footer) is the splash molecule's (splash.tsx).
//
// The code renders as the HTML it is, styles included, inside `.neo-splash` between the app's header and
// footer. Elements that hold a placeholder are drawn as React elements, so the placeholders can be NEO
// components (splash-parts.tsx); the HTML between them goes in as markup, in a `display: contents`
// wrapper that takes no part in the layout. Server and client render the same, so it hydrates.
import { createElement, useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from 'react'
import { View } from 'app/design/view'
import { useRouter } from 'app/lib/hooks/router'
import { sanitazeUrl, isExternalUrl } from 'app/lib/util'
import { normalizeRenderedHref } from 'app/lib/html-helpers'
import emitter, { EVENTS } from 'app/context/emitter'
import { parseSplashHtml, runHtml, splitRuns, type SplashElement, type SplashNode, type SplashTree } from 'app/lib/splash/splash-html'
import { SplashSlotPart } from './splash-parts'
import type { UnaSplashProps } from './una-splash.types'

const CONTENTS: CSSProperties = { display: 'contents' }

/** HTML attribute names React spells differently. */
const REACT_ATTRS: Record<string, string> = {
    class: 'className',
    for: 'htmlFor',
    tabindex: 'tabIndex',
    readonly: 'readOnly',
    maxlength: 'maxLength',
    colspan: 'colSpan',
    rowspan: 'rowSpan',
    crossorigin: 'crossOrigin',
    srcset: 'srcSet',
    accesskey: 'accessKey',
    contenteditable: 'contentEditable',
    spellcheck: 'spellCheck',
}
/**
 * Elements that hold only inline content. One with a placeholder inside renders as a `div`: the
 * placeholders are blocks (NEO components) and so is the wrapper of the HTML around them, and a block in
 * a paragraph is markup the browser rewrites before React hydrates it.
 */
const PHRASING_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'b', 'strong', 'i', 'em', 'u', 's', 'small', 'label', 'code', 'q', 'sub', 'sup', 'mark', 'abbr', 'cite', 'time', 'del', 'ins', 'strike', 'pre'])

const BOOLEAN_ATTRS = new Set(['hidden', 'inert', 'disabled', 'checked', 'selected', 'required', 'open', 'multiple', 'autofocus'])

/** `a: b; --c: d` as a React style object (custom properties keep their names). */
function styleObject(style: string): Record<string, string> {
    const result: Record<string, string> = {}
    for (const declaration of style.split(';')) {
        const colon = declaration.indexOf(':')
        if (colon < 0) continue
        const name = declaration.slice(0, colon).trim()
        const value = declaration.slice(colon + 1).trim()
        if (!name || !value) continue
        const key = name.startsWith('--') ? name : name.toLowerCase().replace(/^-ms-/, 'ms-').replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase())
        result[key] = value
    }
    return result
}

function reactProps(element: SplashElement, key: string): Record<string, unknown> {
    const props: Record<string, unknown> = { key }
    for (const [name, value] of Object.entries(element.attrs)) {
        if (name.startsWith('on') || name === 'dangerouslysetinnerhtml' || name === 'ref' || name === 'key') continue
        if (name === 'style') {
            props.style = styleObject(value)
            continue
        }
        const reactName = REACT_ATTRS[name] ?? name
        props[reactName] = BOOLEAN_ATTRS.has(name) ? true : value
    }
    return props
}

function renderNodes(tree: SplashTree, nodes: SplashNode[], data: unknown, keyPrefix: string): ReactNode[] {
    return splitRuns(tree, nodes).map((run, i) => {
        const key = `${keyPrefix}${i}`
        if (run.kind === 'html') {
            return <div key={key} style={CONTENTS} dangerouslySetInnerHTML={{ __html: runHtml(tree, run.start, run.end) }} />
        }
        const node = run.node
        if (node.type === 'slot') return <SplashSlotPart key={key} name={node.name} data={data} />
        const tag = PHRASING_TAGS.has(node.tag) ? 'div' : node.tag
        return createElement(tag, reactProps(node, key), ...renderNodes(tree, node.children, data, `${key}.`))
    })
}

export default function UnaSplash({ code, data }: Readonly<UnaSplashProps>) {
    const router = useRouter()
    const content = useMemo(() => {
        const tree = parseSplashHtml(code)
        return renderNodes(tree, tree.nodes, data, '')
    }, [code, data])

    // Links in the code: the app's own pages open in the app, the rest as the browser does (as Html).
    // One listener on the wrapper for the links in it, which keep their own keyboard handling (Enter
    // on a link is a click); the wrapper itself is not interactive.
    const rootRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        const root = rootRef.current
        if (!root) return undefined
        const onClick = (event: MouseEvent) => {
            const anchor = (event.target as Element | null)?.closest?.('a')
            const rawHref = anchor?.getAttribute('href')
            if (!anchor || !rawHref || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
            emitter.emit(EVENTS.link, { action: 'pressed' })
            const href = normalizeRenderedHref(rawHref)
            if (/^(mailto:|tel:|#)/i.test(href) || anchor.target === '_blank' || anchor.hasAttribute('download') || isExternalUrl(href)) return
            const url = sanitazeUrl(href)
            if (!url) return
            event.preventDefault()
            router.push(url)
        }
        root.addEventListener('click', onClick)
        return () => root.removeEventListener('click', onClick)
    }, [router])

    return (
        <View className="flex-auto w-full">
            <div ref={rootRef} className="neo-splash flex flex-auto flex-col w-full">
                {content}
            </div>
        </View>
    )
}
