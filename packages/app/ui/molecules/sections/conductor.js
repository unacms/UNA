import React, { useCallback, useState, useEffect, useLayoutEffect, useMemo, useRef, useContext } from "react";
import { Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, interpolate, Extrapolation, useAnimatedReaction, runOnJS, FadeIn } from 'react-native-reanimated';
import { View, ScrollView, Row, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import UniList from 'app/ui/atoms/unilist'
import { Icon } from 'app/ui/atoms/icon'
import DropdownMenu, { DropdownMenuOpenContext } from 'app/ui/atoms/dropdown-menu'
import { appSetting, deepEqual, getUnitModeBySource, isNativeTabsEnabled } from 'app/lib/util';
import { fillTabs, mergeConductorRoutes, parseData, fetchAndUpdateData, getAddon, getUnitType, findConductorRouteIndex, findConductorRouteIndexOrZero, hasConductorSubitems, conductorHref, ConductorCompactNav } from 'app/lib/conductor-helpers';
import { ItemRenderer } from 'app/components/item-renderer';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { getSkeletonForList } from 'app/lib/skeleton-helpers';
import { Button } from 'app/design/controls';
import { useCurrentUser } from 'app/context/user'
import { subscribe } from 'app/ui/atoms/socket';
import { fetcher } from 'app/lib/fetcher';
import Snackbar from 'app/ui/atoms/snackbar';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { BlockByName } from 'app/components/block';
import Cover, { CoverSmall, CoverBackButton } from 'app/components/elements/cover';
import emitter from 'app/context/emitter'
import { useSetHeader, useGetScrollValue, defaultHeader, useSetHeaderHeight, getHeaderWriteGeneration } from 'app/context/jotai/layout';
import { isTabScopedChromeKey, useTabChromeKey } from 'app/context/tab-chrome';
import { getComponent } from 'app/components/registry';
import { getWindowSafeAreaInsets, useFocusEffect, useIsFocused } from 'app/lib/hooks/router'
import {
    getCachedConductorState,
    setCachedConductorState,
    consumeNotificationsConductorStale,
} from 'app/lib/cache/native-conductor-cache';
import { setListScrollOffset } from 'app/lib/cache/list-scroll-cache';
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

const TabSceneHeader = React.memo(function TabSceneHeader2({
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

const normalizeLeftbarMenuItem = (item, index) => {
    const rawLink = item?.url || item?.link || ''
    const link =
        rawLink && rawLink !== 'javascript:void(0)'
            ? rawLink.startsWith('/')
                ? rawLink
                : `/${rawLink}`
            : ''
    return {
        id: item?.id ?? item?.name ?? index,
        title: item?.title || item?.name || '',
        icon: item?.icon || 'Circle',
        link,
    }
}

const getDropdownItemsFromLeftbarBlock = (blockItem) => {
    const elements = blockItem?.data?.content
    if (!Array.isArray(elements)) return []

    return elements
        .flatMap((el) => {
            const type = el?.type || el?.content_type
            if (type === 'menu') {
                const items = el?.data?.content?.items ?? el?.content?.items ?? []
                return items.map(normalizeLeftbarMenuItem)
            }
            if (type === 'categories_list') {
                const items = Array.isArray(el?.data)
                    ? el.data
                    : Array.isArray(el?.data?.content)
                        ? el.data.content
                        : []
                return items.map(normalizeLeftbarMenuItem)
            }
            if (
                Array.isArray(el?.data) &&
                el.data[0] &&
                (el.data[0].url || el.data[0].link || el.data[0].name || el.data[0].title)
            ) {
                return el.data.map(normalizeLeftbarMenuItem)
            }
            return []
        })
        .filter((item) => item.title)
}

function LeftbarMenuTrigger({ title, icon }) {
    const isOpen = useContext(DropdownMenuOpenContext) ?? false
    return (
        <Row
            className={`items-center h-9 px-2 gap-1 rounded-full shrink-0 ${
                isOpen ? 'bg-muted' : ''
            }`}
        >
            <Icon icon={icon} size={16} className="text-secondary-foreground shrink-0" />
            <Text className="text-sm font-semibold text-card-foreground">
                {title}
            </Text>
            <Icon
                icon={isOpen ? 'ChevronUp' : 'ChevronDown'}
                size={16}
                className="text-muted-foreground shrink-0"
            />
        </Row>
    )
}

function LeftbarMenuDropdown({ blockItem, t }) {
    const items = useMemo(
        () => getDropdownItemsFromLeftbarBlock(blockItem),
        [blockItem]
    )
    if (!items.length) return null

    const title = t(blockItem?.data?.title || 'Menu')
    const icon = blockItem?.data?.config_api?.icon || 'LayoutGrid'

    return (
        <DropdownMenu
            items={items}
            mode="popup"
            triggerAccessibilityLabel={title}
        >
            <LeftbarMenuTrigger title={title} icon={icon} />
        </DropdownMenu>
    )
}

const TabBar = React.memo(({
    routes,
    index,
    setIndex,
    onChangeRoute,
    routesRef,
    onSelectTab,
    leftbarMenus = [],
}) => {
    const MenuItemSubmenu = getComponent('menu-item', 'submenu');
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

    const renderPill = (a) => {
        const href = conductorHref(a.link || a.key)

        if (a.icon === '*') {
            return (
                <Pressable
                    accessibilityRole="link"
                    accessibilityLabel={a.title}
                    onPress={() => selectTab(a)}
                >
                    <Text className="text-base font-medium text-card-foreground">
                        {a.title}
                    </Text>
                </Pressable>
            )
        }

        return (
            <MenuItemSubmenu
                title={a.title}
                pressed={a.index == index}
                disabled={a?.item?.disabled}
                addon={getAddon(a.addon)}
                href={href}
                onPress={() => selectTab(a)}
                item={a}
            />
        )
    }

    return (
        <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            className="overflow-visible"
        >
            <Row className="px-3 pb-3 gap-2 items-center min-h-14" >
                {hasTabs && (useCompactNav ? (
                    <ConductorCompactNav
                        routes={routes}
                        index={index}
                        onSelect={selectTab}
                        renderPill={renderPill}
                    />
                ) : visibleRoutes.map((a) => (
                    <View
                        className={`flex-none items-center justify-center ${a?.menu_settings?.class || ''}`}
                        key={`tab-${a.index}`}
                    >
                        {renderPill(a)}
                    </View>
                )))}
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


const AddBlocks = React.memo(({
    leftSideBarBlocks, data, onFormSubmit, onChange
}) => {
    if (!leftSideBarBlocks?.length) return null

    return (
        <View className="my-3 mx-2 ">
            {leftSideBarBlocks.map((block, index) => {
                const name =
                    typeof block === 'string'
                        ? block
                        : block?.block ?? block?.data?.source
                const key =
                    typeof block === 'string'
                        ? block
                        : block?.id ?? block?.data?.id ?? index
                if (!name) return null
                return (
                    <View key={`lb-${key}`}>
                        <BlockByName
                            data={data}
                            name={name}
                            onFormSubmit={onFormSubmit}
                            onChange={onChange}
                            saveOnChanges={true}
                            sidebar={true}
                        />
                    </View>
                )
            })}
        </View>
    )
});

const AT_TOP_SCROLL_THRESHOLD = 50;

/** Re-apply conductor-stored form values into pageData form inputs (any field type). */
function pageDataWithRestoredFormValues(pageData, formValues) {
    if (!pageData?.elements || !formValues || Object.keys(formValues).length === 0) {
        return pageData
    }
    const elements = JSON.parse(JSON.stringify(pageData.elements))
    const visit = (node) => {
        if (!node || typeof node !== 'object') return
        if (Array.isArray(node)) {
            node.forEach(visit)
            return
        }
        if (
            (node.type === 'form' || node.content_type === 'form') &&
            node.data?.inputs
        ) {
            Object.keys(formValues).forEach((key) => {
                if (!node.data.inputs[key]) return
                node.data.inputs[key].value = formValues[key]
            })
        }
        Object.values(node).forEach(visit)
    }
    visit(elements)
    return { ...pageData, elements }
}

const TabScene = React.memo(({
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

    const mobileLeftbarItems = useMemo(() => {
        const leftbarContent = route?.leftbar?.content ?? []
        const excludedIds = leftbarExcludedFromMainIds
        return leftbarContent.filter((item) => {
            if (item.data?.hidden_on?.includes?.('phone')) return false
            if (excludedIds?.has?.(item?.id)) return false
            return true
        })
    }, [route?.leftbar?.content, leftbarExcludedFromMainIds])

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

/** Match conductor submenu tab to page URL.
 * Supports nested paths: `group-respect/9c882` → tab `group-respect`.
 * Returns -1 when no tab matches (callers that need a default use `?? 0`). */
function findConductorTabIndex(tabRoutes, url, useSectionAsMenu) {
    return findConductorRouteIndex(tabRoutes, url, useSectionAsMenu);
}

function findConductorTabIndexOrZero(tabRoutes, url, useSectionAsMenu) {
    return findConductorRouteIndexOrZero(tabRoutes, url, useSectionAsMenu);
}

export function Conductor({ isCoverDisabled, header, isHideDefaultHeader, leftSideBarBlocks, menu, layoutName, data, blocks, useSectionAsMenu, unitMode, skeleton, onChangeRoute, keyword, ts }) {
    const { t } = useTranslation();
    isHideDefaultHeader = isHideDefaultHeader || false;
    useSectionAsMenu = useSectionAsMenu || false;
    skeleton = skeleton || '';
    unitMode = unitMode || '';
    const isFormInitialized = useRef(false);
    const routesRef = useRef(null);
    const { currentUser } = useCurrentUser();

    const { setBottomSheetData } = useBottomSheetData();
    const initedTabs = useMemo(() => fillTabs(menu, data, blocks, currentUser, useSectionAsMenu), [menu, data, blocks, currentUser, useSectionAsMenu]);;
    const conductorCacheKey = `${layoutName}:${data?.url ?? ''}:${currentUser?.id ?? 'guest'}`;
    const cachedConductor = getCachedConductorState(layoutName, data?.url, currentUser?.id);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [routes, setRoutes1] = useState(cachedConductor?.routes ?? initedTabs);
    const [menuState, setMenuState] = useState(menu);
    const [isRevalidate, setIsRevalidate] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [refreshRequested, setRefreshRequested] = useState(false);

    const setHeader = useSetHeader();
    const setHeaderHeight = useSetHeaderHeight();
    const getScrollValue = useGetScrollValue();
    const tabScopedHeader = isTabScopedChromeKey(useTabChromeKey());
    // Tab screens stay mounted when blurred (see tabs.js) — every write to the
    // shared header atom and every global emitter command must be gated on
    // focus, otherwise a background conductor clobbers the visible submenu.
    const isFocused = useIsFocused();
    const isFocusedRef = useRef(isFocused);
    isFocusedRef.current = isFocused;

    const listRef = useRef(null);
    const coverScrollY = useSharedValue(0);
    const [coverOverlayPad, setCoverOverlayPad] = useState(0);
    const onOverlayHeight = useCallback((height) => {
        setCoverOverlayPad((prev) => (prev === height ? prev : height));
    }, []);
    const activeRequestUrlRef = useRef(null);
    const pageRevRef = useRef({
        url: data?.url,
        keyword,
        timestamp: data?.timestamp,
        ts,
        didMount: false,
    });

    const setRoutes = /*useCallback(*/(a) => {
        setRoutes1(a);
    }/*, []);*/

    useEffect(() => {
        if (!deepEqual(menu, menuState)) {
            setMenuState(menu);
            setRoutes((prev) => mergeConductorRoutes(initedTabs, prev));
        }
    }, [menu, menuState, initedTabs, data]);

    routesRef.current = routes;
    // Always align submenu to page URL. Cached index is the last *clicked* tab and
    // must not win over the URL when re-entering the same page (e.g. group-respect/…).
    const initialIndex = useMemo(
        () => findConductorTabIndexOrZero(routes, data?.url, useSectionAsMenu),
        [routes, data?.url, useSectionAsMenu]
    );

    const [index, _setIndex] = useState(initialIndex);
    const [prevIndex, setPrevIndex] = useState(initialIndex);
    const indexRef = useRef(initialIndex);

    useEffect(() => {
        indexRef.current = index;
    }, [index]);

    // Write-through while URL is stable so a timestamp remount can bootstrap
    // from cache. Do not key this effect on data.url — a URL change would
    // otherwise store the previous page's routes under the new URL.
    useEffect(() => {
        if (!layoutName || !data?.url || !routes?.some((route) => route.inited)) {
            return;
        }
        setCachedConductorState(layoutName, data.url, {
            routes,
            index,
        }, currentUser?.id);
    }, [layoutName, routes, index, currentUser?.id]);

    useEffect(() => {
        return () => {
            if (!data?.url || !routesRef.current?.some((route) => route.inited)) {
                return;
            }
            setCachedConductorState(layoutName, data.url, {
                routes: routesRef.current,
                index: indexRef.current,
            }, currentUser?.id);
        };
    }, [conductorCacheKey, layoutName, data?.url, currentUser?.id]);

    // Stable identity: setIndex feeds the sceneHeader memo — recreating it every
    // render would recompute the submenu (and rewrite the header atom) on each render.
    const setIndex = useCallback((newIndex) => {
        setPrevIndex(indexRef.current);
        _setIndex(newIndex);
    }, []);

    // Submenu tabs switch in place. The screen URL must stay on the page that
    // owns the cover: changing it makes the shell look for page data under the
    // new path, find none for a tab that was never opened, and unmount the whole
    // page (cover included) until the fetch resolves. The tab content itself is
    // loaded here by the route query, so no page-level navigation is needed.
    const onSelectTab = useCallback((tab) => {
        setIndex(tab.index);
        if (onChangeRoute) {
            onChangeRoute(routesRef.current?.[tab.index] ?? tab);
        }
    }, [setIndex, onChangeRoute]);

    // Sync when page URL / soft-refresh timestamp changes (ts from profile soft-reload).
    // Skip the first run: useState already bootstrapped from conductor cache.
    // A mount setRoutes(fillTabs()) was wiping that cache (parsed layouts have
    // no browse rows until parseData).
    useEffect(() => {
        const prev = pageRevRef.current;
        const urlOrSearchChanged = prev.url !== data?.url || prev.keyword !== keyword;
        const softRefresh = prev.timestamp !== data?.timestamp || prev.ts !== ts;
        pageRevRef.current = {
            url: data?.url,
            keyword,
            timestamp: data?.timestamp,
            ts,
            didMount: true,
        };

        if (!prev.didMount) {
            return;
        }

        if (urlOrSearchChanged) {
            setRoutes(initedTabs);
            // data.url points at the page, not at the active subtab, so only a real
            // navigation may move the selection. On a soft refresh it would drag the
            // user back to the entry tab.
            const foundIndex = findConductorTabIndex(initedTabs, data?.url, useSectionAsMenu);
            if (foundIndex !== -1 && foundIndex !== indexRef.current) {
                setIndex(foundIndex);
            }
        } else if (softRefresh) {
            setRoutes((current) => mergeConductorRoutes(initedTabs, current));
        }
    }, [keyword, data?.url, data?.timestamp, ts]);

    // Same-URL link presses still fire (navigation may no-op) — switch submenu by href.
    useEffect(() => {
        const sub = emitter.addListener('link', (payload) => {
            if (!isFocusedRef.current) return;
            const href = payload?.href;
            if (!href) return;
            const foundIndex = findConductorTabIndex(routesRef.current, href, useSectionAsMenu);
            if (foundIndex !== -1 && foundIndex !== indexRef.current) {
                setIndex(foundIndex);
            }
        });
        return () => sub.remove();
    }, [useSectionAsMenu, setIndex]);


    /*const currentRoute = useMemo(() => routes.find((item) => item.index === index), [routes, index]);
    const prevRoute = useMemo(() => routes.find((item) => item.index === prevIndex), [routes, prevIndex]);;
    */
    const prevRoute = useMemo(
        () => routes.find((item) => item.index === prevIndex),
        [routes, prevIndex]
    );
    // Selected tab route (may still be loading — fetch logic must not use the fallback below).
    const activeRoute = useMemo(
        () => routes.find((item) => item.index === index),
        [routes, index]
    );
    activeRequestUrlRef.current = activeRoute?.endpoint?.request_url ?? null;
    const currentRoute = useMemo(() => {
        return activeRoute?.inited ? activeRoute : (prevRoute ?? activeRoute);
    }, [activeRoute, prevRoute]);
    // Query key follows the selected tab only after fetchAndUpdateData inits it — not prevRoute's endpoint.
    // Full params (incl. status) so group activate/deactivate does not reuse an empty cache.
    const endpointParamsKey = useMemo(
        () => JSON.stringify(activeRoute?.inited ? (activeRoute?.endpoint?.params ?? null) : null),
        [activeRoute?.inited, activeRoute?.endpoint?.params]
    );
    const qKey = useMemo(
        () => [
            activeRoute?.inited ? activeRoute?.endpoint?.request_url : null,
            index,
            keyword,
            endpointParamsKey,
            ts,
        ],
        [activeRoute?.inited, activeRoute?.endpoint?.request_url, index, keyword, endpointParamsKey, ts]
    );
    const queryClient = useQueryClient();

    const numColumns = 1;

    // Drop cached hasNextPage=false when the selected tab changes so the first fetch is not blocked.
    useEffect(() => {
        if (!activeRoute?.inited) return;
        queryClient.removeQueries({ queryKey: qKey });
    }, [index, activeRoute?.inited, qKey, queryClient]);

    useEffect(() => {
        if (currentRoute.cached) {
            revalidateData();

        }
    }, []);

    useEffect(() => {
        if (currentRoute?.endpoint?.unit !== 'feed')
            return;

        const sub1 = subscribe('bx_timeline_0', 'added', setIsRevalidate);
        const sub2 = subscribe('bx_timeline_0', 'deleted', setIsRevalidate);

        return () => {
            sub1();
            sub2();
        };
    }, []);

    useEffect(() => {
        const subscription2 = emitter.addListener('feed', (data) => {
            if (data.action == 'remove_content') {
                setRoutes(prevRoutes => {
                    const newRoutes = [...prevRoutes];
                    newRoutes[index] = {
                        ...newRoutes[index],
                        data: newRoutes[index].data.filter(item => item.id != data.id)
                    };
                    return newRoutes;
                });
            }
            if (data.action == 'new_content' && (!currentRoute?.endpoint?.params?.owner_id || Math.abs(currentRoute?.endpoint?.params?.owner_id) == Math.abs(data?.data?.owner_id))) {
                setRoutes(prevRoutes => {
                    const newRoutes = [...prevRoutes];
                    const routeData = newRoutes[index].data;
                    const lastBlockIndex = routeData.findLastIndex(item => item.type === 'block');
                    const insertAt = lastBlockIndex + 1;
                    newRoutes[index] = {
                        ...newRoutes[index],
                        data: [
                            ...routeData.slice(0, insertAt),
                            data.data,
                            ...routeData.slice(insertAt)
                        ]
                    };
                    return newRoutes;
                });
            }
        })

        return () => {

            subscription2.remove()
        }
    }, [])

    useEffect(() => {
        if (isRevalidate)
            revalidateData();
    }, [isRevalidate]);


    // Gate fetches on the selected tab once inited — not on prevRoute while the new tab is loading.
    const bEnabled = Boolean(
        activeRoute?.inited &&
        activeRoute?.endpoint &&
        activeRoute.endpoint.request_url &&
        !activeRoute.endpoint.finished &&
        (activeRoute.endpoint.params?.start == 0 ||
            activeRoute.data.length <
            (activeRoute.endpoint.params?.per_page ?? Number.POSITIVE_INFINITY)) &&
        !isRefreshing
    );

    const {
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useInfiniteQuery({
        queryKey: qKey,
        queryFn: ({ pageParam }) => parseData(routesRef.current, index, setRoutes),
        getNextPageParam: (lastPage, pages) => {
            if (lastPage?.data?.length > 0) {
                return lastPage?.endpoint;
            }

            return;
        },
        enabled: false//routes[index]?.data?.length == 0
    });

    useEffect(() => {
        // Do not check hasNextPage===false here — a premature empty page marks false and blocks the real first fetch.
        if (!bEnabled || isFetchingNextPage) return;
        fetchNextPage();
    }, [bEnabled, activeRoute?.data?.length, isFetchingNextPage, fetchNextPage]);

    useEffect(() => {
        setSnackbarVisible(false);
        isFormInitialized.current = false;
    }, [index]);

    const showNewContent2 = async () => {
        const newRoutes = [...routes];
        newRoutes[index].endpoint.finished = false;
        newRoutes[index].data = newRoutes[index].data.filter(item => item.type === 'block');;
        newRoutes[index].endpoint.params.start = 0;
        setRoutes(newRoutes);
        setSnackbarVisible(false);
    }

    const revalidateData = useCallback(async () => {
        const hasEndpoint = Boolean(currentRoute?.endpoint);
        let endpointUpdateContent = '';
        let bUpdateContent = false;
        const revalidatedData = JSON.parse(isRevalidate);
        if (hasEndpoint) {

            const a = [...new Set(currentRoute.data
                .filter(item => item.type !== 'block')
                .map(item => item.id)
            )].slice(0, 10).join(',');

            if ((a || true) && revalidatedData.author_id != currentUser?.id && !currentRoute.endpoint.request_url.includes("system/get_results/TemplSearchExtendedServices")) {
                endpointUpdateContent = currentRoute.endpoint.request_url + JSON.stringify({
                    'params': { ...currentRoute.endpoint.params, validate: a }
                });
                bUpdateContent = true;
            }
        }
        if (bUpdateContent) {
            const validatedData = (await fetcher(endpointUpdateContent)).data?.[0]?.data?.data;

            if (validatedData && (validatedData == 'valid' || validatedData == 'invalid')) {
                setSnackbarVisible(validatedData !== 'valid');
            }
        }
    }, [currentRoute, isRevalidate, currentUser?.id]);

    useEffect(() => {
        fetchAndUpdateData(routes, index, setRoutes);
    }, [index]);

    const onStartRefresh = useCallback(() => {
        const requestUrl = activeRoute?.endpoint?.request_url;
        if (requestUrl) {
            setListScrollOffset(requestUrl, 0);
        }
        setRoutes((prevRoutes) =>
            prevRoutes.map((route) => {
                if (route.index !== index) return route;
                return {
                    ...route,
                    data: (route.data || []).filter((item) => item.type === 'block'),
                    endpoint: route.endpoint
                        ? {
                            ...route.endpoint,
                            finished: false,
                            params: {
                                ...route.endpoint.params,
                                start: 0,
                            },
                        }
                        : route.endpoint,
                };
            })
        );
        setIsRefreshing(true);
        setRefreshRequested(true);
    }, [index, activeRoute?.endpoint?.request_url]);

    // CounterChecker emits when unread grows; only act if notifications list is focused.
    // Keep the badge until the user leaves the tab (tabs/navigator still clear on enter).
    useEffect(() => {
        const subscription = emitter.addListener('notifications', (payload) => {
            if (payload?.action !== 'arrived') return;
            if (!isFocusedRef.current) return;
            const unit = routesRef.current?.[indexRef.current]?.endpoint?.unit;
            if (unit !== 'notifications') return;

            consumeNotificationsConductorStale();
            onStartRefresh();
        });
        return () => subscription.remove();
    }, [onStartRefresh]);

    useEffect(() => {
        const subscription = emitter.addListener('list', (payload) => {
            if (!isFocusedRef.current) return;
            if (payload?.action === 'refresh') {
                onStartRefresh();
            }
        });
        return () => subscription.remove();
    }, [onStartRefresh]);

    useEffect(() => {
        const subscription = emitter.addListener('page', (payload) => {
            if (!isFocusedRef.current) return;
            if (payload?.action === 'reload') {
                onStartRefresh();
            }
        });
        return () => subscription.remove();
    }, [onStartRefresh]);

    useEffect(() => {
        const subscription = emitter.addListener('conductor', (payload) => {
            if (!isFocusedRef.current) return;
            if (payload?.action !== 'reset_to_first') return;

            if (indexRef.current !== 0) {
                setIndex(0);
                return;
            }

            const requestUrl = activeRequestUrlRef.current;
            if (getScrollValue() > AT_TOP_SCROLL_THRESHOLD) {
                if (requestUrl) {
                    setListScrollOffset(requestUrl, 0);
                }
                if (listRef.current?.scrollToOffset) {
                    listRef.current.scrollToOffset({ offset: 0, animated: true });
                } else {
                    listRef.current?.scrollToIndex?.({ index: 0, animated: true });
                }
                return;
            }

            onStartRefresh();
        });
        return () => subscription.remove();
    }, [setIndex, onStartRefresh, getScrollValue]);

    useEffect(() => {
        if (!refreshRequested) {
            return;
        }

        let isMounted = true;
        const runRefresh = async () => {
            try {
                queryClient.removeQueries({ queryKey: qKey });
                await fetchNextPage();
            } finally {
                if (isMounted) {
                    setIsRefreshing(false);
                    setRefreshRequested(false);
                }
            }
        };

        runRefresh();
        return () => {
            isMounted = false;
        };
    }, [refreshRequested, queryClient, qKey, fetchNextPage]);


    const leftbarContent = currentRoute?.leftbar?.content ?? []
    // Dropdown only when use_as_menu is explicitly set.
    const leftbarMenuBlocks = useMemo(
        () =>
            leftbarContent.filter(
                (item) =>
                    !item?.data?.config_api?.use_as_filter &&
                    !!item?.data?.config_api?.use_as_menu &&
                    getDropdownItemsFromLeftbarBlock(item).length > 0
            ),
        [leftbarContent]
    )
    // use_as_filter → Filters on any layout. navigator keeps legacy: remaining non-menu leftbar.
    const leftbarFilterBlocks = useMemo(
        () =>
            leftbarContent.filter((item) => {
                if (item?.data?.config_api?.use_as_filter) return true
                if (layoutName !== 'navigator') return false
                if (!item?.data?.config_api?.use_as_menu) return true
                return getDropdownItemsFromLeftbarBlock(item).length === 0
            }),
        [leftbarContent, layoutName]
    )
    // Same as web: do not also render menu/filter (or all navigator leftbar) in main list.
    const leftbarExcludedFromMainIds = useMemo(() => {
        if (layoutName === 'navigator') {
            return new Set(
                leftbarContent.map((item) => item?.id).filter((id) => id != null)
            )
        }
        return new Set(
            [...leftbarMenuBlocks, ...leftbarFilterBlocks]
                .map((item) => item?.id)
                .filter((id) => id != null)
        )
    }, [layoutName, leftbarContent, leftbarMenuBlocks, leftbarFilterBlocks])

    // Prefer route leftbar; keep legacy string-name prop as fallback.
    const filtersSheetBlocks = useMemo(() => {
        if (leftbarFilterBlocks.length > 0) return leftbarFilterBlocks
        return Array.isArray(leftSideBarBlocks) ? leftSideBarBlocks : []
    }, [leftbarFilterBlocks, leftSideBarBlocks])

    const isShowFilters = filtersSheetBlocks.length > 0;

    const tabBarMetaKey = useMemo(
        () =>
            routes
                .map(
                    (r) =>
                        `${r.index}:${r.title}:${r.hideInTop ?? ''}:${r.key ?? ''}:${r.item?.disabled ?? ''}:${r.hasChildren ?? ''}:${r.parentIndex ?? ''}`
                )
                .join('|'),
        [routes]
    );

    const tabBarRoutes = useMemo(
        () =>
            routes.map(({ index: routeIndex, title, hideInTop, menu_settings, addon, item, key, link, icon, hasChildren, childIndices, parentIndex, canNavigate, depth, image }) => ({
                index: routeIndex,
                title,
                hideInTop,
                menu_settings,
                addon,
                item,
                key,
                link,
                icon,
                hasChildren,
                childIndices,
                parentIndex,
                canNavigate,
                depth,
                image,
            })),
        [tabBarMetaKey]
    );

    const sceneHeader = useMemo(
        () => (
            <TabBar
                routes={tabBarRoutes}
                routesRef={routesRef}
                index={index}
                setIndex={setIndex}
                onChangeRoute={onChangeRoute}
                onSelectTab={onSelectTab}
                leftbarMenus={leftbarMenuBlocks}
            />
        ),
        [tabBarRoutes, index, setIndex, onChangeRoute, onSelectTab, leftbarMenuBlocks]
    );

    const setFilterValue = useCallback((values, rawFormValues) => {
        setRoutes(prevRoutes => {
            const newRoutes = [...prevRoutes];
            if (!newRoutes[index]?.endpoint?.params) return prevRoutes;

            const filters = {};
            values.forEach(v => { filters[v.name] = v.value; });

            newRoutes[index] = {
                ...newRoutes[index],
                data: [],
                endpoint: {
                    ...newRoutes[index].endpoint,
                    finished: false,
                    params: {
                        ...newRoutes[index].endpoint.params,
                        filters,
                        start: 0,
                    },
                    ...(rawFormValues != null
                        ? { filterFormValues: rawFormValues }
                        : {}),
                },
            };
            return newRoutes;
        });
    }, [index])

    const onFormChangedValues = useCallback((values) => {
        if (!isFormInitialized.current) {
            isFormInitialized.current = true;
            return;
        }

        let filterValues = []
        for (let key in values) {
            filterValues.push({
                name: key,
                value: Array.isArray(values[key])
                    ? values[key].join(',')
                    : values[key],
            })
        }

        const currentFilters = routesRef.current?.[index]?.endpoint?.params?.filters
        const newFilters = {}
        filterValues.forEach(f => { newFilters[f.name] = f.value })
        if (JSON.stringify(currentFilters) !== JSON.stringify(newFilters)) {
            setFilterValue(filterValues, values)
        }
    }, [index, setFilterValue])

    const onFormSubmit = useCallback((formData, d) => {
        let filterValues = [];
        for (let key in d) {
            filterValues.push({ name: key, value: Array.isArray(d[key]) ? d[key].join(',') : d[key] })
        };
        setFilterValue(filterValues, d);
        setBottomSheetData(false);
    }, [setFilterValue, setBottomSheetData]);

    const showFilters = useCallback(() => {
        const pageData = pageDataWithRestoredFormValues(
            currentRoute?.pageData ?? data,
            routesRef.current?.[index]?.endpoint?.filterFormValues
        )
        setBottomSheetData({
            title: t('Filters'),
            content: (
                <AddBlocks
                    leftSideBarBlocks={filtersSheetBlocks}
                    data={pageData}
                    onFormSubmit={onFormSubmit}
                    onChange={onFormChangedValues}
                />
            ),
            showClose: true,
            snapPoints: ['60%', '60%'],
        });
    }, [filtersSheetBlocks, currentRoute?.pageData, data, onFormSubmit, onFormChangedValues, t, setBottomSheetData, index]);

    const filter = useMemo(
        () =>
            isShowFilters ? (
                <View className="items-start ml-3 mt-2 mb-1">
                    <Button title={t('Filters')} variant="default" size="sm" rounded onPress={showFilters} />
                </View>
            ) : null,
        [isShowFilters, showFilters, t]
    );

    const coverMode = appSetting(
        'cover',
        'view_by_module',
        data?.cover_block?.profile?.module ?? currentRoute?.pageData?.cover_block?.profile?.module
    );

    const isProfileLayout = layoutName === 'profile';
    const hasDynamicCover = isProfileLayout && !isCoverDisabled && coverMode !== 'none';
    const headerMode = !isProfileLayout
        ? 'none'      // settings on weave
        : hasDynamicCover
            ? 'dynamic' // person profile
            : 'small';    // group on weave profile

    const useLocalHeader =
        headerMode === 'dynamic' ||
        (headerMode === 'small' && !appSetting('native', 'collapsible_header'));

    const coverBlock = data?.cover_block;
    // Cover chrome (context selector, actions menu) belongs to the page that owns
    // cover_block, so it must not follow the active subtab — otherwise every tab
    // switch hands the cover a new uri and re-renders it.
    const pageUri = data?.uri ?? currentRoute?.pageData?.uri;
    const pageContext = data?.context //currentRoute?.pageData?.context;

    const sceneHeaderComp = useMemo(
        () => (
            <TabSceneHeader
                headerMode={headerMode}
                coverBlock={coverBlock}
                pageUri={pageUri}
                pageContext={pageContext}
                sceneHeader={sceneHeader}
                filter={filter}
                ts={ts}
                coverScrollY={coverScrollY}
                onOverlayHeight={onOverlayHeight}
            />
        ),
        [headerMode, coverBlock, pageUri, pageContext, sceneHeader, filter, ts, coverScrollY, onOverlayHeight]
    );

    const subHeaderRef = useRef(sceneHeaderComp);
    subHeaderRef.current = sceneHeaderComp;
    const headerWriteRef = useRef(0);
    const setOwnedHeader = useCallback((value) => {
        setHeader(value);
        headerWriteRef.current = getHeaderWriteGeneration();
    }, [setHeader]);

    useFocusEffect(
        useCallback(() => {
            if (useLocalHeader) {
                setOwnedHeader({ header: false });
                setHeaderHeight(0);
            } else {
                setOwnedHeader({ subHeader: subHeaderRef.current });
            }
            const unit =
                routesRef.current?.[indexRef.current]?.endpoint?.unit;
            if (unit === 'notifications' && consumeNotificationsConductorStale()) {
                onStartRefresh();
            }
        }, [useLocalHeader, setOwnedHeader, setHeaderHeight, onStartRefresh])
    );

    // Reset chrome only on a real blur. Subtab switches remount this conductor
    // while the screen stays focused — a focus-effect cleanup would clear
    // subHeader, zero the list offset, and PageHeader would not re-measure.
    // Skip if another screen already wrote the shared header in this commit
    // (sibling useEffects run in tree order; useFocusEffect can run first).
    const wasFocusedRef = useRef(isFocused);
    useEffect(() => {
        const wasFocused = wasFocusedRef.current;
        wasFocusedRef.current = isFocused;
        if (
            wasFocused
            && !isFocused
            && !tabScopedHeader
            && headerWriteRef.current === getHeaderWriteGeneration()
        ) {
            setHeader(defaultHeader);
        }
    }, [isFocused, setHeader, tabScopedHeader]);

    const lastPushedSubHeaderRef = useRef(null);
    useEffect(() => {
        // Only the focused screen may update the shared subHeader; on refocus
        // the useFocusEffect above restores it from subHeaderRef.
        if (!useLocalHeader && isFocused) {
            if (lastPushedSubHeaderRef.current === sceneHeaderComp) return;
            lastPushedSubHeaderRef.current = sceneHeaderComp;
            setOwnedHeader({ subHeader: sceneHeaderComp });
        }
    }, [useLocalHeader, isFocused, sceneHeaderComp, setOwnedHeader]);

    const tabSceneProps = {
        skeleton: skeleton,
        numColumns: numColumns,
        onRefresh: onStartRefresh,
        refreshing: isRefreshing,
        route: currentRoute,
        index: index,
        unitMode: unitMode,
        fetchNextPage: fetchNextPage,
        hasNextPage: hasNextPage,
        isFetchingNextPage: isFetchingNextPage,
        skipHeaderOffset: useLocalHeader,
        listRef: listRef,
        leftbarExcludedFromMainIds,
        coverOverlayPad: headerMode === 'dynamic' ? coverOverlayPad : 0,
        coverScrollY: headerMode === 'dynamic' ? coverScrollY : undefined,
    };

    const Form = getComponent('element', 'form');
    const formProps = currentRoute?.endpoint?.filters;

    const FormHeader = useMemo(() => {
        if (!formProps) return undefined;
        const formUrl = currentRoute?.link || currentRoute?.pageData?.url;
        return () => (
            <View className="w-full">
                <Form
                    {...formProps}
                    key={formUrl ? `form-${formUrl}` : 'form'}
                    name={formProps.name}
                    url={formUrl}
                    onChange={onFormChangedValues}
                />
            </View>
        );
    }, [formProps, onFormChangedValues, currentRoute?.link, currentRoute?.pageData?.url]);

    if (!!formProps) {
        Object.assign(tabSceneProps, {
            ListHeaderComponent: FormHeader
        });
    }

    return (
        <View className="w-full h-full ">
            <View className="w-full flex-1 " style={headerMode === 'dynamic' ? { overflow: 'hidden' } : undefined}>
                <Snackbar visible={snackbarVisible} onPress={showNewContent2} onDismiss={() => setSnackbarVisible(false)} variant="primary" title={t('Show New Posts')} size="sm" />
                {useLocalHeader && headerMode !== 'dynamic' ? sceneHeaderComp : null}
                <TabScene {...tabSceneProps} />
                {useLocalHeader && headerMode === 'dynamic' ? sceneHeaderComp : null}
            </View>
        </View>
    );
}