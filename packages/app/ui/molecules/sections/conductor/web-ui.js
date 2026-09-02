import { useCallback, useState, useEffect, useLayoutEffect, useRef, useMemo, memo, createContext, useContext } from 'react'
import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'
import { Icon } from 'app/ui/atoms/icon'
import {
    appSetting,
    getMenuSettings,
    menuItemsFilter,
    storageSet,
    storageGet,
} from 'app/lib/util'
import {
    getAddon,
    hasConductorSubitems,
    conductorHref,
    conductorListQueryKey,
    buildConductorSidebarExpandedMap,
    mergeConductorSidebarExpandedMap,
    getConductorRouteChildren,
    getConductorSidebarRootRoutes,
    getConductorDepthClassName,
    registeredComponent,
} from './helpers'
import {
    LeftColumnMenuDropdown,
    Addon,
    TabItem,
    TabList,
    ListScene,
    FiltersButton,
} from './shared-ui'
import { useConductorList } from './use-conductor-list'
import { Button, NeoButton, NeoButtonLink } from 'app/design/controls'
import Link from 'app/ui/atoms/link'
import { getSkeletonForList } from 'app/lib/skeleton-helpers'
import { useTranslation } from 'react-i18next'
import { useCurrentUser } from 'app/context/user'
import Search from 'app/ui/molecules/sections/search'
import DynamicMenu from 'app/components/nav/menu-dynamic'
import { layoutForList } from 'app/customization/functions'
import FormModal, { handleFormModal } from 'app/ui/molecules/dialogs/form-modal'
import emitter from 'app/context/emitter'
import Cover from 'app/components/elements/covers/cover'
import CoverMorph from 'app/components/elements/covers/cover-morph'
import { CoverMenuMore, CoverMenu } from 'app/components/elements/covers/menu-cover'
import {
    Panel,
    PanelGroup,
    PanelHandler,
    resolvePanelProps,
} from 'app/ui/molecules/page/resizable-panels'
import { useLayoutSettings } from 'app/context/layout-settings'
import { useIsDesktop, useBreakpointName } from 'app/context/measure'
import Snackbar from 'app/ui/atoms/snackbar'
import { useHeaderHeight } from 'app/context/jotai/layout'
import { ItemRenderer } from 'app/components/item-renderer'
import { BlockByName } from 'app/components/block'
import { measureHeaderFixedOffset } from 'app/lib/hooks/use-sticky-header-offset'

const conductorTheme = appSetting('theme', 'conductor')

const coverTabScroll = { collapsed: false, hold: false }

function scrollTabToStart() {
    if (typeof window === 'undefined') return
    if (!coverTabScroll.collapsed) {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
        return
    }
    coverTabScroll.hold = true
    const content = document.querySelector('.ns--conductor-tab-content--')
    const headerOffset = measureHeaderFixedOffset()
    if (!content || headerOffset <= 0) return
    const top = Math.max(0, Math.round(window.scrollY + content.getBoundingClientRect().top - headerOffset))
    window.scrollTo({ top, left: 0, behavior: 'auto' })
}

