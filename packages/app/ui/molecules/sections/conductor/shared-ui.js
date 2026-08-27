import { useCallback, useContext, useEffect, useMemo, useRef, useState, memo } from 'react'
import { View, Row, Pressable } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import DropdownMenu, { DropdownMenuOpenContext } from 'app/ui/atoms/dropdown-menu'
import UniList from 'app/ui/atoms/unilist'
import { getComponent } from 'app/components/registry'
import { BlockByName } from 'app/components/block'
import { ItemRenderer } from 'app/components/item-renderer'
import { Button } from 'app/design/controls'
import { useTranslation } from 'react-i18next'
import { appSetting, getPageSettings } from 'app/lib/util'
import { getSkeletonForList } from 'app/lib/skeleton-helpers'
import { layoutForList, paddingForList } from 'app/customization/functions'
import {
    getAddon,
    getDropdownItemsFromLeftbarBlock,
    hasConductorSubitems,
    buildCompactNavEntries,
    buildConductorSubitemsDropdownItems,
    isConductorSubitemsDropdownActive,
    buildConductorSidebarExpandedMap,
    mergeConductorSidebarExpandedMap,
    getConductorRouteChildren,
    getConductorSidebarRootRoutes,
    getConductorDepthClassName,
    conductorHref,
    pageDataWithRestoredFormValues,
    resolveConductorUnitType,
    resolveConductorSkeletonKey,
    getMobileLeftbarItems,
    buildConductorListRows,
    conductorListHasEntries,
} from './helpers'

const conductorTheme = appSetting('theme', 'conductor')

/** Block name for BlockByName: string entry or object from leftbar JSON. */
function resolveLeftbarBlockName(block) {
    if (typeof block === 'string') return block
    return block?.block ?? block?.data?.source ?? null
}

function leftbarBlockKey(block, index) {
    if (typeof block === 'string') return block
    return block?.id ?? block?.data?.id ?? block?.block ?? index
}

/**
 * Shared leftbar / filters block list (native sheet + web sidebar/mobile).
 */
export const ConductorLeftbarBlocks = memo(function ConductorLeftbarBlocks({
    items,
    data,
    onChange,
    onFormSubmit,
    saveOnChanges = false,
    className = 'gap-y-4',
}) {
    if (!items?.length) return null

    return (
        <View className={className}>
            {items.map((block, index) => {
                const name = resolveLeftbarBlockName(block)
                if (!name) return null
                return (
                    <View key={`lb-${leftbarBlockKey(block, index)}`}>
                        <BlockByName
                            name={name}
                            data={data}
                            onChange={onChange}
                            onFormSubmit={onFormSubmit}
                            saveOnChanges={saveOnChanges}
                            sidebar={true}
                        />
                    </View>
                )
            })}
        </View>
    )
})

/**
 * Web-style helper: leftbar from route (+ optional restore of filter form values).
 * Same return shape as the old LeftBarContent() function.
 */
export function conductorLeftbarContent(
    route,
    onChange,
    itemsOverride,
    {
        restoreFormValues = false,
        className = 'gap-y-4',
        onFormSubmit,
        saveOnChanges = false,
    } = {}
) {
    const items = itemsOverride ?? route?.leftbar?.content ?? []
    if (!items.length) return null

    const pageData = restoreFormValues
        ? pageDataWithRestoredFormValues(
              route?.pageData,
              route?.endpoint?.filterFormValues
          )
        : route?.pageData

    return (
        <ConductorLeftbarBlocks
            items={items}
            data={pageData}
            onChange={onChange}
            onFormSubmit={onFormSubmit}
            saveOnChanges={saveOnChanges}
            className={className}
        />
    )
}

/** Filter form above the conductor list (native header + web sibling). */
export function ConductorListForm({ route, onChange }) {
    const Form = getComponent('element', 'form')
    const formProps = route?.endpoint?.filters
    if (!formProps) return null
    const formUrl = route?.link || route?.pageData?.url
    return (
        <View className="w-full">
            <Form
                {...formProps}
                key={formUrl ? `form-${formUrl}` : 'form'}
                name={formProps.name}
                url={formUrl}
                onChange={onChange}
            />
        </View>
    )
}

/** Open the shared Filters bottom sheet (platform snapPoints / modal differ). */
export function openConductorFiltersSheet(
    setBottomSheetData,
    { t, content, snapPoints, modal = false }
) {
    setBottomSheetData({
        title: t('Filters'),
        content,
        showClose: true,
        snapPoints,
        ...(modal ? { modal: true } : {}),
    })
}

