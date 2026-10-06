import { useCallback, useState, useEffect, useLayoutEffect, useRef, useMemo, memo, createContext, useContext } from 'react'
import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'
import { Icon } from 'app/ui/atoms/icon'
import {
    appSetting,
    getMenuSettings,
    menuItemsFilter,
} from 'app/lib/util'
import { usePref, setPref, usePrefsStore } from 'app/context/prefs'
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
    getConductorLayoutCols,
    getConductorColumnsConfig,
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
import { NeoButton, NeoButtonLink } from 'app/design/controls'
import Link from 'app/ui/atoms/link'
import { getSkeletonForList } from 'app/lib/skeleton-helpers'
import { useTranslation } from 'react-i18next'
import { useCurrentUser } from 'app/context/user'
import Search from 'app/ui/molecules/sections/search'
import DynamicMenu from 'app/components/nav/menu-dynamic'
import { layoutForList } from 'app/customization/functions'
import FormModal, { handleFormModal } from 'app/ui/molecules/dialogs/form-modal'
import emitter, { EVENTS } from 'app/context/emitter'
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

/*
 * ============================================================================
 * Web presentation layer for the Conductor. Wired from `index.web.js`; nothing
 * here owns routes or list state.
 *
 * Roughly top to bottom on screen:
 *   HeaderContainer  cover + tab bar, sticky at the top
 *     └ TopSidebar   the bar itself (title, tabs, add buttons)
 *       └ TabBar → TabMenu → TabList/CompactNav  (shared-ui)
 *   TabSceneHeader   optional page title / counter
 *   TabSceneColumns  resizable left / center / right panels
 *     ├ LeftColumnContainer   nav + filter blocks
 *     ├ TabScene              the list (owns its own query)
 *     └ RightColumnContainer  sidebar blocks
 * ============================================================================
 */

/**
 * Cover collapse state, shared between HeaderContainer (which reports it) and
 * the tab-switch scroll below (which reads it).
 *
 * Module-level on purpose: the two live in different subtrees with no common
 * provider. The trade-off is that a second Conductor on the same page would
 * share it — acceptable today, since the layouts never mount two.
 *
 * `hold` marks the short window right after a tab switch, so the cover does not
 * treat our programmatic scroll as a user gesture and re-expand.
 */
const coverTabScroll = { collapsed: false, hold: false }

/**
 * Put the new tab at the top of the viewport.
 *
 * Expanded cover → plain scroll to 0. Collapsed cover → scroll to just below
 * the sticky header instead, so the cover stays collapsed rather than snapping
 * open and pushing the content down.
 */
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

/**
 * The center list for one tab, including its own TanStack query.
 *
 * Unlike native — where the shell owns the query so pull-to-refresh and sockets
 * can share it — web keeps it here, so an unmounted tab drops its query with it.
 *
 * `deferNewItems` is on: new rows arriving mid-scroll are held back behind a
 * "Show New" snackbar instead of shifting the page under the reader.
 *
 * @param {object}   props
 * @param {object}   props.pageRoute  Active route; `endpoint` drives the query.
 * @param {boolean}  props.isInited   Route has its page JSON (else: skeletons).
 * @param {string}   [props.skeleton] Skeleton override.
 * @param {string}   [props.keyword]  Search term, part of the query key.
 * @param {*}        [props.ts]       Soft-refresh token, part of the query key.
 * @param {number}   [props.timestamp] Mount token, part of the query key.
 * @param {Function} [props.onFormChangedValues] Filter form change handler.
 * @param {Set|null} [props.leftColumnExcludedFromMainIds] Blocks already shown
 *        in the left column, so the list must not repeat them.
 * @param {boolean}  [props.fillViewport=false]  Pin the scene to the parent
 *        height and skip window-scroll UniList (tasks-home).
 * @param {boolean}  [props.isLeftColumnShown]  Left panel is on screen; when
 *        not, its blocks render above the list. Defaults to desktop.
 * @param {boolean}  [props.isRightColumnShown] Right panel is on screen; when
 *        not, its blocks are appended to the list. Defaults to desktop.
 */
