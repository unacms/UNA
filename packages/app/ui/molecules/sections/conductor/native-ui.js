import React, { useCallback, useState, useLayoutEffect, useMemo, useRef } from "react";
import { Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, interpolate, Extrapolation, useAnimatedReaction, runOnJS, FadeIn } from 'react-native-reanimated';
import { View, ScrollView, Row } from 'app/design/view';
import UniList from 'app/ui/atoms/unilist'
import { appSetting, getUnitModeBySource, isNativeTabsEnabled } from 'app/lib/util';
import { getUnitType, hasConductorSubitems, getMobileLeftbarItems } from './helpers';
import { LeftbarMenuDropdown, ConductorTabList } from './shared-ui';
import { ItemRenderer } from 'app/components/item-renderer';
import { getSkeletonForList } from 'app/lib/skeleton-helpers';
import { BlockByName } from 'app/components/block';
import Cover, { CoverSmall, CoverBackButton } from 'app/components/elements/cover';
import { getComponent } from 'app/components/registry';
import { getWindowSafeAreaInsets } from 'app/lib/hooks/router'
import { useTranslation } from 'react-i18next';
import {
    getSkeletonByEndPoint,
    layoutForList,
    paddingForList
} from 'app/customization/functions'

const conductorTheme = appSetting('theme', 'conductor')

// Scroll jitter right at the collapse threshold must not flip-flop the
// Cover/CoverSmall swap (each flip is a JS remount).
const COVER_SWAP_HYSTERESIS = 8;
// Masks the content pop of the hard swap. Entering-only: an exiting
// animation would keep both covers mounted at once (see Host crash note).
const COVER_SWAP_FADE_MS = 160;

/**
 * Overlay + translateY like Showtime. Cover and CoverSmall are never
 * mounted together — stacking their Hosts crashes the back button even
 * before any scroll.
 */
const DynamicCoverHeader = React.memo(function DynamicCoverHeader({
    pageKey,
    coverHeader,
    coverHeaderSmall,
    sceneHeader,
    filter,
    leading,
    coverScrollY,
    onOverlayHeight,
}) {
    const [coverHeight, setCoverHeight] = useState(0);
    const [showSmall, setShowSmall] = useState(false);
    const overlayMaxRef = useRef(0);
    // Fade the full cover back in only after a real swap, never on first mount.
    const hasSwappedRef = useRef(false);
    const collapsedSV = useSharedValue(false);
    const compactHeight = 64 + (isNativeTabsEnabled() ? (getWindowSafeAreaInsets().top || 0) : 0);
    const collapseRange = Math.max(0, coverHeight - compactHeight);

    useLayoutEffect(() => {
        overlayMaxRef.current = 0;
        hasSwappedRef.current = false;
        setCoverHeight(0);
        setShowSmall(false);
        collapsedSV.set(false);
        coverScrollY?.set(0);
        onOverlayHeight?.(0);
    }, [pageKey, coverScrollY, onOverlayHeight, collapsedSV]);

    const applyShowSmall = useCallback((next) => {
        hasSwappedRef.current = true;
        setShowSmall(next);
    }, []);

    useAnimatedReaction(
        () => coverScrollY?.get() ?? 0,
        (y) => {
            if (collapseRange <= 0) return;
            const wasCollapsed = collapsedSV.get();
            const next = wasCollapsed
                ? y > collapseRange - COVER_SWAP_HYSTERESIS
                : y >= collapseRange;
            if (next !== wasCollapsed) {
                collapsedSV.set(next);
                runOnJS(applyShowSmall)(next);
            }
        },
        [collapseRange, applyShowSmall]
    );

    const onCoverLayout = useCallback((e) => {
        const height = e.nativeEvent.layout.height;
        if (height <= 0) return;
        setCoverHeight((prev) => (height > prev ? height : prev));
    }, []);

    const onRootLayout = useCallback((e) => {
        const height = e.nativeEvent.layout.height;
        if (height > overlayMaxRef.current) {
            overlayMaxRef.current = height;
            onOverlayHeight?.(height);
        }
    }, [onOverlayHeight]);

    const translateStyle = useAnimatedStyle(() => {
        if (showSmall) return { transform: [{ translateY: 0 }] };
        const y = coverScrollY ? Math.max(0, coverScrollY.get()) : 0;
        return {
            transform: [{
                translateY: collapseRange > 0
                    ? interpolate(y, [0, collapseRange], [0, -collapseRange], Extrapolation.CLAMP)
                    : 0,
            }],
        };
    }, [collapseRange, coverScrollY, showSmall]);

    return (
        <View
            pointerEvents="box-none"
            onLayout={onRootLayout}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}
        >
            {leading}
            <Animated.View className="bg-background" style={translateStyle}>
                {showSmall ? (
                    <Animated.View key="cover-swap-small" entering={FadeIn.duration(COVER_SWAP_FADE_MS)}>
                        {coverHeaderSmall}
                    </Animated.View>
                ) : (
                    <Animated.View
                        key="cover-swap-full"
                        entering={hasSwappedRef.current ? FadeIn.duration(COVER_SWAP_FADE_MS) : undefined}
                    >
                        <View onLayout={onCoverLayout}>
                            {coverHeader}
                        </View>
                    </Animated.View>
                )}
                {sceneHeader}
                {filter}
            </Animated.View>
        </View>
    );
});

