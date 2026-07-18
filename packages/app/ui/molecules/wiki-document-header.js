import { Row, View } from 'app/design/view'
import { H1C, Text } from 'app/design/typography'
import { appSetting, openExternalLink, setClipboard } from 'app/lib/util'
import Image from 'app/ui/atoms/image'
import { NeoButtonLink } from 'app/design/controls'
import Badge from 'app/ui/molecules/badge'
import DropdownMenu from 'app/ui/atoms/dropdown-menu'
import { Linking, Platform } from 'react-native'
import { Icon } from 'app/ui/atoms/icon'

const unaStoragePathPattern = /^\/?sys_[^/]+_files\//
const markdownSourceStoragePrefix = 'wiki-markdown-source:v1:'
const defaultAiPrompt = 'Read this documentation page, so I can ask questions about it:\n\n{url}'
const markdownBaseMenuItems = [
    {
        id: 'copy-markdown',
        icon: 'Copy',
        title: 'Copy as Markdown',
    },
    {
        id: 'view-markdown',
        icon: 'ExternalLink',
        title: 'View as Markdown',
    },
]

function fallbackPlatformLabel(value) {
    return String(value || '')
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase())
}

function resolveIconUrl(value) {
    const source = String(value || '')
    return unaStoragePathPattern.test(source)
        ? `/s/${source.replace(/^\/+/, '')}`
        : source
}

function resolvePageUrl(value) {
    const source = String(value || '')
    if (/^https?:\/\//i.test(source)) return source

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const pathname = source
            ? (source.startsWith('/') ? source : `/${source}`)
            : window.location.pathname
        return new URL(pathname, window.location.origin).toString()
    }

    const appUrl = String(appSetting('config', 'app_url') || '').replace(/\/$/, '')
    return appUrl && source ? `${appUrl}/${source.replace(/^\/+/, '')}` : source
}

function createAiPrompt(template, pageUrl) {
    return String(template || '')
        .split('{url}')
        .join(pageUrl)
}

function createAiAppUrl(template, prompt, pageUrl) {
    return String(template || '')
        .split('{prompt}')
        .join(encodeURIComponent(prompt))
        .split('{url}')
        .join(encodeURIComponent(pageUrl))
}

async function openAiApp(url) {
    if (/^https?:\/\//i.test(url)) {
        await openExternalLink(url)
        return
    }
    await Linking.openURL(url)
}

async function copyMarkdownSource(markdownSource) {
    try {
        await setClipboard(markdownSource)
        return
    } catch {
        if (Platform.OS !== 'web' || typeof document === 'undefined') return
    }

    const textarea = document.createElement('textarea')
    textarea.value = markdownSource
    textarea.setAttribute('readonly', '')
    textarea.style.left = '-9999px'
    textarea.style.position = 'fixed'
    document.body.appendChild(textarea)
    textarea.select()

    try {
        document.execCommand('copy')
    } finally {
        textarea.remove()
    }
}