export const TabScene = ({
    pageRoute,
    isInited,
    skeleton,
    keyword,
    ts,
    timestamp,
    onFormChangedValues,
    leftColumnExcludedFromMainIds = null,
}) => {
    const isDesktop = useIsDesktop()
    const uniRef = useRef()
    const { t } = useTranslation()
    const layout = layoutForList(pageRoute?.endpoint)

    const qKey = useMemo(
        () => conductorListQueryKey({
            requestUrl: pageRoute?.endpoint?.request_url,
            tabId: pageRoute.link,
            keyword,
            params: pageRoute?.endpoint?.params ?? null,
            ts,
            timestamp,
        }),
        [
            pageRoute?.endpoint?.request_url,
            pageRoute.link,
            keyword,
            pageRoute?.endpoint?.params,
            ts,
            timestamp,
        ]
    )

    const {
        listItems,
        hasNewData,
        acceptNewData,
        hasNextPage,
        isFetching,
        isPending,
        refetch,
        isRefetching,
        handleEndReached,
        listReady,
        skipToastRef,
    } = useConductorList({
        route: pageRoute,
        queryKey: qKey,
        enabled: !!pageRoute?.endpoint?.request_url,
        deferNewItems: true,
        refetchOnWindowFocus: true,
        listenPageReload: true,
    })

    const afterList = useCallback((scene) => (
        <>
            {pageRoute?.endpoint?.request_url && hasNextPage
                ? getSkeletonForList(
                    scene.skeletonKey,
                    skipToastRef.current.skipToast ? 0 : 5,
                    false,
                    scene.layout,
                    scene.renderItem,
                    scene.paddings
                )
                : null}
            <Snackbar
                visible={hasNewData}
                onPress={() => {
                    acceptNewData()
                    if (uniRef.current) {
                        uniRef.current.scrollToIndex?.({
                            index: 0,
                            align: 'end',
                            behavior: 'smooth',
                        })
                    }
                }}
                variant="primary"
                title={t('Show New')}
                size="sm"
            />
        </>
    ), [
        pageRoute?.endpoint?.request_url,
        hasNextPage,
        hasNewData,
        acceptNewData,
        skipToastRef,
        t,
    ])

    const uniListProps = useMemo(() => ({
        listState: pageRoute?.state,
        mode: layout == 'w-full' ? 'simple' : '',
        storagekey: pageRoute.storageKeyValue,
        useWindowScroll: true,
    }), [pageRoute?.state, layout, pageRoute.storageKeyValue])

    return (
        <ListScene
            route={pageRoute}
            skeleton={skeleton}
            skeletonCount={5}
            listItems={listItems}
            includeSidebar={!isDesktop}
            showMobileLeftColumn={!isDesktop}
            leftColumnExcludedFromMainIds={leftColumnExcludedFromMainIds}
            onFormChangedValues={onFormChangedValues}
            isInited={isInited}
            listReady={listReady}
            refreshing={isRefetching}
            hasNextPage={hasNextPage}
            isPending={isPending}
            isFetching={isFetching}
            enableRevealFade
            listRef={uniRef}
            handleEndReached={handleEndReached}
            onRefresh={refetch}
            afterList={afterList}
            uniListProps={uniListProps}
        />
    )
};

