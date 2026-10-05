// Enriched Markdown has no per-image attributes or custom renderer API. Extract
// explicitly sized images before rendering and leave ordinary Markdown images
// to Enriched's native renderer.
const sizedMarkdownImagePattern = /!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?\s+=\s*(\d{1,4})x(\d{1,4})\s*\)/gi
const htmlImagePattern = /<img\b[^>]*>/gi
const htmlAttributePattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
const cssWidthPattern = /(?:^|;)\s*width\s*:\s*(\d{1,4})(?:px)?\s*(?:;|$)/i
const cssHeightPattern = /(?:^|;)\s*height\s*:\s*(\d{1,4})(?:px)?\s*(?:;|$)/i

function decodeHtmlAttribute(value: any) {
    const decodeCodePoint = (match: any, code: string, radix = 10) => {
        const codePoint = Number.parseInt(code, radix)
        return Number.isSafeInteger(codePoint) && codePoint <= 0x10FFFF
            ? String.fromCodePoint(codePoint)
            : match
    }

    return String(value || '')
        .replace(/&#(\d+);/g, (match, code) => decodeCodePoint(match, code))
        .replace(/&#x([\da-f]+);/gi, (match, code) => decodeCodePoint(match, code, 16))
        .replace(/&quot;/gi, '"')
        .replace(/&apos;/gi, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&amp;/gi, '&')
}

function parseDimension(value: any) {
    const match = String(value || '').trim().match(/^(\d{1,4})(?:px)?$/i)
    if (!match) return null

    const dimension = Number(match[1])
    return dimension > 0 && dimension <= 4096 ? dimension : null
}

function parseHtmlImage(match: any) {
    const attributes: Record<string, string> = {}
    const attributeSource = match[0].replace(/^<img\b/i, '').replace(/>$/, '')

    for (const attributeMatch of attributeSource.matchAll(htmlAttributePattern)) {
        const name = attributeMatch[1].toLowerCase()
        attributes[name] = decodeHtmlAttribute(
            attributeMatch[2] ?? attributeMatch[3] ?? attributeMatch[4] ?? '',
        )
    }

    const style = attributes.style || ''
    const width = parseDimension(attributes.width ?? style.match(cssWidthPattern)?.[1])
    const height = parseDimension(attributes.height ?? style.match(cssHeightPattern)?.[1])
    const src = attributes.src

    if (!src || (!width && !height)) return null

    return {
        index: match.index,
        length: match[0].length,
        kind: 'image',
        alt: attributes.alt || '',
        src,
        width,
        height,
    }
}

function collectSizedImages(markdown: string) {
    const images = []

    for (const match of markdown.matchAll(sizedMarkdownImagePattern)) {
        const width = parseDimension(match[3])
        const height = parseDimension(match[4])
        if (!width || !height) continue

        images.push({
            index: match.index,
            length: match[0].length,
            kind: 'image',
            alt: match[1],
            src: match[2],
            width,
            height,
        })
    }

    for (const match of markdown.matchAll(htmlImagePattern)) {
        const image = parseHtmlImage(match)
        if (image) images.push(image)
    }

    return [...images].sort((left, right) => left.index - right.index)
}

export function splitSizedMarkdownImages(markdown: string) {
    const source = String(markdown || '')
    const images = collectSizedImages(source)
    if (!images.length) return [{ kind: 'markdown', markdown: source }]

    const segments = []
    let cursor = 0

    for (const image of images) {
        if (image.index < cursor) continue

        const precedingMarkdown = source.slice(cursor, image.index)
        if (precedingMarkdown.trim()) {
            segments.push({ kind: 'markdown', markdown: precedingMarkdown })
        }

        const { index: _index, length: _length, ...imageSegment } = image
        segments.push(imageSegment)
        cursor = image.index + image.length
    }

    const trailingMarkdown = source.slice(cursor)
    if (trailingMarkdown.trim()) {
        segments.push({ kind: 'markdown', markdown: trailingMarkdown })
    }

    return segments
}