export default function WikiDocumentHeader({ markdownSource = '', metadata, pageUrl = '' }) {
    const {
        description,
        iconUrl,
        packageName,
        platforms = [],
        sourceCodeUrl,
        tags = [],
        title,
    } = metadata || {}
    const config = appSetting('wiki', 'document_header') || {}
    const platformMap = config.platforms || {}
    const tagConfig = config.tag || {}
    const aiApps = config.ai_apps || {}
    const resolvedPageUrl = resolvePageUrl(pageUrl)
    const aiPrompt = createAiPrompt(config.ai_prompt || defaultAiPrompt, resolvedPageUrl)
    const markdownMenuItems = [
        ...markdownBaseMenuItems,
        ...Object.entries(aiApps).flatMap(([id, aiApp]) => (
            aiApp?.label && aiApp?.url
                ? [{
                    id: `ai-${id}`,
                    aiAppUrl: createAiAppUrl(aiApp.url, aiPrompt, resolvedPageUrl),
                    icon: aiApp.icon || 'Bot',
                    title: aiApp.label,
                }]
                : []
        )),
    ]
    const iconSize = Number(config.icon_size) || 56
    const resolvedIconUrl = resolveIconUrl(iconUrl)

    if (!title) return null

    const handleMarkdownAction = (item) => {
        if (item?.id === 'copy-markdown') {
            void copyMarkdownSource(markdownSource)
            return
        }

        if (item?.aiAppUrl) {
            void openAiApp(item.aiAppUrl).catch(() => {})
            return
        }

        if (item?.id !== 'view-markdown') return

        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            const sourceId = globalThis.crypto?.randomUUID?.()
                || `${Date.now()}-${Math.random().toString(36).slice(2)}`
            const storageKey = `${markdownSourceStoragePrefix}${sourceId}`

            try {
                window.localStorage.setItem(
                    storageKey,
                    JSON.stringify({ source: markdownSource, title }),
                )
                window.open(
                    `/wiki/markdown-source#${encodeURIComponent(storageKey)}`,
                    '_blank',
                    'noopener,noreferrer',
                )
                window.setTimeout(
                    () => window.localStorage.removeItem(storageKey),
                    5 * 60 * 1000,
                )
            } catch {
                void copyMarkdownSource(markdownSource)
            }
            return
        }

        void openExternalLink(
            `data:text/plain;charset=utf-8,${encodeURIComponent(markdownSource)}`,
        )
    }

    const platformBadges = platforms.map((platform) => {
        const key = String(platform).toLowerCase()
        const platformConfig = platformMap[key] || {}
        return {
            key,
            data: {
                color: platformConfig.color || 'neutral',
                icon: platformConfig.icon || 'Globe',
                text: platformConfig.label || fallbackPlatformLabel(platform),
            },
        }
    })

    return (
        <View className="w-full border-b border-border/60 gap-3 pb-2">
            <Row className="items-center gap-4">
                {resolvedIconUrl ? (
                    <View className="rounded-lg overflow-hidden h-10 w-10 lg:h-12 lg:w-12">
                    <Image
                        alt={`${title} icon`}
                        contentFit="contain"
                        height={iconSize}
                        nobg
                        sizes={`${iconSize}px`}
                        src={resolvedIconUrl}
                        style={{ borderRadius: 12, height: iconSize, width: iconSize }}
                        width={iconSize}
                    /></View>
                ) : null}

                
                    <H1C isfirst islast>{title}</H1C>
                
            </Row>
            
                <View className="min-w-0 flex-1 gap-4">
                    {description ? (
                        <Text className="text-lg leading-6 text-secondary-foreground">
                            {description}
                        </Text>
                    ) : null}

                    {platformBadges.length > 0 || tags.length > 0 ? (
                        <Row className="flex-wrap items-center gap-2 ">
                            {platformBadges.map((badge) => (
                                <Badge
                                    key={`platform-${badge.key}`}
                                    data={{ ...badge.data }}
                                    rounded
                                    size="sm"
                                    variant="secondary"
                                />
                            ))}
                            {tags.map((tag) => (
                                <Badge
                                    key={`tag-${tag}`}
                                    data={{
                                        color: tagConfig.color || 'neutral',
                                        icon: tagConfig.icon || 'Tag',
                                        text: tag,
                                    }}
                                    rounded
                                    size="sm"
                                    variant="outline"
                                />
                            ))}
                        </Row>
                    ) : null}
                    <Row className="flex-wrap items-center justify-between gap-2 ">
                    {packageName ? (
                            <Row className="flex-wrap items-center gap-1">
                                <Icon icon="Package" size={16} className="text-secondary-foreground" />
                                <Text className="text-sm leading-7 text-secondary-foreground">Version:</Text>
                                <Badge
                                    data={{
                                        color: 'neutral',
                                       
                                        text: packageName,
                                    }}
                                    rounded
                                    size="xs"
                                    variant="secondary"
                                />
                                </Row>
                            ) : null}
                        <Row className="flex-wrap items-center gap-2 ">
                        {sourceCodeUrl ? (
                            <NeoButtonLink
                                accessibilityLabel={`View ${title} source code`}
                                asExternal
                                borderShape="capsule"
                                className="self-start"
                                controlSize="mini"
                                href={sourceCodeUrl}
                                image="Github"
                                label="Source"
                                style="borderless"
                                target="_blank"
                            />
                        ) : null}
                         
                        {markdownSource ? (
                            <DropdownMenu
                                items={markdownMenuItems}
                                onSelect={handleMarkdownAction}
                                buttonProps={{
                                    accessibilityLabel: 'Markdown actions',
                                    borderShape: 'capsule',
                                    controlSize: 'mini',
                                    image: 'Copy',
                                    label: 'Copy Page',
                                    style: 'borderless',
                                }}
                                triggerAccessibilityLabel="Markdown actions"
                            />
                        ) : null}
                        </Row>
                    </Row>
                </View>
            
        </View>
    )
}
