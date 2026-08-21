import { View } from 'app/design/view'
import { useRef, useCallback, useMemo, useEffect } from 'react';
import { Platform, RefreshControl } from 'react-native';
import { LegendList } from "@legendapp/list";
import { useSetScrollDirection, useHeaderHeight, useSetScrollValue, useSetListMaxScrollOffset, useCoverScrollCompensation } from 'app/context/jotai/layout';
import { getListScrollOffset, setListScrollOffset } from 'app/lib/tab-page-cache';
import { useFocusEffect } from 'app/lib/hooks/router';
import { paddingForList } from 'app/customization/functions';
import { getHeaderFadeExtend } from 'app/ui/molecules/header/page-header-parts';

const ESTIMATED_ITEM_SIZE_BY_UNIT = {
    feed: 140,
    notifications: 64,
};

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
        ...rest 
    } = props;

    const scrollY = useRef(0);
    const scrollState = useRef(0);
    const isFocusedRef = useRef(true);
    const lastPublishedScrollRef = useRef(0);
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

    const filteredData = useMemo(() => 
        data.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i),
        [data]
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

    const handleScroll = useCallback((event) => {
        if (!isFocusedRef.current) {
            return;
        }

        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const SCROLL_OFFSET_THRESHOLD = 100;
        const currentScrollY = contentOffset.y;
        const roundedScrollY = Math.round(currentScrollY);

        const maxOffset = Math.max(0, contentSize.height - layoutMeasurement.height);
        setListMaxScrollOffset((prev) => (prev === maxOffset ? prev : maxOffset));

        if (roundedScrollY !== lastPublishedScrollRef.current) {
            lastPublishedScrollRef.current = roundedScrollY;
            setScrollValue(roundedScrollY);
        }

        const previousScrollY = scrollY.current;

        let newScrollState;

        if (currentScrollY < SCROLL_OFFSET_THRESHOLD) {
            newScrollState = 0;
        } else if (currentScrollY > previousScrollY && currentScrollY > 0) {
            newScrollState = 1;
        } else if (currentScrollY < previousScrollY) {
            newScrollState = -1;
        } else {
            newScrollState = scrollState.current;
        }

        if (newScrollState !== scrollState.current) {
            setScrollDirection(newScrollState);
            scrollState.current = newScrollState;
        }

        scrollY.current = currentScrollY;
    }, [setScrollDirection, setScrollValue, setListMaxScrollOffset]);

    // Scroll atoms live in the tab's Jotai store, so an in-tab navigation
    // (list → profile) would otherwise leave the new list reporting the
    // previous screen's offset — enough for the profile cover to collapse on
    // its own. Publish this list's starting offset as soon as it mounts.
    useEffect(() => {
        scrollY.current = initialScrollOffset;
        lastPublishedScrollRef.current = Math.round(initialScrollOffset);
        scrollState.current = 0;
        setScrollValue(lastPublishedScrollRef.current);
        setScrollDirection(0);
        setListMaxScrollOffset(0);
    }, [url, initialScrollOffset, setScrollValue, setScrollDirection, setListMaxScrollOffset]);

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

    const progressViewOffset = typeof progressViewOffsetProp === 'number'
        ? progressViewOffsetProp
        : listHeaderOffset;

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
                onRefresh={onRefresh}
                progressViewOffset={progressViewOffset}
            />
        );
    }, [refreshControlProp, onRefresh, inverted, refreshing, progressViewOffset]);

    const shouldApplyHeaderOffset = !inverted && !isModal && !skipHeaderOffset;
    const shouldApplyFooterOffset = inverted && !isModal;

    const enhancedListHeaderComponent = useCallback(() => {
        return (
            <>
                {shouldApplyHeaderOffset && listHeaderOffset > 0 && (
                    <View style={{ height: listHeaderOffset }} />
                )}
                {ListHeaderComponent && (
                    typeof ListHeaderComponent === 'function' 
                        ? <ListHeaderComponent /> 
                        : ListHeaderComponent
                )}
                {shouldApplyFooterOffset && listHeaderOffset > 0 && inverted && (
                    <View style={{ height: listHeaderOffset }} />
                )}
            </>
        );
    }, [shouldApplyHeaderOffset, listHeaderOffset, ListHeaderComponent, shouldApplyFooterOffset, inverted, skipHeaderOffset]);

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

    if (preloadComponent) {
        return (
            <View className="w-full">
                <View className="w-full" style={{ height: listHeaderOffset }} />
                {preloadComponent}
            </View>
        );
    }

    return (
        <LegendList
            key={url || undefined}
            contentContainerStyle={contentContainerStyleProp}
            contentContainerClassName={contentContainerClassName || undefined}
            ref={setListRef}
            onEndReachedThreshold={1}
            data={filteredData}
            ListHeaderComponent={enhancedListHeaderComponent}
            ListFooterComponent={enhancedListFooterComponent}
            keyExtractor={item => item.id}
            renderItem={layout ? listRenderItem : renderItem}
            onEndReached={onEndReached}
            onStartReached={onStartReached}
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
