/*
 * ============================================================================
 * UniList — the one virtualized list used by every UNA browse / feed / panel.
 *
 * Two implementations behind one import (`app/ui/atoms/unilist`):
 *   index.tsx      native — LegendList + reanimated scroll bridge
 *   index.web.tsx  web    — react-virtuoso (list or grid) + SortableList
 *
 * This file holds what both share: the prop contract and small helpers.
 * ============================================================================
 */

import type { ComponentType, ReactElement, ReactNode, Ref } from 'react'
import type { SharedValue } from 'react-native-reanimated'
import type { DropResult } from '@hello-pangea/dnd'

/** Slot props may be an element, a component, or a render function. */
export type UniListSlot = ReactNode | ComponentType<any> | (() => ReactNode)

export type UniListRenderItem<T = any> = (info: { item: T; index: number }) => ReactNode

export type UniListProps<T = any> = {
    // Common
    /** Rows; deduped by `id` before render. */
    data?: T[] | null
    renderItem: UniListRenderItem<T>
    /** Identity of the list (scroll cache, remount key). */
    url?: string
    /** UNA unit ('feed', 'notifications', …) — sizing hints. */
    unit?: string
    /** Browse endpoint — drives `paddingForList`. */
    endpoint?: any
    /** Tailwind class wrapped around each row ('w-full', 'w-1/2', …). */
    layout?: string
    /** Skeleton shown while the list is not ready; the list stays mounted underneath on both platforms. */
    preloadComponent?: UniListSlot
    ListHeaderComponent?: UniListSlot
    ListFooterComponent?: UniListSlot
    ListEmptyComponent?: UniListSlot
    onEndReached?: () => void
    onStartReached?: () => void
    onRefresh?: () => void
    refreshing?: boolean
    /** Ref to the underlying list instance. */
    refer?: Ref<any>

    // Native only (ignored on web)
    /** Chat-style: newest at the bottom. */
    inverted?: boolean
    /** Inside a modal — no page-header offset. */
    isModal?: boolean
    /** Caller renders its own header (profile cover). */
    skipHeaderOffset?: boolean
    /** Space to leave for the collapsing cover overlay. */
    coverOverlayPad?: number
    /** Space after the last row for a tab bar drawn over the list (NativeTabs). */
    tabBarInset?: number
    /**
     * Chat (inverted): move the rows up with the keyboard. The value is the part of
     * the keyboard height the screen already pads for (the bar under the composer),
     * like KbStickyView's `offset.opened`.
     */
    keyboardBottomOffset?: number
    /** Reanimated shared value the cover reads. */
    coverScrollY?: SharedValue<number>
    estimatedItemSize?: number
    refreshControl?: ReactElement
    progressViewOffset?: number
    contentContainerStyle?: any
    contentContainerClassName?: string
    scrollProps?: { headerHeight?: number; [key: string]: unknown }

    // Web only (ignored on native)
    /** 'simple' = single column list, else grid. */
    mode?: 'simple' | '' | string
    /** Fixed height → own scroller; none → window scroll. */
    height?: number | string
    useWindowScroll?: boolean
    /** Drag-and-drop reorder (not virtualized). */
    sortable?: boolean
    /** DnD result handler. */
    onSort?: (result: DropResult) => void
    scrollToLastItem?: boolean
    paddingTop?: number | string
    /** Extra Virtuoso `components`. */
    components?: Record<string, any>
    /** Plain column, no virtualization. */
    no_scroll?: boolean
    flowLayout?: boolean

    /**
     * RN ScrollView / FlatList props (`keyboardDismissMode`, `onScrollBeginDrag`,
     * `numColumns`, …) pass straight through on native; leftover Virtuoso props on web.
     */
    [key: string]: unknown
}

/** Rows with a duplicate `id` are dropped, first occurrence wins. O(n). */
export function dedupeById<T>(rows: T[] | null | undefined): T[] {
    if (!rows?.length) return rows ?? []
    const seen = new Set()
    const out: T[] = []
    for (const row of rows) {
        const id = (row as { id?: unknown } | null)?.id
        if (seen.has(id)) continue
        seen.add(id)
        out.push(row)
    }
    return out.length === rows.length ? rows : out
}

/** Slot props may be an element, a component, or a render function. */
export function renderSlot(slot: UniListSlot): ReactNode {
    if (!slot) return null
    return typeof slot === 'function' ? (slot as () => ReactNode)() : slot
}

/** Time the list stays at opacity 0 before fading in (web). */
export const REVEAL_DELAY_MS = 140

/** Handled only by index.web.tsx; must never reach LegendList. */
export const WEB_ONLY_PROPS = [
    'mode', 'height', 'useWindowScroll', 'sortable', 'onSort',
    'scrollToLastItem', 'paddingTop', 'components', 'no_scroll', 'flowLayout',
]

/**
 * RN ScrollView / FlatList props and native-only UniList props. Native passes
 * them through to LegendList; web must strip them or they land on a DOM node.
 */
export const NATIVE_ONLY_PROPS = [
    'inverted', 'isModal', 'skipHeaderOffset', 'coverOverlayPad', 'coverScrollY', 'tabBarInset',
    'keyboardBottomOffset', 'estimatedItemSize', 'refreshControl', 'progressViewOffset', 'scrollProps',
    'contentContainerStyle', 'contentContainerClassName',
    'maxToRenderPerBatch', 'initialNumToRender', 'initialScrollIndex', 'numColumns',
    'keyExtractor', 'extraData', 'keyboardShouldPersistTaps', 'keyboardDismissMode',
    'onScrollBeginDrag', 'onScrollEndDrag', 'onMomentumScrollBegin', 'onMomentumScrollEnd',
]

/** Accepted for backwards compatibility, used by nobody. Stripped everywhere. */
export const IGNORED_PROPS = [
    'useCustomScrollHandler', 'isInPanel', 'viewParams', 'topItemCount',
    'listState', 'storagekey', 'onScrollToIndex',
]

/** Copy of `props` without the given keys. */
export function omitProps<T extends object>(props: T, keys: readonly string[]): Record<string, unknown> {
    const rest = { ...props } as Record<string, unknown>
    for (const key of keys) delete rest[key]
    return rest
}