export const TabSceneColumns = ({
    pageRoute,
    layoutName,
    tabIndex,
    leftColumn,
    rightColumn,
    children,
}) => {
    const pageData = pageRoute.pageData

    const currentBreakpointName = useBreakpointName()

    const isRightColumn = !!rightColumn
    const isLeftColumn = !!leftColumn

    const groupRef = useRef(null)

    const layoutCols =
        !isLeftColumn && !isRightColumn
            ? 'c'
            : !isLeftColumn
                ? 'c-r'
                : !isRightColumn
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
        : undefined

    const defaultLayouts = useMemo(() => {
        const layouts = []
        if (isLeftColumn && leftPanelProps.defaultSize) {
            layouts.push(leftPanelProps.defaultSize)
        }
        if (centerPanelProps.defaultSize) {
            layouts.push(centerPanelProps.defaultSize)
        }
        if (isRightColumn && rightPanelProps.defaultSize) {
            layouts.push(rightPanelProps.defaultSize)
        }
        return layouts.length > 0 ? layouts : null
    }, [
        isLeftColumn,
        isRightColumn,
        leftPanelProps.defaultSize,
        centerPanelProps.defaultSize,
        rightPanelProps.defaultSize,
    ])

    const onLayout = useCallback((sizes) => {
        if (
            JSON.stringify(sizes) != JSON.stringify(defaultLayouts) &&
            asId &&
            defaultLayouts
        ) {
            storageSet('rrp', asId + '-' + currentBreakpointName, sizes, true)
        }
        setTimeout(() => window.dispatchEvent(new Event('resize_panel')), 100)
    }, [asId, currentBreakpointName, defaultLayouts])

    useEffect(() => {
        const stored = storageGet('rrp', asId + '-' + currentBreakpointName, true)
        const next = stored || defaultLayouts
        if (next) groupRef.current?.setLayout(next)
    }, [asId, currentBreakpointName, defaultLayouts, pageRoute])

    // `tabIndex` changes on click; `pageRoute.index` when the new tab mounts.
    useLayoutEffect(() => {
        if (typeof window === 'undefined') return
        scrollTabToStart()
        const frame = requestAnimationFrame(() => scrollTabToStart())
        const releaseHold = setTimeout(() => {
            coverTabScroll.hold = false
        }, 80)
        return () => {
            cancelAnimationFrame(frame)
            clearTimeout(releaseHold)
        }
    }, [tabIndex, pageRoute?.index, pageRoute?.inited])

    return (
        <PanelGroup
            ref={groupRef}
            key={`${panelLayoutKey}-pnl2-${cellsCustomConfig.sizable ? 'sizable' : 'static'
                }`}

            direction="horizontal"
            className='h-full'
            // Default panel-group overflow:hidden creates a scrollport and breaks
            // window-scroll sticky. clip still contains resize overflow without that.
            style={{ overflow: 'clip' }}
            onLayout={onLayout}
        >
            {isLeftColumn && (
                <>
                    <Panel
                        className={`hidden ${leftBreakpoint}:block`}
                        {...leftPanelProps}
                    >
                        {leftColumn}
                    </Panel>
                    <PanelHandler
                        gap={`hidden ${leftBreakpoint}:block`}
                        sizable={cellsCustomConfig.sizable}
                        panelLine={cellsCustomConfig['panel-line']}
                    />
                </>
            )}
            <Panel {...centerPanelProps}>
                <View
                    className={`${isRightColumn ? 'flex-auto' : 'w-full mx-auto'
                        } ${layoutName !== 'navigator'
                            ? 'mt-0.5 sm:m-0 sm:p-3 lg:p-4'
                            : (!pageRoute?.endpoint?.request_url ? 'sm:p-4 ' : '')
                        }`}
                >
                    {children}
                </View>
            </Panel>
            {isRightColumn && (
                <>
                    <PanelHandler
                        gap={`hidden ${rightBreakpoint}:block`}
                        sizable={cellsCustomConfig.sizable}
                        panelLine={cellsCustomConfig['panel-line']}
                    />
                    <Panel
                        className={`hidden ${rightBreakpoint}:block `}
                        {...rightPanelProps}
                    >
                        {rightColumn}
                    </Panel>
                </>
            )}
        </PanelGroup>
    )
}



function getAddMenuItems(menu, filter, currentUser) {
    const menuSettings = getMenuSettings(menu.object, menu.config)
    let items = menuSettings?.add?.filter((item) => item[filter] !== true)
    items = menuItemsFilter(items, currentUser)

    if (!items) {
        items = []
        if (menu.add_url && currentUser) {
            items.push({
                icon: 'Plus',
                name: 'Add',
                link: menu.add_url,
            })
        }
        if (menu.name && menu.add_url) {
            items.push({
                icon: 'Search',
                name: 'Search',
                link: '',
                section: menu.name,
            })
        }
    }
    return items
}