export const TabScene = ({
    pageRoute,
    isInited,
    skeleton,
    keyword,
    ts,
    timestamp,
    onFormChangedValues,
    leftColumnExcludedFromMainIds = null,
    fillViewport = false,
    isLeftColumnShown,
    isRightColumnShown,
}) => {
    const isDesktop = useIsDesktop()
    const showLeftColumnInList = !(isLeftColumnShown ?? isDesktop)
    const showSidebarInList = !(isRightColumnShown ?? isDesktop)
    const uniRef = useRef()
    const { t } = useTranslation()
    const layout = layoutForList(pageRoute?.endpoint)

    const qKey = useMemo(
        () => conductorListQueryKey({
            requestUrl: pageRoute?.endpoint?.request_url,
            tabId: pageRoute?.link,
            keyword,
            params: pageRoute?.endpoint?.params ?? null,
            ts,
            timestamp,
        }),
        [
            pageRoute?.endpoint?.request_url,
            pageRoute?.link,
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

    /**
     * Rendered below the list: the "more is coming" skeletons for infinite
     * scroll, plus the deferred-new-rows snackbar. `scene` comes from
     * `useListScene`, so the skeletons match the real rows exactly.
     */
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
        storagekey: pageRoute?.storageKeyValue,
        // Viewport-locked pages (tasks-home) own their own scroller; skip
        // Virtuoso so the single page block can fill and scroll internally.
        useWindowScroll: !fillViewport,
        no_scroll: fillViewport,
    }), [pageRoute?.state, layout, pageRoute?.storageKeyValue, fillViewport])

    const scene = (
        <ListScene
            route={pageRoute}
            skeleton={skeleton}
            skeletonCount={5}
            listItems={listItems}
            includeSidebar={showSidebarInList}
            showMobileLeftColumn={showLeftColumnInList}
            leftColumnExcludedFromMainIds={leftColumnExcludedFromMainIds}
            onFormChangedValues={onFormChangedValues}
            // Same bottom spacing as the list rows below (see item-renderer).
            leftColumnClassName="gap-y-4 mb-0.5 sm:mb-3 lg:mb-4"
            isInited={isInited}
            listReady={listReady}
            refreshing={isRefetching}
            hasNextPage={hasNextPage}
            isPending={isPending}
            isFetching={isFetching}
            showListPreload
            listRef={uniRef}
            handleEndReached={handleEndReached}
            onRefresh={refetch}
            afterList={afterList}
            uniListProps={uniListProps}
        />
    )

    if (!fillViewport) return scene
    return <View className="h-full min-h-0">{scene}</View>
};

/**
 * The three-column frame: left nav / center list / right sidebar, as resizable
 * panels. Which columns exist is decided by the caller (it passes `null` for
 * the ones it does not want); this component only lays them out.
 *
 * Sizes come from UNA settings under `layouts` — keyed by page uri first, then
 * by the column combination (`cols-l-c-r`, `cols-c-r`, …), with per-breakpoint
 * overrides. When the config is `sizable`, the user's own drag is stored in
 * local storage and wins over the default on the next visit.
 *
 * @param {object}   props
 * @param {object}   props.pageRoute   Route the columns render from.
 * @param {string}   props.layoutName  Drives the center column's padding.
 * @param {number}   props.tabIndex    Active tab; changing it scrolls to top.
 * @param {node}     [props.leftColumn]
 * @param {node}     [props.rightColumn]
 * @param {node}     props.children    The center column (TabScene).
 * @param {boolean}  [props.fillViewport=false]  Stretch columns to the parent
 *        height so the center list can scroll internally (tasks-home).
 */
