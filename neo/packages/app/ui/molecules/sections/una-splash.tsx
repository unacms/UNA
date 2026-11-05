// UNA's guest splash code on iOS and Android (Studio > Designer > Splash; `data.splash.code`).
//
// No web view: the code's text goes through the rich text renderer (the `Html` atom, react-native-enriched-
// html) and its placeholders are native components (splash-parts.tsx). What the native renderer reads:
// - headings, paragraphs, lists, quotes, links, bold, italic, underline, strike-through, line breaks;
// - `text-align` in `style`, or a `text-left` / `text-center` / `text-right` / `text-start` / `text-end`
//   class, on the element or an element around it;
// - an element with a placeholder inside becomes a column, centred, with the built-in splash's gap;
// - a heading with text only (no links) is the app's own heading (H1 to H6), as the built-in splash's title.
// Everything else is left out: `<style>` and CSS layout, `<svg>`, images, forms, iframes. Other containers
// (div, section, header, ...) keep only their text. See neo/AGENTS.md, "Guest splash".
import { View } from 'app/design/view'
import { H1, H2, H3, H4, H5, H6 } from 'app/design/typography'
import Html from 'app/ui/atoms/html'
import { appSetting } from 'app/lib/util'
import {
    elementAlign,
    escapeHtml,
    nodeSource,
    nodeText,
    parseSplashHtml,
    splitRuns,
    type SplashNode,
    type SplashTree,
} from 'app/lib/splash/splash-html'
import { SplashSlotPart } from './splash-parts'
import type { UnaSplashProps } from './una-splash.types'
import type { ReactNode } from 'react'

type Align = 'left' | 'center' | 'right' | null

