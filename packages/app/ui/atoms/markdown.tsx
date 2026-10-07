import { useCallback, useEffect, useMemo, useState, type Ref } from 'react'
import { EnrichedMarkdownText } from 'react-native-enriched-markdown'
import { Image as ReactNativeImage, Platform } from 'react-native'
import { useCSSVariable, useResolveClassNames } from 'uniwind'
import { Row, View } from 'app/design/view'
import { Text } from 'app/design/typography'
import { useTheme, useThemeValue } from 'app/design/theme'
import { appSetting, isExternalUrl, openExternalLink, sanitazeUrl } from 'app/lib/util'
import { useRouter, useCurrentTabPath } from 'app/lib/hooks/router'
import { nativeTabPageHref } from 'app/lib/navigation/tab-history'
import { normalizeLinkHref } from 'app/components/form-fields/editor-mention-html'
import { Icon } from 'app/ui/atoms/icon'
import LazyCodeBlock from 'app/ui/atoms/code-block-lazy'
import Image from 'app/ui/atoms/image'
import { splitMarkdownSegments } from 'app/lib/markdown/segments'
import { splitSizedMarkdownImages } from 'app/lib/markdown/images'
import { APP_URL, UNA_URL } from 'app/config'

type AlertType = 'NOTE' | 'TIP' | 'IMPORTANT' | 'WARNING' | 'CAUTION'

/** Blocks produced by lib/markdown (segments.ts + images.ts). */
type MarkdownSegment =
    | { kind: 'markdown'; markdown: string }
    | { kind: 'lead'; markdown: string }
    | { kind: 'code'; code: string; language?: string | null }
    | { kind: 'alert'; alertType: AlertType; markdown: string }
    | { kind: 'image'; src: string; alt?: string; width?: number; height?: number }

/** Style object for react-native-enriched-markdown (one entry per element type). */
type MarkdownStyle = Record<string, Record<string, any>>

type ImagePart = Extract<MarkdownSegment, { kind: 'image' }> | { kind: 'markdown'; markdown: string }

// GFM on native; the web build has no `flavor` prop and would put it on the <div>.
const nativeFlavor = Platform.OS === 'web' ? {} : { flavor: 'github' as const }

const headingScale = {
    regular: {
        h1: { fontSize: 36, fontWeight: '700', lineHeight: 40, marginTop: 12, marginBottom: 12 },
        h2: { fontSize: 24, fontWeight: '700', lineHeight: 32, marginTop: 8, marginBottom: 8 },
        h3: { fontSize: 20, fontWeight: '700', lineHeight: 28, marginTop: 8, marginBottom: 8 },
        h4: { fontSize: 18, fontWeight: '600', lineHeight: 28, marginTop: 8, marginBottom: 4 },
        h5: { fontSize: 16, fontWeight: '600', lineHeight: 24, marginTop: 8, marginBottom: 4 },
        h6: { fontSize: 14, fontWeight: '600', lineHeight: 20, marginTop: 8, marginBottom: 4 },
    },
    small: {
        h1: { fontSize: 30, fontWeight: '700', lineHeight: 36, marginTop: 8, marginBottom: 8 },
        h2: { fontSize: 22, fontWeight: '700', lineHeight: 28, marginTop: 8, marginBottom: 6 },
        h3: { fontSize: 18, fontWeight: '700', lineHeight: 24, marginTop: 8, marginBottom: 6 },
        h4: { fontSize: 16, fontWeight: '600', lineHeight: 22, marginTop: 8, marginBottom: 4 },
        h5: { fontSize: 14, fontWeight: '600', lineHeight: 20, marginTop: 8, marginBottom: 4 },
        h6: { fontSize: 12, fontWeight: '600', lineHeight: 18, marginTop: 8, marginBottom: 4 },
    },
}

const alertConfig: Record<AlertType, { label: string; icon: string; surfaceClassName: string; toneClassName: string }> = {
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

const markdownImageDestinationPattern = /(!\[[^\]]*\]\(\s*<?)([^)\s>]+)(>?)/g
const unaStoragePathPattern = /^\/?sys_[^/]+_files\//
const markdownImageWidth = 1920

