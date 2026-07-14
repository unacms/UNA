import { useCallback, useMemo } from 'react'
import { EnrichedMarkdownText } from 'react-native-enriched-markdown'
import { Platform } from 'react-native'
import { Row, View } from 'app/design/view'
import { Text } from 'app/design/typography'
import { useTheme, useThemeName } from 'app/design/theme'
import { isExternalUrl, openExternalLink, sanitazeUrl } from 'app/lib/util'
import { useRouter, useGlobalSearchParams } from 'app/lib/hooks/router'
import { normalizeLinkHref } from 'app/components/form-fields/editor-mention-html'
import { Icon } from 'app/ui/atoms/icon'

const headingScale = {
    regular: {
        h1: { fontSize: 36, fontWeight: '700', lineHeight: 40, marginTop: 8, marginBottom: 24 },
        h2: { fontSize: 24, fontWeight: '700', lineHeight: 32, marginTop: 24, marginBottom: 16 },
        h3: { fontSize: 20, fontWeight: '700', lineHeight: 28, marginTop: 16, marginBottom: 8 },
        h4: { fontSize: 18, fontWeight: '600', lineHeight: 28, marginTop: 8, marginBottom: 4 },
        h5: { fontSize: 16, fontWeight: '600', lineHeight: 24, marginTop: 8, marginBottom: 4 },
        h6: { fontSize: 14, fontWeight: '600', lineHeight: 20, marginTop: 8, marginBottom: 4 },
    },
    small: {
        h1: { fontSize: 30, fontWeight: '700', lineHeight: 36, marginTop: 8, marginBottom: 20 },
        h2: { fontSize: 22, fontWeight: '700', lineHeight: 28, marginTop: 20, marginBottom: 12 },
        h3: { fontSize: 18, fontWeight: '700', lineHeight: 24, marginTop: 14, marginBottom: 6 },
        h4: { fontSize: 16, fontWeight: '600', lineHeight: 22, marginTop: 8, marginBottom: 4 },
        h5: { fontSize: 14, fontWeight: '600', lineHeight: 20, marginTop: 8, marginBottom: 4 },
        h6: { fontSize: 12, fontWeight: '600', lineHeight: 18, marginTop: 8, marginBottom: 4 },
    },
}

const alertConfig = {
    NOTE: {
        label: 'Note',
        icon: 'Info',
        surfaceClassName: 'border-sky-500/20 bg-sky-500/10',
        toneClassName: 'text-sky-700',
    },
    TIP: {
        label: 'Tip',
        icon: 'Lightbulb',
        surfaceClassName: 'border-emerald-500/20 bg-emerald-500/10',
        toneClassName: 'text-emerald-700',
    },
    IMPORTANT: {
        label: 'Important',
        icon: 'CircleAlert',
        surfaceClassName: 'border-purple-500/20 bg-purple-500/10',
        toneClassName: 'text-purple-700',
    },
    WARNING: {
        label: 'Warning',
        icon: 'TriangleAlert',
        surfaceClassName: 'border-amber-500/20 bg-amber-500/10',
        toneClassName: 'text-amber-700',
    },
    CAUTION: {
        label: 'Caution',
        icon: 'OctagonAlert',
        surfaceClassName: 'border-red-500/20 bg-red-500/10',
        toneClassName: 'text-red-700',
    },
}