/** Tags the rich text renderer draws, with the attributes it reads. */
const BLOCK_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'pre'])
const INLINE_TAGS = new Set(['a', 'b', 'strong', 'i', 'em', 'u', 'ins', 's', 'del', 'strike', 'code', 'br'])
const ALIGNED_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote'])
/** Left out with everything inside. */
const DROPPED_TAGS = new Set(['style', 'script', 'svg', 'img', 'picture', 'video', 'audio', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button', 'template', 'noscript', 'canvas', 'title'])

function hasBlockChild(nodes: SplashNode[]): boolean {
    return nodes.some((node) => node.type === 'element' && (BLOCK_TAGS.has(node.tag) || (!INLINE_TAGS.has(node.tag) && !DROPPED_TAGS.has(node.tag) && hasBlockChild(node.children))))
}

/** Block tags whose content is inline text: containers inside them stay inline. */
const TEXT_BLOCK_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre'])

/** A container (div, section, span ...): its blocks, or its text as a paragraph unless it is inside text. */
function containerRichText(tree: SplashTree, children: SplashNode[], align: Align, inline: boolean): string {
    if (inline || hasBlockChild(children)) return toRichText(tree, children, align, inline)
    const inner = toRichText(tree, children, align, true).trim()
    if (!inner) return ''
    const style = align ? ` style="text-align: ${align}"` : ''
    return `<p${style}>${inner}</p>`
}

/**
 * Nodes as HTML the rich text renderer reads; `align` from the elements around them. `inline`: inside a
 * paragraph, heading, link or inline tag, where containers keep their text without a paragraph of their own.
 */
function toRichText(tree: SplashTree, nodes: SplashNode[], align: Align, inline = false): string {
    let out = ''
    for (const node of nodes) {
        if (node.type === 'text') {
            out += nodeSource(tree, node)
            continue
        }
        if (node.type === 'slot') {
            // Only the site title reaches a run: its text.
            out += escapeHtml(nodeText(tree, node))
            continue
        }
        const tag = node.tag
        if (DROPPED_TAGS.has(tag)) continue
        const ownAlign = elementAlign(node) ?? align
        if (tag === 'br') {
            out += '<br>'
        } else if (tag === 'a') {
            const href = node.attrs.href ? ` href="${escapeHtml(node.attrs.href)}"` : ''
            out += `<a${href}>${toRichText(tree, node.children, ownAlign, true)}</a>`
        } else if (INLINE_TAGS.has(tag)) {
            out += `<${tag}>${toRichText(tree, node.children, ownAlign, true)}</${tag}>`
        } else if (BLOCK_TAGS.has(tag)) {
            const style = ownAlign && ALIGNED_TAGS.has(tag) ? ` style="text-align: ${ownAlign}"` : ''
            out += `<${tag}${style}>${toRichText(tree, node.children, ownAlign, TEXT_BLOCK_TAGS.has(tag))}</${tag}>`
        } else {
            out += containerRichText(tree, node.children, ownAlign, inline)
        }
    }
    return out
}

const HEADINGS: Record<string, typeof H1> = { h1: H1, h2: H2, h3: H3, h4: H4, h5: H5, h6: H6 }
const ALIGN_CLASSES: Record<'left' | 'center' | 'right', string> = { left: 'text-left', center: 'text-center', right: 'text-right' }

function hasLink(nodes: SplashNode[]): boolean {
    return nodes.some((node) => node.type === 'element' && (node.tag === 'a' || hasLink(node.children)))
}

/** Plain HTML as rich text, a paragraph when it is only text (an inline run). */
function richText(tree: SplashTree, nodes: SplashNode[], align: Align, key: string): ReactNode {
    const html = toRichText(tree, nodes, align).trim()
    if (!html) return null
    let source = html
    if (!/^<(p|h[1-6]|ul|ol|blockquote|pre)\b/i.test(html)) {
        const style = align ? ` style="text-align: ${align}"` : ''
        source = `<p${style}>${html}</p>`
    }
    return (
        <View key={key} className="w-full">
            <Html data={source} />
        </View>
    )
}

/** A run of plain HTML: its text headings as the app's headings, the rest as rich text between them. */
function renderRun(tree: SplashTree, nodes: SplashNode[], align: Align, key: string): ReactNode[] {
    const result: ReactNode[] = []
    let pending: SplashNode[] = []
    const flush = () => {
        const item = richText(tree, pending, align, `${key}.${result.length}`)
        if (item) result.push(item)
        pending = []
    }
    for (const node of nodes) {
        const Heading = node.type === 'element' && !hasLink(node.children) ? HEADINGS[node.tag] : undefined
        if (!Heading || node.type !== 'element') {
            pending.push(node)
            continue
        }
        flush()
        const text = nodeText(tree, node).replace(/\s+/g, ' ').trim()
        const headingAlign = elementAlign(node) ?? align
        if (text)
            result.push(
                <Heading key={`${key}.${result.length}`} isfirst islast className={`w-full ${headingAlign ? ALIGN_CLASSES[headingAlign] : ''}`}>
                    {text}
                </Heading>
            )
    }
    flush()
    return result
}

function renderNodes(tree: SplashTree, nodes: SplashNode[], data: unknown, align: Align, keyPrefix: string): ReactNode[] {
    const result: ReactNode[] = []
    splitRuns(tree, nodes).forEach((run, i) => {
        const key = `${keyPrefix}${i}`
        if (run.kind === 'html') {
            result.push(...renderRun(tree, run.nodes, align, key))
            return
        }
        const node = run.node
        if (node.type === 'slot') {
            result.push(<SplashSlotPart key={key} name={node.name} data={data} />)
            return
        }
        result.push(
            <View key={key} className="w-full items-center gap-6">
                {renderNodes(tree, node.children, data, elementAlign(node) ?? align, `${key}.`)}
            </View>
        )
    })
    return result
}

export default function UnaSplash({ code, data }: Readonly<UnaSplashProps>) {
    const tree = parseSplashHtml(code)
    return (
        <View className={`flex-auto items-center justify-center p-4 sm:p-6 gap-6 w-full mx-auto ${appSetting('layout', 'max_width_landing')}`}>
            {renderNodes(tree, tree.nodes, data, null, '')}
        </View>
    )
}