const AddMenu = ({ menu, filter }) => {
    const [pageData, setPageData] = useState(false)
    const { currentUser } = useCurrentUser()
    const { t } = useTranslation()
    const addButtonsSet = getAddMenuItems(menu, filter, currentUser)

    return (
        <Row className="gap-x-2">
            {addButtonsSet.map((button) => {
                let btn
                if (button.section) {
                    btn = (
                        <Search
                            section={button.section}
                            params={{
                                trigger: {
                                    style: 'bordered',
                                    controlSize: 'small',
                                },
                            }}
                        />
                    )
                } else {
                    btn = (
                        <NeoButton
                            label={t(button.title)}
                            image={button.icon}
                            style="bordered"
                            controlSize="small"
                            borderShape="circle"
                            onPress={() => {
                                setPageData('loading')
                                handleFormModal(button, null, setPageData)
                            }}
                        />
                    )
                    if (button.link && button.name != 'Add') {
                        btn = <Link href={button.link}>{btn}</Link>
                    }
                }

                return (
                    <View key={`add-${button.icon}-${button.name}`}>
                        {btn}
                    </View>
                )
            })}
            <FormModal
                pageData={pageData}
                setPageData={setPageData}
            />
        </Row>
    )
}

const TabMenuContext = createContext(null)

function TabMenuItem({ item }) {
    const { selectedIndex, onSelect } = useContext(TabMenuContext)
    return (
        <TabItem
            item={item}
            selectedIndex={selectedIndex}
            onPress={onSelect}
        />
    )
}

const TabMenuItemEx = memo(function TabMenuItemEx({ item }) {
    const { onSelect } = useContext(TabMenuContext)
    const { t } = useTranslation()
    const { title, icon, menu_settings } = item
    const itemClassName = menu_settings?.class ? ` ${menu_settings.class}` : ''
    const translatedTitle = (
        <Text className="text-muted-foreground web:hover:text-secondary-foreground leading-6 font-medium text-base">
            {t(title)}
        </Text>
    )
    const addonContent = <Addon item={item} />

    const handlePress = () => {
        emitter.emit('dynamic_menu', { action: 'hide' })
        onSelect(item)
    }

    if (icon === '*') {
        return (
            <Pressable
                className={itemClassName}
                accessibilityRole="link"
                accessibilityLabel={title}
                onPress={handlePress}
            >
                <Row className="justify-between items-center min-w-200">
                    {translatedTitle}
                    {addonContent}
                </Row>
            </Pressable>
        )
    }

    return (
        <Pressable
            className={itemClassName}
            onPress={handlePress}
        >
            <Row className="web:hover:cursor-pointer justify-between flex flex-row h-10 px-3 text-base rounded-xl web:hover:bg-muted items-center ">
                {translatedTitle}
                {addonContent}
            </Row>
        </Pressable>
    )
})

const TabMenuButtonEx = memo(function TabMenuButtonEx({ visibleItemsCount }) {
    const { selectedIndex } = useContext(TabMenuContext)
    return (
        <View className="pr-3">
            <Button
                startDecorator="ChevronDown"
                variant="text"
                rounded
                pressed={visibleItemsCount <= selectedIndex ? true : false}
                size="sm"
            />
        </View>
    )
})

const TabMenu = function TabMenu({
    routes,
    index,
    setIndex,
    onChangeRoute,
}) {
    const name = 'cnd-main-menu'
    const useCompactNav = hasConductorSubitems(routes)
    const filteredItems = routes.filter((aItem) => aItem.hideInTop != true)
    const menuClasses = conductorTheme.menu_cnt
    const selectedIndex = !useCompactNav && index >= filteredItems.length ? 0 : index

    const onSelect = useCallback((item) => {
        setIndex(item.index)
        const rawHref = item.canNavigate === false ? '' : item.link || item.key
        const href = conductorHref(rawHref)
        if (typeof window !== 'undefined') {
            window.history.pushState({}, '', href || `/${item.key}`)
        }
        onChangeRoute?.(item)
    }, [setIndex, onChangeRoute])

    const menuContext = useMemo(
        () => ({ selectedIndex, onSelect }),
        [selectedIndex, onSelect]
    )

    return (
        <TabMenuContext.Provider value={menuContext}>
            {!conductorTheme.menu_is_dynamic ? (
                <View className={menuClasses}>
                    <TabList
                        routes={routes}
                        index={selectedIndex}
                        onSelect={onSelect}
                        itemWrapperClassName=""
                    />
                </View>
            ) : (
                <DynamicMenu
                    name={name}
                    offsetWidth={80}
                    ButtonEx={TabMenuButtonEx}
                    MenuItemEx={TabMenuItemEx}
                    MenuItem={TabMenuItem}
                    containerClasses="w-full justify-between "
                    items={filteredItems}
                    isButtonOutside={false}
                    menuClasses={menuClasses}
                    menuExClasses="mr-auto ml-4 items-end"
                />
            )}
        </TabMenuContext.Provider>
    )
}