export const TabSceneColumns = ({
    pageRoute,
    layoutName,
    tabIndex,
    leftColumn,
    rightColumn,
    children,
    fillViewport = false,
}) => {
    const pageData = pageRoute?.pageData

    const currentBreakpointName = useBreakpointName()

    const isRightColumn = !!rightColumn
    const isLeftColumn = !!leftColumn

    const groupRef = useRef(null)

    const layoutCols = getConductorLayoutCols(isLeftColumn, isRightColumn)

    // A page can override the column sizes for itself; otherwise fall back to
    // the generic config for this column combination.
    const cellsCustomConfig = useMemo(
        () => getConductorColumnsConfig(pageRoute?.pageData?.uri, layoutCols),
        [pageRoute?.pageData?.uri, layoutCols]
    )


    /** Identity of this arrangement: remounts the group when the shape changes. */
    const panelLayoutKey = `${layoutCols}-${pageData?.menu?.object || pageData?.uri || 'default'}`

    // Each cell config splits into: `breakpoint` (below it the column is hidden),
    // `responsive` (per-breakpoint overrides) and the base panel props.
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

    /** Storage id for the user's dragged sizes; undefined when not resizable. */
    const asId = cellsCustomConfig.sizable
        ? `cells-${panelLayoutKey}`
        : undefined

    /** Configured sizes, in panel order; null when the config sets none. */
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

    /**
     * User dragged a handle: remember the sizes (per breakpoint) unless they
     * are just the defaults, and let width-aware children re-measure.
     */
    const panelSizes = usePref('panelSizes')
    const panelSizesKey = asId + '-' + currentBreakpointName
    const onLayout = useCallback((sizes) => {
        if (
            JSON.stringify(sizes) != JSON.stringify(defaultLayouts) &&
            asId &&
            defaultLayouts
        ) {
            // Read the latest map from the store (not the render closure) to avoid clobbering other keys.
            setPref('panelSizes', { ...usePrefsStore.getState().persisted.panelSizes, [panelSizesKey]: sizes })
        }
        setTimeout(() => window.dispatchEvent(new Event('resize_panel')), 100)
    }, [asId, panelSizesKey, defaultLayouts])

    // Apply stored sizes (or the defaults) whenever the arrangement changes or
    // the stored preference hydrates.
    const storedSizes = panelSizes[panelSizesKey]
    useEffect(() => {
        const next = storedSizes || defaultLayouts
        if (next) groupRef.current?.setLayout(next)
    }, [storedSizes, defaultLayouts, pageRoute])

    // Scroll the new tab into view. Runs twice — synchronously and on the next
    // frame — because the list height is not final until it has painted.
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
            className={fillViewport ? 'h-full min-h-0' : 'h-full'}
            // Default panel-group overflow:hidden creates a scrollport and breaks
            // window-scroll sticky. clip still contains resize overflow without that.
            // Viewport-locked pages need a real hidden overflow so the list, not
            // the document, is the scroller.
            style={{ overflow: fillViewport ? 'hidden' : 'clip' }}
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
            <Panel {...centerPanelProps} className={fillViewport ? 'h-full min-h-0' : undefined}>
                <View
                    className={`${isRightColumn ? 'flex-auto' : 'w-full mx-auto'
                        } ${layoutName !== 'navigator'
                            ? 'mt-0.5 sm:m-0 sm:p-3 lg:p-4'
                            : (!pageRoute?.endpoint?.request_url ? 'sm:p-4 ' : '')
                        }${fillViewport ? ' h-full min-h-0 overflow-hidden' : ''}`}
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



/*
 * ============================================================================
 * "Add" buttons — the create / search actions next to the tab bar or in the
 * left column, e.g. "+ Post", "Search" on a module's browse page.
 * ============================================================================
 */

/**
 * Action buttons for a module menu.
 *
 * Configured list first (`menuSettings.add`, minus the ones flagged by
 * `filter` — 'hideInTopBar' / 'hideInSideBar'). When nothing is configured,
 * fall back to the module's own `add_url` ("Add") and a section search.
 *
 * @param {object} menu        UNA menu JSON.
 * @param {string} filter      Flag name that hides an item at this placement.
 * @param {object} currentUser Guests never get an "Add".
 */
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

/**
 * Renders `getAddMenuItems` as buttons. Three kinds:
 * - `section` set → an inline Search trigger
 * - "Add" → opens the create form in a modal (one FormModal for all buttons)
 * - anything else with a link → plain navigation
 */
const AddMenu = ({ menu, filter }) => {
    // false = closed, 'loading' while the form JSON is fetched, then the form.
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

/*
 * ============================================================================
 * Top tab bar. Two render modes, picked by `conductorTheme.menu_is_dynamic`:
 *   static  → TabList (shared-ui) — all pills inline, horizontally scrollable
 *   dynamic → DynamicMenu — pills that fit stay inline, the rest collapse into
 *             a "▾" overflow dropdown as the viewport narrows
 *
 * DynamicMenu renders its items through the three `*Ex` components below and
 * does not pass props through, hence TabMenuContext.
 * ============================================================================
 */

/** `{ selectedIndex, onSelect }` for the DynamicMenu item components. */
const TabMenuContext = createContext(null)

/** Inline pill inside DynamicMenu. */
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

/** Row inside the "▾" overflow dropdown; closes the dropdown on select. */
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
        emitter.emit(EVENTS.dynamicMenu, { action: 'hide' })
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

/** The "▾" trigger; shown pressed when the selected tab is hidden in overflow. */
const TabMenuButtonEx = memo(function TabMenuButtonEx({ visibleItemsCount }) {
    const { selectedIndex } = useContext(TabMenuContext)
    return (
        <View className="pr-3">
            <NeoButton
                style="borderless"
                controlSize="small"
                borderShape="circle"
                image="ChevronDown"
                interactive
                selected={visibleItemsCount <= selectedIndex}
            />
        </View>
    )
})

/**
 * The tab pills. This is the one place on web where a tab click turns into a
 * URL: `onSelect` does the `pushState`, the shell only learns about it through
 * `setIndex` / `onChangeRoute`.
 */
const TabMenu = function TabMenu({
    routes,
    index,
    setIndex,
    onChangeRoute,
}) {
    const { t } = useTranslation()
    const name = 'cnd-main-menu'
    const useCompactNav = hasConductorSubitems(routes)
    const filteredItems = routes.filter((aItem) => aItem.hideInTop != true)
    const menuClasses = conductorTheme.menu_cnt
    // A hidden tab may be selected (deep link); the flat bar then shows none pressed.
    const selectedIndex = !useCompactNav && index >= filteredItems.length ? 0 : index

    /** Switch tab + update the address bar without a navigation. */
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
                <View className="w-full min-w-0 overflow-x-auto web:scrollbar-none">
                    <View className={menuClasses}>
                        <TabList
                            routes={routes}
                            index={selectedIndex}
                            onSelect={onSelect}
                            itemWrapperClassName=""
                        />
                    </View>
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
                    triggerAccessibilityLabel={t('More options')}
                    triggerClassName="u-neo-btn-link hit-area-4"
                />
            )}
        </TabMenuContext.Provider>
    )
}