function normalizeMarkdownImageSources(markdown: string) {
    const unaBaseUrl = String(UNA_URL || '').replace(/\/$/, '')
    const optimizerBaseUrl = Platform.OS === 'web'
        ? ''
        : String(appSetting('config', 'native_app_images_url') || APP_URL || '').replace(/\/$/, '')

    return String(markdown || '').replace(
        markdownImageDestinationPattern,
        (match: string, prefix: string, destination: string, suffix: string) => {
            if (
                destination.startsWith('/_next/image?')
                || /^(?:data:image|blob:)/i.test(destination)
                || destination.startsWith('/static/')
            ) {
                return match
            }

            let source = destination
            if (unaStoragePathPattern.test(source)) {
                source = `/s/${source.replace(/^\/+/, '')}`
            }

            if (!/^https?:\/\//i.test(source)) {
                if (!unaBaseUrl) return match
                source = `${unaBaseUrl}/${source.replace(/^\/+/, '')}`
            }

            // Match the shared Image atom: optimize UNA-hosted media through
            // Next on web and through the configured app image host on native.
            if (!unaBaseUrl || !source.startsWith(`${unaBaseUrl}/`)) {
                return `${prefix}${source}${suffix}`
            }
            if (Platform.OS !== 'web' && !optimizerBaseUrl) {
                return `${prefix}${source}${suffix}`
            }

            const optimized = `${optimizerBaseUrl}/_next/image?url=${encodeURIComponent(source)}&w=${markdownImageWidth}&q=75`
            return `${prefix}${optimized}${suffix}`
        },
    )
}

function resolveMarkdownImageSource(destination: string) {
    const unaBaseUrl = String(UNA_URL || '').replace(/\/$/, '')
    let source = String(destination || '')

    if (
        /^(?:https?:\/\/|data:image|blob:)/i.test(source)
        || source.startsWith('/static/')
    ) {
        return source
    }

    if (unaStoragePathPattern.test(source)) {
        source = `/s/${source.replace(/^\/+/, '')}`
    }

    if (!unaBaseUrl) return source
    return `${unaBaseUrl}/${source.replace(/^\/+/, '')}`
}

function normalizeSegmentImages(segments: MarkdownSegment[]): MarkdownSegment[] {
    return segments.flatMap((segment) => {
        if (segment.kind === 'code' || segment.kind === 'alert' || segment.kind === 'image') return segment

        return (splitSizedMarkdownImages(segment.markdown) as ImagePart[]).map((part): MarkdownSegment => (
            part.kind === 'image'
                ? { ...part, src: resolveMarkdownImageSource(part.src) }
                : {
                    ...segment,
                    markdown: normalizeMarkdownImageSources(part.markdown),
                }
        ))
    })
}

function SizedMarkdownImage({ alt, height, src, width }: { alt?: string; height?: number; src: string; width?: number }) {
    const [intrinsicRatio, setIntrinsicRatio] = useState<number | null>(null)

    useEffect(() => {
        if (width && height) return

        ReactNativeImage.getSize(
            src,
            (intrinsicWidth, intrinsicHeight) => {
                if (intrinsicWidth > 0 && intrinsicHeight > 0) {
                    setIntrinsicRatio(intrinsicWidth / intrinsicHeight)
                }
            },
            () => {},
        )
    }, [height, src, width])

    const fallbackSize = width || height || 200
    // parseHtmlImage guarantees at least one dimension, so the other side is set here.
    const resolvedWidth = width || (intrinsicRatio ? height! * intrinsicRatio : fallbackSize)
    const resolvedHeight = height || (intrinsicRatio ? width! / intrinsicRatio : fallbackSize)

    return (
        <Image
            alt={alt}
            contentFit="contain"
            height={resolvedHeight}
            nobg
            sizes={`${resolvedWidth}px`}
            src={src}
            style={{
                borderRadius: 8,
                height: resolvedHeight,
                marginBottom: 16,
                maxWidth: '100%',
                width: resolvedWidth,
            }}
            width={resolvedWidth}
        />
    )
}

type MarkdownSegmentsProps = {
    alertMarkdownStyle: MarkdownStyle
    handleLinkPress: (event: { url?: string }) => void
    leadMarkdownStyle: MarkdownStyle
    markdownStyle: MarkdownStyle
    segments: MarkdownSegment[]
    selectionColor?: string
}