export function SidebarNav({ routes, index, onSelect }) {
    const MenuItemSidebarWithWrapper = registeredComponent('menu-item', 'sidebar_with_wrapper')
    const [expandedMap, setExpandedMap] = useState(() => (
        buildConductorSidebarExpandedMap(routes, index)
    ))

    useEffect(() => {
        setExpandedMap((prev) => mergeConductorSidebarExpandedMap(prev, routes, index))
    }, [index, routes])

    const toggleExpanded = (itemIndex) => {
        setExpandedMap((prev) => ({ ...prev, [itemIndex]: !prev[itemIndex] }))
    }

    const renderRoute = (route) => {
        const children = getConductorRouteChildren(route, routes)
        const hasChildren = children.length > 0
        const isExpanded = Boolean(expandedMap[route.index])
        const canNavigate = Boolean(route.canNavigate)
        const isActive = route.index === index
        const href = conductorHref(route.link || route.key)
        const icon = route.image || route.icon || 'Circle'

        return (
            <View key={`lmenu-${route.index}`} className="w-full">
                <MenuItemSidebarWithWrapper
                    link={canNavigate ? href : undefined}
                    title={route.title}
                    icon={icon}
                    iconEnd={
                        !canNavigate && hasChildren
                            ? (isExpanded ? 'ChevronDown' : 'ChevronRight')
                            : undefined
                    }
                    isActive={isActive}
                    onPress={
                        !canNavigate && hasChildren
                            ? () => toggleExpanded(route.index)
                            : (event) => {
                                event?.preventDefault?.()
                                onSelect(route)
                            }
                    }
                    className={getConductorDepthClassName(route.depth)}
                />
                {hasChildren && isExpanded ? (
                    <View className="gap-0.5">
                        {children.map((child) => renderRoute(child))}
                    </View>
                ) : null}
            </View>
        )
    }

    const roots = getConductorSidebarRootRoutes(routes)

    if (!roots.length) return null

    return (
        <View className="w-full gap-0.5">
            {roots.map((route) => renderRoute(route))}
        </View>
    )
}

function NavigatorMenuLink({ item, index, setIndex }) {
    const MenuItemSidebar = registeredComponent('menu-item', 'sidebar')
    const isActive = item.index === index
    const isStar = item?.icon == '*'
    const btn = (
        <MenuItemSidebar
            addon={getAddon(item.addon)}
            title={item.title}
            icon={item.icon || 'Circle'}
            isActive={isActive}
        />
    )

    return (
        <NeoButtonLink
            href={isStar ? item.link : item.key}
            alt={item.title}
            style="borderless"
            controlSize="regular"
            width="fill"
            align="start"
            contentInsets={{ x: 8 }}
            selected={isActive}
            selectedState="pressed"
            className={
                isStar
                    ? 'group'
                    : `group ${item.ident ? conductorTheme.menu_categ_indent : ''}`.trim()
            }
            onPress={
                isStar
                    ? undefined
                    : (event) => {
                        setIndex(item.index)
                        window.history.pushState({}, '', item.key)
                        event.preventDefault()
                    }
            }
        >
            {btn}
        </NeoButtonLink>
    )
}

