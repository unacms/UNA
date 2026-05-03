import React from 'react'
import Image from 'app/ui/atoms/image'
import { Row, View } from 'app/design/view'
import { P, Strong, I, EM, Div, UL, Code } from '@expo/html-elements'
import { Platform } from 'react-native'
import Link from 'app/ui/atoms/link'
import { Text, H1, H2, H3, H4, H5, H6 } from 'app/design/typography'
import { decodeText } from 'app/lib/util'
import { ParseHtmlClasses } from 'app/customization/functions';

const StyledStrong = (props) => {
    if (Platform.OS === 'web') {
        return <strong {...props} />
    }
    return <Strong {...props} />
}

const StyledI = (props) => {
    if (Platform.OS === 'web') {
        return <i {...props} />
    }
    return <I {...props} />
}

const StyledEM = (props) => {
    if (Platform.OS === 'web') {
        return <em {...props} />
    }
    return <EM {...props} />
}

const StyledP = ({ children, className, ...props }) => {
    className += ' text-card-foreground'
    className += props.isfirst === 'true' ? ' mt-0 ' : ' mt-1 '
    className += props.islast === 'true' ? ' mb-0' : ' mb-1'


    if (Platform.OS === 'web') {
        const WebDiv = 'div'
        return <WebDiv {...props} className={`${className} `} >{children}</WebDiv>
    }
    return <P className={className} {...props}>{children}</P>
}

const StyledLi = ({ children, ...props }) => {
    if (Platform.OS === 'web') {
        const WebLi = 'li'
        return <WebLi {...props}>{children}</WebLi>
    }
    return (
        <Row {...props} className={`mb-1 ml-4 flex-row items-start`}>
            <Text className="mr-2 text-foreground">•</Text>
            <Text className="flex-1 text-foreground">{children}</Text>
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
        const separatorIndex = (() => {
            let index = i + 1
            while (index < lines.length && lines[index].trim() === '') index += 1
            return index
        })()

        if (
            isMarkdownTableRow(line) &&
            separatorIndex < lines.length &&
            isMarkdownTableSeparator(lines[separatorIndex])
        ) {
            const tableLines = [line, lines[separatorIndex]]
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

            output.push(markdownTableToHtml(tableLines))
            continue
        }

        output.push(line)
        i += 1
    }

    return output.join('\n')
}

const normalizeHtml = (html) => {
    let normalized = html
    let previous

    do {
        previous = normalized
        normalized = normalized.replace(/<\/(ul|ol)>\s*<\/li>/gi, '</li></$1>')
    } while (normalized !== previous)

    return convertMarkdownTables(normalized)
}

const hasBlockHtml = (html) => (
    /<(p|div|ul|ol|li|h[1-6]|pre|blockquote|table|thead|tbody|tr)\b/i.test(html)
)

const parseHtmlToReact = (html, parentKey = '0') => {
    if (!/<[a-zA-Z0-9]+[^>]*>/.test(html)) {
        if (Platform.OS === 'web') return html
        return <Text>{html}</Text>
    }


    let childIndex = 0
    const getKey = (tag) => `${parentKey}-${childIndex++}-${tag}`
    const elements = []

    html = html.replace(
        /<br\s*\/?>/gi,
        (_, index) => `<br key="${getKey('br')}"></br>`
    )



    html = html.replace(
        /<img\s*([^>]*)\/?>/gi,
        (match, attributes, index) => {
            return `<customimg ${attributes} key="${getKey('img')}"></customimg>`
        }
    )

    const mainTagRegex = /<([a-zA-Z0-9]+)([^>]*)>(.*?)<\/\1>/gis
    let lastIndex = 0
    let match

    while ((match = mainTagRegex.exec(html)) !== null) {
        const [fullMatch, tag, attributes, content] = match
        const normalizedTag = tag.toLowerCase()
        const textBefore = html.slice(lastIndex, match.index)
        lastIndex = mainTagRegex.lastIndex

        if (textBefore) {
            if (Platform.OS === 'web') {
                elements.push(textBefore)
            } else {
                elements.push(<Text key={getKey('text-before')}>{textBefore}</Text>)
            }
        }

        if (normalizedTag === 'br') {
            if (Platform.OS === 'web') {
                const WebDiv = 'div'
                elements.push(<WebDiv key={getKey('br')}></WebDiv>)
            }
            else {
                elements.push(<P key={getKey('br')}></P>)
            }

            continue
        }

        let srcClass = attributes.match(/class=['"]([^'"]*)['"]/) || attributes.match(/class=([^'"\s>]+)/)

        if (normalizedTag === 'a') {
            const hrefMatch = attributes.match(/href="([^"]+)"/)
            if (hrefMatch) {
                elements.push(
                    <Link
                        key={getKey('link')}
                        href={hrefMatch[1]}
                        mode="text"
                        className={
                            'text-accent-foreground ' +
                            (srcClass && srcClass[1]
                                ? ParseHtmlClasses(
                                      srcClass[1],
                                      'link'
                                  )
                                : '')
                        }
                    >
                        {parseHtmlToReact(content, getKey('content'))}
                    </Link>
                )
            }
            continue
        }

        const Component = tagMapping[normalizedTag] || StyledText

        if (tag === 'customimg') {
            const srcMatch = attributes.match(/src=['"]?([^'"\s>]+)['"]?/)
            if (srcMatch && srcMatch[1]) {
                elements.push(
                    <View className="w-full aspect-video"><Image
                        key={getKey('image')}
                        src={srcMatch[1]}
                        view="cover"
                    /></View>
                )
            }
            continue
        }

        elements.push(
            <Component
                key={getKey(tag)}
                className={
                    srcClass && srcClass[1]
                        ? ParseHtmlClasses(srcClass[1], 'text')
                        : ''
                }
                isfirst="false"
                islast="false"
            >
                {parseHtmlToReact(content, getKey('content'))}
            </Component>
        )
    }

    const remainingText = html.slice(lastIndex)
    if (remainingText) {
        if (Platform.OS === 'web') {
            elements.push(remainingText)
        } else {
            elements.push(<Text key={getKey('end')}>{remainingText}</Text>)
        }
    }

    if (elements.length > 0 && elements.every(React.isValidElement)) {
        elements[0] = React.cloneElement(elements[0], { isfirst: 'true' })
        elements[elements.length - 1] = React.cloneElement(
            elements[elements.length - 1],
            { islast: 'true' }
        )
    }

    return elements
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
    if (html.trim() != '' && !hasBlockHtml(html)) html = `<p>${html}</p>`
    return (
        <View className={`min-w-0 max-w-full ${customClassName || 'u-vanilla-html'}`} ref={innerRef}>
            {parseHtmlToReact(html)}
        </View>
    )
}