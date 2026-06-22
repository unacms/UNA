import React, { useCallback } from 'react'
import Image from 'app/ui/atoms/image'
import { Row, View } from 'app/design/view'
import { P, Strong, I, EM, Div, UL, Code } from '@expo/html-elements'
import { Platform } from 'react-native'
import Link from 'app/ui/atoms/link'
import { Text, H1, H2, H3, H4, H5, H6 } from 'app/design/typography'
import { decodeText, appSetting, isExternalUrl, openExternalLink } from 'app/lib/util'
import { ParseHtmlClasses } from 'app/customization/functions';
import { useThemeName } from 'app/design/theme'
import { useRouter, useGlobalSearchParams } from 'app/lib/hooks/router'
import { unaLinksToMentions, linkifyHtml, normalizeLinkHref } from 'app/components/form-fields/editor-mention-html'

// Native-only: the enriched-html display component is Tiptap-based on web and must
// not load/execute during web/SSR. The require only runs on native.
const EnrichedText = Platform.OS === 'web' ? null : require('react-native-enriched-html').EnrichedText

// When the enriched editor engine is active, render output through the library's
// native `EnrichedText` so mentions/formatting match the editor 1:1 (incl. native
// mention pills). Native-only (web keeps the existing renderer + CSS), and only
// for content the library supports — embeds/iframes/videos/tables/images fall back.
const ENRICHED_ENGINE = appSetting('editor', 'engine') === 'enriched'
const ENRICHED_UNSUPPORTED_RE = /<(iframe|video|table|thead|tbody|tr|td|th|img)\b|bx-embed/i
const canUseEnrichedRenderer = (html) => !ENRICHED_UNSUPPORTED_RE.test(html)

const isWeb = Platform.OS === 'web'
const noScale = isWeb  || appSetting('native', 'allow_font_scaling')? {} : { allowFontScaling: false }

// Mentions/tags. On web they keep their `bx-mention-link` / `bx-tag` class and are
// styled by the .bx-mention-link CSS (utilities.css). On native there's no CSS, so we
// apply the same semantic tokens here via className (configurable in settings).
const MENTION_RENDER_CLASS = appSetting('editor', 'mention', 'render_class') || 'text-accent-foreground bg-accent/60 rounded px-1'
const isMentionClass = (cls = '') => /\b(bx-mention-link|bx-tag)\b/.test(cls)
const mentionIndicatorFor = (cls = '') => (/\bbx-tag\b/.test(cls) ? '#' : '@')
const getNodeText = (node) => {
    if (!node) return ''
    if (node.type === 'text') return node.value || ''
    if (Array.isArray(node.children)) return node.children.map(getNodeText).join('')
    return ''
}


const StyledStrong = (props) => {
    if (Platform.OS === 'web') {
        return <strong {...props} />
    }
    return <Strong {...noScale} {...props} />
}

const StyledI = (props) => {
    if (Platform.OS === 'web') {
        return <i {...props} />
    }
    return <I {...noScale} {...props} />
}

const StyledEM = (props) => {
    if (Platform.OS === 'web') {
        return <em {...props} />
    }
    return <EM {...noScale} {...props} />
}

const StyledP = ({ children, className, ...props }) => {
    className += ' text-card-foreground'
    className += props.isfirst === 'true' ? ' mt-0 ' : ' mt-1 '
    className += props.islast === 'true' ? ' mb-0' : ' mb-1'


    if (Platform.OS === 'web') {
        const WebDiv = 'div'
        return <WebDiv {...props} className={`${className}`} >{children}</WebDiv>
    }
    return <P {...noScale} className={className} {...props}>{children}</P>
}

const StyledLi = ({ children, className, ...props }) => {
    
    className += ' text-card-foreground'

    if (Platform.OS === 'web') {
        const WebLi = 'li'
        return <WebLi {...props} className={`${className}`}>{children}</WebLi>
    }
    return (
        <Row {...props} className={`mb-1 ml-4 flex-row items-start`}>
            <Text className="mr-2 text-card-foreground">•</Text>
            <Text className="flex-1 text-card-foreground">{children}</Text>
        </Row>
    )
}

const StyledText = (props) => {
    if (Platform.OS === 'web') {
        const WebSpan = 'span'
        return <WebSpan {...props} />
    }
    return <Text {...props} />
}

const StyledDiv = (props) => <Div {...props} />

