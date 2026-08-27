import { useCallback, useState, useEffect, useLayoutEffect, useRef, useMemo, memo } from 'react'
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
} from './helpers'
import {
    LeftbarMenuDropdown,
    TopSidebar,
    Addon,
    ConductorSidebarNav,
    ConductorTabItem,
    ConductorTabList,
    ConductorListScene,
    ConductorFiltersButton,
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
import Cover, { CoverSmall } from 'app/components/elements/cover'
import { CoverMenuMore, CoverMenu } from 'app/components/nav/menu-cover'
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
import { getComponent } from 'app/components/registry'
import { ItemRenderer } from 'app/components/item-renderer'
import { BlockByName } from 'app/components/block'
import { measureHeaderFixedOffset } from 'app/lib/hooks/use-sticky-header-offset'

const conductorTheme = appSetting('theme', 'conductor')

const coverTabScroll = { collapsed: false, hold: false }

function scrollConductorTabToStart() {
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
    leftbarExcludedFromMainIds = null,
}) => {
    const isDesktop = useIsDesktop()
    const uniRef = useRef()
    const { t } = useTranslation()
    const layout = layoutForList(pageRoute?.endpoint)

    const qKey = conductorListQueryKey({
        requestUrl: pageRoute?.endpoint?.request_url,
        tabId: pageRoute.link,
        keyword,
        params: pageRoute?.endpoint?.params ?? null,
        ts,
        timestamp,
    })

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

    return (
        <ConductorListScene
            route={pageRoute}
            skeleton={skeleton}
            skeletonCount={5}
            listItems={listItems}
            includeSidebar={!isDesktop}
            showMobileLeftbar={!isDesktop}
            leftbarExcludedFromMainIds={leftbarExcludedFromMainIds}
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
            uniListProps={{
                listState: pageRoute?.state,
                mode: layout == 'w-full' ? 'simple' : '',
                storagekey: pageRoute.storageKeyValue,
                useWindowScroll: true,
            }}
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
        : undefined;

    function getLayouts() {
        const layouts = [];

        if (isLeftColumn && leftPanelProps.defaultSize) {
            layouts.push(leftPanelProps.defaultSize);
        }
        if (centerPanelProps.defaultSize)
            layouts.push(centerPanelProps.defaultSize);

        if (isRightColumn && rightPanelProps.defaultSize) {
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

    // `tabIndex` changes on click; `pageRoute.index` when the new tab mounts.
    useLayoutEffect(() => {
        if (typeof window === 'undefined') return
        scrollConductorTabToStart()
        const frame = requestAnimationFrame(() => scrollConductorTabToStart())
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
                            params={{
                                trigger: {
                                    style: 'bordered',
                                    controlSize: 'small',
                                },
                            }}
                        />
                    )
                else {
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

const ConductorMenu = function ConductorMenu({
    routes,
    index,
    t,
    setIndex,
    onChangeRoute,
}) {
    const name = 'cnd-main-menu'

    const useCompactNav = hasConductorSubitems(routes)
    const filteredItems = routes.filter((aItem) => aItem.hideInTop != true)
    const menuClasses = conductorTheme.menu_cnt

    if (!useCompactNav && index >= filteredItems.length) {
        index = 0
    }

    // Web tab click: index + history URL (native does not pushState).
    const onSelect = (item) => {
        setIndex(item.index)
        const rawHref = item.canNavigate === false ? '' : item.link || item.key
        const href = conductorHref(rawHref)
        if (typeof window !== 'undefined') {
            window.history.pushState({}, '', href || `/${item.key}`)
        }
        if (onChangeRoute) {
            onChangeRoute(item)
        }
    }

    const MenuItem = ({ item: a }) => (
        <ConductorTabItem
            item={a}
            selectedIndex={index}
            onPress={onSelect}
        />
    )

    const MenuItemEx = memo(({ item, index: itemIndex }) => {
        const { title, icon, menu_settings, key } = item
        const translatedTitle = (
            <Text className="text-muted-foreground web:hover:text-secondary-foreground leading-6 font-medium text-base">
                {t(title)}
            </Text>
        )
        const addonContent = <Addon item={item} index={itemIndex} />

        const handlePress = () => {
            emitter.emit('dynamic_menu', { action: 'hide' })
            onSelect(item)
        }

        if (icon === '*') {
            return (
                <Pressable
                    className={' ' + menu_settings?.class ?? ''}
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
                className={' ' + menu_settings?.class ?? ''}
                onPress={handlePress}
            >
                <Row className="web:hover:cursor-pointer justify-between flex flex-row h-10 px-3 text-base rounded-xl web:hover:bg-muted items-center ">
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
                <ConductorTabList
                    routes={routes}
                    index={index}
                    onSelect={onSelect}
                    itemWrapperClassName=""
                />
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

export const LeftColumnContainer = ({
    menu,
    routes,
    index,
    setIndex,
    children,
    layoutName,
    stickyColumnStyle,
}) => {
    const { t } = useTranslation();
    const menuSettings = getMenuSettings(menu.object, menu.config, menu)
    const addButtons = <AddMenu menu={menu} filter="hideInSideBar" />
    const title = layoutName == 'profile' ? '' : t(menuSettings?.name)
    const icon = layoutName == 'profile' ? '' : (menuSettings?.icon || menu?.icon)
    const MenuItemSidebar = getComponent('menu-item', 'sidebar');
    const padClass =
        layoutName == 'profile'
            ? 'mt-0.5 sm:m-0 sm:p-3 lg:p-4'
            : appSetting('conductor', 'sidebar_container')

    return (
        <View className="h-full">
            <View
                className={`web:sticky web:overflow-y-auto ${padClass}`}
                style={stickyColumnStyle}
            >
                <View className={layoutName == 'profile' ? '' : appSetting('conductor', 'sidebar_inner_container')}>
                    {(!!title || !!addButtons?.length > 0) && (
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
                                    <ConductorSidebarNav
                                        routes={routes}
                                        index={index}
                                        onSelect={(a) => {
                                            setIndex(a.index)
                                            const href = conductorHref(a.link || a.key)
                                            if (href) window.history.pushState({}, '', href)
                                        }}
                                    />
                                ) : routes
                                    .filter((aItem) => aItem.hideInTop != true)
                                    .map((a) => {
                                        const isActive = a.index === index;
                                        const btn = <MenuItemSidebar addon={getAddon(a.addon)} title={a.title} icon={a.icon || 'Circle'} isActive={isActive} />

                                        if (a?.icon == '*') {
                                            return (
                                                <NeoButtonLink
                                                    href={a.link}
                                                    key={`lmenu-${a.index}`}
                                                    alt={a.title}
                                                    style="borderless"
                                                    controlSize="regular"
                                                    width="fill"
                                                    align="start"
                                                    contentInsets={{ x: 8 }}
                                                    selected={isActive}
                                                    selectedState="pressed"
                                                    className="group"
                                                >
                                                    {btn}
                                                </NeoButtonLink>
                                            )
                                        }
                                        return (
                                            <NeoButtonLink
                                                href={a.key}
                                                key={`lmenu-${a.index}`}
                                                alt={a.title}
                                                style="borderless"
                                                controlSize="regular"
                                                width="fill"
                                                align="start"
                                                contentInsets={{ x: 8 }}
                                                selected={isActive}
                                                selectedState="pressed"
                                                className={`group ${a.ident ? conductorTheme.menu_categ_indent : ''}`.trim()}
                                                onPress={(event) => {
                                                    setIndex(a.index)
                                                    window.history.pushState({}, '', a.key)
                                                    event.preventDefault()
                                                }}
                                            >
                                                {btn}
                                            </NeoButtonLink>
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
    leftbarMenus = [],
    showFilters = false,
    onShowFilters,
}) => {
    const [hideDefaultHeaderFrom, setHideDefaultHeaderFrom] = useState(100);
    const [smallCoverHeight, setSmallCoverHeight] = useState(79);
    const isDesktop = useIsDesktop()
    const pageHeaderHeight = useHeaderHeight()
    const [isScrolled, setIsScrolled] = useState(isCoverDisabled)
    // Keeps the small cover mounted through its exit animation when scrolling back up.
    const [isSmallCoverMounted, setIsSmallCoverMounted] = useState(isCoverDisabled)
    // Measured height of the small cover so it can collapse smoothly on exit (tabs follow).
    const [smallCoverInnerHeight, setSmallCoverInnerHeight] = useState(0)
    const uri = pageData?.uri
    coverTabScroll.collapsed = isScrolled
    const collapseThreshold = hideDefaultHeaderFrom - smallCoverHeight - 10

    const handleScroll = useCallback(() => {
        requestAnimationFrame(() => {
            const next = window.scrollY > collapseThreshold
            if (!next && coverTabScroll.collapsed && coverTabScroll.hold) {
                scrollConductorTabToStart()
                return
            }
            coverTabScroll.collapsed = next
            setIsScrolled(next)
        })
    }, [collapseThreshold])

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

    useLayoutEffect(() => {
        const wrap = document.querySelector('.ns--conductor-wrapper--')
        if (!wrap) return
        wrap.style.minHeight = isScrolled
            ? `calc(100dvh - ${pageHeaderHeight || 0}px + ${hideDefaultHeaderFrom}px)`
            : `calc(100dvh - ${pageHeaderHeight || 0}px)`
    }, [isScrolled, hideDefaultHeaderFrom, pageHeaderHeight])

    useEffect(() => {
        return () => {
            coverTabScroll.hold = false
            coverTabScroll.collapsed = false
        }
    }, [])

    useEffect(() => {
        if (isScrolled) {
            setIsSmallCoverMounted(true)
            return
        }
        // Delay unmount so the exit animation can play before display:none.
        const timer = setTimeout(() => setIsSmallCoverMounted(false), 300)
        return () => clearTimeout(timer)
    }, [isScrolled])

    const onCoverLayout1 = useCallback((e) => {
        setHideDefaultHeaderFrom(e.nativeEvent.layout.height)
    }, [])

    const onCoverLayout2 = useCallback((e) => {
        setSmallCoverHeight(e.nativeEvent.layout.height)
    }, [])

    const onSmallCoverLayout = useCallback((e) => {
        setSmallCoverInnerHeight(e.nativeEvent.layout.height)
    }, [])
    //hideDefaultHeaderFrom
    return (
        <View className={`ns--cover-wrapper-- z-40 ne--`}>
            <View className={`w-full cover-1 ${conductorTheme.cover_base}`}
                style={{
                    // When scrolled, header-fixed (small cover + tab bar) leaves normal flow,
                    // so reserve its full height here: tab bar (smallCoverHeight) plus the
                    // measured small cover (smallCoverInnerHeight) when it's shown. Replaces the
                    // previous hardcoded 56px approximation of the small cover height.
                    marginBottom: !isScrolled ? '0px' : `${(smallCoverHeight + ((isCover && !isHideCover) || !isDesktop ? smallCoverInnerHeight : 0))}px`,
                }}
            >
                
                    
                        {isCover && !isHideCover && (
                            <View className={conductorTheme.cover_content}>
                            <View className={`w-full `} onLayout={onCoverLayout1}>
                                <Cover
                                    key={`cover-${pageData?.ts ?? ''}:${pageData?.cover_block?.cover?.src ?? ''}:${pageData?.cover_block?.profile?.url_avatar ?? ''}`}
                                    data={pageData.cover_block}
                                    mode={headerSettings.cover}
                                    uri={uri}
                                    context={pageData.context}
                                />
                            </View>
                            </View>
                        )}
                  
                
            </View>
            <View
                className={`header-fixed w-full ${conductorTheme.cover_base} ${isScrolled ? 'fixed left-0 right-0 z-40' : ''}`}
                style={isScrolled ? { top: pageHeaderHeight || 0 } : undefined}
            >
                <View className={`${contentWidth} ${conductorTheme.cover_small} ${isScrolled ? 'animate-in fade-in slide-in-from-top-2 duration-300 ease-out' : ''}`}
                    style={{
                        display: isSmallCoverMounted ? 'flex' : 'none',
                   
                        maxHeight: isScrolled ? smallCoverInnerHeight || undefined : 0,
                        opacity: isScrolled ? 1 : 0,
                        transitionProperty: 'max-height, opacity',
                        transitionDuration: '300ms',
                        transitionTimingFunction: 'ease-out',
                    }}
                >
                    <View className="w-full" onLayout={onSmallCoverLayout}>
                        {((isCover && !isHideCover) || !isDesktop) && (
                            <View className="w-full">
                                <CoverSmall
                                    key={`cover-small-${pageData?.ts ?? ''}:${pageData?.cover_block?.cover?.src ?? ''}:${pageData?.cover_block?.profile?.url_avatar ?? ''}`}
                                    context={pageData.context}
                                    data={pageData.cover_block}
                                />
                            </View>
                        )}
                    </View>
                </View>
                <View onLayout={onCoverLayout2}>
                    <TabBar
                        menu={menu}
                        routes={routes}
                        layoutName={layoutName}
                        index={index}
                        setIndex={setIndex}
                        onChangeRoute={onChangeRoute}
                        pageData={pageData}
                        leftbarMenus={leftbarMenus}
                    />
                    <ConductorFiltersButton
                        visible={showFilters}
                        onPress={onShowFilters}
                        className="items-start px-3 lg:px-4 py-2"
                    />
                </View>
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
    leftbarMenus = [],
}) => {
    const { t } = useTranslation()
    const { layoutName: layout } = useLayoutSettings()
    const menuSettings = getMenuSettings(menu.object, menu.config, menu)
    const isDesktop = useIsDesktop()
    const hasLeftbarMenus = !isDesktop && leftbarMenus.length > 0

    if (routes.length > 0) {
        const addButtons = <AddMenu menu={menu} filter="hideInTopBar" />
        const isShowSecondLine = (
            routes.length > 1 ||
            !!pageData.cover_block?.actions_menu ||
            hasLeftbarMenus
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
                        {routes.length > 1 && <ConductorMenu
                            routes={routes}
                            index={index}
                            t={t}
                            setIndex={setIndex}
                            onChangeRoute={onChangeRoute}
                        />}
                    </View>
                    {hasLeftbarMenus && (
                        <Row className="items-center gap-1 shrink-0 pl-1">
                            {leftbarMenus.map((blockItem) => (
                                <LeftbarMenuDropdown
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
}

export const TabSceneHeader = ({ route, setFilterValue, contentWidth }) => {
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
