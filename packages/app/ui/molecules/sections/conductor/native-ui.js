import React, { useCallback, useState, useLayoutEffect, useMemo, useRef } from "react";
import Animated, { useSharedValue, useAnimatedStyle, interpolate, Extrapolation, useAnimatedReaction, runOnJS, FadeIn } from 'react-native-reanimated';
import { View, ScrollView, Row } from 'app/design/view';
import { appSetting, isNativeTabsEnabled } from 'app/lib/util';
import { hasConductorSubitems, registeredComponent } from './helpers';
import { LeftColumnMenuDropdown, TabList, ListScene } from './shared-ui';
import Cover, { CoverSmall, CoverBackButton } from 'app/components/elements/cover';
import { useStableSafeAreaInsets } from 'app/lib/hooks/router'
import { useTranslation } from 'react-i18next';

const conductorTheme = appSetting('theme', 'conductor')

// Scroll jitter right at the collapse threshold must not flip-flop the
// Cover/CoverSmall swap (each flip is a JS remount).
const COVER_SWAP_HYSTERESIS = 8;
// Masks the content pop of the hard swap. Entering-only: an exiting
// animation would keep both covers mounted at once (see Host crash note).
const COVER_SWAP_FADE_MS = 160;

const COVER_OVERLAY_STYLE = { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }

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
    nativeTabsTopInset = 0,
}) {
    const [coverHeight, setCoverHeight] = useState(0);
    const [showSmall, setShowSmall] = useState(false);
    const overlayMaxRef = useRef(0);
    // Fade the full cover back in only after a real swap, never on first mount.
    const hasSwappedRef = useRef(false);
    const collapsedSV = useSharedValue(false);
    const compactHeight = 64 + nativeTabsTopInset;
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
            style={COVER_OVERLAY_STYLE}
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

export const TabSceneHeader = React.memo(function TabSceneHeader({
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
    const ContextSelector = registeredComponent('molecule', 'context_selector');
    const { top: stableTopInset } = useStableSafeAreaInsets();
    // One selector for dynamic cover profiles (groups/spaces).
    const useStandaloneContextSelector =
        appSetting('context_selector', 'show_always') &&
        pageContext &&
        headerMode === 'dynamic';

    // Lift the back button out of the cover when it shares a row with the
    // standalone context selector — otherwise leave it in Cover/CoverSmall.
    const useStandaloneCoverBackButton = !!useStandaloneContextSelector;

    // Remount covers on soft-reload (profile `ts`) so CoverImage local state
    // cannot stick after setPageData.
    const coverKey = `${ts ?? ''}:${coverBlock?.cover?.src ?? ''}:${coverBlock?.profile?.url_avatar ?? ''}`;

    const nativeTabsTopInset = isNativeTabsEnabled() ? (stableTopInset || 0) : 0;
    const selectorPadStyle = useMemo(
        () => (nativeTabsTopInset > 0 ? { paddingTop: nativeTabsTopInset } : undefined),
        [nativeTabsTopInset]
    );

    const standaloneContextSelector = useMemo(() => {
        if (!useStandaloneContextSelector || !ContextSelector) return null
        return (
            <View style={selectorPadStyle}>
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
        )
    }, [
        useStandaloneContextSelector,
        useStandaloneCoverBackButton,
        selectorPadStyle,
        ContextSelector,
        pageContext,
        pageUri,
    ]);

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
                nativeTabsTopInset={nativeTabsTopInset}
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
    leftColumnMenus = [],
}) => {
    const { t } = useTranslation();
    const visibleRoutes = routes.filter((aItem) => aItem.hideInTop != true);
    const useCompactNav = hasConductorSubitems(routes)
    const hasTabs = useCompactNav || visibleRoutes.length > 1;
    const hasLeftColumnMenus = leftColumnMenus.length > 0;

    const selectTab = useCallback((a) => {
        if (onSelectTab) {
            onSelectTab(a);
        } else {
            setIndex(a.index)
            if (onChangeRoute) {
                onChangeRoute(routesRef?.current?.[a.index] ?? a)
            }
        }
    }, [onSelectTab, setIndex, onChangeRoute, routesRef])

    if (!hasTabs && !hasLeftColumnMenus) return null;

    return (
        <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            className="overflow-visible"
        >
            <Row className="px-3 pb-3 gap-2 items-center min-h-14" >
                {hasTabs ? (
                    <TabList
                        routes={routes}
                        index={index}
                        onSelect={selectTab}
                    />
                ) : null}
                {hasLeftColumnMenus ? leftColumnMenus.map((blockItem) => (
                    <LeftColumnMenuDropdown
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

export const TabScene = React.memo(function TabScene({
    route,
    hasNextPage,
    skeleton,
    unitMode,
    handleEndReached,
    onRefresh,
    refreshing,
    numColumns,
    skipHeaderOffset,
    listRef,
    leftColumnExcludedFromMainIds = null,
    coverOverlayPad = 0,
    coverScrollY,
    isInited = true,
    listItems,
    listReady = true,
    isPending = false,
    isFetching = false,
    onFormChangedValues,
}) {
    const uniListProps = useMemo(() => ({
        index: route.index,
        maxToRenderPerBatch: 5,
        initialNumToRender: 5,
        numColumns,
        mode: 'simple',
        url: route?.endpoint?.request_url,
        skipHeaderOffset,
        coverOverlayPad,
        coverScrollY,
    }), [
        route.index,
        route?.endpoint?.request_url,
        numColumns,
        skipHeaderOffset,
        coverOverlayPad,
        coverScrollY,
    ])

    return (
        <ListScene
            route={route}
            skeleton={skeleton}
            unitMode={unitMode}
            skeletonCount={1}
            listItems={listItems}
            includeSidebar
            showMobileLeftColumn
            leftColumnExcludedFromMainIds={leftColumnExcludedFromMainIds}
            onFormChangedValues={onFormChangedValues}
            leftColumnClassName="my-3 mx-2 gap-y-4"
            isInited={isInited}
            listReady={listReady}
            refreshing={refreshing}
            hasNextPage={hasNextPage}
            isPending={isPending}
            isFetching={isFetching}
            preloadWhenEmpty
            headerInList
            showListPreload
            listRef={listRef}
            handleEndReached={handleEndReached}
            onRefresh={onRefresh}
            uniListProps={uniListProps}
        />
    )
});
