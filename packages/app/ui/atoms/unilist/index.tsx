import { View } from 'app/design/view'
import { useCallback, useMemo, useEffect, useRef, type ComponentType, type ReactElement } from 'react'
import { Platform, RefreshControl } from 'react-native'
import { AnimatedLegendList } from '@legendapp/list/reanimated'
import { useSharedValue } from 'react-native-reanimated'
import { KeyboardGestureArea } from 'react-native-keyboard-controller'
import { useHeaderHeight, useCoverScrollCompensation } from 'app/context/jotai/layout'
import { getListScrollOffset, setListScrollOffset } from 'app/lib/cache/list-scroll-cache'
import { paddingForList } from 'app/customization/functions'
import { getHeaderFadeExtend, PageHeaderBand } from 'app/ui/molecules/header/page-header-parts'
import {
    dedupeById,
    renderSlot,
    omitProps,
    WEB_ONLY_PROPS,
    IGNORED_PROPS,
    type UniListProps,
    type UniListSlot,
} from './shared'
import { resolveEstimatedItemSize, estimateItemSize } from './item-size'
import { useCoverRefreshArming } from './use-cover-refresh-arming'
import { useChatKeyboard } from './use-chat-keyboard'
import { useListScrollPublisher } from './use-list-scroll-publisher'

/*
 * ============================================================================
 * UniList — native. See `shared.ts` for the prop contract.
 *
 * LegendList with three things layered on top:
 *   - page-header / cover spacers above and below the rows
 *   - a scroll bridge to the page's Jotai atoms (`use-list-scroll-publisher`)
 *   - pull-to-refresh that survives a collapsing cover (`use-cover-refresh-arming`)
 * ============================================================================
 */

const EMPTY_LIST_DATA: any[] = []

/**
 * Stable header component. LegendList reconciles ListHeaderComponent by type;
 * a new `useCallback` header on every chrome/filter change would remount the
 * filter form and reset its values.
 */
function UniListChromeHeader({
    coverOverlayPad,
    headerOffset,
    applyHeaderOffset,
    applyFooterOffset,
    header,
}: {
    coverOverlayPad: number
    headerOffset: number
    applyHeaderOffset: boolean
    applyFooterOffset?: boolean
    header: UniListSlot
}) {
    return (
        <>
            {coverOverlayPad > 0 ? (
                <View style={{ height: coverOverlayPad }} />
            ) : null}
            {applyHeaderOffset && headerOffset > 0 ? (
                // Behind the page header at rest: the card surface (mobile
                // layout). Part of the list, so it scrolls away and the fixed
                // header keeps its own gradient chrome.
                <View style={{ height: headerOffset }}>
                    <PageHeaderBand height={headerOffset} />
                </View>
            ) : null}
            {renderSlot(header)}
            {applyFooterOffset && headerOffset > 0 ? (
                <View style={{ height: headerOffset }} />
            ) : null}
        </>
    )
}

export type { UniListProps } from './shared'

function assignRef(ref: unknown, node: unknown) {
    if (typeof ref === 'function') ref(node)
    else if (ref) (ref as { current: unknown }).current = node
}

