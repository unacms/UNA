import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { NeoButton } from 'app/design/controls'
import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getYouTubeVideoId } from 'app/lib/util'
import Youtube from 'app/ui/molecules/content/youtube'

/** A link's preview as UNA sends it (`system` embed provider). `image` and `logo` are addresses an app can load. */
export type EmbedData = {
    url: string
    title?: string
    description?: string
    image?: string
    logo?: string
    domain?: string
}

type EmbedProps = {
    data: EmbedData
    /** `small`: the compact card of a comment (Slack's link preview); anything else: the full card of a post. */
    size?: string
    /** Takes the card off and keeps the link (the comment's author); no button without it. */
    onRemove?: () => void
}

/** A picture of the card, or nothing while it has none or fails to load: no empty box in its place. */
function EmbedImage({ src, className = '', imageClassName = '' }: { src?: string; className?: string; imageClassName?: string }) {
    // The address that failed: another one is tried again.
    const [failedSrc, setFailedSrc] = useState<string | undefined>(undefined)

    if (!src || failedSrc === src)
        return null

    return (
        <View className={`overflow-hidden bg-muted/50 ${className}`}>
            <Image view="cover" className={imageClassName} src={src} alt="" onError={() => setFailedSrc(src)} />
        </View>
    )
}

function EmbedDomain({ data, compact }: { data: EmbedData; compact: boolean }) {
    return (
        <Row className="gap-x-2 items-center">
            <EmbedImage className={compact ? 'h-4 w-4 rounded-sm' : 'h-6 w-6'} src={data.logo} />
            <Text className={compact ? 'text-secondary-foreground text-xs' : 'text-popover-foreground text-sm'} numberOfLines={1}>{data.domain}</Text>
        </Row>
    )
}

/** Compact card: the domain, the title and two lines of text beside a small picture, with an accent rule on the left. */
function EmbedCompact({ data, onRemove }: { data: EmbedData; onRemove?: () => void }) {
    const { t } = useTranslation()

    return (
        <View className="relative max-w-md">
            <Link target="_blank" href={data.url} asExternal>
                <Row className={`gap-3 border-s-4 border-border rounded-e-lg py-1 ps-3 ${onRemove ? 'pe-9' : 'pe-2'}`}>
                    <View className="flex-1 min-w-0 gap-0.5">
                        <EmbedDomain data={data} compact />
                        {!!data.title && (
                            <Text className="text-foreground text-sm font-semibold" numberOfLines={1}>{data.title}</Text>
                        )}
                        {!!data.description && (
                            <Text className="text-secondary-foreground text-sm" numberOfLines={2}>{data.description}</Text>
                        )}
                    </View>
                    <EmbedImage className="h-16 w-16 rounded-md flex-none self-center" imageClassName="rounded-md" src={data.image} />
                </Row>
            </Link>
            {!!onRemove && (
                <View className="absolute top-0 end-0">
                    <NeoButton
                        image="X"
                        style="borderless"
                        controlSize="mini"
                        borderShape="circle"
                        accessibilityLabel={t('Remove preview')}
                        tooltip={t('Remove preview')}
                        onPress={onRemove}
                    />
                </View>
            )}
        </View>
    )
}

const Embed = memo(function Embed({ data, size, onRemove }: EmbedProps) {
    const videoId = getYouTubeVideoId(data.url)
    if (videoId)
        return <Youtube videoId={videoId} size={size} />

    if (size === 'small')
        return <EmbedCompact data={data} onRemove={onRemove} />

    return (
        <Link target="_blank" href={data.url}>
            <Row className="rounded-lg border border-border/60">
                <EmbedImage
                    className="aspect-square h-32 mr-4"
                    imageClassName="rounded-tl-lg rounded-bl-lg"
                    src={data.image || data.logo}
                />
                <View className={`flex-auto my-2 mr-4 ${data.image || data.logo ? '' : 'ml-4'}`}>
                    <Text className="text-popover-foreground text-base font-bold" numberOfLines={1}>{data.title}</Text>
                    <Text className="text-popover-foreground text-sm my-2" numberOfLines={2}>{data.description}</Text>
                    <EmbedDomain data={data} compact={false} />
                </View>
            </Row>
        </Link>
    )
})
export default Embed
