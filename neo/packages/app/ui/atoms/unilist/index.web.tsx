import { VirtuosoGrid, Virtuoso } from 'react-virtuoso'
import type { ViewStyle } from 'react-native'
import { View } from 'app/design/view'
import { useRef, useEffect, useState, useCallback, forwardRef, useMemo, type ComponentType, type HTMLAttributes, type ReactNode } from 'react'
import { paddingForList } from 'app/customization/functions'
import {
    dedupeById,
    renderSlot,
    omitProps,
    NATIVE_ONLY_PROPS,
    IGNORED_PROPS,
    REVEAL_DELAY_MS,
    type UniListProps,
    type UniListSlot,
} from './shared'
import { lazyComponent } from 'app/lib/lazy-component'

// Drag-and-drop (@hello-pangea/dnd) only when a list is actually sortable.
const SortableList = lazyComponent(() => import('./sortable-list'), { name: 'SortableList' })

/*
 * ============================================================================
 * UniList — web. See `shared.ts` for the prop contract.
 *
 * react-virtuoso in one of two shapes — `Virtuoso` (mode 'simple', one
 * column) or `VirtuosoGrid` (flex-wrap grid) — with the same wrapper, header,
 * footer and preload/fade around either. Two escape hatches render no
 * virtualization at all: `sortable` → SortableList, `no_scroll` → plain column.
 * ============================================================================
 */

/**
 * `height` prop → CSS height string, or undefined when it does not describe a
 * real box ('', 'auto', '100%', 0, negative). Undefined means "use the window
 * as the scroller".
 */
function parseHeight(height: unknown): string | undefined {
    if (typeof height === 'number') {
        return height > 0 ? `${height}px` : undefined
    }
    if (typeof height !== 'string') return undefined
    const value = height.trim()
    if (!value || value === '100%' || value === 'auto') return undefined
    const asNumber = Number(value)
    if (!Number.isNaN(asNumber)) {
        return asNumber > 0 ? `${asNumber}px` : undefined
    }
    const asFloat = parseFloat(value)
    if (!Number.isNaN(asFloat) && asFloat <= 0) return undefined
    return value
}

/**
 * Pixels rendered past each edge of the viewport, so window scroll never shows
 * a blank band on a fast wheel. A module constant: Virtuoso republishes every
 * prop on each render, and a new object makes it recompute the visible range.
 */
const INCREASE_VIEWPORT_BY = { top: 3000, bottom: 3000 }

/**
 * Row key by item id, not index: a row prepended (a new post over the socket)
 * or removed then keeps the other rows mounted, with their state and measured
 * size. A module constant for the same reason as INCREASE_VIEWPORT_BY.
 */
const computeItemKey = (index: number, item: any) => item?.id ?? item?.key ?? index

type Overscan = { main: number; reverse: number }

/**
 * Virtuoso `overscan` with the same value on both sides. A bare number only
 * extends the list in the direction it last grew, so the visible range depends
 * on that direction. When a grid item is re-measured (a card's button chunk
 * loads and the card grows), VirtuosoGrid lays out its rows with the new height
 * while its list boundary still has the old one; with a one-sided overscan each
 * pass then flips the direction, the range alternates between two values, and
 * the recursion ends in "Maximum call stack size exceeded". With equal sides the
 * range depends on the scroll position only, so the next pass repeats it and
 * Virtuoso stops there.
 */
function overscanBothSides(overscan: unknown, fallback: number): Overscan {
    if (overscan && typeof overscan === 'object') return overscan as Overscan
    const px = typeof overscan === 'number' ? overscan : fallback
    return { main: px, reverse: px }
}

/** Grid container: rows wrap horizontally. */
const GridListComponent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function GridListComponent({ className, ...props }, ref) {
    return (
        <div
            ref={ref}
            className={`u-max-width-block w-full mx-auto flex flex-wrap flex-row ${className || ''}`}
            {...props}
        />
    )
})

/**
 * Preload → fade in. The list stays mounted under the skeleton (at zero
 * height) so Virtuoso can measure and the header's filter form keeps its
 * state. Once the preload goes away — and, for a grid, once Virtuoso has laid
 * the rows out (`waitForGrid`) — the list fades in after a few frames, so it
 * shows rows that are already laid out.
 *
 * The skeleton stays up until then: the caller drops it as soon as the data
 * is there, and an empty area during the wait reads as a slower load.
 *
 * @returns whether the list shows, and the skeleton to render until it does.
 */
function useListReveal(preloadComponent: UniListSlot, waitForGrid: boolean) {
    const [showContent, setShowContent] = useState(!preloadComponent)
    // A slot can be a component or a render function, which useState and its
    // setter would call; pass it through a callback so the slot itself is kept.
    const [heldPreload, setHeldPreload] = useState<UniListSlot>(() => preloadComponent)

    if (preloadComponent) {
        if (showContent) setShowContent(false)
        if (!heldPreload) setHeldPreload(() => preloadComponent)
    }

    useEffect(() => {
        if (preloadComponent || waitForGrid || showContent) return undefined
        const timer = setTimeout(() => {
            setShowContent(true)
            setHeldPreload(undefined)
        }, REVEAL_DELAY_MS)
        return () => clearTimeout(timer)
    }, [preloadComponent, waitForGrid, showContent])

    return { showContent, skeleton: showContent ? null : (preloadComponent || heldPreload) }
}

export type { UniListProps } from './shared'