const StyledPre = ({ children, className = '', ...props }) => {
    const preClassName = `my-2 rounded-md bg-muted p-3 ${className}`.trim()

    if (Platform.OS === 'web') {
        const WebPre = 'pre'
        return (
            <WebPre {...props} className={preClassName}>
                {children}
            </WebPre>
        )
    }

    return (
        <View {...props} className={preClassName}>
            <Text className="font-mono text-sm text-foreground">{children}</Text>
        </View>
    )
}

const StyledTable = ({ children, className = '', ...props }) => {
    const tableClassName = `my-3 w-full border-collapse text-sm ${className}`.trim()

    if (Platform.OS === 'web') {
        const WebTable = 'table'
        return <WebTable {...props} className={tableClassName}>{children}</WebTable>
    }

    return <View {...props} className={`my-3 w-full overflow-hidden rounded-lg border border-border ${className}`}>{children}</View>
}

const StyledTHead = ({ children, ...props }) => {
    if (Platform.OS === 'web') {
        const WebTHead = 'thead'
        return <WebTHead {...props}>{children}</WebTHead>
    }

    return <View {...props} className="bg-muted">{children}</View>
}

const StyledTBody = ({ children, ...props }) => {
    if (Platform.OS === 'web') {
        const WebTBody = 'tbody'
        return <WebTBody {...props}>{children}</WebTBody>
    }

    return <View {...props}>{children}</View>
}

const StyledTR = ({ children, ...props }) => {
    if (Platform.OS === 'web') {
        const WebTR = 'tr'
        return <WebTR {...props}>{children}</WebTR>
    }

    return <Row {...props} className="border-t border-border first:border-t-0">{children}</Row>
}

const StyledTableCell = ({ children, header = false, className = '', ...props }) => {
    const cellClassName = `border border-border px-3 py-2 text-left align-top ${header ? 'font-semibold text-foreground' : 'text-card-foreground'} ${className}`.trim()

    if (Platform.OS === 'web') {
        const WebCell = header ? 'th' : 'td'
        return <WebCell {...props} className={cellClassName}>{children}</WebCell>
    }

    return (
        <View {...props} className={`flex-1 px-3 py-2 ${className}`}>
            <Text className={header ? 'font-semibold text-foreground' : 'text-card-foreground'}>
                {children}
            </Text>
        </View>
    )
}

const StyledTH = (props) => <StyledTableCell {...props} header />
const StyledTD = (props) => <StyledTableCell {...props} />

const tagMapping = {
    h1: H1,
    h2: H2,
    h3: H3,
    h4: H4,
    h5: H5,
    h6: H6,
    p: StyledP,
    strong: StyledStrong,
    b: StyledStrong,
    i: StyledI,
    em: StyledEM,
    code: Code,
    pre: StyledPre,
    div: StyledDiv,
    li: StyledLi,
    span: StyledText,
    ul: UL,
    ol: UL,
    table: StyledTable,
    thead: StyledTHead,
    tbody: StyledTBody,
    tr: StyledTR,
    th: StyledTH,
    td: StyledTD
}

const isMarkdownTableRow = (line = '') => {
    const trimmed = line.trim()
    return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.slice(1, -1).includes('|')
}

const getMarkdownTableRowStart = (line = '') => {
    const firstPipe = line.indexOf('|')
    if (firstPipe === -1) return -1

    return isMarkdownTableRow(line.slice(firstPipe)) ? firstPipe : -1
}

const isMarkdownTableSeparator = (line = '') => {
    const trimmed = line.trim()
    if (!isMarkdownTableRow(trimmed)) return false

    return trimmed
        .slice(1, -1)
        .split('|')
        .every((cell) => /^:?-{3,}:?$/.test(cell.trim()))
}

const parseMarkdownTableRow = (line = '') => (
    line
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((cell) => cell.trim())
)

const escapeHtml = (value = '') => (
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
)

const markdownTableToHtml = (lines) => {
    const header = parseMarkdownTableRow(lines[0])
    const rows = lines.slice(2).map(parseMarkdownTableRow)

    return [
        '<table>',
        '<thead><tr>',
        header.map((cell) => `<th>${escapeHtml(cell)}</th>`).join(''),
        '</tr></thead>',
        '<tbody>',
        rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join(''),
        '</tbody>',
        '</table>',
    ].join('')
}