export const LeftColumnContainer = ({
    menu,
    routes,
    index,
    setIndex,
    children,
    layoutName,
    stickyColumnStyle,
}) => {
    const { t } = useTranslation()
    const { currentUser } = useCurrentUser()
    const menuSettings = getMenuSettings(menu.object, menu.config, menu)
    const addMenuItems = getAddMenuItems(menu, 'hideInSideBar', currentUser)
    const addButtons = <AddMenu menu={menu} filter="hideInSideBar" />
    const title = layoutName == 'profile' ? '' : t(menuSettings?.name)
    const icon = layoutName == 'profile' ? '' : (menuSettings?.icon || menu?.icon)
    const padClass =
        layoutName == 'profile'
            ? 'mt-0.5 sm:m-0 sm:p-3 lg:p-4'
            : appSetting('conductor', 'sidebar_container')

    const onSelectSidebar = useCallback((item) => {
        setIndex(item.index)
        const href = conductorHref(item.link || item.key)
        if (href) window.history.pushState({}, '', href)
    }, [setIndex])

    return (
        <View className="h-full">
            <View
                className={`web:sticky web:overflow-y-auto ${padClass}`}
                style={stickyColumnStyle}
            >
                <View className={layoutName == 'profile' ? '' : appSetting('conductor', 'sidebar_inner_container')}>
                    {(!!title || addMenuItems.length > 0) && (
                        <Row className={appSetting('conductor', 'sidebar_title')}>
                            <Row className="items-center mr-auto min-w-0 hidden lg:flex">
                                {!!icon && (
                                    <View className="h-9 w-9 mx-1 items-center justify-center flex">
                                    <Icon
                                        icon={icon}
                                        size={28}
                                        className="text-card-foreground shrink-0"
                                    /></View>
                                )}
                                <Text className="text-2xl px-0.5 tracking-tight truncate font-bold leading-9 text-card-foreground">
                                    {t(title)}
                                </Text>
                            </Row>
                            <Row>{addButtons}</Row>
                        </Row>
                    )}
                    <View className="flex-1 gap-4">
                        {layoutName == 'navigator' && routes.length > 1 && (
                            <View className=' gap-0.5 '>
                                {hasConductorSubitems(routes) ? (
                                    <SidebarNav
                                        routes={routes}
                                        index={index}
                                        onSelect={onSelectSidebar}
                                    />
                                ) : routes
                                    .filter((aItem) => aItem.hideInTop != true)
                                    .map((item) => (
                                        <NavigatorMenuLink
                                            key={`lmenu-${item.index}`}
                                            item={item}
                                            index={index}
                                            setIndex={setIndex}
                                        />
                                    ))}
                            </View>
                        )}

                        {children}

                    </View>
                </View>
            </View>
        </View>
    )
}

export const RightColumnContainer = ({ route, stickyColumnStyle }) => {
    const items = route?.sidebar?.content ?? []
    const unitType = route?.blocks?.browse_sidebar?.unitType || 'default'

    return (
        <View className="h-full">
            <View
                className={`web:sticky web:overflow-y-auto mt-0.5 sm:m-0 sm:p-3 lg:p-4 ${appSetting('conductor', 'sidebar_container')}`}
                style={stickyColumnStyle}
            >
                {items.map((item) => (
                    <ItemRenderer
                        key={`${route?.index}-${item.id}`}
                        unitType={unitType}
                        route={route}
                        sidebar={true}
                        item={item}
                        unit={route?.sidebar?.endpoint?.unit}
                        module={route?.sidebar?.endpoint?.module || ''}
                    />
                ))}
                <View>
                    {!!route.pageData && (
                        <BlockByName
                            data={route.pageData}
                            name={route.blocks?.browse_sidebar}
                            sidebar={true}
                            perLine={1}
                            maxItems={1}
                        />
                    )}
                </View>
            </View>
        </View>
    )
}

