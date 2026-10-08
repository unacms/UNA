import type { ReactNode } from 'react'
import { View } from 'app/design/view'
import { cn } from 'app/lib/util'
import type { InlineMediaLayout } from 'app/lib/editor/inline-video'

const ALIGN_CLASS = {
    left: 'items-start',
    center: 'items-center',
    right: 'items-end',
} as const

type InlineMediaFrameProps = InlineMediaLayout & {
    /** Keep the editor's width/height ratio (video); off for cards that size themselves (embed). */
    keepRatio?: boolean
    className?: string
    children: ReactNode
}

/**
 * Body video / embed box: the width the editor gave the image (never wider than the
 * column) at its paragraph's alignment. No width — the whole column, as before.
 */
export default function InlineMediaFrame({ width, height, align, keepRatio, className, children }: InlineMediaFrameProps) {
    const aspectRatio = keepRatio ? (width && height ? width / height : 16 / 9) : undefined
    return (
        <View className={cn('w-full my-3', ALIGN_CLASS[align || 'left'])}>
            <View className={cn('max-w-full', !width && 'w-full', className)} style={{ width, aspectRatio }}>
                {children}
            </View>
        </View>
    )
}