/*
 * ============================================================================
 * Left column (navigator layout): the section tree.
 * ============================================================================
 */

/**
 * Collapsible tree of routes for menus that have sub-items.
 *
 * A parent without its own link toggles open/closed; one with a link navigates.
 * Ancestors of the selected tab are always expanded, so a deep link opens the
 * tree to the right place — the user can still collapse the rest.
 *
 * @param {object}   props
 * @param {array}    props.routes   Flat route list (tree is in `childIndices`).
 * @param {number}   props.index    Selected route index.
 * @param {Function} props.onSelect Called with the route; caller does the URL.
 */
export function SidebarNav({ routes, index, onSelect }) {
    const MenuItemSidebarWithWrapper = registeredComponent('menu-item', 'sidebar_with_wrapper')
    // Which parents are open, keyed by route index.
    const [expandedMap, setExpandedMap] = useState(() => (
        buildConductorSidebarExpandedMap(routes, index)
    ))

    // Selection moved: make sure its ancestors are open (never closes anything).
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

/**
 * One flat sidebar link (menus without sub-items).
 *
 * `icon: '*'` is UNA's marker for an external / full-page link: it renders as
 * a real anchor and is *not* intercepted, so the page actually navigates.
 * Everything else switches the tab in place and only pushes the URL.
 */
function NavigatorMenuLink({ item, index, setIndex }) {
    const MenuItemSidebar = registeredComponent('menu-item', 'sidebar')
    const isActive = item.index === index
    const isStar = item?.icon == '*'
    const href = isStar ? item.link : conductorHref(item.key || item.link)
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
            href={href || item.key}
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
                        if (href) window.history.pushState({}, '', href)
                        event.preventDefault()
                    }
            }
        >
            {btn}
        </NeoButtonLink>
    )
}

