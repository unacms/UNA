/*
 * Row height estimates for LegendList (native). These only seed the virtual
 * layout — real heights are measured after mount — so being roughly right is
 * what matters: a good guess means less scroll-bar jitter and fewer blank
 * frames on fast scroll.
 *
 * The per-unit numbers are UNA knowledge, not list knowledge; if they grow
 * beyond feed + notifications they belong in `customization/functions` next
 * to `paddingForList`.
 */

const DEFAULT_ROW = 100
const BLOCK_ROW = 160
// 56px avatar + 8px inside + 2px outside, top and bottom.
const NOTIFICATION_ROW = 76

const ESTIMATED_ITEM_SIZE_BY_UNIT: Record<string, number> = {
    feed: 140,
    notifications: NOTIFICATION_ROW,
}

/** Baseline row height for a unit; explicit prop wins. */
export function resolveEstimatedItemSize(unit: string | undefined, explicitSize: number | undefined): number {
    if (typeof explicitSize === 'number' && explicitSize > 0) {
        return explicitSize
    }
    return ESTIMATED_ITEM_SIZE_BY_UNIT[unit as string] ?? DEFAULT_ROW
}

/** Per-row estimate from the row's content shape. */
export function estimateItemSize(unit: string | undefined, item: any, fallback: number): number {
    if (!item || typeof item !== 'object') {
        return fallback
    }

    // Page blocks (forms, widgets) rendered inside the list.
    if (item.type === 'block') {
        return BLOCK_ROW
    }

    if (unit === 'notifications') {
        return NOTIFICATION_ROW
    }

    if (unit === 'feed') {
        const content = item.content
        const hasImage =
            item.mainImage ||
            (content?.images?.length > 0) ||
            (content?.images_attach?.length > 0)
        const hasVideo = content?.videos_attach?.length > 0
        const hasEmbed = !!content?.embed

        if (hasVideo || hasEmbed) return 360
        if (hasImage) return 420
        if (content?.title && content?.text) return 180
        if (content?.text) return 140
        return 120
    }

    return fallback
}