function MarkdownSegments({
    alertMarkdownStyle,
    handleLinkPress,
    leadMarkdownStyle,
    markdownStyle,
    segments,
    selectionColor,
}: MarkdownSegmentsProps) {
    return segments.map((segment, index) => {
        if (segment.kind === 'image') {
            return (
                <SizedMarkdownImage
                    key={`image-${index}-${segment.src}`}
                    alt={segment.alt}
                    height={segment.height}
                    src={segment.src}
                    width={segment.width}
                />
            )
        }

        if (segment.kind === 'code') {
            return (
                <LazyCodeBlock
                    key={`code-${index}`}
                    code={segment.code}
                    language={segment.language}
                />
            )
        }

        if (segment.kind === 'markdown') {
            return (
                <View
                    key={`markdown-${index}`}
                    className={`${index > 0 ? 'markdown-continuation' : ''} min-w-0 max-w-full`}
                >
                    <EnrichedMarkdownText
                        selectable
                        selectionColor={selectionColor}
                        {...nativeFlavor}
                        markdown={segment.markdown}
                        markdownStyle={markdownStyle}
                        onLinkPress={handleLinkPress}
                    />
                </View>
            )
        }

        if (segment.kind === 'lead') {
            return (
                <View
                    key={`lead-${index}`}
                    className="my-3 w-full min-w-0 max-w-full text-lg lg:text-xl text-secondary-foreground"
                >
                    <EnrichedMarkdownText
                        selectable
                        selectionColor={selectionColor}
                        {...nativeFlavor}
                        markdown={segment.markdown}
                        markdownStyle={leadMarkdownStyle}
                        onLinkPress={handleLinkPress}
                    />
                </View>
            )
        }

        const config = alertConfig[segment.alertType]
        const alertSegments = normalizeSegmentImages(splitMarkdownSegments(segment.markdown) as MarkdownSegment[])
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
                        <MarkdownSegments
                            alertMarkdownStyle={alertMarkdownStyle}
                            handleLinkPress={handleLinkPress}
                            leadMarkdownStyle={leadMarkdownStyle}
                            // Alert bodies use the tighter paragraph/list margins.
                            markdownStyle={alertMarkdownStyle}
                            segments={alertSegments}
                            selectionColor={selectionColor}
                        />
                    </View>
                ) : null}
            </View>
        )
    })
}

// Cross-platform Markdown renderer built on `react-native-enriched-markdown`
// (native text on iOS/Android, md4c/WASM on web — no WebView). Content is
// expected to arrive as Markdown; link presses route internally via the app
// router and fall back to the system browser for external URLs.
type MarkdownProps = {
    /** Markdown source. */
    data?: string | null
    /** `u-vanilla-html-small` shrinks the text. */
    customClassName?: string
    className?: string
    innerRef?: Ref<any>
}