export const HeaderContainer = ({
    pageData,
    headerSettings,
    isCover,
    isHideCover,
    isCoverDisabled,
    contentWidth,
    menu,
    routes,
    layoutName,
    index,
    setIndex,
    onChangeRoute,
    leftColumnMenus = [],
    showFilters = false,
    onShowFilters,
}) => {
    const isDesktop = useIsDesktop()
    const pageHeaderHeight = useHeaderHeight()
    const uri = pageData?.uri
    const stickyTop = pageHeaderHeight || 0
    const coverKey = `${pageData?.ts ?? ''}:${pageData?.cover_block?.cover?.src ?? ''}:${pageData?.cover_block?.profile?.url_avatar ?? ''}`

    const hasCoverData = !!pageData?.cover_block?.profile
    // Single morphing cover replaces the old full Cover → CoverSmall swap.
    // It applies whenever there is cover data and the collapse behavior is
    // wanted: the cover image scrolls away while one identity bar morphs and
    // pins below the page header (see covers/cover-morph).
    const useMorph =
        hasCoverData &&
        !appSetting('cover', 'fixed') &&
        ((isCover && !isHideCover) || !isDesktop)

    const onMorphProgress = useCallback((progress) => {
        coverTabScroll.collapsed = progress >= 0.999
    }, [])

    useEffect(() => {
        return () => {
            coverTabScroll.hold = false
            coverTabScroll.collapsed = false
        }
    }, [])

    const tabBarContent = (
        <>
            <TabBar
                menu={menu}
                routes={routes}
                layoutName={layoutName}
                index={index}
                setIndex={setIndex}
                onChangeRoute={onChangeRoute}
                pageData={pageData}
                leftColumnMenus={leftColumnMenus}
            />
            <FiltersButton
                visible={showFilters}
                onPress={onShowFilters}
                className="items-start px-3 lg:px-4 py-2"
            />
        </>
    )

    if (useMorph) {
        // Cover + sticky compact bar + tab bar. The conductor wrapper is the
        // sticky containing block so they pin while tab content scrolls.
        return (
            <CoverMorph
                key={`cover-morph-${coverKey}`}
                pageKey={coverKey}
                data={pageData.cover_block}
                mode={headerSettings.cover}
                uri={uri}
                context={pageData.context}
                stickyTop={stickyTop}
                showImage={!isCoverDisabled && isCover && !isHideCover}
                onProgress={onMorphProgress}
            >
                {tabBarContent}
            </CoverMorph>
        )
    }

    // No cover data, or `cover.fixed` set: static full cover + static tab bar.
    return (
        <View className={`ns--cover-wrapper-- z-40 ne--`}>
            {isCover && !isHideCover && (
                <View className={`w-full ${conductorTheme.cover_base}`}>
                    <View className={conductorTheme.cover_content}>
                        <View className="w-full">
                            <Cover
                                key={`cover-${coverKey}`}
                                data={pageData.cover_block}
                                mode={headerSettings.cover}
                                uri={uri}
                                context={pageData.context}
                            />
                        </View>
                    </View>
                </View>
            )}
            <View className={`header-fixed w-full `}>
                {tabBarContent}
            </View>
        </View>
    )
}