export const TabSceneHeader = React.memo(function TabSceneHeader2({
    headerMode,
    coverBlock,
    pageUri,
    pageContext,
    sceneHeader,
    filter,
    ts,
    coverScrollY,
    onOverlayHeight,
}) {
    const ContextSelector = getComponent('molecule', 'context_selector');
    // One selector for dynamic cover profiles (groups/spaces).
    const useStandaloneContextSelector =
        appSetting('context_selector', 'show_always') &&
        pageContext &&
        headerMode === 'dynamic';

    // Only lift the back button out of the cover when it shares a row with the
    // standalone context selector — otherwise leave it in Cover/CoverSmall.
    const useStandaloneCoverBackButton =
        Platform.OS !== 'web' &&
        headerMode === 'dynamic' &&
        useStandaloneContextSelector;

    // Remount covers on soft-reload (profile `ts`) so CoverImage local state
    // cannot stick after setPageData.
    const coverKey = `${ts ?? ''}:${coverBlock?.cover?.src ?? ''}:${coverBlock?.profile?.url_avatar ?? ''}`;

    const nativeTabsTopInset = isNativeTabsEnabled() ? (getWindowSafeAreaInsets().top || 0) : 0;
    const standaloneContextSelector = useStandaloneContextSelector ? (
        <View style={nativeTabsTopInset > 0 ? { paddingTop: nativeTabsTopInset } : undefined}>
            <Row className={`${conductorTheme.standalone_context_selector} gap-2 items-center `}>
                {useStandaloneCoverBackButton ? <CoverBackButton /> : null}
                <View className="flex-1 shrink">
                    <ContextSelector
                        data={pageContext}
                        url={pageUri}
                        uri={pageUri}
                    />
                </View>
            </Row>
        </View>
    ) : null;

    const coverHeader = useMemo(
        () => (
            <Cover
                key={`cover-${coverKey}`}
                data={coverBlock}
                showMoreMenu={false}
                uri={pageUri}
                context={pageContext}
                suppressContextSelector={useStandaloneContextSelector}
                suppressCoverBackButton={useStandaloneCoverBackButton}
            />
        ),
        [coverKey, coverBlock, pageUri, pageContext, useStandaloneContextSelector, useStandaloneCoverBackButton]
    );
    const coverHeaderSmall = useMemo(
        () => (
            <CoverSmall
                key={`cover-small-${coverKey}`}
                showMoreMenu
                context={pageContext}
                data={coverBlock}
                uri={pageUri}
                suppressContextSelector={useStandaloneContextSelector}
                suppressCoverBackButton={useStandaloneCoverBackButton}
            />
        ),
        [coverKey, coverBlock, pageContext, pageUri, useStandaloneContextSelector, useStandaloneCoverBackButton]
    );
    if (headerMode === 'dynamic') {
        return (
            <DynamicCoverHeader
                pageKey={coverKey}
                coverHeader={coverHeader}
                coverHeaderSmall={coverHeaderSmall}
                sceneHeader={sceneHeader}
                filter={filter}
                leading={standaloneContextSelector}
                coverScrollY={coverScrollY}
                onOverlayHeight={onOverlayHeight}
            />
        );
    }
    if (headerMode === 'small') {
        return (
            <View className="w-full">
                {coverHeader}
                {sceneHeader}
                {filter}
            </View>
        );
    }
    if (headerMode === 'none') {
        return (
            <View className="w-full">
                {sceneHeader}
                {filter}
            </View>
        );
    }
    return null;
});

