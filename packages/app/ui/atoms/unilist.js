import { View } from 'app/design/view'
import { useRef, useCallback, useMemo, useEffect, useLayoutEffect, useState } from 'react';
import { Platform, RefreshControl } from 'react-native';
import { AnimatedLegendList } from "@legendapp/list/reanimated";
import { useAnimatedScrollHandler, useSharedValue, runOnJS } from 'react-native-reanimated';
import { useSetScrollDirection, useHeaderHeight, useSetScrollValue, useSetListMaxScrollOffset, useCoverScrollCompensation } from 'app/context/jotai/layout';
import { getListScrollOffset, setListScrollOffset } from 'app/lib/cache/list-scroll-cache';
import { useFocusEffect } from 'app/lib/hooks/router';
import { paddingForList } from 'app/customization/functions';
import { getHeaderFadeExtend } from 'app/ui/molecules/header/page-header-parts';

const EMPTY_LIST_DATA = [];

// Stable type so LegendList can reconcile the header when chrome/filters
// update. A new `useCallback` header remounts the filter form and resets it.
function UniListChromeHeader({
    coverOverlayPad,
    applyHeaderOffset,
    headerOffset,
    applyFooterOffset,
    inverted,
    header,
}) {
    return (
        <>
            {coverOverlayPad > 0 ? (
                <View style={{ height: coverOverlayPad }} />
            ) : null}
            {applyHeaderOffset && headerOffset > 0 ? (
                <View style={{ height: headerOffset }} />
            ) : null}
            {header
                ? (typeof header === 'function' ? header() : header)
                : null}
            {applyFooterOffset && headerOffset > 0 && inverted ? (
                <View style={{ height: headerOffset }} />
            ) : null}
        </>
    );
}

const ESTIMATED_ITEM_SIZE_BY_UNIT = {
    feed: 140,
    notifications: 64,
};

// Android SwipeRefreshLayout treats "scroll back to 0 + overscroll" as a
// pull-to-refresh. Cover collapse/expand does exactly that, so keep the
// control disarmed until the list has been at rest at the top.
const COVER_REFRESH_DISARM_Y = 16;
const COVER_REFRESH_REARM_MS = 400;

// Scroll direction is forced to 0 below this offset (header stays visible near top).
const SCROLL_DIRECTION_THRESHOLD = 100;
// Minimum travel (px) between UI-thread → JS scroll publishes. The cover
// overlay reads `coverScrollY` on the UI thread every frame; JS only needs
// coarse offsets for atoms, scroll caching, and threshold checks.
const SCROLL_PUBLISH_DELTA = 8;

function resolveEstimatedItemSize(unit, explicitSize) {
    if (typeof explicitSize === 'number' && explicitSize > 0) {
        return explicitSize;
    }
    if (unit && ESTIMATED_ITEM_SIZE_BY_UNIT[unit]) {
        return ESTIMATED_ITEM_SIZE_BY_UNIT[unit];
    }
    return 100;
}

function estimateItemSize(unit, item, fallback) {
    if (!item || typeof item !== 'object') {
        return fallback;
    }

    if (item.type === 'block') {
        return 160;
    }

    if (unit === 'notifications') {
        return 64;
    }

    if (unit === 'feed') {
        const content = item.content;
        const hasImage =
            item.mainImage ||
            (content?.images?.length > 0) ||
            (content?.images_attach?.length > 0);
        const hasVideo = content?.videos_attach?.length > 0;
        const hasEmbed = !!content?.embed;

        if (hasVideo || hasEmbed) {
            return 360;
        }
        if (hasImage) {
            return 420;
        }
        if (content?.title && content?.text) {
            return 180;
        }
        if (content?.text) {
            return 140;
        }
        return 120;
    }

    return fallback;
}