export default function UniList(props: UniListProps) {
    const {
        data: rawData,
        renderItem,
        preloadComponent,
        ListHeaderComponent,
        ListFooterComponent,
        onEndReached,
        onStartReached,
        refer,
        unit,
        endpoint,
        layout,
        mode,
        height,
        useWindowScroll: useWindowScrollProp,
        sortable,
        onSort,
        scrollToLastItem,
        paddingTop,
        components: componentsProp,
        no_scroll,
        flowLayout,
        // consumed only to keep them out of `rest`: url is native's remount
        // key, pull-to-refresh is native only
        url,
        refreshing,
        onRefresh,
        overscan: overscanProp,
        ...restProps
    } = props
    // Anything left over is a Virtuoso prop (computeItemKey, …).
    const rest = omitProps(restProps, [...NATIVE_ONLY_PROPS, ...IGNORED_PROPS])
    // Notifications are short rows; everything else pre-renders generously.
    const overscan = useMemo(
        () => overscanBothSides(overscanProp, unit === 'notifications' ? 100 : 900),
        [overscanProp, unit]
    )

    const uniRef = useRef<any>(undefined)
    const rows = useMemo(() => dedupeById(rawData), [rawData])
    const isGrid = mode != 'simple'
    const listPadding = paddingForList(endpoint)

    // ------------------------------------------------------------------
    // Scroller: own box or the window
    // ------------------------------------------------------------------

    const fixedHeight = parseHeight(height)
    // No usable height → the window scrolls, whatever the prop says: a
    // zero-sized scroller makes Virtuoso throw. With a height the prop decides
    // and the default is an own scroller.
    const isWindowScroll = !fixedHeight || (useWindowScrollProp ?? false)
    // Web CSS length ('400px', '50vh'), wider than RN DimensionValue.
    const wrapperStyle = isWindowScroll ? undefined : ({ height: fixedHeight } as ViewStyle)
    const virtuosoStyle = {
        ...(isWindowScroll ? {} : { height: fixedHeight }),
        ...(paddingTop ? { paddingTop } : {}),
    }

    // ------------------------------------------------------------------
    // Preload → fade in (useListReveal)
    // ------------------------------------------------------------------
    //
    // VirtuosoGrid reports ready only after it has *measured a row*, so an
    // empty grid never reports; do not wait for it when there is nothing to
    // lay out, or the header and the empty state would stay hidden.

    const [gridReady, setGridReady] = useState(false)
    const waitForGrid = isGrid && !gridReady && rows.length > 0
    const { showContent, skeleton } = useListReveal(preloadComponent, waitForGrid)

    const onGridReadyStateChanged = useCallback((ready: boolean) => {
        if (ready) setGridReady(true)
    }, [])

    // ------------------------------------------------------------------
    // Virtuoso pieces
    // ------------------------------------------------------------------

    const itemContent = useCallback((index: number, item: any) => (
        <View className="min-h-px">
            {renderItem({ item, index })}
        </View>
    ), [renderItem])

    /** Grid cell: `layout` class sets the column width (w-1/2, w-1/3, …). */
    const GridItemComponent = useMemo(() => {
        const widthClass = layout || 'w-full'
        return function GridItem({ className, ...itemProps }: HTMLAttributes<HTMLDivElement>) {
            return <div className={`${widthClass} ${className || 'mb-3'}`} {...itemProps} />
        }
    }, [layout])

    const FooterComponent = useCallback(() => {
        if (!ListFooterComponent) return null
        return typeof ListFooterComponent === 'function'
            ? <ListFooterComponent />
            : (ListFooterComponent as ReactNode)
    }, [ListFooterComponent])

    // ------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------

    if (no_scroll) {
        return (
            <View className={flowLayout ? 'w-full' : 'h-full min-h-0'}>
                {rows.map((item, index) => (
                    <View
                        key={item?.id ?? item?.key ?? `row-${index}`}
                        className={flowLayout || rows.length !== 1 ? 'min-h-px' : 'h-full min-h-0'}
                    >
                        {renderItem({ item, index })}
                    </View>
                ))}
            </View>
        )
    }

    if (sortable) {
        return (
            <SortableList
                data={rows}
                renderItem={renderItem}
                onSort={onSort}
                style={wrapperStyle}
            />
        )
    }

    const List = (isGrid ? VirtuosoGrid : Virtuoso) as ComponentType<any>
    const virtuosoProps = {
        data: rows,
        useWindowScroll: isWindowScroll,
        style: virtuosoStyle,
        ref: refer ?? uniRef,
        startReached: onStartReached,
        endReached: onEndReached,
        overscan,
        increaseViewportBy: INCREASE_VIEWPORT_BY,
        components: {
            ...(isGrid ? { List: GridListComponent, Item: GridItemComponent } : {}),
            Footer: FooterComponent,
            ...componentsProp,
        },
        itemContent,
        computeItemKey,
        ...(scrollToLastItem ? { initialTopMostItemIndex: rows.length } : {}),
        ...(isGrid ? { readyStateChanged: onGridReadyStateChanged } : {}),
        ...rest,
    }

    return (
        <View className="@container/list relative" style={wrapperStyle}>
            {skeleton ? <View>{renderSlot(skeleton)}</View> : null}
            <View
                className={`${listPadding} ${
                    showContent
                        ? 'transition-opacity duration-150 ease-out motion-reduce:transition-none opacity-100'
                        : 'absolute inset-x-0 top-0 h-0 overflow-hidden opacity-0 pointer-events-none'
                }`}
                style={wrapperStyle}
            >
                {renderSlot(ListHeaderComponent)}
                <List {...virtuosoProps} />
            </View>
        </View>
    )
}
