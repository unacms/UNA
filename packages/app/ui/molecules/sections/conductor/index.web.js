import { useCallback, useState, useEffect, useRef, useMemo } from 'react'
import { View } from 'app/design/view'
import {
    appSetting,
    getHeaderSettings,
    getURI,
    isObjectsEqual,
    getPageContentWidth,
} from 'app/lib/util'
import {
    fillTabs,
    getDataForRoute,
    findConductorRouteIndex,
} from './helpers'
import {
    conductorLeftbarContent,
    ConductorFiltersButton,
    openConductorFiltersSheet,
} from './shared-ui'
import {
    TabSceneMainContent,
    TabScene,
    LeftSideBarContainer,
    HeaderContainer,
    TabBar,
    TabSceneHeader,
} from './web-ui'
import { useConductorLeftbar, useConductorFilters } from './use-conductor'
import { useConductorRoutes } from './use-conductor-routes'
import { ItemRenderer } from 'app/components/item-renderer'
import { BlockByName } from 'app/components/block'
import { useTranslation } from 'react-i18next'
import { useCurrentUser } from 'app/context/user'
import { useBottomSheetData } from 'app/context/bottomsheet'
import { useLayoutSettings } from 'app/context/layout-settings'
import { useIsDesktop } from 'app/context/measure'
import { useHeaderHeight } from 'app/context/jotai/layout'
import { useSound } from 'app/lib/hooks/useSound'
import { useStickyHeaderOffset, stickySidebarStyle } from 'app/lib/hooks/use-sticky-header-offset'