const convertMarkdownTables = (html) => {
    const lines = html.split(/\r?\n/)
    const output = []
    let i = 0

    while (i < lines.length) {
        const line = lines[i]
        const rowStart = getMarkdownTableRowStart(line)
        const tableHeaderLine = rowStart >= 0 ? line.slice(rowStart) : line
        const separatorIndex = (() => {
            let index = i + 1
            while (index < lines.length && lines[index].trim() === '') index += 1
            return index
        })()

        if (
            isMarkdownTableRow(tableHeaderLine) &&
            separatorIndex < lines.length &&
            isMarkdownTableSeparator(lines[separatorIndex])
        ) {
            const leadingText = rowStart > 0 ? line.slice(0, rowStart).trim() : ''
            const tableLines = [tableHeaderLine, lines[separatorIndex]]
            i = separatorIndex + 1

            while (i < lines.length) {
                if (lines[i].trim() === '') {
                    i += 1
                    continue
                }

                if (!isMarkdownTableRow(lines[i])) break
                tableLines.push(lines[i])
                i += 1
            }

            if (leadingText) {
                output.push(leadingText)
            }
            output.push(markdownTableToHtml(tableLines))
            continue
        }

        output.push(line)
        i += 1
    }

    return output.join('\n')
}

const normalizeHtml = (html) => convertMarkdownTables(html)

const hasBlockHtml = (html) => (
    /<(p|div|ul|ol|li|h[1-6]|pre|blockquote|table|thead|tbody|tr)\b/i.test(html)
)

const keyedChildren = (children) => React.Children.toArray(children)

// UNA CMS can emit nested <a> tags (e.g. channel mention wrapping a keyword link).
// HTML forbids anchor descendants; unwrap inner links and keep the outer href.
const flattenNestedAnchorsInTree = (children, insideAnchor = false) => {
    const result = []
    for (const child of children) {
        if (child.type === 'element' && child.tag === 'a') {
            if (insideAnchor) {
                result.push(...flattenNestedAnchorsInTree(child.children, true))
            } else {
                result.push({
                    ...child,
                    children: flattenNestedAnchorsInTree(child.children, true),
                })
            }
        } else if (child.type === 'element') {
            result.push({
                ...child,
                children: flattenNestedAnchorsInTree(child.children, insideAnchor),
            })
        } else {
            result.push(child)
        }
    }
    return result
}

const renderTextNode = (key, content) => {
    if (Platform.OS === 'web') {
        const WebSpan = 'span'
        return <WebSpan key={key} className="font-main">{content}</WebSpan>
    }

    return <Text key={key} className="text-card-foreground">{content}</Text>
}

const VOID_TAGS = new Set([
    'br', 'hr', 'img', 'input', 'meta', 'link',
    'wbr', 'area', 'base', 'col', 'embed', 'param', 'source', 'track',
])

// Tags that auto-close a previous open sibling of the same type (HTML spec)
const AUTO_CLOSE_SIBLINGS = {
    li: new Set(['li']),
    p: new Set(['p', 'div', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'blockquote', 'table']),
    tr: new Set(['tr']),
    td: new Set(['td', 'th']),
    th: new Set(['td', 'th']),
    thead: new Set(['tbody', 'tfoot']),
    tbody: new Set(['thead', 'tfoot']),
}

const tokenizeHtml = (html) => {
    const tokens = []
    const tagRegex = /<(\/)?\s*([a-zA-Z][a-zA-Z0-9]*)((?:\s[^>]*)?)\s*(\/)?>/g
    let lastIndex = 0
    let m
    while ((m = tagRegex.exec(html)) !== null) {
        if (m.index > lastIndex) {
            tokens.push({ type: 'text', value: html.slice(lastIndex, m.index) })
        }
        const slash = m[1]
        const tag = m[2].toLowerCase()
        const attrs = m[3] || ''
        const selfSlash = m[4]

        if (slash === '/') {
            tokens.push({ type: 'close', tag })
        } else if (selfSlash === '/' || VOID_TAGS.has(tag)) {
            tokens.push({ type: 'void', tag, attrs })
        } else {
            tokens.push({ type: 'open', tag, attrs })
        }
        lastIndex = tagRegex.lastIndex
    }
    if (lastIndex < html.length) {
        tokens.push({ type: 'text', value: html.slice(lastIndex) })
    }
    return tokens
}

