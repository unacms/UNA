import React, { useCallback, useMemo } from "react";
import { View, ScrollView, Row } from 'app/design/view';
import { appSetting, isNativeTabsEnabled } from 'app/lib/util';
import { hasConductorSubitems, registeredComponent } from './helpers';
import { LeftColumnMenuDropdown, TabList, ListScene } from './shared-ui';
import Cover from 'app/components/elements/covers/cover';
import { CoverBackButton } from 'app/components/elements/covers/cover-elements';
import CoverMorph from 'app/components/elements/covers/cover-morph';
import { useStableSafeAreaInsets } from 'app/lib/hooks/router'
import { useTranslation } from 'react-i18next';

const conductorTheme = appSetting('theme', 'conductor')

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

    const coverKey = `${ts ?? ''}:${coverBlock?.cover?.src ?? ''}:${coverBlock?.profile?.url_avatar ?? ''}`;

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

    if (headerMode === 'dynamic') {
        return (
            <CoverMorph
                key={`cover-morph-${coverKey}`}
                pageKey={coverKey}
                data={coverBlock}
                mode={coverMode}
                uri={pageUri}
                context={pageContext}
                stickyTop={nativeTabsTopInset}
                showImage={coverMode !== 'min' && coverMode !== 'none'}
                coverScrollY={coverScrollY}
                onOverlayHeight={onOverlayHeight}
                onProgress={onProgress}
                leading={standaloneContextSelector}
                sceneHeader={sceneHeader}
                filter={filter}
                suppressContextSelector={useStandaloneContextSelector}
                suppressCoverBackButton={useStandaloneCoverBackButton}
            />
        );
    }
    if (headerMode === 'small') {
        return (
            <View className="w-full">
                <Cover
                    key={`cover-${coverKey}`}
                    data={coverBlock}
                    showMoreMenu={false}
                    uri={pageUri}
                    context={pageContext}
                    suppressContextSelector={useStandaloneContextSelector}
                    suppressCoverBackButton={useStandaloneCoverBackButton}
                />
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
