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
        ...restProps
    } = props
    // Anything left over is a Virtuoso prop (overscan, computeItemKey, …).
    const rest = omitProps(restProps, [...NATIVE_ONLY_PROPS, ...IGNORED_PROPS])

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
    // Preload → fade in
    // ------------------------------------------------------------------
    //
    // The list stays mounted under the skeleton (at zero height) so Virtuoso
    // can measure and the header's filter form keeps its state. Once the
    // preload goes away — and, for a grid, once Virtuoso reports it has laid
    // the rows out — the list fades in after a short delay so the swap does
    // not flash.
    //
    // VirtuosoGrid reports ready only after it has *measured a row*, so an
    // empty grid never reports; do not wait for it when there is nothing to
    // lay out, or the header and the empty state would stay hidden.

    const [gridReady, setGridReady] = useState(false)
    const [showContent, setShowContent] = useState(!preloadComponent)
    const waitForGrid = isGrid && !gridReady && rows.length > 0

    useEffect(() => {
        if (preloadComponent) {
            setShowContent(false)
            return undefined
        }
        if (waitForGrid) return undefined
        const timer = setTimeout(() => setShowContent(true), REVEAL_DELAY_MS)
        return () => clearTimeout(timer)
    }, [preloadComponent, waitForGrid])

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
        // Notifications are short rows; everything else pre-renders generously
        // so window-scroll never shows a blank band on a fast wheel.
        overscan: unit === 'notifications' ? 100 : 900,
        increaseViewportBy: { top: 3000, bottom: 3000 },
        components: {
            ...(isGrid ? { List: GridListComponent, Item: GridItemComponent } : {}),
            Footer: FooterComponent,
            ...componentsProp,
        },
        itemContent,
        ...(scrollToLastItem ? { initialTopMostItemIndex: rows.length } : {}),
        ...(isGrid ? { readyStateChanged: onGridReadyStateChanged } : {}),
        ...rest,
    }

    return (
        <View className="@container/list relative" style={wrapperStyle}>
            {!showContent && preloadComponent ? (
                <View>{renderSlot(preloadComponent)}</View>
            ) : null}
            <View
                className={`${listPadding} ${
                    showContent
                        ? 'transition-opacity duration-500 ease-out opacity-100'
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