/**
 * Sticky left column. From top: section title + "Add" buttons (navigator
 * only), the section nav (navigator only, tree or flat), then whatever the
 * caller passes as `children` — normally the page's own left-column blocks.
 *
 * Profile layout uses it purely as a padded container for the blocks.
 *
 * @param {object}   props
 * @param {object}   props.menu       UNA menu JSON (title, icon, add buttons).
 * @param {array}    props.routes
 * @param {number}   props.index
 * @param {Function} props.setIndex
 * @param {node}     props.children   Left-column blocks.
 * @param {string}   props.layoutName
 * @param {object}   props.stickyColumnStyle  From `stickySidebarStyle`.
 */
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
    // Profile has its name in the cover already — no title row here.
    const title = layoutName == 'profile' ? '' : t(menuSettings?.name)
    const icon = layoutName == 'profile' ? '' : (menuSettings?.icon || menu?.icon)
    const padClass =
        layoutName == 'profile'
            ? 'mt-0.5 sm:m-0 sm:p-3 lg:p-4'
            : appSetting('conductor', 'sidebar_container')

    /** Tree nav select: switch tab + push URL (same policy as TabMenu). */
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
                     {((!!title || addMenuItems.length > 0) && layoutName != 'profile') && (
                        <Row className={appSetting('conductor', 'sidebar_title')}>
                            <Row className="items-center mr-auto min-w-0 hidden lg:flex gap-2">
                                {!!icon && (
                                    <View className="h-8 w-8 items-center justify-center flex">
                                    <Icon
                                        icon={icon}
                                        size={29}
                                        className="text-card-foreground shrink-0"
                                    /></View>
                                )}
                                <Text className="text-xl  tracking-tight truncate font-bold leading-9 text-card-foreground">
                                    {t(title)}
                                </Text>
                            </Row>
                            <Row>{addButtons}</Row>
                        </Row>
                    )}
                    <View className="flex-1 gap-4">
                        {layoutName == 'navigator' && routes.length > 1 && (
                            <View className=' gap-0.5 -mx-1 -mb-1'>
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

/**
 * Sticky right column: the tab's sidebar blocks (`route.sidebar.content`,
 * rendered as sidebar items) plus an optional `browse_sidebar` block —
 * a secondary browse list, e.g. "People you may know".
 */
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
                    {!!route?.pageData && (
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

/*
 * ============================================================================
 * Top chrome: cover + tab bar.
 * ============================================================================
 */

/**
 * The sticky top of a conductor page.
 *
 * With profile cover data it is a `CoverMorph` — full cover that collapses
 * into a compact bar on scroll, with the tab bar inside. Without, it is a
 * plain sticky bar with the same tab bar.
 *
 * @param {object}   props
 * @param {object}   props.pageData         UNA page JSON (`cover_block`, `context`, `uri`).
 * @param {object}   props.headerSettings   Per-tab header config (`cover` mode).
 * @param {boolean}  props.isCover          Page has a cover and mode is not 'none'.
 * @param {boolean}  props.isHideCover      Own profile on desktop → collapse cover.
 * @param {boolean}  props.isCoverDisabled  Page asked for no cover image.
 * @param {string}   props.contentWidth     Tailwind max-width class.
 * @param {object}   props.menu
 * @param {array}    props.routes
 * @param {string}   props.layoutName
 * @param {number}   props.index
 * @param {Function} props.setIndex
 * @param {Function} [props.onChangeRoute]
 * @param {array}    [props.leftColumnMenus] Left-column blocks shown as dropdowns.
 * @param {boolean}  [props.showFilters]     Render the "Filters" button.
 * @param {Function} [props.onShowFilters]
 */
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
    // Mobile profile hides the page header (`header: false`); pin morph chrome
    // at the viewport top, not at the leftover DEFAULT_HEADER_HEIGHT (64).
    const stickyTop =
        !isDesktop && layoutName === 'profile' ? 0 : (pageHeaderHeight || 0)
    // Remounts the morph when the cover image or avatar changes; a plain data
    // refresh with the same images keeps the collapse state.
    const coverKey = `${pageData?.ts ?? ''}:${pageData?.cover_block?.cover?.src ?? ''}:${pageData?.cover_block?.profile?.url_avatar ?? ''}`

    const hasCoverData = !!pageData?.cover_block?.profile
    const useMorph = hasCoverData && (!isHideCover || !isDesktop)

    // Report collapse state for the tab-switch scroll (see coverTabScroll).
    const onMorphProgress = useCallback((progress) => {
        coverTabScroll.collapsed = progress >= 0.999
    }, [])

    // Leaving the page must not leak a "collapsed" flag into the next one.
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
                contentWidth={contentWidth}
            />
            <FiltersButton
                visible={showFilters}
                onPress={onShowFilters}
                className="items-start px-3 lg:px-4 py-2"
            />
        </>
    )

    if (useMorph) {
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

    return (
        <View className={`ns--cover-wrapper-- z-40 ne--`}>
            <View className={`header-fixed w-full `}>
                {tabBarContent}
            </View>
        </View>
    )
}

/**
 * The bar frame around the tabs: optional section title on the left, `children`
 * (the tabs) in the middle, "Add" buttons on the right.
 *
 * On non-profile pages it hides itself from `hide_top_menu_from` (xl) up —
 * at that width the left column takes over both the nav and the title.
 * Wired from HeaderContainer in this file; page header lives in index.web.js.
 */
export function TopSidebar({
    styles,
    addButtons,
    children,
    title,
    icon,
    layout,
    layoutName,
    omitDefaultBackground = false,
    contentWidth,
}) {
    const isHideOnDesktop = layoutName !== 'profile'
    const widthClass = contentWidth || appSetting('layout', 'page_content_width_default')
    return (
        <View
            style={styles}
            className={`${!omitDefaultBackground ? conductorTheme.menu : ''} ${isHideOnDesktop ? conductorTheme.hide_top_menu_from + ':hidden' : ''
                }`}
        >
            <View
                className={`${isHideOnDesktop ? '' : 'mx-auto'} ${widthClass} mx-auto`}
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
                            <Row className="hidden lg:flex items-center gap-2 shrink-0 min-w-0 pl-3 lg:pl-4">
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
                        <Row className={`hidden ${conductorTheme.hide_top_menu_from}:flex cond-buttons-add px-3 lg:px-4`}>
                            {addButtons}
                        </Row>
                    )}
            </View>
        </View>
    )
}

/**
 * Everything in the tab row: the pills (`TabMenu`), left-column dropdowns
 * (mobile only — desktop shows them in the column itself) and, when the cover
 * does not own them, the profile action buttons.
 *
 * Renders an empty frame when there is only one tab and nothing else to show.
 */
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
    contentWidth,
}) => {
    const { t } = useTranslation()
    const { layoutName: layout } = useLayoutSettings()
    const menuSettings = getMenuSettings(menu.object, menu.config, menu)
    const isDesktop = useIsDesktop()
    const hasLeftColumnMenus = !isDesktop && leftColumnMenus.length > 0

    if (!routes.length) return null

    const addButtons = <AddMenu menu={menu} filter="hideInTopBar" />
    // Profile actions ("Follow", "…") normally sit on the cover. With no cover
    // (`none`) — or when config asks for it — they move into the tab row.
    const profileModule =
        pageData?.cover_block?.profile?.module || pageData?.module
    const coverMode = appSetting('cover', 'view_by_module', profileModule)
    const showActionsInTabBar =
        isDesktop &&
        (coverMode === 'none' ||
            !!appSetting('cover', 'more_menu_in_navbar', profileModule))
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
            contentWidth={contentWidth}
        >
             {isShowSecondLine && <Row className="px-0 w-full items-center">
                <View className="flex-1 min-h-13 lg:min-h-14 min-w-0">
                    {routes.length > 1 && <TabMenu
                        routes={routes}
                        index={index}
                        setIndex={setIndex}
                        onChangeRoute={onChangeRoute}
                    />}
                </View>
                    {hasLeftColumnMenus && (
                        <Row className={`items-center gap-1 shrink-0 pl-1${showActionsInTabBar ? '' : ' pr-3 lg:pr-4'}`}>
                            {leftColumnMenus.map((blockItem) => (
                                <LeftColumnMenuDropdown
                                    key={blockItem.id ?? blockItem.block?.name}
                                    blockItem={blockItem}
                                    t={t}
                                />
                            ))}
                        </Row>
                    )}
                    {!!pageData.cover_block?.actions_menu && showActionsInTabBar ? (
                        <Row className={`${conductorTheme.more_menu_container || 'items-center shrink-0 pl-1'} pr-3 lg:pr-4`}>
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
                        </Row>
                    ) : null}
                </Row>}
            </TopSidebar>
        )
}

/**
 * Title strip above the list, between the tab bar and the scene.
 *
 * Two independent, config-driven pieces:
 * - `show_nav_counters` OFF → the tab's counter is not on the pill, so show it
 *   here next to the title ("Friends (12)"). ON → the pill owns it, show nothing.
 * - `show_nav_titles` ON → a large standalone page title.
 *
 * Renders nothing when both are off, which is the default.
 */
export const TabSceneHeader = ({ route, contentWidth }) => {
    const addon = route?.addon
    const counter = appSetting('conductor', 'show_nav_counters')
        ? 0
        : (addon?.text ?? addon ?? 0)
    const isTitle = appSetting('conductor', 'show_nav_titles')
    return (
        <>
            {counter > 0 && (
                <View className="mx-4 mb-0 mt-2">
                    <Text className="text-xl font-bold text-secondary-foreground   ">
                        {route?.title} ({counter})
                    </Text>
                </View>
            )}
            {isTitle && (
                <View
                    className={`${contentWidth} mx-auto pt-3 px-4`}
                >
                    <Text className="text-3xl tracking-tight leading-10 font-bold text-secondary-foreground">
                        {route?.title}
                    </Text>
                </View>
            )}
        </>
    )
}