const buildHtmlTree = (tokens) => {
    const root = { type: 'element', tag: 'root', attrs: '', children: [] }
    const stack = [root]
    const top = () => stack[stack.length - 1]

    for (const t of tokens) {
        if (t.type === 'text') {
            if (t.value) top().children.push({ type: 'text', value: t.value })
        } else if (t.type === 'void') {
            top().children.push({ type: 'void', tag: t.tag, attrs: t.attrs })
        } else if (t.type === 'open') {
            const closers = AUTO_CLOSE_SIBLINGS[t.tag]
            if (closers && closers.has(top().tag)) {
                stack.pop()
            }
            const node = { type: 'element', tag: t.tag, attrs: t.attrs, children: [] }
            top().children.push(node)
            stack.push(node)
        } else if (t.type === 'close') {
            let foundIdx = -1
            for (let i = stack.length - 1; i > 0; i--) {
                if (stack[i].tag === t.tag) {
                    foundIdx = i
                    break
                }
            }
            if (foundIdx > 0) {
                stack.length = foundIdx
            }
        }
    }
    return root
}

const matchAttr = (attrs, name) => {
    const re = new RegExp(`${name}=['"]([^'"]*)['"]`, 'i')
    const re2 = new RegExp(`${name}=([^'"\\s>]+)`, 'i')
    const m = attrs.match(re) || attrs.match(re2)
    return m ? m[1] : ''
}

const renderTreeNode = (node, key) => {
    if (node.type === 'text') {
        return renderTextNode(key, node.value)
    }

    if (node.type === 'void') {
        if (node.tag === 'br') {
            if (Platform.OS === 'web') {
                const WebDiv = 'div'
                return <WebDiv key={key}></WebDiv>
            }
            return <P key={key}></P>
        }
        if (node.tag === 'img') {
            const src = matchAttr(node.attrs, 'src')
            if (src) {
                return (
                    <View key={key} className="w-full aspect-video">
                        <Image src={src} view="cover" />
                    </View>
                )
            }
            return null
        }
        return null
    }

    const className = matchAttr(node.attrs, 'class')
    const childElements = renderChildren(node.children, key)

    if (node.tag === 'a') {
        const href = matchAttr(node.attrs, 'href')
        const isMention = isMentionClass(className)
        // Prefix the indicator (@ / #) so mentions/tags read differently from plain
        // links. Guarded so we don't double it if the text already starts with it.
        const indicator = isMention ? mentionIndicatorFor(className) : ''
        const mentionText = isMention ? getNodeText(node).trimStart() : ''
        const needsPrefix = isMention && !mentionText.startsWith(indicator)
        if (href) {
            // Native: mentions/tags need explicit styling (no CSS). Render the text
            // directly so the mention color/background isn't overridden by the inner
            // text node's `text-card-foreground`. Web keeps the class for the CSS.
            if (!isWeb && isMention) {
                return (
                    <Link
                        key={key}
                        href={href}
                        mode="text"
                        haptics="Select"
                        className={MENTION_RENDER_CLASS}
                    >
                        {needsPrefix ? indicator + getNodeText(node) : getNodeText(node)}
                    </Link>
                )
            }
            return (
                <Link
                    key={key}
                    href={isMention ? href : normalizeLinkHref(href)}
                    mode="text"
                    className={
                        'text-accent-foreground ' +
                        (className ? ParseHtmlClasses(className, 'link') : '')
                    }
                >
                    {needsPrefix ? indicator : ''}{childElements}
                </Link>
            )
        }
        return <React.Fragment key={key}>{childElements}</React.Fragment>
    }

    const Component = tagMapping[node.tag] || StyledText
    return (
        <Component
            key={key}
            className={className ? ParseHtmlClasses(className, 'text') : ''}
            isfirst="false"
            islast="false"
        >
            {childElements}
        </Component>
    )
}

const renderChildren = (children, parentKey) => {
    const elements = children
        .map((child, i) => renderTreeNode(child, `${parentKey}-${i}-${child.tag || 'text'}`))
        .filter((el) => el !== null && el !== undefined)

    if (elements.length > 0 && elements.every(React.isValidElement)) {
        elements[0] = React.cloneElement(elements[0], { isfirst: 'true' })
        elements[elements.length - 1] = React.cloneElement(
            elements[elements.length - 1],
            { islast: 'true' }
        )
    }

    return elements
}