/** Web-only tab subbar. Wired from HeaderContainer in this file; page header lives in index.web.js. */
export function TopSidebar({
    styles,
    addButtons,
    children,
    title,
    icon,
    layout,
    layoutName,
    omitDefaultBackground = false,
}) {
    const isHideOnDesktop = layoutName !== 'profile'
    return (
        <View
            style={styles}
            className={`${!omitDefaultBackground ? conductorTheme.menu : ''} ${isHideOnDesktop ? conductorTheme.hide_top_menu_from + ':hidden' : ''
                }`}
        >
            <View
                className={`${isHideOnDesktop ? '' : 'mx-auto'} ${appSetting('layout', 'page_content_width_default')} px-3 lg:px-4 mx-auto`}
            >
                    {/*
                      * Section title on the tab subbar, for the middle viewport range.
                      * Below `lg` the title already shows in the page sub-header (see
                      * the `setHeader` effect in index.web.js), and from
                      * `hide_top_menu_from` (xl) up this whole bar is hidden and the
                      * left column carries the title — so `hidden lg:flex` alone lands
                      * it exactly in the gap where nothing else shows it. No `xl:`
                      * gate is needed: the parent is already hidden there.
                      */}
                    <Row className="w-full items-center gap-4 min-w-0">
                        {(!!title && conductorTheme.show_title !== false && isHideOnDesktop) && (
                            <Row className="hidden lg:flex items-center gap-2 shrink-0 min-w-0">
                                {!!icon && (
                                    <Icon
                                        icon={icon}
                                        size={22}
                                        className="text-card-foreground shrink-0"
                                    />
                                )}
                                <Text className="text-xl font-bold tracking-tight text-card-foreground font-main truncate">
                                    {title}
                                </Text>
                            </Row>
                        )}
                        <View className="flex-1 min-w-0">{children}</View>
                    </Row>
                    {(layout != 'mixed' && layoutName !== 'profile') && (
                        <Row className={`hidden ${conductorTheme.hide_top_menu_from}:flex cond-buttons-add`}>
                            {addButtons}
                        </Row>
                    )}
            </View>
        </View>
    )
}

export const TabBar = ({
    menu,
    routes,
    pageData,
    layoutName,
    index,
    setIndex,
    onChangeRoute,
    omitDefaultBackground = false,
    leftColumnMenus = [],
}) => {
    const { t } = useTranslation()
    const { layoutName: layout } = useLayoutSettings()
    const menuSettings = getMenuSettings(menu.object, menu.config, menu)
    const isDesktop = useIsDesktop()
    const hasLeftColumnMenus = !isDesktop && leftColumnMenus.length > 0

    if (!routes.length) return null

    const addButtons = <AddMenu menu={menu} filter="hideInTopBar" />
    const isShowSecondLine = (
        routes.length > 1 ||
        !!pageData.cover_block?.actions_menu ||
        hasLeftColumnMenus
    )
    return (
        <TopSidebar
            layoutName={layoutName}
            omitDefaultBackground={omitDefaultBackground}
            addButtons={addButtons}
            layout={layout}
            title={t(menuSettings?.name)}
            icon={menuSettings?.icon || menu?.icon}
        >
             {isShowSecondLine && <Row className="px-0 w-full items-center">
                <View className="flex-1 min-h-12 lg:min-h-14 min-w-0">
                    {routes.length > 1 && <TabMenu
                        routes={routes}
                        index={index}
                        setIndex={setIndex}
                        onChangeRoute={onChangeRoute}
                    />}
                </View>
                    {hasLeftColumnMenus && (
                        <Row className="items-center gap-1 shrink-0 pl-1">
                            {leftColumnMenus.map((blockItem) => (
                                <LeftColumnMenuDropdown
                                    key={blockItem.id ?? blockItem.block?.name}
                                    blockItem={blockItem}
                                    t={t}
                                />
                            ))}
                        </Row>
                    )}
                    {!!pageData.cover_block?.actions_menu && (
                        <Row className={conductorTheme.more_menu_container}>
                            {isDesktop && !!appSetting(
                                'cover',
                                'more_menu_in_navbar',
                                pageData?.module
                            ) && (
                                    <Row className="items-center">
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
                </Row>}
            </TopSidebar>
        )
}

export const TabSceneHeader = ({ route, contentWidth }) => {
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
                    <Text className="text-xl font-bold text-secondary-foreground   ">
                        {route.title} ({counter})
                    </Text>
                </View>
            )}
            {isTitle && (
                <View
                    className={`${contentWidth} mx-auto pt-3 px-4`}
                >
                    <Text className="text-3xl tracking-tight leading-10 font-bold text-secondary-foreground">
                        {route.title}
                    </Text>
                </View>
            )}
        </>
    )
}
