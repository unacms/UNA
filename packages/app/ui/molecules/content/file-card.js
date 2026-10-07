import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import Link from 'app/ui/atoms/link'
import { Icon } from 'app/ui/atoms/icon'
import { formatFileSize, fileNameExt } from 'app/lib/util'

/**
 * Downloadable file row (post attachments, comment files).
 * `size` is bytes or a size string the API already formatted (UNA comments send "3 KB").
 * `ext` is a fallback for names without an extension.
 */
export default function FileCard({ href, name, size, ext, compact = false }) {
    const fileExt = fileNameExt(name) || String(ext || '').toLowerCase()
    const sizeLabel = typeof size === 'number' || /^\d+$/.test(String(size ?? '')) ? formatFileSize(size) : (size || '')
    const meta = [fileExt.toUpperCase(), sizeLabel].filter(Boolean).join(' · ')

    return (
        <Link href={href} mode="plain" className="block">
            <Row className={`items-center gap-3 rounded-lg shadow-btn-outline dark:shadow-btn-outline-deep ${compact ? 'p-1.5' : 'p-2'}`}>
                <View className={`shrink-0 items-center justify-center rounded-md bg-muted ${compact ? 'h-8 w-8' : 'h-10 w-10'}`}>
                    <Icon icon="File" size={compact ? 16 : 20} className="text-muted-foreground" />
                </View>
                <View className="min-w-0 flex-1">
                    <Text numberOfLines={1} className="text-sm text-foreground">{name}</Text>
                    {meta ? <Text numberOfLines={1} className="text-xs text-muted-foreground">{meta}</Text> : null}
                </View>
                <Icon icon="Download" size={16} className="text-muted-foreground" />
            </Row>
        </Link>
    )
}