export default function UniList(props) {
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
        ...rest 
    } = props;

    const scrollY = useRef(0);
    const scrollState = useRef(0);
    const isFocusedRef = useRef(true);
    const lastPublishedScrollRef = useRef(0);
    const coverRefreshArmedRef = useRef(!coverScrollY);
    const coverRefreshRearmTimerRef = useRef(null);
    const [coverRefreshArmed, setCoverRefreshArmed] = useState(!coverScrollY);
    const disarmCoverRefresh = useCallback(() => {
        if (coverRefreshRearmTimerRef.current) {
            clearTimeout(coverRefreshRearmTimerRef.current);
            coverRefreshRearmTimerRef.current = null;
        }
        if (coverRefreshArmedRef.current) {
            coverRefreshArmedRef.current = false;
            setCoverRefreshArmed(false);
        }
    }, []);

    const scheduleCoverRefreshRearm = useCallback(() => {
        if (coverRefreshArmedRef.current || coverRefreshRearmTimerRef.current) {
            return;
        }
        coverRefreshRearmTimerRef.current = setTimeout(() => {
            coverRefreshArmedRef.current = true;
            setCoverRefreshArmed(true);
            coverRefreshRearmTimerRef.current = null;
        }, COVER_REFRESH_REARM_MS);
    }, []);

    useEffect(() => {
        return () => {
            if (coverRefreshRearmTimerRef.current) {
                clearTimeout(coverRefreshRearmTimerRef.current);
            }
        };
    }, []);

    // Spacer insertion at the list top can trip Android's refresh layout.
    useEffect(() => {
        if (!coverScrollY) {
            return;
        }
        disarmCoverRefresh();
        coverRefreshRearmTimerRef.current = setTimeout(() => {
            coverRefreshArmedRef.current = true;
            setCoverRefreshArmed(true);
            coverRefreshRearmTimerRef.current = null;
        }, COVER_REFRESH_REARM_MS);
        return () => {
            if (coverRefreshRearmTimerRef.current) {
                clearTimeout(coverRefreshRearmTimerRef.current);
                coverRefreshRearmTimerRef.current = null;
            }
        };
    }, [coverOverlayPad, coverScrollY, disarmCoverRefresh]);

    const setScrollDirection = useSetScrollDirection();
    const setScrollValue = useSetScrollValue();
    const setListMaxScrollOffset = useSetListMaxScrollOffset();
    // Bottom padding applied while the profile cover is collapsed on a short
    // list, so the scroll range does not shrink (see conductor.js).
    const coverScrollCompensation = useCoverScrollCompensation();

    const headerHeightFromAtom = useHeaderHeight();

    const headerHeight = useMemo(() => {
        if (typeof headerHeightFromAtom === 'number') {
            return headerHeightFromAtom;
        }
        if (typeof scrollProps?.headerHeight === 'number') {
            return scrollProps.headerHeight;
        }
        return 0;
    }, [headerHeightFromAtom, scrollProps?.headerHeight]);

    /** Native PageHeader chrome extends below measured content (`fade_extend`). */
    const listHeaderOffset = useMemo(() => {
        if (headerHeight <= 0) {
            return 0;
        }
        const fadeExtra =
            Platform.OS !== 'web' && !skipHeaderOffset && !inverted && !isModal
                ? getHeaderFadeExtend()
                : 0;
        return headerHeight + fadeExtra;
    }, [headerHeight, skipHeaderOffset, inverted, isModal]);

    // Keep LegendList (and its header / filter form) mounted while skeletons
    // show. Replacing the whole tree on preload remounts native filters and
    // re-applies their defaults.
    const sourceData = preloadComponent ? EMPTY_LIST_DATA : data;
    const filteredData = useMemo(() =>
        (sourceData ?? EMPTY_LIST_DATA).filter((v, i, a) => a.findIndex(t => t.id === v.id) === i),
        [sourceData]
    );

    const initialScrollOffset = useMemo(
        () => (url ? getListScrollOffset(url) : 0),
        [url]
    );

    const estimatedItemSize = useMemo(
        () => resolveEstimatedItemSize(unit, estimatedItemSizeProp),
        [unit, estimatedItemSizeProp]
    );

    const getEstimatedItemSize = useCallback(
        (_index, item) => estimateItemSize(unit, item, estimatedItemSize),
        [unit, estimatedItemSize]
    );

    // Match web UniList: layout wraps each item; paddings come from endpoint.
    const listPadding = endpoint ? paddingForList(endpoint) : '';
    const contentContainerClassName = [
        '@container/list',
        filteredData.length ? listPadding : '',
        contentContainerClassNameProp || '',
    ].filter(Boolean).join(' ').trim();

    const listRenderItem = useCallback(
        (info) => (
            <View className={layout || 'w-full'}>
                {renderItem(info)}
            </View>
        ),
        [renderItem, layout]
    );

    useFocusEffect(
        useCallback(() => {
            isFocusedRef.current = true;
            setScrollDirection(0);
            scrollState.current = 0;
            if (scrollY.current >= 0) {
                lastPublishedScrollRef.current = Math.round(scrollY.current);
                setScrollValue(lastPublishedScrollRef.current);
            }
            return () => {
                isFocusedRef.current = false;
            };
        }, [setScrollDirection, setScrollValue])
    );

    // Scroll handling is split across threads: the worklet below runs on the
    // UI thread every frame (so the profile cover overlay tracks the finger
    // even while JS is busy rendering list items) and crosses to JS only on
    // meaningful changes — a direction flip, the refresh top-zone edge, the
    // top boundary (isScrolled), or ~SCROLL_PUBLISH_DELTA px of travel.
    const publishScrollValue = useCallback((y, maxOffset) => {
        if (!isFocusedRef.current) {
            return;
        }
        scrollY.current = y;
        setListMaxScrollOffset((prev) => (prev === maxOffset ? prev : maxOffset));
        const rounded = Math.round(y);
        if (rounded !== lastPublishedScrollRef.current) {
            lastPublishedScrollRef.current = rounded;
            setScrollValue(rounded);
        }
    }, [setListMaxScrollOffset, setScrollValue]);

    const publishScrollDirection = useCallback((direction) => {
        if (!isFocusedRef.current) {
            return;
        }
        if (direction !== scrollState.current) {
            setScrollDirection(direction);
            scrollState.current = direction;
        }
    }, [setScrollDirection]);

    const publishCoverTopZone = useCallback((inTopZone) => {
        if (!isFocusedRef.current) {
            return;
        }
        if (inTopZone) {
            scheduleCoverRefreshRearm();
        } else {
            disarmCoverRefresh();
        }
    }, [scheduleCoverRefreshRearm, disarmCoverRefresh]);

    const prevScrollYSV = useSharedValue(0);
    const directionSV = useSharedValue(0);
    const publishedScrollYSV = useSharedValue(0);
    const coverTopZoneSV = useSharedValue(true);

    const handleScroll = useAnimatedScrollHandler({
        onScroll: (event) => {
            const y = event.contentOffset.y;

            if (coverScrollY) {
                coverScrollY.set(y);
                const inTopZone = y <= COVER_REFRESH_DISARM_Y;
                if (inTopZone !== coverTopZoneSV.get()) {
                    coverTopZoneSV.set(inTopZone);
                    runOnJS(publishCoverTopZone)(inTopZone);
                }
            }

            const prevY = prevScrollYSV.get();
            prevScrollYSV.set(y);
            let direction = directionSV.get();
            if (y < SCROLL_DIRECTION_THRESHOLD) {
                direction = 0;
            } else if (y > prevY) {
                direction = 1;
            } else if (y < prevY) {
                direction = -1;
            }
            if (direction !== directionSV.get()) {
                directionSV.set(direction);
                runOnJS(publishScrollDirection)(direction);
            }

            const published = publishedScrollYSV.get();
            const crossedTopBoundary = (y <= 0) !== (published <= 0);
            if (crossedTopBoundary || Math.abs(y - published) >= SCROLL_PUBLISH_DELTA) {
                publishedScrollYSV.set(y);
                runOnJS(publishScrollValue)(
                    y,
                    Math.max(0, event.contentSize.height - event.layoutMeasurement.height)
                );
            }
        },
        // Publish the exact resting offset so getScrollValue()/scroll caching
        // are precise once the gesture settles.
        onEndDrag: (event) => {
            publishedScrollYSV.set(event.contentOffset.y);
            runOnJS(publishScrollValue)(
                event.contentOffset.y,
                Math.max(0, event.contentSize.height - event.layoutMeasurement.height)
            );
        },
        onMomentumEnd: (event) => {
            publishedScrollYSV.set(event.contentOffset.y);
            runOnJS(publishScrollValue)(
                event.contentOffset.y,
                Math.max(0, event.contentSize.height - event.layoutMeasurement.height)
            );
        },
    }, [coverScrollY, publishCoverTopZone, publishScrollDirection, publishScrollValue]);

    // Scroll atoms live in the tab's Jotai store. Publishing a cached
    // `initialScrollOffset` here collapsed the profile cover on feed load.
    // Zero the atoms before paint; LegendList still restores position via
    // `initialScrollOffset`, and `onScroll` then reports the real offset.
    useLayoutEffect(() => {
        scrollY.current = 0;
        lastPublishedScrollRef.current = 0;
        scrollState.current = 0;
        setScrollValue(0);
        setScrollDirection(0);
        setListMaxScrollOffset(0);
        coverScrollY?.set(0);
        prevScrollYSV.set(0);
        directionSV.set(0);
        publishedScrollYSV.set(0);
        coverTopZoneSV.set(true);
    }, [url, setScrollValue, setScrollDirection, setListMaxScrollOffset, coverScrollY, prevScrollYSV, directionSV, publishedScrollYSV, coverTopZoneSV]);

    useEffect(() => {
        return () => {
            if (url) {
                setListScrollOffset(url, scrollY.current);
            }
        };
    }, [url]);

    const setListRef = useCallback((node) => {
        if (typeof refer === 'function') {
            refer(node);
        } else if (refer) {
            refer.current = node;
        }
    }, [refer]);

    const handleScrollToIndexFailed = useCallback(() => {
    }, []);

    const handleRefresh = useCallback(() => {
        if (coverScrollY && !coverRefreshArmedRef.current) {
            return;
        }
        onRefresh?.();
    }, [coverScrollY, onRefresh]);

    const progressViewOffset = typeof progressViewOffsetProp === 'number'
        ? progressViewOffsetProp
        : (coverOverlayPad > 0 ? coverOverlayPad : listHeaderOffset);

    const refreshControl = useMemo(() => {
        if (refreshControlProp) {
            return refreshControlProp;
        }
        if (!onRefresh || inverted) {
            return undefined;
        }
        return (
            <RefreshControl
                refreshing={!!refreshing}
                onRefresh={handleRefresh}
                progressViewOffset={progressViewOffset}
                enabled={!coverScrollY || coverRefreshArmed || !!refreshing}
            />
        );
    }, [refreshControlProp, onRefresh, handleRefresh, inverted, refreshing, progressViewOffset, coverScrollY, coverRefreshArmed]);

    const shouldApplyHeaderOffset = !inverted && !isModal && !skipHeaderOffset;
    const shouldApplyFooterOffset = inverted && !isModal;

    const listHeaderElement = (
        <UniListChromeHeader
            coverOverlayPad={coverOverlayPad}
            applyHeaderOffset={shouldApplyHeaderOffset}
            headerOffset={listHeaderOffset}
            applyFooterOffset={shouldApplyFooterOffset}
            inverted={inverted}
            header={ListHeaderComponent}
        />
    );

    const shouldApplyCoverCompensation =
        skipHeaderOffset && !inverted && !isModal && coverScrollCompensation > 0;

    const enhancedListFooterComponent = useCallback(() => {
        return (
            <>
                {ListFooterComponent && (
                    typeof ListFooterComponent === 'function' 
                        ? <ListFooterComponent /> 
                        : ListFooterComponent
                )}
                {shouldApplyFooterOffset && listHeaderOffset > 0 && !inverted && (
                    <View style={{ height: listHeaderOffset }} />
                )}
                {shouldApplyCoverCompensation && (
                    <View style={{ height: coverScrollCompensation }} />
                )}
            </>
        );
    }, [shouldApplyFooterOffset, listHeaderOffset, ListFooterComponent, inverted, shouldApplyCoverCompensation, coverScrollCompensation]);

    return (
        <AnimatedLegendList
            key={url || undefined}
            contentContainerStyle={contentContainerStyleProp}
            contentContainerClassName={contentContainerClassName || undefined}
            ref={setListRef}
            onEndReachedThreshold={1}
            data={filteredData}
            ListHeaderComponent={listHeaderElement}
            ListEmptyComponent={preloadComponent ?? listEmptyComponentProp}
            ListFooterComponent={enhancedListFooterComponent}
            keyExtractor={item => item.id}
            renderItem={layout ? listRenderItem : renderItem}
            onEndReached={preloadComponent ? undefined : onEndReached}
            onStartReached={preloadComponent ? undefined : onStartReached}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            keyboardShouldPersistTaps="always"
            onScrollToIndexFailed={handleScrollToIndexFailed}
            refreshControl={refreshControl}
            alignItemsAtEnd={inverted}
            maintainScrollAtEnd={inverted}
            contentInsetAdjustmentBehavior="never"
            automaticallyAdjustContentInsets={false}
            onStartReachedThreshold={inverted ? 1 : undefined}
            initialScrollIndex={inverted && filteredData.length > 0 ? filteredData.length - 1 : undefined}
            initialScrollOffset={initialScrollOffset > 0 ? initialScrollOffset : undefined}
            estimatedItemSize={estimatedItemSize}
            getEstimatedItemSize={getEstimatedItemSize}
            drawDistance={inverted ? 400 : 250}
            {...rest}
        />
    );
}