export default function ElementMarkdown({ data, customClassName, className = '', innerRef }: MarkdownProps) {
    const { colors } = useTheme()
    const mutedBg = useThemeValue('rgba(3,7,18,0.05)', 'rgba(255,255,255,0.06)')
    const borderColorFallback = useThemeValue('rgba(3,7,18,0.12)', 'rgba(255,255,255,0.12)')
    const cardBgFallback = useThemeValue('rgba(255,255,255,1)', 'rgba(24,24,27,1)')
    const pageBgFallback = useThemeValue('rgba(244,244,245,1)', 'rgba(12,12,14,1)')
    const secondaryBgFallback = useThemeValue('rgba(228,228,231,1)', 'rgba(39,39,42,1)')
    const [
        secondaryForegroundToken,
        cardBackgroundToken,
        pageBackgroundToken,
        secondaryBackgroundToken,
        cardForegroundToken,
        borderToken,
    ] = useCSSVariable([
        '--color-secondary-foreground',
        '--color-card',
        '--color-background',
        '--color-secondary',
        '--color-card-foreground',
        '--color-border',
    ])
    const secondaryForeground = Platform.OS === 'web'
        ? 'var(--color-secondary-foreground)'
        : (secondaryForegroundToken || colors.default)
    const leadTextStyle = useResolveClassNames('text-lg lg:text-xl text-secondary-foreground')
    const leadTextColor = Platform.OS === 'web'
        ? secondaryForeground
        : (leadTextStyle.color || secondaryForeground)
    const router = useRouter()
    const tabPath = useCurrentTabPath()

    const isSmall = customClassName === 'u-vanilla-html-small'
    const fontSize = isSmall ? 14 : 16
    const lineHeight = isSmall ? 18 : 22

    const navigate = useCallback((rawUrl?: string) => {
        if (!rawUrl) return
        const url = normalizeLinkHref(rawUrl)
        if (isExternalUrl(url)) {
            openExternalLink(url)
            return
        }
        const relative = sanitazeUrl(url.replace(/^https?:\/\/[^/]+/, '') || url)
        if (!relative) return
        if (Platform.OS === 'web') {
            router.push(relative)
            return
        }
        // Object href is native-only; the web router is typed for strings.
        router.push(nativeTabPageHref(relative, tabPath) as any)
    }, [router, tabPath])

    const markdownStyle = useMemo((): MarkdownStyle => {
        const borderColor = Platform.OS === 'web'
            ? 'var(--color-border)'
            : (borderToken || borderColorFallback)
        const tableEvenBackground = Platform.OS === 'web'
            ? 'var(--color-card)'
            : (cardBackgroundToken || cardBgFallback)
        const tableOddBackground = Platform.OS === 'web'
            ? 'var(--color-background)'
            : (pageBackgroundToken || pageBgFallback)
        const tableHeaderBackground = Platform.OS === 'web'
            ? 'var(--color-secondary)'
            : (secondaryBackgroundToken || secondaryBgFallback)
        const tableForeground = Platform.OS === 'web'
            ? 'var(--color-card-foreground)'
            : (cardForegroundToken || colors.default)
        const headingStyle = {
            color: Platform.OS === 'web' ? 'var(--color-popover-foreground)' : colors.default,
            // Native EnrichedMarkdown looks up a typeface by this string.
            // Passing the Uniwind token `font-title` can abort Android after
            // the first heading lays out — keep the family on web only.
            ...(Platform.OS === 'web' ? { fontFamily: 'var(--font-title)' } : {}),
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
            table: {
                color: tableForeground,
                borderColor,
                headerBackgroundColor: tableHeaderBackground,
                headerTextColor: tableForeground,
                rowEvenBackgroundColor: tableEvenBackground,
                rowOddBackgroundColor: tableOddBackground,
            },
            thematicBreak: { color: borderColor },
        }
    }, [
        borderColorFallback,
        borderToken,
        cardBackgroundToken,
        cardBgFallback,
        cardForegroundToken,
        colors.default,
        colors.primary,
        fontSize,
        isSmall,
        lineHeight,
        mutedBg,
        pageBackgroundToken,
        pageBgFallback,
        secondaryBackgroundToken,
        secondaryBgFallback,
    ])

    const alertMarkdownStyle = useMemo(() => ({
        ...markdownStyle,
        paragraph: { ...markdownStyle.paragraph, marginTop: 4, marginBottom: 4 },
        list: { ...markdownStyle.list, marginTop: 4, marginBottom: 4 },
    }), [markdownStyle])

    const leadMarkdownStyle = useMemo(() => ({
        ...markdownStyle,
        paragraph: {
            ...markdownStyle.paragraph,
            color: leadTextColor,
            fontSize: leadTextStyle.fontSize || 18,
            lineHeight: leadTextStyle.lineHeight || 28,
            marginTop: 0,
            marginBottom: 0,
        },
        list: {
            ...markdownStyle.list,
            color: leadTextColor,
            fontSize: leadTextStyle.fontSize || 18,
            lineHeight: leadTextStyle.lineHeight || 28,
        },
        strong: { ...markdownStyle.strong, color: leadTextColor },
        em: { ...markdownStyle.em, color: leadTextColor },
    }), [leadTextColor, leadTextStyle.fontSize, leadTextStyle.lineHeight, markdownStyle])

    const segments = useMemo(
        () => normalizeSegmentImages(splitMarkdownSegments(data) as MarkdownSegment[]),
        [data],
    )
    const selectionColor = (colors.outline || colors.primary) as string
    const handleLinkPress = useCallback((event: { url?: string }) => navigate(event?.url), [navigate])

    if (!data) return null

    return (
        <View className={`max-w-full u-vanilla-html ${customClassName || ''} ${className}`.trim()} ref={innerRef}>
            <MarkdownSegments
                alertMarkdownStyle={alertMarkdownStyle}
                handleLinkPress={handleLinkPress}
                leadMarkdownStyle={leadMarkdownStyle}
                markdownStyle={markdownStyle}
                segments={segments}
                selectionColor={selectionColor}
            />
        </View>
    )
}
