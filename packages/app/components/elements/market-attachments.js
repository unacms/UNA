import { View, Row } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import { BlockWrapper } from 'app/components/block-wrapper'

const VERSION_RE = /[-_]v\.?(\d+(?:\.\d+)*)/i
const UPDATE_RE = /_update_(\d+(?:\.\d+)*)_(\d+(?:\.\d+)*)/i

function compareVersions(a, b) {
    const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0)
    const pb = String(b).split('.').map((n) => parseInt(n, 10) || 0)
    const len = Math.max(pa.length, pb.length)
    for (let i = 0; i < len; i++) {
        const diff = (pa[i] || 0) - (pb[i] || 0)
        if (diff) return diff
    }
    return 0
}

function getDownloadUrl(item) {
    return item?.url || item?.file_url || item?.src || ''
}

function classifyAttachments(data) {
    const items = Array.isArray(data) ? data : []
    const versions = []
    const updates = []

    for (const item of items) {
        const name = item?.file_name || ''
        const updateMatch = name.match(UPDATE_RE)
        if (updateMatch) {
            updates.push({
                ...item,
                kind: 'update',
                versionFrom: updateMatch[1],
                versionTo: updateMatch[2],
                downloadUrl: getDownloadUrl(item),
            })
            continue
        }

        const versionMatch = name.match(VERSION_RE)
        if (versionMatch) {
            versions.push({
                ...item,
                kind: 'version',
                version: versionMatch[1],
                downloadUrl: getDownloadUrl(item),
            })
        }
    }

    versions.sort((a, b) => compareVersions(b.version, a.version))
    updates.sort((a, b) => {
        const to = compareVersions(b.versionTo, a.versionTo)
        if (to) return to
        return compareVersions(b.versionFrom, a.versionFrom)
    })

    return {
        latest: versions[0] || null,
        older: versions.slice(1),
        updates,
    }
}

function formatKb(bytes) {
    if (!bytes || bytes <= 0) return null
    return `${Math.round(bytes / 1024)} Kb`
}

function DownloadCard({ title, size, href, featured = false }) {
    const sizeLabel = formatKb(size)
    return (
        <Link href={href}>
            <Row className=" gap-x-3 my-1 items-center justify-start">
                {featured ? (
                    <View className="">
                        <Icon icon="Check" size={20} className="text-emerald-500" />
                    </View>
                ) : <View className="">
                <Icon icon="Dot" size={20} className="text-text-foreground" />
            </View>}

                <Text className="text-sm  text-foreground" numberOfLines={1}>
                    {title}{sizeLabel ? ` (${sizeLabel})` : ''}
                </Text>

            </Row>
        </Link>
    )
}

function Section({ title, children }) {
    if (!children) return null
    return (
        <View className="w-full gap-3">
            <Text className="text-xl font-semibold text-foreground">{title}</Text>
            {children}
        </View>
    )
}

export default function ElementMarketAttachments({ data, blockWrapperProps }) {
    const { latest, older, updates } = classifyAttachments(data)

    if (!latest && older.length === 0 && updates.length === 0) {
        return null
    }

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className="w-full mx-auto  gap-8 lg:p-4 p-2">
                {latest ? (
                    <Section title="Latest version">
                        <Row className="flex-wrap">
                            <View className="p-1 w-full sm:w-1/2 lg:w-1/3">
                                <DownloadCard
                                    title={latest.version}
                                    size={latest.size || latest.file_size}
                                    href={latest.downloadUrl}
                                    featured
                                />
                            </View>
                        </Row>
                    </Section>
                ) : null}

                {older.length > 0 ? (
                    <Section title="Older versions">
                        <View className="flex-wrap -m-1">
                            {older.map((item, index) => (
                               
                                    <DownloadCard
                                        title={item.version}
                                        size={item.size || item.file_size}
                                        href={item.downloadUrl}
                                    />
                               
                            ))}
                        </View>
                    </Section>
                ) : null}

                {updates.length > 0 ? (
                    <Section title="Updates">
                        <View className="flex-wrap -m-1">
                            {updates.map((item, index) => (
                               
                                    <DownloadCard
                                        title={`from ${item.versionFrom} to ${item.versionTo}`}
                                        size={item.size || item.file_size}
                                        href={item.downloadUrl}
                                    />
                               
                            ))}
                        </View>
                    </Section>
                ) : null}
            </View>
        </BlockWrapper>
    )
}