export default function UniList(props: UniListProps) {
    const {
        preloadComponent,
        contentContainerStyle: contentContainerStyleProp,
        contentContainerClassName: contentContainerClassNameProp,
        ListHeaderComponent,
        ListEmptyComponent: listEmptyComponentProp,
        scrollProps,
        isModal,
        data,
        renderItem,
        onEndReached,
        onStartReached,
        ListFooterComponent,
        refer,
        refreshing,
        inverted,
        onRefresh,
        url,
        unit,
        layout,
        endpoint,
        estimatedItemSize: estimatedItemSizeProp,
        refreshControl: refreshControlProp,
        progressViewOffset: progressViewOffsetProp,
        skipHeaderOffset,
        coverOverlayPad = 0,
        coverScrollY,
        tabBarInset = 0,
        keyboardBottomOffset,
        ...restProps
    } = props
    // RN ScrollView props (keyboardDismissMode, onScrollBeginDrag, …) pass through.
    const rest = omitProps(restProps, [...WEB_ONLY_PROPS, ...IGNORED_PROPS])

    // ------------------------------------------------------------------
    // Rows
    // ------------------------------------------------------------------

    // Keep LegendList (and its header / filter form) mounted while skeletons
    // show. Replacing the whole tree on preload remounts native filters and
    // re-applies their defaults.
    const rows = useMemo(
        () => (preloadComponent ? EMPTY_LIST_DATA : dedupeById(data ?? EMPTY_LIST_DATA)),
        [preloadComponent, data]
    )

    const estimatedItemSize = useMemo(
        () => resolveEstimatedItemSize(unit, estimatedItemSizeProp),
        [unit, estimatedItemSizeProp]
    )
    const getEstimatedItemSize = useCallback(
        (_index: number, item: any) => estimateItemSize(unit, item, estimatedItemSize),
        [unit, estimatedItemSize]
    )

    // Match web UniList: layout wraps each item; paddings come from endpoint.
    const listPadding = endpoint ? paddingForList(endpoint) : ''
    const contentContainerClassName = [
        '@container/list',
        rows.length ? listPadding : '',
        contentContainerClassNameProp || '',
    ].filter(Boolean).join(' ').trim()

    const listRenderItem = useCallback(
        (info: { item: any; index: number }) => (
            <View className={layout || 'w-full'}>
                {renderItem(info)}
            </View>
        ),
        [renderItem, layout]
    )

    // ------------------------------------------------------------------
    // Scroll: atoms bridge, offset cache, cover-aware refresh
    // ------------------------------------------------------------------

    const { armed: coverRefreshArmed, armedRef: coverRefreshArmedRef, onTopZoneChange } =
        useCoverRefreshArming({ coverScrollY, coverOverlayPad })

    // Chat (inverted): LegendList 2.0.19's `initialScrollIndex` sets the iOS
    // ScrollView's `contentOffset` to the last row's *top*; its viewPosition fix
    // only reaches the JS state, and it re-seeds on re-render. The chat opened
    // ~a screen past its end. Pull such an offset back to the native end.
    const listRef = useRef<any>(null)
    const snapToEnd = useCallback((animated = false) => {
        const list = listRef.current
        const scroller = list?.getNativeScrollRef?.()
        if (scroller?.scrollToEnd) scroller.scrollToEnd({ animated })
        else list?.scrollToEnd?.({ animated })
    }, [])

    const keyboardAnimating = useSharedValue(false)
    const { handleScroll, scrollYRef, scrollYSV, atEndSV } = useListScrollPublisher({
        url,
        coverScrollY,
        onTopZoneChange,
        pinHeader: !!inverted,
        onOvershootEnd: inverted ? snapToEnd : undefined,
        clampPaused: keyboardAnimating,
    })

    const chatKeyboardEnabled = !!inverted && typeof keyboardBottomOffset === 'number'
    const chatKeyboard = useChatKeyboard({
        enabled: chatKeyboardEnabled,
        bottomOffset: keyboardBottomOffset ?? 0,
        scrollY: scrollYSV,
        atEnd: atEndSV,
        animating: keyboardAnimating,
        listRef,
        snapToEnd,
    })

    const initialScrollOffset = useMemo(
        () => (url ? getListScrollOffset(url) : 0),
        [url]
    )

    // Remember where the user was, so re-entering this list restores it.
    // Reading the ref *in cleanup* is the point: we want the final offset.
    useEffect(() => {
        return () => {
            if (url) {
                // eslint-disable-next-line react-hooks/exhaustive-deps -- value ref, latest on purpose
                setListScrollOffset(url, scrollYRef.current)
            }
        }
    }, [url, scrollYRef])

    const handleRefresh = useCallback(() => {
        if (coverScrollY && !coverRefreshArmedRef.current) {
            return
        }
        onRefresh?.()
    }, [coverScrollY, coverRefreshArmedRef, onRefresh])

    // ------------------------------------------------------------------
    // Page-header / cover offsets
    // ------------------------------------------------------------------

    const headerHeightFromAtom = useHeaderHeight()
    const headerHeight = typeof headerHeightFromAtom === 'number'
        ? headerHeightFromAtom
        : (typeof scrollProps?.headerHeight === 'number' ? scrollProps.headerHeight : 0)

    /** Native PageHeader chrome extends below measured content (`fade_extend`). */
    const listHeaderOffset = useMemo(() => {
        if (headerHeight <= 0) return 0
        const fadeExtra =
            Platform.OS !== 'web' && !skipHeaderOffset && !inverted && !isModal
                ? getHeaderFadeExtend()
                : 0
        return headerHeight + fadeExtra
    }, [headerHeight, skipHeaderOffset, inverted, isModal])

    // Normal list: spacer at the top for the page header. Inverted (chat):
    // the "top" of the content is at the bottom, so the spacer goes there.
    const applyHeaderOffset = !inverted && !isModal && !skipHeaderOffset
    const applyFooterOffset = inverted && !isModal

    // Bottom padding applied while the profile cover is collapsed on a short
    // list, so the scroll range does not shrink (see conductor).
    const coverScrollCompensation = useCoverScrollCompensation()
    const applyCoverCompensation =
        skipHeaderOffset && !inverted && !isModal && coverScrollCompensation > 0

    const progressViewOffset = typeof progressViewOffsetProp === 'number'
        ? progressViewOffsetProp
        : (coverOverlayPad > 0 ? coverOverlayPad : listHeaderOffset)

    const refreshControl = useMemo(() => {
        if (refreshControlProp) return refreshControlProp
        if (!onRefresh || inverted) return undefined
        return (
            <RefreshControl
                refreshing={!!refreshing}
                onRefresh={handleRefresh}
                progressViewOffset={progressViewOffset}
                enabled={!coverScrollY || coverRefreshArmed || !!refreshing}
            />
        )
    }, [refreshControlProp, onRefresh, handleRefresh, inverted, refreshing, progressViewOffset, coverScrollY, coverRefreshArmed])

    const listHeaderElement = (
        <UniListChromeHeader
            coverOverlayPad={coverOverlayPad}
            headerOffset={listHeaderOffset}
            applyHeaderOffset={applyHeaderOffset}
            applyFooterOffset={applyFooterOffset}
            header={ListHeaderComponent}
        />
    )

    const listFooterComponent = useCallback(() => (
        <>
            {typeof ListFooterComponent === 'function'
                ? <ListFooterComponent />
                : (ListFooterComponent ?? null)}
            {applyCoverCompensation ? (
                <View style={{ height: coverScrollCompensation }} />
            ) : null}
            {tabBarInset > 0 ? (
                <View style={{ height: tabBarInset }} />
            ) : null}
        </>
    ), [ListFooterComponent, applyCoverCompensation, coverScrollCompensation, tabBarInset])

    // ------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------

    const setListRef = useCallback((node: unknown) => {
        assignRef(listRef, node)
        assignRef(refer, node)
    }, [refer])

    const list = (
        <AnimatedLegendList
            // A new url is a new list: drop LegendList's layout cache and let
            // `initialScrollOffset` restore the position for this one.
            key={url || undefined}
            contentContainerStyle={contentContainerStyleProp}
            // Not in LegendList's types, but it works: the prop reaches RN's Animated.ScrollView,
            // which uniwind's metro resolver patches (it keeps Animated/components in scope).
            contentContainerClassName={contentContainerClassName || undefined}
            ref={setListRef}
            onEndReachedThreshold={1}
            data={rows}
            ListHeaderComponent={listHeaderElement}
            ListEmptyComponent={(preloadComponent ?? listEmptyComponentProp) as ReactElement | ComponentType<any> | null | undefined}
            ListFooterComponent={listFooterComponent}
            keyExtractor={(item: any) => item.id}
            renderItem={layout ? listRenderItem : renderItem}
            onEndReached={preloadComponent ? undefined : onEndReached}
            onStartReached={preloadComponent ? undefined : onStartReached}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            keyboardShouldPersistTaps="always"
            refreshControl={refreshControl}
            alignItemsAtEnd={inverted}
            maintainScrollAtEnd={inverted}
            contentInsetAdjustmentBehavior="never"
            automaticallyAdjustContentInsets={false}
            onStartReachedThreshold={inverted ? 1 : undefined}
            initialScrollIndex={inverted && rows.length > 0 ? rows.length - 1 : undefined}
            initialScrollOffset={initialScrollOffset > 0 ? initialScrollOffset : undefined}
            estimatedItemSize={estimatedItemSize}
            getEstimatedItemSize={getEstimatedItemSize}
            drawDistance={inverted ? 400 : 250}
            animatedProps={chatKeyboard.animatedProps}
            style={chatKeyboard.animatedStyle}
            // Chat: drag the list down to pull the keyboard away (iOS native).
            keyboardDismissMode={chatKeyboardEnabled ? 'interactive' : undefined}
            {...rest}
        />
    )

    // Android has no interactive keyboard dismiss of its own; the gesture area
    // lets the keyboard follow a drag that reaches it, like iOS.
    if (chatKeyboardEnabled && Platform.OS === 'android') {
        return (
            <KeyboardGestureArea interpolator="ios" style={{ flex: 1 }}>
                {list}
            </KeyboardGestureArea>
        )
    }
    return list
}