export const TabBar = React.memo(({
    routes,
    index,
    setIndex,
    onChangeRoute,
    routesRef,
    onSelectTab,
    leftbarMenus = [],
}) => {
    const { t } = useTranslation();
    const visibleRoutes = routes.filter((aItem) => aItem.hideInTop != true);
    const useCompactNav = hasConductorSubitems(routes)
    const hasTabs = useCompactNav || visibleRoutes.length > 1;
    const hasMenus = leftbarMenus.length > 0;

    if (!hasTabs && !hasMenus) return null;

    const selectTab = (a) => {
        if (onSelectTab) {
            onSelectTab(a);
        } else {
            setIndex(a.index)
            if (onChangeRoute) {
                onChangeRoute(routesRef?.current?.[a.index] ?? a)
            }
        }
    }

    return (
        <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            className="overflow-visible"
        >
            <Row className="px-3 pb-3 gap-2 items-center min-h-14" >
                {hasTabs ? (
                    <ConductorTabList
                        routes={routes}
                        index={index}
                        onSelect={selectTab}
                    />
                ) : null}
                {hasMenus ? leftbarMenus.map((blockItem) => (
                    <LeftbarMenuDropdown
                        key={blockItem.id ?? blockItem.block?.name}
                        blockItem={blockItem}
                        t={t}
                    />
                )) : null}
            </Row>
        </ScrollView>
    )
});


export const AT_TOP_SCROLL_THRESHOLD = 50;

