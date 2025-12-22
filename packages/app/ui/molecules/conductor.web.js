import { useCallback, useState, useEffect, useRef, useMemo, memo, useReducer } from 'react'
import { Text } from 'app/design/typography'
import { View, ViewRef, Row, Pressable } from 'app/design/view'
import UniList from 'app/ui/atoms/unilist'
import {
    appSetting,
    getHeaderSettings,
    getUnitModeBySource,
    getURI,
    getMenuSettings,
    isObjectsEqual,
    getBreakpoint,
} from 'app/lib/util'
import {
    fillTabs,
    getDataForRoute,
    TopSidebar,
    refetchUniListReducer,
    isSameItemsForUniList,
    flattenPagesForUniList,
    fetchUniListData,
    Addon,
    getAddon
} from 'app/lib/conductor-helpers'
import { ItemRenderer } from 'app/components/item-renderer'
import { Button } from 'app/design/controls'
import Link from 'app/ui/atoms/link'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getSkeletonForList } from 'app/lib/skeleton-helpers'
import { BlockByName } from 'app/components/block'
import { useTranslation } from 'react-i18next'
import { useCurrentUser } from 'app/context/user'
import Search from 'app/ui/molecules/search'
import DynamicMenu from 'app/components/nav/menu-dynamic'
import { menuItemsFilter, storageSet, storageGet } from 'app/lib/util'
import { subscribe } from 'app/ui/atoms/socket'
import { useBottomSheetData } from 'app/context/bottomsheet'
import {
    getSkeletonByEndPoint,
    layoutForList,
} from 'app/functions'
import FormModal, { handleFormModal } from 'app/ui/molecules/form_modal'
import emitter from 'app/context/emitter'
import Cover, { CoverSmall } from 'app/components/elements/cover'
import { CoverMenuMore, CoverMenu } from 'app/components/nav/menu-cover'
import {
    Panel,
    PanelGroup,
    PanelHandler,
    resolvePanelProps,
} from 'app/ui/molecules/resizable-panels'
import { useLayoutSettings } from 'app/context/layout-settings'
import { useIsDesktop, useBreakpoint } from 'app/context/measure'
import Snackbar from 'app/ui/atoms/snackbar'
import { useSetHeader, defaultHeader } from 'app/context/jotai/layout';
import { getComponent } from 'app/components/registry';

