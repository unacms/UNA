import { useCallback, useState, useEffect, useRef, useMemo } from 'react'
import { View } from 'app/design/view'
import {
    appSetting,
    getHeaderSettings,
    getURI,
    getPageContentWidth,
} from 'app/lib/util'
import {
    fillTabs,
    ensureRouteInited,
    findConductorRouteIndex,
} from './helpers'
import {
    LeftColumnContent,
    openFiltersSheet,
} from './shared-ui'
import {
    TabScene,
    TabSceneColumns,
    LeftColumnContainer,
    RightColumnContainer,
    HeaderContainer,
    TabSceneHeader,
} from './web-ui'
import { useLeftColumn, useConductorFilters } from './use-conductor'
import { useConductorRoutes } from './use-conductor-routes'
import { useTranslation } from 'react-i18next'
import { useCurrentUser } from 'app/context/user'
import { useBottomSheetData } from 'app/context/bottomsheet'
import { useLayoutSettings } from 'app/context/layout-settings'
import { useIsDesktop } from 'app/context/measure'
import { useSetHeader, defaultHeader, useHeaderHeight } from 'app/context/jotai/layout'
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
}) {
    const [timestamp] = useState(Date.now());
    const { t } = useTranslation()
    const { currentUser } = useCurrentUser()
    const { setBottomSheetData } = useBottomSheetData()
    const { layoutName: tmplLayout } = useLayoutSettings()
    const isDesktop = useIsDesktop()
    const setHeader = useSetHeader()
    const pageHeaderHeight = useHeaderHeight()
    // Clear page header + cover/tab `header-fixed` stack (profile menus). Wiki's top:0
    // padding trick overlaps Conductor's opaque fixed cover bar when scrolled.
    const stickyTop = useStickyHeaderOffset(pageHeaderHeight)
    const stickyColumnStyle = stickySidebarStyle(stickyTop)

    const coverMode = appSetting('cover', 'view_by_module', data.cover_block?.profile?.module)
    const isCover = Boolean(data.cover_block) && coverMode != 'none'

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

    const cellsCustomConfig = appSetting('layouts', 'navigator') || appSetting('layouts', `cols-l-c`)
    const contentWidth = getPageContentWidth(layoutName)
    const headerSettings = useMemo(() => {
        const settings = getHeaderSettings(
            getURI(activeRoute?.key),
            isDesktop,
            layoutName,
            activeRoute?.config
        )
        if (!cellsCustomConfig?.adjustable) return settings
        return { ...settings, offset: false }
    }, [activeRoute?.key, activeRoute?.config, isDesktop, layoutName, cellsCustomConfig?.adjustable])

    useEffect(() => {
        setBottomSheetData(false)
    }, [index])

    const { onFormChangedValues } = useConductorFilters({
        index,
        setRoutes,
        skipFirstChange: false,
    })

    useEffect(() => {
        ensureRouteInited(routes, index, setRoutes)
    }, [index])

    const leftColumnContent = activeRoute?.leftbar?.content ?? []

    const {
        leftColumnMenuBlocks,
        leftColumnFilterBlocks,
        leftColumnExcludedFromMainIds,
    } = useLeftColumn({
        leftColumnContent,
        layoutName,
        isDesktop,
    })

    const tabRoute = activeRoute.inited ? activeRoute : prevRoute
    const hasLeftColumn = tabRoute?.leftbar?.content?.length > 0 || layoutName === 'navigator'
    const hasRightColumn = (tabRoute?.sidebar?.content?.length > 0) || !!tabRoute?.blocks?.browse_sidebar

    const isHideCover =
        data?.cover_block?.profile &&
        appSetting('cover', 'hide_cover_for_context') &&
        data?.cover_block?.profile?.id === data?.context?.current?.id &&
        isDesktop

    // Mobile: Filters sheet for use_as_filter (any layout) + navigator non-menu left column.
    const showFiltersBtn = !isDesktop && leftColumnFilterBlocks.length > 0
    const isUseCurrentHeader = layoutName === 'profile' && (!isCoverDisabled || !isDesktop)

    const showFilters = useCallback(() => {
        openFiltersSheet(setBottomSheetData, {
            t,
            content: (
                <LeftColumnContent
                    route={activeRoute}
                    items={leftColumnFilterBlocks}
                    onChange={onFormChangedValues}
                    restoreFormValues
                />
            ),
            snapPoints: ['50%', '75%'],
            modal: true,
        })
    }, [activeRoute, onFormChangedValues, leftColumnFilterBlocks, t, setBottomSheetData])

    useEffect(() => {
        setTimeout(() => window.dispatchEvent(new Event('resize_panel')), 100)
    }, [])

    const headerComponent = useMemo(
        () => (
            <HeaderContainer
                contentWidth={contentWidth}
                isCover={isCover}
                isCoverDisabled={isCoverDisabled}
                isHideCover={isHideCover}
                headerSettings={headerSettings}
                pageData={data}
                menu={menu}
                routes={routes}
                layoutName={layoutName}
                index={index}
                setIndex={setIndex}
                onChangeRoute={onChangeRoute}
                leftColumnMenus={leftColumnMenuBlocks}
                showFilters={showFiltersBtn}
                onShowFilters={showFilters}
            />
        ),
        [
            contentWidth,
            isCover,
            isCoverDisabled,
            isHideCover,
            headerSettings,
            data?.uri,
            data?.ts,
            data?.cover_block,
            data?.context,
            data?.module,
            menu,
            routes,
            layoutName,
            index,
            setIndex,
            onChangeRoute,
            leftColumnMenuBlocks,
            showFiltersBtn,
            showFilters,
        ]
    )

    useEffect(() => {
        if (isDesktop) {
            setHeader(defaultHeader)
            return
        }
        if (isUseCurrentHeader) {
            setHeader({ header: false })
        }
    }, [isDesktop, isUseCurrentHeader, setHeader])

    useEffect(() => {
        if (isDesktop || isUseCurrentHeader) return
        setHeader({ subHeader: headerComponent })
    }, [isDesktop, isUseCurrentHeader, headerComponent, setHeader])

    const leftColumn = hasLeftColumn ? (
        <LeftColumnContainer
            layoutName={layoutName}
            index={index}
            setIndex={setIndex}
            menu={menu}
            routes={routes}
            stickyColumnStyle={stickyColumnStyle}
        >
            <LeftColumnContent route={tabRoute} onChange={onFormChangedValues} />
        </LeftColumnContainer>
    ) : null

    const rightColumn = hasRightColumn ? (
        <RightColumnContainer
            route={tabRoute}
            stickyColumnStyle={stickyColumnStyle}
        />
    ) : null

    return (
        <View
            className="ns--conductor-wrapper-- w-full h-full ne--"
            style={{ minHeight: `calc(100dvh - ${pageHeaderHeight}px)` }}
        >
            {(isUseCurrentHeader || isDesktop) && headerComponent}
            <View
                className={`ns--conductor-tab-content-- ${contentWidth} mx-auto ${tmplLayout == 'mixed' ? 'mt-12' : ''}`}
            >
                <TabSceneHeader
                    route={activeRoute}
                    contentWidth={contentWidth}
                />
                <TabSceneColumns
                    layoutName={layoutName}
                    tabIndex={index}
                    pageRoute={tabRoute}
                    leftColumn={leftColumn}
                    rightColumn={rightColumn}
                >
                    <TabScene
                        pageRoute={activeRoute}
                        isInited={activeRoute.inited}
                        onFormChangedValues={onFormChangedValues}
                        keyword={keyword}
                        ts={ts}
                        timestamp={timestamp}
                        skeleton={skeleton}
                        leftColumnExcludedFromMainIds={leftColumnExcludedFromMainIds}
                    />
                </TabSceneColumns>
            </View>
        </View>
    )
}
