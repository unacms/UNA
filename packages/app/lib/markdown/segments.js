const alertMarkerPattern = /^\s{0,3}>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/i
const blockquoteLinePattern = /^\s{0,3}>\s?(.*)$/
const openingFencePattern = /^(\s{0,3})(`{3,}|~{3,})(.*)$/
const headingPattern = /^\s{0,3}#{1,6}\s+\S/
const inlineLinkDestinationPattern = /(\]\(\s*<?)([^)\s>]+)(>?)/g
const absoluteOrRelativeUrlPattern = /^(?:[a-z][a-z\d+\-.]*:|\/|#|\?|\.{1,2}\/)/i
const bareDomainPattern = /^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,24}(?:[/?#]|$)/

// Markdown route links use app-root semantics. Without a leading slash, the
// browser resolves `wiki/accounts` from `/wiki/overview` as
// `/wiki/wiki/accounts`, even when the click handler later corrects navigation.
function normalizeMarkdownRouteLinks(markdown) {
    return String(markdown || '').replace(
        inlineLinkDestinationPattern,
        (match, prefix, destination, suffix) => {
            if (
                absoluteOrRelativeUrlPattern.test(destination)
                || bareDomainPattern.test(destination)
            ) {
                return match
            }

            return `${prefix}/${destination}${suffix}`
        },
    )
}

function trimBlankLines(lines) {
    let start = 0
    let end = lines.length
    while (start < end && !lines[start].trim()) start += 1
    while (end > start && !lines[end - 1].trim()) end -= 1
    return lines.slice(start, end)
}

function isClosingFence(line, character, minimumLength) {
    const match = line.match(/^\s{0,3}(`+|~+)\s*$/)
    return Boolean(
        match
        && match[1][0] === character
        && match[1].length >= minimumLength,
    )
}

function fenceLanguage(info) {
    return String(info || '').trim().split(/\s+/, 1)[0] || ''
}

export function splitMarkdownSegments(markdown) {
    const lines = String(markdown || '').split(/\r?\n/)
    const segments = []
    let regularLines = []
    let canUseLeadBlockquote = false
    let leadBlockquoteHandled = false

    const flushRegular = () => {
        const value = regularLines.join('\n')
        if (value.trim()) {
            segments.push({
                kind: 'markdown',
                markdown: normalizeMarkdownRouteLinks(value),
            })
        }
        regularLines = []
    }

    for (let index = 0; index < lines.length;) {
        const line = lines[index]
        const openingFence = line.match(openingFencePattern)

        if (openingFence) {
            if (canUseLeadBlockquote) {
                canUseLeadBlockquote = false
                leadBlockquoteHandled = true
            }

            const marker = openingFence[2]
            let closingIndex = index + 1
            while (
                closingIndex < lines.length
                && !isClosingFence(lines[closingIndex], marker[0], marker.length)
            ) {
                closingIndex += 1
            }

            if (closingIndex >= lines.length) {
                regularLines.push(...lines.slice(index))
                break
            }

            flushRegular()
            segments.push({
                kind: 'code',
                code: lines.slice(index + 1, closingIndex).join('\n'),
                language: fenceLanguage(openingFence[3]),
            })
            index = closingIndex + 1
            continue
        }

        const markerMatch = line.match(alertMarkerPattern)
        if (markerMatch) {
            if (canUseLeadBlockquote) {
                canUseLeadBlockquote = false
                leadBlockquoteHandled = true
            }

            flushRegular()
            const alertLines = []
            index += 1

            while (index < lines.length) {
                const quoteMatch = lines[index].match(blockquoteLinePattern)
                if (!quoteMatch) break
                alertLines.push(quoteMatch[1])
                index += 1
            }

            segments.push({
                kind: 'alert',
                alertType: markerMatch[1].toUpperCase(),
                markdown: normalizeMarkdownRouteLinks(trimBlankLines(alertLines).join('\n')),
            })
            continue
        }

        if (canUseLeadBlockquote) {
            if (!line.trim()) {
                regularLines.push(line)
                index += 1
                continue
            }

            if (blockquoteLinePattern.test(line)) {
                flushRegular()
                const leadLines = []

                while (index < lines.length) {
                    const quoteMatch = lines[index].match(blockquoteLinePattern)
                    if (!quoteMatch) break
                    leadLines.push(quoteMatch[1])
                    index += 1
                }

                segments.push({
                    kind: 'lead',
                    markdown: normalizeMarkdownRouteLinks(trimBlankLines(leadLines).join('\n')),
                })
                canUseLeadBlockquote = false
                leadBlockquoteHandled = true
                continue
            }

            canUseLeadBlockquote = false
            leadBlockquoteHandled = true
        }

        regularLines.push(line)
        if (!leadBlockquoteHandled && headingPattern.test(line)) {
            canUseLeadBlockquote = true
        }
        index += 1
    }

    flushRegular()
    return segments
}