const conductorTheme = appSetting('theme', 'conductor')

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
    const { currentUser } = useCurrentUser()
    const { setBottomSheetData } = useBottomSheetData()
    const { layoutName: tmplLayout } = useLayoutSettings()
    const cleanUrl = data.url.split('?')[0]
    const isDesktop = useIsDesktop()

    const coverMode = appSetting(
        'cover',
        'view_by_module',
        data.cover_block?.profile?.module
    )

    const isCover = data.cover_block && coverMode != 'none' ? true : false

    const initedTabs = fillTabs(
        menu,
        data,
        blocks,
        currentUser,
        useSectionAsMenu
    )
    const [routes, setRoutes] = useState(initedTabs)

    useEffect(() => {
        setRoutes(initedTabs)
    }, [keyword, data.url, data.elements])

    // found current index from routes
    const getFoundIndex = useCallback(() => {
        const found = routes.findIndex((item) => {
            if (useSectionAsMenu) {
                return data.url === item.key
            } else {
                return item.key.includes('?')
                    ? data.url === item.key
                    : cleanUrl === item.key
            }
        })
        return found !== -1 ? found : 0
    }, [routes, useSectionAsMenu, data.url, cleanUrl])

    const initialIndex = useMemo(() => getFoundIndex(), [getFoundIndex])

    const [index, _setIndex] = useState(initialIndex)
    const [prevIndex, setPrevIndex] = useState(initialIndex)

    const setIndex = (newIndex) => {
        setPrevIndex(index)
        _setIndex(newIndex)
    }

    const currentRoute = routes.find((item) => item.index === index)

    useEffect(() => {
        const foundIndex = getFoundIndex()
        if (foundIndex !== index) setIndex(foundIndex)
        // storageClear('ul:data', currentRoute.storageKeyValue)
        // storageClear('ul:state', currentRoute.storageKeyValue)
    }, [ts])

    const prevRoute = useMemo(
        () => routes.find((item) => item.index === prevIndex),
        [routes, prevIndex]
    )

    const cellsCustomConfig =
        appSetting('layouts', 'navigator') || appSetting('layouts', `cols-l-c`)
    const initialHeaderSettings = getHeaderSettings(
        getURI(currentRoute?.key),
        isDesktop,
        layoutName,
        currentRoute.config
    )

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

    const setFilterValue = (values) => {
        setIndex((prevIndex) => {
            setRoutes((prevRoutes) => {
                const newRoutes = [...prevRoutes]
                values.forEach((value) => {
                    const name = value.name
                    const val = value.value

                    if (newRoutes[prevIndex].endpoint.params.filters) {
                        newRoutes[prevIndex].endpoint.params.filters[name] = val
                    } else {
                        newRoutes[prevIndex].endpoint.params.filters = {
                            [name]: val,
                        }
                    }
                })

                newRoutes[prevIndex].endpoint.finished = false
                newRoutes[prevIndex].data = []
                newRoutes[prevIndex].endpoint.params.start = 0
                return newRoutes
            })

            return prevIndex
        })
    }

    const onFormChangedValues = useCallback((values) => {
        let filterValues = []
        for (let key in values) {
            filterValues.push({
                name: key,
                value: Array.isArray(values[key])
                    ? values[key].join(',')
                    : values[key],
            })
        }

        setFilterValue(filterValues)
        //  setBottomSheetData(false);
    }, [])

    useEffect(() => {
        getDataForRoute(routes, index, setRoutes)
    }, [index])

    const LeftBarContentBlocks = LeftBarContent(
        currentRoute,
        onFormChangedValues
    )

    const showFilters = useCallback(() => {
        setBottomSheetData({
            title: 'Filters',
            content: LeftBarContentBlocks,
            showClose: true,
            snapPoints: ['50%', '75%'],
            modal: true,
        })
    }, [LeftBarContentBlocks])

    useEffect(() => {
        setTimeout(() => window.dispatchEvent(new Event('resize_panel')), 100)
    }, [])

    const isHideCover =
        data?.cover_block?.profile &&
        appSetting('cover', 'hide_cover_for_context') &&
        data?.cover_block?.profile?.id === data?.context?.current?.id &&
        isDesktop

    const showFiltersBtn =
        !isDesktop &&
        layoutName === 'navigator' &&
        (currentRoute?.leftbar?.content?.length ?? 0) > 0

    const headerComponent = (
        <HeaderContainer
            isCover={isCover}
            isCoverDisabled={isCoverDisabled}
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
                    />
                    {showFiltersBtn && (
                        <View className="items-start px-3 sm:px-4 py-2">
                            <Button
                                title="Filters"
                                variant="default"
                                size="sm"
                                rounded
                                onPress={showFilters}
                            />
                        </View>
                    )}
                </>
            }
            headerSettings={headerSettings}
            pageData={data}
        />
    )

    const isUseCurrentHeader = layoutName === 'profile' && (!isCoverDisabled || !isDesktop);

    const tabRoute = currentRoute.inited ? currentRoute : prevRoute
    const isLeftCol = tabRoute?.leftbar?.content?.length > 0 || layoutName == 'navigator'
    const isRightCol = tabRoute?.sidebar?.content?.length > 0 || tabRoute?.blocks?.browse_sidebar
    const sidebarUnitType = tabRoute.blocks?.browse_sidebar?.unitType || 'default'

    const LeftColumnContent = isLeftCol ?
        <LeftSideBarContainer
            layoutName={layoutName}
            index={index}
            setIndex={setIndex}
            menu={menu}
            routes={routes}
            headerSettings={headerSettings}
        >
            {LeftBarContentBlocks}
        </LeftSideBarContainer> : null

    const RightColumnContent = isRightCol ? <View className=" fixed-process mt-0.5 sm:p-2">
        {tabRoute?.sidebar?.content.map((item, index) => {
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
    </View> : null

    const CenterColumnContent = <TabSceneMainContent
        pageRoute={tabRoute}
        isCover={isCover}
        headerHeight={
            showFiltersBtn && routes.length > 1
                ? defaultHeaderHeight + 52
                : defaultHeaderHeight
        }
        header={isUseCurrentHeader ? null : headerComponent}
        isUseCurrentHeader={isUseCurrentHeader}
        keyword={keyword}
        ts={ts}
        timestamp={timestamp}
        skeleton={skeleton}
    />

    return (
        <View className="w-full h-full" scrollEnabled={false}>
            {(isUseCurrentHeader || isDesktop) && headerComponent}
            <View
                className={`${layoutName === 'profile'
                    ? conductorTheme.content_max_width
                    : conductorTheme.content_max_width_nav
                    } mx-auto  min-h-screen ${tmplLayout == 'mixed' ? 'mt-12' : ''
                    }`}
            >
                <TabSceneHeader
                    route={currentRoute}
                    setFilterValue={setFilterValue}
                />
                <TabScene
                    layoutName={layoutName}
                    pageRoute={tabRoute}
                    leftColumnContent={LeftColumnContent}
                    rightColumnContent={RightColumnContent}
                    centerColumnContent={CenterColumnContent}
                />
            </View>
        </View>
    )
}

const TabSceneMainContent = ({
    pageRoute,
    header,
    headerHeight,
    skeleton,
    keyword,
    ts,
    timestamp,
    isUseCurrentHeader
}) => {
    const isDesktop = useIsDesktop()
    const pageData = pageRoute.pageData
    const uniRef = useRef()
    const dataItemsPage = pageRoute?.data;

    const setHeader = useSetHeader();

    const unitType = useMemo(() => {
        const type = getUnitModeBySource(pageRoute?.endpoint)
        return type === 'default' ? getUnitType(pageRoute) : type
    }, [pageRoute?.endpoint, pageRoute?.blocks])

    const [refetchState, dispatch] = useReducer(refetchUniListReducer, {
        visibleItems: [],
        hasNewData: false
    })
    const refetchRef = useRef({
        skipToast: false,
        isFirstLoad: true,
        prevItems: []
    })

    const qKey = [
        pageRoute?.endpoint?.request_url,
        pageRoute.link,
        keyword,
        JSON.stringify(pageRoute?.endpoint?.params?.filters),
        ts,
        timestamp
    ]

    const {
        data: pagesData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
        isRefetching
    } = useInfiniteQuery({
        queryKey: qKey,
        queryFn: ({ pageParam }) => fetchUniListData({
            pageParam,
            requestUrl: pageRoute?.endpoint?.request_url,
            defaultParams: pageRoute?.endpoint?.params
        }),

        getNextPageParam: (lastPage) => {
            return (lastPage?.data.length > 0 && lastPage?.cursor) ? { ...lastPage?.params, start: lastPage?.cursor } : undefined
        },
        staleTime: appSetting('browse', 'stale_time'),
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        enabled: !!pageRoute?.endpoint?.request_url
    })

    useEffect(() => {

        if (pageRoute?.endpoint?.unit == 'feed') {
            subscribe('bx_timeline_0', 'added', refetch)
            subscribe('bx_timeline_0', 'deleted', refetch)
        }

        const subscription = emitter.addListener(`page`, (data) => {
            if (data.action == 'reload') {
                refetchRef.current.skipToast = true
                refetch();
            }
        })

        const subscription2 = emitter.addListener('feed', (data) => {
            if (data.action == 'remove_content') {
                dispatch({ type: 'REMOVE_ITEM', id: data.id })
                if (refetchRef.current?.prevItems) {
                    refetchRef.current.prevItems = refetchRef.current.prevItems.filter(item => item.id != data.id)
                }
                refetchRef.current.skipToast = true
            }
            if (data.action == 'new_content') {
                dispatch({ type: 'PREPEND_ITEM', item: data.data })
                if (refetchRef.current?.prevItems) {
                    refetchRef.current.prevItems = [data.data, ...refetchRef.current.prevItems]
                }
                refetchRef.current.skipToast = true
            }
        })

        return () => {
            subscription.remove();
            subscription2.remove()
        }
    }, [])

    useEffect(() => {
        refetchRef.current.skipToast = true
    }, [qKey])


    const handleEndReached = useCallback(
        async (lastItemIndex) => {
            if (isFetchingNextPage) return
            if (hasNextPage === false) return
            if (lastItemIndex === false) return
            refetchRef.current.skipToast = true
            fetchNextPage()
        },
        [isFetchingNextPage, hasNextPage]
    )

    useEffect(() => {
        if (!pagesData) return

        const items = flattenPagesForUniList(pagesData)

        if (refetchRef.current.isFirstLoad) {
            dispatch({ type: 'SET_ITEMS', items })
            refetchRef.current.prevItems = items
            refetchRef.current.isFirstLoad = false
            refetchRef.current.skipToast = false
            return
        }

        if (!isSameItemsForUniList(refetchRef.current.prevItems, items)) {
            if (refetchRef.current.skipToast) {
                dispatch({ type: 'SET_ITEMS', items })
                refetchRef.current.skipToast = false
            } else {
                dispatch({ type: 'SHOW_NEW_DATA' })
                refetchRef.current.skipToast = false
            }
            refetchRef.current.prevItems = items
        }
    }, [pagesData])

    const renderItem = useCallback(
        ({ item, index }) => (
            <ItemRenderer
                unitType={unitType}
                route={pageRoute}
                item={{ ...item, feed_type: pageRoute?.endpoint?.params?.type }}
                unit={pageRoute?.endpoint?.unit}
                module={pageRoute?.endpoint?.module}
            />
        ),
        [pageRoute, unitType]
    )

    const SkeletonForRoute = useMemo(() => {
        const a = getSkeletonByEndPoint(pageRoute)
        if (a) return a
        const baseSkeleton =
            skeleton ||
            pageRoute?.endpoint?.module ||
            pageRoute?.endpoint?.unit
        return unitType ? [baseSkeleton, unitType] : baseSkeleton
    }, [skeleton, pageRoute, unitType])

    const layout = layoutForList(pageRoute?.endpoint);

    const Preload = useMemo(
        () => getSkeletonForList(SkeletonForRoute, 5, true, layout),
        [SkeletonForRoute]
    )

    const PreloadShort = useMemo(
        () => getSkeletonForList(SkeletonForRoute, 5, false, layout),
        [SkeletonForRoute]
    )

    const dataItems = isDesktop || !!pageRoute?.endpoint?.request_url ? [...dataItemsPage, ...refetchState.visibleItems] : [...dataItemsPage, ...refetchState.visibleItems, ...pageRoute.sidebar.content];

    useEffect(() => {
        if (isUseCurrentHeader) {
            setHeader(isDesktop ? defaultHeader : { header: false });
        }
        else {
            setHeader(isDesktop ? defaultHeader : { subHeader: header });
        }
    }, [isDesktop, header, setHeader]);

    const NoContent = getComponent('molecule', 'no_content')


    return (
        <><UniList

            data={dataItems}
            endpoint={pageRoute.endpoint}
            listState={pageRoute?.state}
            layout={layout}
            mode={layout == 'w-full' ? 'simple' : ''}
            storagekey={pageRoute.storageKeyValue}
            refer={uniRef}
            route={pageRoute}
            unit={pageRoute.endpoint?.unit}
            useWindowScroll={true}
            onEndReached={handleEndReached}
            onRefresh={refetch}
            refreshing={isRefetching}
            renderItem={renderItem}

        />
            {(pageRoute?.endpoint?.request_url && hasNextPage === undefined) && Preload}
            {(pageRoute?.endpoint?.request_url && hasNextPage) && PreloadShort}
            {(pageRoute?.endpoint?.request_url && hasNextPage === false && dataItems.filter((item) => item.type != 'block').length == 0) && <NoContent endpoint={pageRoute?.endpoint} />}

            <Snackbar
                visible={refetchState.hasNewData}
                onPress={() => {
                    const latestItems = flattenPagesForUniList(pagesData)
                    dispatch({ type: 'SET_ITEMS', items: latestItems })
                    refetchRef.current.prevItems = latestItems
                    if (uniRef.current) {
                        uniRef.current.scrollToIndex?.({
                            index: 0,
                            align: 'end',
                            behavior: 'smooth',
                        })
                    }
                }}
                variant="primary"
                title="Show New"
                size="sm"
            />
        </>
    )
};

const TabScene = ({
    pageRoute,
    layoutName,
    leftColumnContent,
    rightColumnContent,
    centerColumnContent
}) => {
    const pageData = pageRoute.pageData

    const currentBreakpoint = useBreakpoint()
    const currentBreakpointName = getBreakpoint(currentBreakpoint)

    const isRightCol = !!rightColumnContent
    const isLeftCol = !!leftColumnContent

    const groupRef = useRef(null)

    const layoutCols =
        !isLeftCol && !isRightCol
            ? 'c'
            : !isLeftCol
                ? 'c-r'
                : !isRightCol
                    ? 'l-c'
                    : 'l-c-r'

    const cellsCustomConfig = useMemo(() => {
        return (
            appSetting('layouts', pageRoute?.pageData?.uri) ||
            appSetting('layouts', `cols-${layoutCols}`)
        )
    }, [pageRoute?.pageData?.uri, layoutCols])


    const panelLayoutKey = `${layoutCols}-${pageData?.menu?.object || pageData?.uri || 'default'}`

    const { cells = {} } = cellsCustomConfig || {}

    // LEFT
    const {
        breakpoint: leftBreakpoint,
        responsive: leftResponsive,
        ...leftBase
    } = cells.left ?? {}
    const leftPanelProps = resolvePanelProps(
        leftBase,
        leftResponsive,
        currentBreakpointName
    )

    // CENTER
    const {
        breakpoint: centerBreakpoint,
        responsive: centerResponsive,
        ...centerBase
    } = cells.center ?? {}
    const centerPanelProps = resolvePanelProps(
        centerBase,
        centerResponsive,
        currentBreakpointName
    )

    // RIGHT
    const {
        breakpoint: rightBreakpoint,
        responsive: rightResponsive,
        ...rightBase
    } = cells.right ?? {}
    const rightPanelProps = resolvePanelProps(
        rightBase,
        rightResponsive,
        currentBreakpointName
    )

    const asId = cellsCustomConfig.sizable
        ? `cells-${panelLayoutKey}`
        : undefined;

    function getLayouts() {
        const layouts = [];

        if (isLeftCol && leftPanelProps.defaultSize) {
            layouts.push(leftPanelProps.defaultSize);
        }
        if (centerPanelProps.defaultSize)
            layouts.push(centerPanelProps.defaultSize);

        if (isRightCol && rightPanelProps.defaultSize) {
            layouts.push(rightPanelProps.defaultSize);
        }

        return layouts.length > 0 ? layouts : null;
    }

    const onLayout = (sizes) => {
        const layouts = getLayouts();
        if (JSON.stringify(sizes) != JSON.stringify(layouts) && asId && layouts) {
            storageSet('rrp', asId + '-' + currentBreakpointName, sizes, true);
        }
        setTimeout(() => window.dispatchEvent(new Event('resize_panel')), 100)
    }

    useEffect(() => {
        const sl = storageGet('rrp', asId + '-' + currentBreakpointName, true);
        if (groupRef) {
            const l = sl || getLayouts()
            if (l)
                groupRef.current?.setLayout(sl || getLayouts())
        }
    }, [currentBreakpointName, pageRoute])

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, [pageRoute])

    return (
        <PanelGroup
            ref={groupRef}
            key={`${panelLayoutKey}-pnl2-${cellsCustomConfig.sizable ? 'sizable' : 'static'
                }`}

            direction="horizontal"
            className={(layoutName == 'navigator' ? '' : '') + ' h-full'}
            onLayout={onLayout}
        >
            {isLeftCol && (
                <>
                    <Panel
                        className={`hidden ${leftBreakpoint}:block`}
                        {...leftPanelProps}
                    >
                        {leftColumnContent}
                    </Panel>
                    <PanelHandler
                        gap={`hidden ${leftBreakpoint}:block`}
                        sizable={cellsCustomConfig.sizable}
                    />
                </>
            )}
            <Panel {...centerPanelProps}>
                <View
                    className={`${isRightCol ? 'flex-auto' : 'w-full mx-auto'
                        } ${layoutName !== 'navigator'
                            ? 'mt-0.5 sm:p-2'
                            : (!pageRoute?.endpoint?.request_url ? 'sm:my-3 mt-0.5 sm:px-3 ' : '')
                        }`}
                >
                    {centerColumnContent}
                </View>
            </Panel>
            {isRightCol && (
                <>
                    <PanelHandler
                        gap={`hidden ${rightBreakpoint}:block`}
                        sizable={cellsCustomConfig.sizable}
                    />
                    <Panel
                        className={`hidden ${rightBreakpoint}:block `}
                        {...rightPanelProps}
                    >
                        {rightColumnContent}
                    </Panel>
                </>
            )}
        </PanelGroup>
    )
}

const getUnitType = (currentRoute) =>
    Object.values(currentRoute?.blocks ?? {}).find(
        (b) => !b.sidebar && b.unitType
    )?.unitType

const LeftBarContent = (route, onFormChangedValues) => {
    const items = route?.leftbar?.content ?? []
    if (items.length === 0) return null

    return (
        <View className="gap-y-4">
            {items.map((block, index) => (
                <View key={`lb-${block.id ?? block.block ?? index}`}>
                    <BlockByName
                        name={block.block}
                        onChange={onFormChangedValues}
                        data={route?.pageData}
                        sidebar={true}
                    />
                </View>
            ))}
        </View>
    )
}

const AddMenu = ({ menu, filter }) => {
    const [pageData, setPageData] = useState(false)
    const { currentUser } = useCurrentUser()
    const { t } = useTranslation()
    const menuSettings = getMenuSettings(menu.object, menu.config)
    let addButtonsSet = menuSettings?.add?.filter(
        (item) => item[filter] !== true
    )
    addButtonsSet = menuItemsFilter(addButtonsSet, currentUser)

    if (!addButtonsSet) {
        addButtonsSet = []

        if (menu.add_url && currentUser) {
            addButtonsSet.push({
                icon: 'Plus',
                name: 'Add',
                link: menu.add_url,
            })
        }
        if (menu.name && menu.add_url) {
            addButtonsSet.push({
                icon: 'Search',
                name: 'Search',
                link: '',
                section: menu.name,
            })
        }
    }
    return (
        <Row className="gap-x-2">
            {addButtonsSet.map((button) => {
                let btn = undefined
                if (button.section)
                    btn = (
                        <Search
                            section={button.section}
                            params={{ trigger: { size: 'sm' } }}
                        />
                    )
                else {
                    btn = (
                        <Button
                            title={t(button.title)}
                            startDecorator={button.icon}
                            rounded
                            size="base"
                            variant="secondary"
                            onPress={() =>
                                handleFormModal(button, event, setPageData)
                            }
                        />
                    )
                    btn =
                        button.link && button.name != 'Add' ? (
                            <Link href={button.link}>{btn}</Link>
                        ) : (
                            btn
                        )
                }

                return (
                    <View key={`add-${button.icon}-${button.name}`}>
                        {btn}
                        <FormModal
                            pageData={pageData}
                            setPageData={setPageData}
                        />
                    </View>
                )
            })}
        </Row>
    )
}

function ConductorMenu({
    routes,
    index,
    t,
    setIndex,
    onChangeRoute,
}) {
    const name = 'cnd-main-menu'

    const filteredItems = routes.filter((aItem) => aItem.hideInTop != true)
    const menuClasses = conductorTheme.menu_cnt

    if (index >= filteredItems.length) {
        index = 0
    }

    const MenuItemSubmenu = getComponent('menu-item', 'submenu');

    const MenuItem = memo(
        ({ item: a, itemRefs, index: index2, visibleItemsCount }) => {
           
            return (
                <View className={`sadasd ${a?.menu_settings?.class}`}>
                    <MenuItemSubmenu
                        title={a.title}
                        pressed={a.index == index}
                        disabled={a?.item?.disabled}
                        addon={getAddon(a.addon)}
                        onPress={() => {
                            setIndex(a.index)
                            window.history.pushState({}, '', '/' + a.key)
                            if (onChangeRoute) {
                                onChangeRoute(a)
                            }
                        }}
                        item={a}
                    />
                </View>
            )
        }
    )

    const MenuItemEx = memo(({ item, index: itemIndex }) => {
        const { title, addon, icon, link, menu_settings, key } = item
        const translatedTitle = (
            <Text className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 leading-6 font-medium text-base">
                {t(title)}
            </Text>
        )
        const addonContent = <Addon item={item} index={itemIndex} />

        const handlePress = () => {
            emitter.emit('dynamic_menu', { action: 'hide' })
            setIndex(itemIndex)
            window.history.pushState({}, '', '/' + key)
            if (onChangeRoute) {
                onChangeRoute(item)
            }
        }

        if (icon === '*') {
            return (
                <Link href={link}>
                    <Row className="justify-between items-center min-w-200">
                        {translatedTitle}
                        {addonContent}
                    </Row>
                </Link>
            )
        }

        return (
            <Pressable
                className={' ' + menu_settings?.class ?? ''}
                onPress={handlePress}
            >
                <Row className="  hover:cursor-pointer justify-between  flex flex-row h-10 items-center px-3 text-base rounded-xl web:hover:bg-muted items-center ">
                    {translatedTitle}
                    {addonContent}
                </Row>
            </Pressable>
        )
    })

    const ButtonEx = memo(({ visibleItemsCount }) => {
        return (
            <View className="pr-3">
                <Button
                    startDecorator="ChevronDown"
                    variant="text"
                    rounded
                    pressed={visibleItemsCount <= index ? true : false}
                    size="sm"
                />
            </View>
        )
    })

    if (!conductorTheme.menu_is_dynamic) {
        return (
            <View className={menuClasses}>
                {filteredItems.map((aItem, iKey) => {
                    return (
                        <MenuItem
                            key={name + 'menu' + iKey}
                            item={aItem}
                            index={iKey}
                        />
                    )
                })}
            </View>
        )
    }

    return (
        <DynamicMenu
            name={name}
            offsetWidth={80}
            ButtonEx={ButtonEx}
            MenuItemEx={MenuItemEx}
            MenuItem={MenuItem}
            containerClasses="w-full justify-between "
            items={filteredItems}
            isButtonOutside={false}
            menuClasses={menuClasses}
            menuExClasses="mr-auto ml-4 items-end"
        />
    )
}

const LeftSideBarContainer = ({
    menu,
    routes,
    index,
    setIndex,
    children,
    layoutName,
}) => {
    const { t } = useTranslation();
    const menuSettings = getMenuSettings(menu.object, menu.config, menu)
    const addButtons = <AddMenu menu={menu} filter="hideInSideBar" />
    const title = layoutName == 'profile' ? '' : t(menuSettings?.name)
    const MenuItemSidebar = getComponent('menu-item', 'sidebar');
     
    return (
        <View
            className={`${layoutName == 'profile'
                ? 'mt-0.5 sm:p-2' + ' fixed-process'
                : appSetting(
                    'conductor',
                    'sidebar_container'
                )
                }`}
        >
            <View className={`${layoutName == 'profile' ? '' : 'mt-fixed-process'}`}>
                <View className={`${layoutName == 'profile' ? '' : appSetting('conductor', 'sidebar_inner_container')} ${layoutName == 'profile' ? '' : 'mt-3'}`}>
                    {(!!title || !!addButtons?.length > 0) && (
                        <Row className={appSetting('conductor', 'sidebar_title')}>
                            <Text className=" text-2xl tracking-tight truncate mr-auto font-bold leading-11 text-card-foreground hidden lg:flex  ">
                                {t(title)}
                            </Text>
                            <Row>{addButtons}</Row>
                        </Row>
                    )}
                    <View className="flex-1 gap-y-4">
                        {layoutName == 'navigator' && routes.length > 1 && (
                            <View className='w-full gap-0.5'>
                                {routes
                                    .filter((aItem) => aItem.hideInTop != true)
                                    .map((a) => {
                                        const btn = <MenuItemSidebar addon={getAddon(a.addon)} title={a.title} icon={a.icon || 'Circle'} isActive={a.index === index } />

                                        if (a?.icon == '*') {
                                            return (
                                                <Link
                                                    href={a.link}
                                                    key={`lmenu-${a.index}`}
                                                    alt={a.title}
                                                >
                                                    {btn}
                                                </Link>
                                            )
                                        }
                                        return (
                                            <Link
                                                href={a.key}
                                                key={`lmenu-${a.index}`}
                                                alt={a.title}
                                            >
                                                <Pressable
                                                    className={
                                                        a.ident
                                                            ? conductorTheme.menu_categ_indent
                                                            : ''
                                                    }
                                                    onPress={(event) => {
                                                        setIndex(a.index)
                                                        window.history.pushState({}, '', a.key)
                                                        event.preventDefault()
                                                    }}
                                                >
                                                    {btn}
                                                </Pressable>
                                            </Link>
                                        )
                                    })}
                            </View>
                        )}
                        {children}
                    </View>
                </View>
            </View>
        </View>
    )
}

const HeaderContainer = ({
    tabBarObj,
    pageData,
    headerSettings,
    isCover,
    isHideCover,
    isCoverDisabled
}) => {
    const [hideDefaultHeaderFrom, setHideDefaultHeaderFrom] = useState(100);
    const [smallCoverHeight, setSmallCoverHeight] = useState(100);
    const isDesktop = useIsDesktop()
    const [isScrolled, setIsScrolled] = useState(isCoverDisabled)
    const uri = pageData?.uri

    const handleScroll = useCallback(() => {
        requestAnimationFrame(() => {
            const currentScrollY = window.scrollY
            setIsScrolled(currentScrollY > (hideDefaultHeaderFrom - smallCoverHeight - 20))
        })
    }, [hideDefaultHeaderFrom, smallCoverHeight])

    useEffect(() => {
        if (!appSetting('cover', 'fixed') && isCover) {
            window.addEventListener('scroll', handleScroll)
        }

        return () => {
            if (!appSetting('cover', 'fixed') && isCover) {
                window.removeEventListener('scroll', handleScroll)
            }
        }
    }, [handleScroll, isCover])

    const onCoverLayout1 = useCallback((e) => {
        setHideDefaultHeaderFrom(e.nativeEvent.layout.height)
    }, [])

    const onCoverLayout2 = useCallback((e) => {
        setSmallCoverHeight(e.nativeEvent.layout.height)
    }, [])

    return (
        <View className="z-40">
            <View className={`${conductorTheme.cover_base} cover-1`}
                style={{
                    marginBottom: !isScrolled ? '0px' : `${smallCoverHeight}px`,
                }}
            >
                <View>
                    <View className={conductorTheme.cover_content}>
                        {isCover && !isHideCover && (
                            <View className="w-full " onLayout={onCoverLayout1}>
                                <Cover
                                    data={pageData.cover_block}
                                    mode={headerSettings.cover}
                                    uri={uri}
                                    context={pageData.context}
                                />
                            </View>
                        )}
                    </View>
                </View>
            </View>
            <View className={` header-fixed 77 ${conductorTheme.cover_base} ` + (isScrolled ? 'fixed' : '')}>
                <View className={conductorTheme.cover_small}
                    style={{
                        display: isScrolled ? 'flex' : 'none',
                    }}
                >
                    {((isCover && !isHideCover) || !isDesktop) && (
                        <View className="w-full">
                            <CoverSmall
                                context={pageData.context}
                                data={pageData.cover_block}
                            />
                        </View>
                    )}
                </View>
                <View onLayout={onCoverLayout2}>{tabBarObj}</View>
            </View>
        </View>
    )
}

const TabBar = ({
    menu,
    routes,
    pageData,
    layoutName,
    index,
    setIndex,
    onChangeRoute,
    omitDefaultBackground = false,
}) => {
    const { t } = useTranslation()
    const { layoutName: layout } = useLayoutSettings()
    const menuSettings = getMenuSettings(menu.object, menu.config, menu)
    if (routes.length > 0) {
        const addButtons = <AddMenu menu={menu} filter="hideInTopBar" />
        return (
            <TopSidebar
                layoutName={layoutName}
                omitDefaultBackground={omitDefaultBackground}
                addButtons={addButtons}
                layout={layout}
                title={t(menuSettings?.name)}
            >
                <View className="flex-1 h-14">
                    {routes.length > 1 && <ConductorMenu
                        routes={routes}
                        index={index}
                        t={t}
                        setIndex={setIndex}
                        onChangeRoute={onChangeRoute}
                    />}
                </View>
                {!!pageData.cover_block?.actions_menu && (
                    <Row className="hidden lg:block items-center mx-3 ">
                        {!!appSetting(
                            'cover',
                            'more_menu_in_navbar',
                            pageData?.module
                        ) && (
                                <Row className="gap-2">
                                    <CoverMenu
                                        {...pageData.cover_block.actions_menu}
                                        uri={pageData.uri}
                                        isSplitMenu={true}
                                        containerClasses="gap-2 "
                                    />
                                    <CoverMenuMore
                                        {...pageData.cover_block.actions_menu}
                                        uri={pageData.uri}
                                        isSplitMenu={true}
                                    />
                                </Row>
                            )}
                    </Row>
                )}
            </TopSidebar>
        )
    }
}

const TabSceneHeader = ({ route, setFilterValue }) => {
    const filters = appSetting('conductor', 'hide_browse_filter')
        ? null
        : route?.endpoint?.filters
    const counter = appSetting('conductor', 'show_nav_counters')
        ? 0
        : route.addon
            ? route.addon.text
                ? route.addon.text
                : route.addon
            : 0
    const isTitle = appSetting('conductor', 'show_nav_titles')
    return (
        <>
            {counter > 0 && (
                <View className="mx-4 mb-0 mt-2">
                    <Text className="text-xl font-bold text-neutral-800  dark:text-neutral-200 ">
                        {route.title} ({counter})
                    </Text>
                </View>
            )}
            {isTitle && (
                <View
                    className={`${conductorTheme.content_max_width} mx-auto w-full pt-3  px-4`}
                >
                    <Text className="text-3xl tracking-tight leading-10 font-bold text-neutral-800  dark:text-neutral-200 ">
                        {route.title}
                    </Text>
                </View>
            )}
        </>
    )
}