const alertMarkerPattern = /^\s{0,3}>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/i
const blockquoteLinePattern = /^\s{0,3}>\s?(.*)$/
const fencePattern = /^\s{0,3}(`{3,}|~{3,})/

function trimBlankLines(lines) {
    let start = 0
    let end = lines.length
    while (start < end && !lines[start].trim()) start += 1
    while (end > start && !lines[end - 1].trim()) end -= 1
    return lines.slice(start, end)
}

function splitMarkdownAlerts(markdown) {
    const lines = String(markdown || '').split(/\r?\n/)
    const segments = []
    let regularLines = []
    let fenceCharacter = null

    const flushRegular = () => {
        const value = regularLines.join('\n')
        if (value.trim()) segments.push({ kind: 'markdown', markdown: value })
        regularLines = []
    }

    for (let index = 0; index < lines.length;) {
        const line = lines[index]
        const fenceMatch = line.match(fencePattern)

        if (fenceMatch) {
            const character = fenceMatch[1][0]
            fenceCharacter = fenceCharacter === character ? null : (fenceCharacter || character)
            regularLines.push(line)
            index += 1
            continue
        }

        const markerMatch = fenceCharacter ? null : line.match(alertMarkerPattern)
        if (!markerMatch) {
            regularLines.push(line)
            index += 1
            continue
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
            markdown: trimBlankLines(alertLines).join('\n'),
        })
    }

    flushRegular()
    return segments
}

// Cross-platform Markdown renderer built on `react-native-enriched-markdown`
// (native text on iOS/Android, md4c/WASM on web — no WebView). Content is
// expected to arrive as Markdown; link presses route internally via the app
// router and fall back to the system browser for external URLs.
export default function ElementMarkdown({ data, customClassName, className = '', innerRef }) {
    const { colors } = useTheme()
    const isDark = useThemeName() === 'dark'
    const router = useRouter()
    const glob = useGlobalSearchParams()

    const isSmall = customClassName === 'u-vanilla-html-small'
    const fontSize = isSmall ? 14 : 16
    const lineHeight = isSmall ? 18 : 22

    const navigate = useCallback((rawUrl) => {
        if (!rawUrl) return
        const url = normalizeLinkHref(rawUrl)
        if (isExternalUrl(url)) {
            openExternalLink(url)
            return
        }
        const relative = sanitazeUrl(url.replace(/^https?:\/\/[^/]+/, '') || url)
        if (!relative) return
        router.push({ pathname: '/' + (glob?.name || ''), params: { url: relative } })
    }, [router, glob?.name])

    const markdownStyle = useMemo(() => {
        const mutedBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(3,7,18,0.05)'
        const borderColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(3,7,18,0.12)'
        const headingStyle = {
            color: Platform.OS === 'web' ? 'var(--color-popover-foreground)' : colors.default,
            fontFamily: Platform.OS === 'web' ? 'var(--font-title)' : 'font-title',
        }
        const headings = headingScale[isSmall ? 'small' : 'regular']
        return {
            paragraph: { color: colors.default, fontSize, lineHeight, marginTop: 8, marginBottom: 8 },
            h1: { ...headingStyle, ...headings.h1 },
            h2: { ...headingStyle, ...headings.h2 },
            h3: { ...headingStyle, ...headings.h3 },
            h4: { ...headingStyle, ...headings.h4 },
            h5: { ...headingStyle, ...headings.h5 },
            h6: { ...headingStyle, ...headings.h6 },
            list: { color: colors.default, fontSize, lineHeight },
            blockquote: { color: colors.default, borderColor, backgroundColor: mutedBg },
            link: { color: colors.primary, underline: false },
            strong: { color: colors.default },
            em: { color: colors.default },
            code: { color: colors.default, backgroundColor: mutedBg, borderColor },
            codeBlock: { color: colors.default, backgroundColor: mutedBg, borderColor, borderRadius: 8, padding: 12 },
            table: { color: colors.default, borderColor },
            thematicBreak: { color: borderColor },
        }
    }, [colors.default, colors.primary, isDark, isSmall, fontSize, lineHeight])

    const alertMarkdownStyle = useMemo(() => ({
        ...markdownStyle,
        paragraph: { ...markdownStyle.paragraph, marginTop: 4, marginBottom: 4 },
        list: { ...markdownStyle.list, marginTop: 4, marginBottom: 4 },
    }), [markdownStyle])

    const segments = useMemo(() => splitMarkdownAlerts(data), [data])
    const selectionColor = colors.outline || colors.primary
    const handleLinkPress = useCallback((event) => navigate(event?.url), [navigate])

    if (!data) return null

    return (
        <View className={`max-w-full u-vanilla-html ${customClassName || ''} ${className}`.trim()} ref={innerRef}>
            {segments.map((segment, index) => {
                if (segment.kind === 'markdown') {
                    return (
                        <EnrichedMarkdownText
                            key={`markdown-${index}`}
                            selectable
                            selectionColor={selectionColor}
                            flavor="github"
                            markdown={segment.markdown}
                            markdownStyle={markdownStyle}
                            onLinkPress={handleLinkPress}
                        />
                    )
                }

                const config = alertConfig[segment.alertType]
                return (
                    <View
                        key={`alert-${segment.alertType}-${index}`}
                        accessible
                        accessibilityLabel={`${config.label} alert`}
                        role={Platform.OS === 'web' ? 'note' : undefined}
                        className={`my-3 w-full min-w-0 max-w-full overflow-hidden rounded-md border px-4 py-3 ${config.surfaceClassName}`}
                    >
                        <Row className={`mb-1.5 items-center gap-2 ${config.toneClassName}`}>
                            <Icon icon={config.icon} size={18} className={config.toneClassName} />
                            <Text className={`text-sm font-semibold ${config.toneClassName}`}>
                                {config.label}
                            </Text>
                        </Row>
                        {segment.markdown ? (
                            <View className="min-w-0 max-w-full">
                                <EnrichedMarkdownText
                                    selectable
                                    selectionColor={selectionColor}
                                    flavor="github"
                                    markdown={segment.markdown}
                                    markdownStyle={alertMarkdownStyle}
                                    onLinkPress={handleLinkPress}
                                />
                            </View>
                        ) : null}
                    </View>
                )
            })}
        </View>
    )
}