export function Conductor({
    isCoverDisabled,
    ts,
    menu,
    data,
    blocks,
    useSectionAsMenu,
    skeleton = '',
    onChangeRoute,
    keyword,
    layoutName,
    defaultHeaderHeight = 112,
}) {
    const [timestamp] = useState(Date.now());
    const { t } = useTranslation()
    const { currentUser } = useCurrentUser()
    const { setBottomSheetData } = useBottomSheetData()
    const { layoutName: tmplLayout } = useLayoutSettings()
    const isDesktop = useIsDesktop()
    const pageHeaderHeight = useHeaderHeight()
    // Clear page header + cover/tab `header-fixed` stack (profile menus). Wiki's top:0
    // padding trick overlaps Conductor's opaque fixed cover bar when scrolled.
    const stickyTop = useStickyHeaderOffset(pageHeaderHeight)
    const stickySidebarScrollStyle = stickySidebarStyle(stickyTop)

    const coverMode = appSetting(
        'cover',
        'view_by_module',
        data.cover_block?.profile?.module
    )

    const isCover = data.cover_block && coverMode != 'none' ? true : false

    const initedTabs = useMemo(
        () => fillTabs(menu, data, blocks, currentUser, useSectionAsMenu),
        [menu, data, blocks, currentUser, useSectionAsMenu]
    )

    const playClick = useSound('click')
    const playClickRef = useRef(playClick)
    playClickRef.current = playClick

    // Web: history + click sound. Tab menu items still pushState themselves;
    // adapter covers soft/hard page sync + popstate + setIndex side effects.
    const routesAdapter = useMemo(
        () => ({
            skipFirstPageRev: true,
            getInitialRoutes: (tabs) => tabs,
            beforeSetIndex: (newIndex, { indexRef, setPrevIndex, _setIndex }) => {
                playClickRef.current?.()
                setPrevIndex(indexRef.current)
                _setIndex(newIndex)
            },
            applyUrlChange: ({ setRoutes, initedTabs: tabs }) => {
                setRoutes(tabs)
            },
            applySoftRefresh: ({
                setRoutes,
                setIndex,
                initedTabs: tabs,
                pageUrl,
                useSectionAsMenu: sectionMenu,
                indexRef,
            }) => {
                setRoutes(tabs)
                const foundIndex = findConductorRouteIndex(
                    tabs,
                    pageUrl,
                    sectionMenu
                )
                const nextIndex = foundIndex !== -1 ? foundIndex : 0
                if (nextIndex !== indexRef.current) {
                    setIndex(nextIndex)
                }
            },
            subscribeExternalHref: (onHref, { onChangeRoute: notify }) => {
                if (typeof window === 'undefined') return undefined
                const handlePopState = () => {
                    const currentPath = `${window.location.pathname.slice(1)}${window.location.search}`
                    const route = onHref(currentPath)
                    if (route) notify?.(route)
                }
                window.addEventListener('popstate', handlePopState)
                return () => window.removeEventListener('popstate', handlePopState)
            },
        }),
        []
    )

    const {
        routes,
        setRoutes,
        index,
        setIndex,
        activeRoute,
        prevRoute,
    } = useConductorRoutes({
        initedTabs,
        pageUrl: data.url,
        keyword,
        // Web historically soft-refreshed only on `ts`, not data.timestamp.
        pageTimestamp: undefined,
        ts,
        useSectionAsMenu,
        onChangeRoute,
        adapter: routesAdapter,
    })

    // Web has no active/prev fallback — selected tab is currentRoute.
    const currentRoute = activeRoute

    const cellsCustomConfig =
        appSetting('layouts', 'navigator') || appSetting('layouts', `cols-l-c`)
    const initialHeaderSettings = getHeaderSettings(
        getURI(currentRoute?.key),
        isDesktop,
        layoutName,
        currentRoute?.config
    )

    const contentWidth = getPageContentWidth(layoutName)

    // Disable offset for adjustable panel layouts
    if (cellsCustomConfig?.adjustable) {
        initialHeaderSettings.offset = false
    }
    const [headerSettings, setHeaderSettings] = useState(initialHeaderSettings)

    useEffect(() => {
        if (currentRoute.inited) {
            const headerSettingsN = getHeaderSettings(
                getURI(currentRoute?.key),
                isDesktop,
                layoutName,
                currentRoute.config
            )
            // Disable offset for adjustable panel layouts
            if (cellsCustomConfig?.adjustable) {
                headerSettingsN.offset = false
            }

            if (!isObjectsEqual(headerSettings, headerSettingsN)) {
                setHeaderSettings(headerSettingsN)
            }
        }
    }, [isDesktop, layoutName, currentRoute?.key, currentRoute.config])

    useEffect(() => {
        setBottomSheetData(false)
    }, [index])

    const { setFilterValue, onFormChangedValues } = useConductorFilters({
        index,
        setRoutes,
        skipFirstChange: false,
    })

    useEffect(() => {
        getDataForRoute(routes, index, setRoutes)
    }, [index])

    const leftbarContent = currentRoute?.leftbar?.content ?? []
    const {
        leftbarMenuBlocks,
        leftbarFilterBlocks,
        leftbarExcludedFromMainIds,
    } = useConductorLeftbar({
        leftbarContent,
        layoutName,
        isDesktop,
    })

    const LeftBarContentBlocks = conductorLeftbarContent(
        currentRoute,
        onFormChangedValues
    )
    const LeftBarFilterBlocks = conductorLeftbarContent(
        currentRoute,
        onFormChangedValues,
        leftbarFilterBlocks,
        { restoreFormValues: true }
    )

    const showFilters = useCallback(() => {
        openConductorFiltersSheet(setBottomSheetData, {
            t,
            content: LeftBarFilterBlocks,
            snapPoints: ['50%', '75%'],
            modal: true,
        })
    }, [LeftBarFilterBlocks, t, setBottomSheetData])

    useEffect(() => {
        setTimeout(() => window.dispatchEvent(new Event('resize_panel')), 100)
    }, [])

    const isHideCover =
        data?.cover_block?.profile &&
        appSetting('cover', 'hide_cover_for_context') &&
        data?.cover_block?.profile?.id === data?.context?.current?.id &&
        isDesktop

    // Mobile: Filters sheet for use_as_filter (any layout) + navigator non-menu leftbar.
    const showFiltersBtn = !isDesktop && leftbarFilterBlocks.length > 0

    const isUseCurrentHeader = layoutName === 'profile' && (!isCoverDisabled || !isDesktop);

    const headerComponent = (
        <HeaderContainer
            contentWidth={contentWidth}
            isCover={isCover}
            isCoverDisabled={isCoverDisabled}
            isUseCurrentHeader={isUseCurrentHeader}
            isHideCover={isHideCover}
            tabBarObj={
                <>
                    <TabBar
                        isHideCover={isHideCover}
                        menu={menu}
                        routes={routes}
                        layoutName={layoutName}
                        index={index}
                        setIndex={setIndex}
                        onChangeRoute={onChangeRoute}
                        omitDefaultBackground={false}
                        pageData={data}
                        leftbarMenus={!isDesktop ? leftbarMenuBlocks : []}
                    />
                    <ConductorFiltersButton
                        visible={showFiltersBtn}
                        onPress={showFilters}
                        className="items-start px-3 lg:px-4 py-2"
                    />
                </>
            }
            headerSettings={headerSettings}
            pageData={data}
        />
    )



    const tabRoute = currentRoute.inited ? currentRoute : prevRoute
    const tabRouteSidebarContent = tabRoute?.sidebar?.content ?? []
    const isLeftCol = tabRoute?.leftbar?.content?.length > 0 || layoutName == 'navigator'
    const isRightCol = tabRouteSidebarContent.length > 0 || tabRoute?.blocks?.browse_sidebar
    const sidebarUnitType = tabRoute?.blocks?.browse_sidebar?.unitType || 'default'

    const LeftColumnContent = isLeftCol ?
        <LeftSideBarContainer
            layoutName={layoutName}
            index={index}
            setIndex={setIndex}
            menu={menu}
            routes={routes}
            headerSettings={headerSettings}
            stickyScrollStyle={stickySidebarScrollStyle}
        >
            {LeftBarContentBlocks}
        </LeftSideBarContainer> : null

    const RightColumnContent = isRightCol ? (
        <View className="h-full">
            <View
                className={`web:sticky web:overflow-y-auto mt-0.5 sm:m-0 sm:p-3 lg:p-4 ${appSetting('conductor', 'sidebar_container')}`}
                style={stickySidebarScrollStyle}
            >
                {tabRouteSidebarContent.map((item, index) => {
                    return (
                        <ItemRenderer
                            key={`${tabRoute?.index}-${item.id}`}
                            unitType={sidebarUnitType}
                            route={tabRoute}
                            sidebar={true}
                            item={item}
                            unit={
                                tabRoute?.sidebar?.endpoint?.unit
                            }
                            module={
                                tabRoute?.sidebar?.endpoint?.module
                                    ? tabRoute?.sidebar?.endpoint
                                        ?.module
                                    : ''
                            }
                        />
                    )
                })}
                <View>
                    {!!tabRoute.pageData && (
                        <BlockByName
                            data={tabRoute.pageData}
                            name={tabRoute.blocks?.browse_sidebar}
                            sidebar={true}
                            perLine={1}
                            maxItems={1}
                        />
                    )}
                </View>
            </View>
        </View>
    ) : null

    const CenterColumnContent = <TabSceneMainContent
        pageRoute={currentRoute}
        isInited={currentRoute.inited}
        isCover={isCover}
        headerHeight={
            showFiltersBtn && routes.length > 1
                ? defaultHeaderHeight + 52
                : defaultHeaderHeight
        }
        header={isUseCurrentHeader ? null : headerComponent}
        isUseCurrentHeader={isUseCurrentHeader}
        onFormChangedValues={onFormChangedValues}
        keyword={keyword}
        ts={ts}
        timestamp={timestamp}
        skeleton={skeleton}
        leftbarExcludedFromMainIds={leftbarExcludedFromMainIds}
    />

    return (
        <View
            className="ns--conductor-wrapper-- w-full h-full ne--"
            scrollEnabled={false}
            style={{ minHeight: `calc(100dvh - ${pageHeaderHeight}px)` }}
        >
            {(isUseCurrentHeader || isDesktop) && headerComponent}
            <View
                className={`ns--conductor-tab-content-- ${contentWidth} mx-auto ${tmplLayout == 'mixed' ? 'mt-12' : ''}`}
            >
                <TabSceneHeader
                    route={currentRoute}
                    setFilterValue={setFilterValue}
                    contentWidth={contentWidth}
                />
                <TabScene
                    layoutName={layoutName}
                    tabIndex={index}
                    pageRoute={tabRoute}
                    leftColumnContent={LeftColumnContent}
                    rightColumnContent={RightColumnContent}
                    centerColumnContent={CenterColumnContent}
                />
            </View>
        </View>
    )
}