/** Filters trigger under the tab bar (native / mobile web). */
export function ConductorFiltersButton({
    onPress,
    visible = true,
    className = 'items-start px-3 py-2',
}) {
    const { t } = useTranslation()
    if (!visible) return null
    return (
        <View className={className}>
            <Button
                title={t('Filters')}
                variant="default"
                size="sm"
                rounded
                onPress={onPress}
            />
        </View>
    )
}

export function LeftbarMenuTrigger({ title, icon }) {
    const isOpen = useContext(DropdownMenuOpenContext) ?? false
    return (
        <Row
            className={`items-center h-9 px-2 gap-1 rounded-full shrink-0 web:cursor-pointer ${
                isOpen ? 'bg-muted' : 'web:hover:bg-muted/50'
            }`}
        >
            <Icon icon={icon} size={16} className="text-secondary-foreground shrink-0" />
            <Text className="text-sm font-semibold text-card-foreground whitespace-nowrap">
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

export function LeftbarMenuDropdown({ blockItem, t }) {
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
                      * the `setHeader` effect in conductor.web.js), and from
                      * `hide_top_menu_from` (xl) up this whole bar is hidden and the
                      * left sidebar carries the title — so `hidden lg:flex` alone lands
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

export function Addon({ item, index }) {
    let addonContent = null
    const settings = getPageSettings(item?.config, item?.key)
    let icon = !item.ident
        ? settings?.icon
            ? settings?.icon
            : String(item?.icon || '').replace('*', '')
        : String(item?.icon || '').replace('*', '')

    const addon = getAddon(item?.addon)
    if (addon) {
        const addonClasses = addon.variant === 'primary' ? 'bg-destructive' : 'bg-secondary'
        const addonText = addon.variant === 'primary' ? addon.text : addon
        if (addonText) {
            addonContent = (
                <Text className={`${addonClasses} rounded-full px-2 py-0.5  text-center items-center text-white text-xs font-semibold`}>
                    {addonText}
                </Text>
            )
        }
    }
    return addonContent
}

function ConductorSubitemsTrigger({ title, icon, isActive }) {
    const isOpen = useContext(DropdownMenuOpenContext) ?? false
    const showIcon = Boolean(icon) && icon !== 'Circle'
    return (
        <Row
            className={`items-center h-9 px-2 gap-1 rounded-full shrink-0 ${
                isOpen || isActive ? 'bg-muted' : ''
            }`}
        >
            {showIcon ? (
                <Icon
                    icon={icon}
                    size={16}
                    className="text-secondary-foreground shrink-0"
                />
            ) : null}
            <Text
                numberOfLines={1}
                className="text-sm font-semibold text-card-foreground max-w-40"
            >
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

function ConductorSubitemsDropdown({ route, routes, selectedIndex, onSelect, t }) {
    const items = buildConductorSubitemsDropdownItems(route, routes, selectedIndex)
    const isActive = isConductorSubitemsDropdownActive(route, routes, selectedIndex)

    if (!items.length) return null

    return (
        <DropdownMenu
            items={items}
            title={t(route.title)}
            triggerAccessibilityLabel={t(route.title)}
            onSelect={(item) => {
                const next = item?.route || routes[item?.routeIndex]
                if (next) onSelect(next)
            }}
        >
            <ConductorSubitemsTrigger
                title={t(route.title)}
                icon={route.icon}
                isActive={isActive}
            />
        </DropdownMenu>
    )
}

/**
 * One top-tab pill. Click policy stays outside (`onPress(item, event)`).
 */
export function ConductorTabItem({ item, selectedIndex, onPress }) {
    const MenuItemSubmenu = getComponent('menu-item', 'submenu')

    if (item?.item?.id === 'hidden') return null

    const rawHref = item.canNavigate === false ? '' : item.link || item.key
    const href = conductorHref(rawHref)

    const handlePress = (event) => {
        event?.preventDefault?.()
        onPress?.(item, event)
    }

    if (item.icon === '*') {
        return (
            <View className={`${item?.menu_settings?.class || ''}`}>
                <Pressable
                    accessibilityRole="link"
                    accessibilityLabel={item.title}
                    onPress={handlePress}
                >
                    <Text className="text-base font-medium text-card-foreground">
                        {item.title}
                    </Text>
                </Pressable>
            </View>
        )
    }

    return (
        <View className={`${item?.menu_settings?.class || ''}`}>
            <MenuItemSubmenu
                title={item.title}
                pressed={item.index == selectedIndex}
                disabled={item?.item?.disabled}
                addon={getAddon(item.addon)}
                href={href}
                onPress={handlePress}
                item={item}
            />
        </View>
    )
}

/**
 * Flat or compact top-tab list. Does not own URL / history — caller passes onSelect.
 *
 * @param {string} [itemWrapperClassName] — native uses flex-none wrapper; web often ''
 */
export function ConductorTabList({
    routes,
    index,
    onSelect,
    itemWrapperClassName = 'flex-none items-center justify-center',
}) {
    const useCompactNav = hasConductorSubitems(routes)
    const visibleRoutes = routes.filter((item) => item.hideInTop != true)

    const renderPill = (item) => (
        <ConductorTabItem
            item={item}
            selectedIndex={index}
            onPress={onSelect}
        />
    )

    if (useCompactNav) {
        return (
            <ConductorCompactNav
                routes={routes}
                index={index}
                onSelect={onSelect}
                renderPill={renderPill}
            />
        )
    }

    if (!visibleRoutes.length) return null

    return visibleRoutes.map((item) => (
        <View
            key={`tab-${item.index}`}
            className={itemWrapperClassName || undefined}
        >
            <ConductorTabItem
                item={item}
                selectedIndex={index}
                onPress={onSelect}
            />
        </View>
    ))
}

export function ConductorCompactNav({ routes, index, onSelect, renderPill }) {
    const { t } = useTranslation()
    if (!hasConductorSubitems(routes)) return null

    const entries = buildCompactNavEntries(routes, index)
    if (!entries.length) return null

    return (
        <Row className="items-center gap-2 shrink-0">
            {entries.map((entry) => {
                if (entry.type === 'dropdown') {
                    return (
                        <ConductorSubitemsDropdown
                            key={`dd-${entry.route.index}`}
                            route={entry.route}
                            routes={routes}
                            selectedIndex={index}
                            onSelect={onSelect}
                            t={t}
                        />
                    )
                }
                return (
                    <View
                        key={`pill-${entry.route.index}`}
                        className="flex-none items-center justify-center"
                    >
                        {renderPill(entry.route)}
                    </View>
                )
            })}
        </Row>
    )
}

export function ConductorSidebarNav({ routes, index, onSelect }) {
    const MenuItemSidebarWithWrapper = getComponent('menu-item', 'sidebar_with_wrapper')
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

const EMPTY_LIST_ITEMS = []

/**
 * Shared conductor center-list chrome (native + small web).
 * Query / snackbar / page header stay in the platform shells.
 */
export function useConductorListScene({
    route,
    skeleton,
    unitMode,
    skeletonCount = 1,
    listItems = EMPTY_LIST_ITEMS,
    includeSidebar = false,
    showMobileLeftbar = includeSidebar,
    leftbarExcludedFromMainIds = null,
    onFormChangedValues,
    leftbarClassName = 'gap-y-4',
    isInited = true,
    listReady = true,
    refreshing = false,
    hasNextPage,
    isPending = false,
    isFetching = false,
    preloadWhenEmpty = false,
}) {
    const unitType = useMemo(
        () => resolveConductorUnitType(route),
        [route?.endpoint, route?.blocks]
    )

    const renderItem = useCallback(
        ({ item, index }) => (
            <ItemRenderer
                unitType={unitType}
                unitMode={unitMode}
                route={route}
                item={item}
                index={index}
                unit={item?.unit || route?.endpoint?.unit}
                module={item?.module || route?.endpoint?.module}
            />
        ),
        [route, unitType, unitMode]
    )

    const skeletonKey = useMemo(
        () => resolveConductorSkeletonKey(route, skeleton, unitType),
        [skeleton, route, unitType]
    )

    const layout = layoutForList(route?.endpoint)
    const paddings = paddingForList(route?.endpoint)

    const Preload = useMemo(
        () => getSkeletonForList(skeletonKey, skeletonCount, true, layout, renderItem, paddings),
        [skeletonKey, skeletonCount, layout, renderItem, paddings]
    )

    const feedType = route?.endpoint?.params?.type

    const mobileLeftbarItems = useMemo(() => {
        if (!showMobileLeftbar) return []
        return getMobileLeftbarItems(route?.leftbar?.content, leftbarExcludedFromMainIds)
    }, [showMobileLeftbar, route?.leftbar?.content, leftbarExcludedFromMainIds])

    const rows = useMemo(
        () =>
            buildConductorListRows({
                pageBlocks: route?.data,
                listItems,
                sidebarContent: route?.sidebar?.content,
                includeSidebar,
                feedType,
            }),
        [route?.data, route?.sidebar?.content, listItems, includeSidebar, feedType]
    )

    const leftbar = conductorLeftbarContent(
        route,
        onFormChangedValues,
        mobileLeftbarItems,
        { className: leftbarClassName }
    )
    const hasForm = !!route?.endpoint?.filters
    const chrome = (hasForm || leftbar) ? (
        <>
            <ConductorListForm route={route} onChange={onFormChangedValues} />
            {leftbar}
        </>
    ) : null

    const isEmpty = !conductorListHasEntries(rows)
    const requestUrl = route?.endpoint?.request_url
    const showPreload = preloadWhenEmpty
        ? (!isInited || !!(requestUrl && !listReady && !refreshing && isEmpty))
        : !!(requestUrl && !listReady) || !isInited
    const showNoContent = !!(
        requestUrl &&
        listReady &&
        hasNextPage === false &&
        !isPending &&
        !isFetching &&
        isEmpty
    )

    return {
        unitType,
        layout,
        paddings,
        renderItem,
        skeletonKey,
        Preload,
        rows,
        chrome,
        showPreload,
        showNoContent,
        isEmpty,
        feedType,
    }
}

function ConductorListBody({
    route,
    scene,
    headerInList,
    showListPreload,
    listRef,
    handleEndReached,
    onRefresh,
    refreshing,
    uniListProps = {},
}) {
    const NoContent = getComponent('molecule', 'no_content')
    const {
        ListFooterComponent: footerFromProps,
        ...restUniListProps
    } = uniListProps

    return (
        <>
            {!headerInList ? scene.chrome : null}
            <UniList
                {...restUniListProps}
                ListHeaderComponent={
                    headerInList && scene.chrome ? () => scene.chrome : undefined
                }
                data={scene.rows}
                route={route}
                unit={route?.endpoint?.unit}
                endpoint={route?.endpoint}
                layout={scene.layout}
                renderItem={scene.renderItem}
                preloadComponent={
                    showListPreload && scene.showPreload ? scene.Preload : undefined
                }
                ListFooterComponent={
                    headerInList && scene.showNoContent
                        ? <NoContent endpoint={route?.endpoint} />
                        : (footerFromProps ?? null)
                }
                refer={listRef}
                onEndReached={handleEndReached}
                onRefresh={onRefresh}
                refreshing={refreshing}
            />
            {!headerInList && scene.showNoContent ? (
                <NoContent endpoint={route?.endpoint} />
            ) : null}
        </>
    )
}

/**
 * UniList + form/leftbar/empty. Native: header in list + preloadComponent.
 * Web: chrome as siblings, window-scroll via uniListProps; optional reveal fade.
 */
export function ConductorListScene({
    route,
    headerInList = false,
    showListPreload = false,
    enableRevealFade = false,
    listRef,
    handleEndReached,
    onRefresh,
    refreshing,
    uniListProps = {},
    afterList,
    ...sceneProps
}) {
    const scene = useConductorListScene({
        route,
        refreshing,
        ...sceneProps,
    })

    const [showContent, setShowContent] = useState(!scene.showPreload)
    const revealTimerRef = useRef(null)

    useEffect(() => {
        if (!enableRevealFade) return undefined
        if (revealTimerRef.current) {
            clearTimeout(revealTimerRef.current)
        }
        if (scene.showPreload) {
            setShowContent(false)
            return undefined
        }
        revealTimerRef.current = setTimeout(() => {
            setShowContent(true)
        }, 140)
        return () => {
            if (revealTimerRef.current) {
                clearTimeout(revealTimerRef.current)
            }
        }
    }, [enableRevealFade, scene.showPreload, route?.key])

    const body = (
        <>
            <ConductorListBody
                route={route}
                scene={scene}
                headerInList={headerInList}
                showListPreload={showListPreload}
                listRef={listRef}
                handleEndReached={handleEndReached}
                onRefresh={onRefresh}
                refreshing={refreshing}
                uniListProps={uniListProps}
            />
            {typeof afterList === 'function' ? afterList(scene) : afterList}
        </>
    )

    if (!enableRevealFade) {
        return body
    }

    return (
        <View className="relative">
            <View
                className={`transition-opacity duration-500 ease-out ${showContent ? 'opacity-100' : 'opacity-0 pointer-events-none'} ${!showContent ? 'absolute inset-x-0 top-0 h-0 overflow-hidden' : ''}`}
            >
                {body}
            </View>
            {!showContent ? (
                <View className="pointer-events-none transition-opacity duration-500 ease-out opacity-100">
                    {scene.Preload}
                </View>
            ) : null}
        </View>
    )
}