const parseHtmlToReact = (html, parentKey = '0') => {
    if (!html) return []
    if (!/<[a-zA-Z0-9]+[^>]*>/.test(html)) {
        return [renderTextNode(`${parentKey}-text`, html)]
    }

    const tokens = tokenizeHtml(html)
    const tree = buildHtmlTree(tokens)
    const sanitizedChildren = flattenNestedAnchorsInTree(tree.children)
    return renderChildren(sanitizedChildren, parentKey)
}

// Native renderer using the enriched-html library's display component. Hooks live
// here (not in ElementHtml) so they only run when this path is actually used.
function EnrichedHtmlNative({ html, customClassName, innerRef }) {
    const themeName = useThemeName() || 'light'
    const router = useRouter()
    const glob = useGlobalSearchParams()

    const isDark = themeName === 'dark'
    const themeKey = isDark ? 'dark' : 'light'
    const mentionCfg = appSetting('editor', 'mention') || {}
    const mentionColor =
        mentionCfg.editor_color?.[themeKey] || (isDark ? 'rgba(59, 130, 246, 1)' : 'rgba(37, 99, 235, 1)')
    const mentionBackground = mentionCfg.editor_background?.[themeKey] || 'transparent'
    const textColor = isDark ? 'rgba(225, 230, 240, 1)' : 'rgba(30, 40, 55, 1)'
    const isSmall = customClassName === 'u-vanilla-html-small'

    const navigate = useCallback((rawUrl) => {
        if (!rawUrl) return
        // Native auto-links store bare hrefs (e.g. "example.com"); add a scheme so
        // they open in the browser instead of being treated as an in-app route.
        const url = normalizeLinkHref(rawUrl)
        if (isExternalUrl(url)) {
            openExternalLink(url)
            return
        }
        const relative = url.replace(/^https?:\/\/[^/]+/, '') || url
        router.push({ pathname: '/' + (glob?.name || ''), params: { url: relative } })
    }, [router, glob?.name])

    const source = `<html>${unaLinksToMentions(html)}</html>`
    // The library resolves mention styles by indicator ('@'/'#') or 'all'; a flat
    // object gets stored under an internal '_default' key that native never matches,
    // so it falls back to blue-on-yellow. Key it per indicator to apply our colors.
    const mentionStyle = { color: mentionColor, backgroundColor: mentionBackground, textDecorationLine: 'none' }
    const htmlStyle = {
        a: { color: mentionColor, textDecorationLine: 'none' },
        mention: { '@': mentionStyle, '#': mentionStyle },
    }

    return (
        <View className={`max-w-full ${customClassName || ''}`} ref={innerRef}>
            <EnrichedText
                selectable
                style={{ color: textColor, fontSize: isSmall ? 14 : 16, lineHeight: isSmall ? 18 : 22 }}
                htmlStyle={htmlStyle}
                onLinkPress={(e) => navigate(e?.url)}
                onMentionPress={(e) => navigate(e?.attributes?.href)}
            >
                {source}
            </EnrichedText>
        </View>
    )
}

export default function ElementHtml({ customClassName, data, innerRef }) {
    if (!data) return null
    const preBlocks = []
    const withProtectedPre = data.replace(
        /<pre\b[^>]*>[\s\S]*?<\/pre>/gi,
        (match) => {
            const token = `__PRE_BLOCK_${preBlocks.length}__`
            preBlocks.push(match)
            return token
        }
    )
    let html = normalizeHtml(decodeText(withProtectedPre).replace(/&nbsp;/g, ' '))
    preBlocks.forEach((block, index) => {
        html = html.replace(`__PRE_BLOCK_${index}__`, block)
    })
    html = html.replace(/\n|\r/g, '')
    // Make plain-text URLs/emails clickable (covers legacy content and platforms
    // where the editor didn't auto-link). Skips text already inside anchors/mentions/code.
    html = linkifyHtml(html)
    if (html.trim() != '' && !hasBlockHtml(html)) html = `<p>${html}</p>`

    // Native + enriched engine: render via the library's native display component
    // (matches the editor, native mention pills). Falls back below for content the
    // library can't render (embeds/iframes/videos/tables/images).
    if (!isWeb && ENRICHED_ENGINE && canUseEnrichedRenderer(html)) {
        return <EnrichedHtmlNative html={html} customClassName={customClassName} innerRef={innerRef} />
    }

    return (
        <View className={`max-w-full ${customClassName || (isWeb ? 'u-vanilla-html' : '')}`} ref={innerRef}>
            {keyedChildren(parseHtmlToReact(html))}
        </View>
    )
}