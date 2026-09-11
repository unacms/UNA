import React, { useCallback, useMemo } from "react";
import { View, ScrollView, Row } from 'app/design/view';
import { appSetting, isNativeTabsEnabled } from 'app/lib/util';
import { hasConductorSubitems, registeredComponent } from './helpers';
import { LeftColumnMenuDropdown, TabList, ListScene } from './shared-ui';
import { CoverBackButton } from 'app/components/elements/covers/cover-elements';
import CoverMorph from 'app/components/elements/covers/cover-morph';
import { useStableSafeAreaInsets } from 'app/lib/hooks/router'
import { useTranslation } from 'react-i18next';

const conductorTheme = appSetting('theme', 'conductor')

/*
 * ============================================================================
 * Native presentation layer for the Conductor. Wired from `index.js`; the
 * shell owns routes, list query and header ownership — these only render.
 *
 *   TabSceneHeader   cover (CoverMorph) or plain chrome, holds the TabBar
 *     └ TabBar       horizontal pill strip + left-column dropdowns
 *   TabScene         the list (UniList via shared ListScene)
 * ============================================================================
 */

/**
 * Conductor chrome for one of three header modes (decided in `index.js`):
 *
 * - `'dynamic'` — profile with a cover image: `CoverMorph` collapses on
 *   scroll, driven by `coverScrollY`, and reports its overlay height so the
 *   list can pad for it.
 * - `'small'`   — profile without a cover image: same `CoverMorph` but static.
 * - `'none'`    — any other page: just the tab bar and the Filters button.
 *
 * With `context_selector.show_always` on, the context selector (and the back
 * button) are lifted out of the cover into a standalone row above it, so they
 * stay put while the cover collapses.
 *
 * @param {object}   props
 * @param {'dynamic'|'small'|'none'} props.headerMode
 * @param {object}   [props.coverBlock]   UNA `cover_block` of the page.
 * @param {string}   [props.pageUri]      Page uri for the selector / actions.
 * @param {object}   [props.pageContext]  Page context (owner, current, …).
 * @param {node}     props.sceneHeader    The `<TabBar>` element.
 * @param {node}     props.filter         The `<FiltersButton>` element.
 * @param {*}        [props.ts]           Soft-refresh token; part of the cover key.
 * @param {object}   [props.coverScrollY] Reanimated shared value (dynamic only).
 * @param {Function} [props.onOverlayHeight]
 * @param {Function} [props.onProgress]
 */
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
    onProgress,
}) {
    const ContextSelector = registeredComponent('molecule', 'context_selector');
    const { top: stableTopInset } = useStableSafeAreaInsets();
    const useStandaloneContextSelector =
        appSetting('context_selector', 'show_always') &&
        pageContext &&
        headerMode === 'dynamic';

    const useStandaloneCoverBackButton = !!useStandaloneContextSelector;

    // Remounts the morph when the cover image or avatar changes; a plain data
    // refresh with the same images keeps the collapse state.
    const coverKey = `${ts ?? ''}:${coverBlock?.cover?.src ?? ''}:${coverBlock?.profile?.url_avatar ?? ''}`;

    // With native tabs there is no navigation header, so the chrome is the
    // topmost thing on screen and has to clear the status bar itself.
    const nativeTabsTopInset = isNativeTabsEnabled() ? (stableTopInset || 0) : 0;
    const selectorPadStyle = useMemo(
        () => (nativeTabsTopInset > 0 ? { paddingTop: nativeTabsTopInset } : undefined),
        [nativeTabsTopInset]
    );

    const coverMode = appSetting(
        'cover',
        'view_by_module',
        coverBlock?.profile?.module,
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

    if (headerMode === 'dynamic' || headerMode === 'small') {
        const isOverlayMorph = headerMode === 'dynamic'
        return (
            <CoverMorph
                key={`cover-morph-${coverKey}`}
                pageKey={coverKey}
                data={coverBlock}
                mode={coverMode}
                uri={pageUri}
                context={pageContext}
                stickyTop={nativeTabsTopInset}
                showImage={isOverlayMorph && coverMode !== 'min' && coverMode !== 'none'}
                coverScrollY={isOverlayMorph ? coverScrollY : undefined}
                onOverlayHeight={isOverlayMorph ? onOverlayHeight : undefined}
                onProgress={isOverlayMorph ? onProgress : undefined}
                leading={standaloneContextSelector}
                sceneHeader={sceneHeader}
                filter={filter}
                suppressContextSelector={useStandaloneContextSelector}
                suppressCoverBackButton={useStandaloneCoverBackButton}
            />
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

/**
 * Horizontal strip of tab pills (`TabList` from shared-ui) followed by the
 * left-column dropdown menus. Returns null when there is a single tab and no
 * dropdowns — nothing to choose from.
 *
 * Prefer `onSelectTab` (the shell wraps it with cover pinning); the
 * `setIndex` + `onChangeRoute` pair is the fallback for callers without it.
 *
 * @param {object}   props
 * @param {array}    props.routes
 * @param {number}   props.index
 * @param {Function} props.setIndex
 * @param {Function} [props.onChangeRoute]
 * @param {object}   [props.routesRef]
 * @param {Function} [props.onSelectTab]
 * @param {array}    [props.leftColumnMenus] Left-column blocks flagged `use_as_menu`.
 */
export const TabBar = React.memo(function TabBar({
    routes,
    index,
    setIndex,
    onChangeRoute,
    routesRef,
    onSelectTab,
    leftColumnMenus = [],
}) {
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


/**
 * Scroll offset (px) under which the list counts as "at the top". Used by the
 * `conductor/reset_to_first` command: above it → scroll up, below it → refresh.
 */
export const AT_TOP_SCROLL_THRESHOLD = 50;

/**
 * The list. A thin adapter from the shell's list state onto the shared
 * `ListScene`, with the native UniList settings: header (form + left column
 * blocks) rendered *inside* the list so it scrolls away, small render batches,
 * and the cover overlay pad / scroll driver when the header is dynamic.
 *
 * Everything about *what* is in the list comes in as props; this component
 * decides only *how* UniList is configured.
 */
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
        index: route?.index,
        maxToRenderPerBatch: 5,
        initialNumToRender: 5,
        numColumns,
        mode: 'simple',
        url: route?.endpoint?.request_url,
        skipHeaderOffset,
        coverOverlayPad,
        coverScrollY,
    }), [
        route?.index,
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