export const TabScene = React.memo(({
    route,
    hasNextPage,
    isFetchingNextPage,
    skeleton,
    ListHeaderComponent,
    unitMode,
    fetchNextPage,
    onRefresh,
    refreshing,
    numColumns,
    skipHeaderOffset,
    listRef,
    leftbarExcludedFromMainIds = null,
    coverOverlayPad = 0,
    coverScrollY,
}) => {
    const unitType = useMemo(() => {
        const type = getUnitModeBySource(route?.endpoint)
        return type === 'default' ? getUnitType(route) : type
    }, [route?.endpoint, route?.blocks])

    const handleEndReached = useCallback(

        async (lastItemIndex) => {

            if (isFetchingNextPage) return
            if (hasNextPage === false) return
            if (lastItemIndex === false) return
            fetchNextPage()
        },
        [refreshing, isFetchingNextPage, hasNextPage]
    )

    const renderItem = useCallback(({ item, index }) => (
        <ItemRenderer
            unitType={unitType}
            unitMode={unitMode}
            route={route}
            item={item}
            unit={route?.endpoint?.unit}
            module={route?.endpoint?.module}
        />
    ), [unitType, unitMode, route]);

    const SkeletonForRoute = useMemo(() => {
        const a = getSkeletonByEndPoint(route)
        if (a) return a
        const baseSkeleton =
            skeleton ||
            route?.endpoint?.module ||
            route?.endpoint?.unit
        return unitType ? [baseSkeleton, unitType] : baseSkeleton
    }, [skeleton, route, unitType])

    const layout = layoutForList(route?.endpoint);
    const paddings = paddingForList(route?.endpoint);

    const Preload = useMemo(
        () => getSkeletonForList(SkeletonForRoute, 1, true, layout, renderItem, paddings),
        [SkeletonForRoute, renderItem, layout, paddings]
    )

    //
    const NoContent = getComponent('molecule', 'no_content')

    const feedType = route?.endpoint?.params?.type;

    const mobileLeftbarItems = useMemo(
        () => getMobileLeftbarItems(route?.leftbar?.content, leftbarExcludedFromMainIds),
        [route?.leftbar?.content, leftbarExcludedFromMainIds]
    )

    const routeData = useMemo(() => {
        const leftbarContent = route?.leftbar?.content ?? []
        const leftbarIds = new Set(
            leftbarContent.map((item) => item?.id).filter((id) => id != null)
        )
        const excludedIds = leftbarExcludedFromMainIds

        const rawBase = route?.endpoint
            ? (route.data || [])
            : [...(route.data || []), ...(route.sidebar?.content || [])]

        // Drop leftbar blocks from main data (filters/menus or duplicates).
        const base = rawBase.filter((item) => {
            if (item?.type === 'block' && leftbarIds.has(item?.id)) return false
            if (item?.type === 'block' && excludedIds?.has?.(item?.id)) return false
            return true
        })

        // Leftbar rendered via BlockByName in header (same as desktop), not as list items.
        if (!feedType) return base
        return base.map((item) =>
            item.feed_type === feedType ? item : { ...item, feed_type: feedType }
        )
    }, [
        route?.endpoint,
        route?.data,
        route?.sidebar?.content,
        route?.leftbar?.content,
        feedType,
        leftbarExcludedFromMainIds,
    ]);

    const leftbarHeader = mobileLeftbarItems.length > 0 ? (
        <View className="my-3 mx-2 gap-y-4">
            {mobileLeftbarItems.map((block, index) => {
                const name = block?.block ?? block?.data?.source
                if (!name) return null
                return (
                    <View key={`lb-${block.id ?? name ?? index}`}>
                        <BlockByName
                            data={route?.pageData}
                            name={name}
                            sidebar={true}
                        />
                    </View>
                )
            })}
        </View>
    ) : null

    const combinedHeader = (ListHeaderComponent || leftbarHeader) ? () => (
        <>
            {typeof ListHeaderComponent === 'function'
                ? ListHeaderComponent()
                : ListHeaderComponent || null}
            {leftbarHeader}
        </>
    ) : undefined

    const isEmpty = (route.data || []).filter((item) => item.type != 'block').length === 0
    // Like web: Preload is outside the padded list (preloadComponent), not ListFooter.
    const showPreload = !!(
        route?.endpoint?.request_url &&
        !route?.endpoint?.finished &&
        !refreshing &&
        isEmpty
    )

    return (
        <UniList
            ListHeaderComponent={combinedHeader}
            index={route.index}
            data={routeData}
            route={route}
            unit={route.endpoint?.unit}
            endpoint={route?.endpoint}
            layout={layout}
            renderItem={renderItem}
            preloadComponent={showPreload ? Preload : undefined}
            ListFooterComponent={
                (route?.endpoint?.request_url &&
                    route?.endpoint?.finished &&
                    !isFetchingNextPage &&
                    !refreshing &&
                    isEmpty
                ) ? <NoContent endpoint={route?.endpoint} /> : <></>
            }
            maxToRenderPerBatch={5}
            initialNumToRender={5}
            numColumns={numColumns}
            mode="simple"
            url={route?.endpoint?.request_url}
            onRefresh={onRefresh}
            refreshing={refreshing}
            onEndReached={handleEndReached}
            skipHeaderOffset={skipHeaderOffset}
            coverOverlayPad={coverOverlayPad}
            coverScrollY={coverScrollY}
            refer={listRef}
        />
    )
});
