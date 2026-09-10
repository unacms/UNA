import { useCallback, useContext, useEffect, useMemo, useRef, useState, memo } from 'react'
import { View, Row, Pressable } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import DropdownMenu, { DropdownMenuOpenContext } from 'app/ui/atoms/dropdown-menu'
import UniList from 'app/ui/atoms/unilist'
import { BlockByName } from 'app/components/block'
import { ItemRenderer } from 'app/components/item-renderer'
import { Button } from 'app/design/controls'
import { useTranslation } from 'react-i18next'
import { getSkeletonForList } from 'app/lib/skeleton-helpers'
import { layoutForList, paddingForList } from 'app/customization/functions'
import {
    getAddon,
    getDropdownItemsFromLeftColumnBlock,
    hasConductorSubitems,
    buildCompactNavEntries,
    buildSubitemsDropdownItems,
    isSubitemsDropdownActive,
    conductorHref,
    pageDataWithRestoredFormValues,
    resolveConductorUnitType,
    resolveConductorSkeletonKey,
    getMobileLeftColumnItems,
    buildConductorListRows,
    conductorListHasEntries,
    registeredComponent,
} from './helpers'

/** Block name for BlockByName: string entry or object from UNA leftbar JSON. */
function resolveLeftColumnBlockName(block) {
    if (typeof block === 'string') return block
    return block?.block ?? block?.data?.source ?? null
}

function leftColumnBlockKey(block, index) {
    if (typeof block === 'string') return block
    return block?.id ?? block?.data?.id ?? block?.block ?? index
}

/**
 * Shared left-column / filters block list (native sheet + web sidebar/mobile).
 * Pass `route` to read UNA `route.leftbar.content`; `items` overrides that list.
 */
export const LeftColumnContent = memo(function LeftColumnContent({
    items: itemsProp,
    route,
    data,
    onChange,
    onFormSubmit,
    saveOnChanges = false,
    restoreFormValues = false,
    className = 'gap-y-4',
}) {
    const items = itemsProp ?? route?.leftbar?.content ?? []
    if (!items.length) return null

    const pageData = restoreFormValues
        ? pageDataWithRestoredFormValues(
              route?.pageData,
              route?.endpoint?.filterFormValues
          )
        : (data ?? route?.pageData)

    return (
        <View className={className}>
            {items.map((block, index) => {
                const name = resolveLeftColumnBlockName(block)
                if (!name) return null
                return (
                    <View key={`lb-${leftColumnBlockKey(block, index)}`}>
                        <BlockByName
                            name={name}
                            data={pageData}
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

/** Filter form above the list (native header + web sibling). */
export function ListForm({ route, onChange }) {
    const Form = registeredComponent('element', 'form')
    const formProps = route?.endpoint?.filters
    if (!Form || !formProps) return null
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
export function openFiltersSheet(
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
export function FiltersButton({
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

function MenuTrigger({ title, icon, isActive = false, compact = false }) {
    const isOpen = useContext(DropdownMenuOpenContext) ?? false
    const showIcon = Boolean(icon) && (!compact || icon !== 'Circle')
    const highlighted = isOpen || isActive
    return (
        <Row
            className={`items-center h-9 px-2 gap-1 rounded-full shrink-0 web:cursor-pointer ${
                highlighted ? 'bg-muted' : 'web:hover:bg-muted/50'
            }`}
        >
            {showIcon ? (
                <Icon icon={icon} size={16} className="text-secondary-foreground shrink-0" />
            ) : null}
            <Text
                numberOfLines={compact ? 1 : undefined}
                className={`text-sm font-semibold text-card-foreground ${
                    compact ? 'max-w-40' : 'whitespace-nowrap'
                }`}
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

export function LeftColumnMenuDropdown({ blockItem, t }) {
    const items = useMemo(
        () => getDropdownItemsFromLeftColumnBlock(blockItem),
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
            <MenuTrigger title={title} icon={icon} />
        </DropdownMenu>
    )
}

export function Addon({ item }) {
    const addon = getAddon(item?.addon)
    if (!addon) return null
    const isPrimary = addon.variant === 'primary'
    const addonText = isPrimary ? addon.text : addon
    if (!addonText) return null
    return (
        <Text className={`${isPrimary ? 'bg-destructive' : 'bg-secondary'} rounded-full px-2 py-0.5  text-center items-center text-white text-xs font-semibold`}>
            {addonText}
        </Text>
    )
}

function SubitemsDropdown({ route, routes, selectedIndex, onSelect, t }) {
    const items = buildSubitemsDropdownItems(route, routes, selectedIndex)
    const isActive = isSubitemsDropdownActive(route, routes, selectedIndex)

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
            <MenuTrigger
                title={t(route.title)}
                icon={route.icon}
                isActive={isActive}
                compact
            />
        </DropdownMenu>
    )
}

/**
 * One top-tab pill. Click policy stays outside (`onPress(item, event)`).
 */
export function TabItem({ item, selectedIndex, onPress }) {
    const MenuItemSubmenu = registeredComponent('menu-item', 'submenu')

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

    if (!MenuItemSubmenu) return null

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

function TabPill({ item, selectedIndex, onPress, className }) {
    return (
        <View className={className || undefined}>
            <TabItem
                item={item}
                selectedIndex={selectedIndex}
                onPress={onPress}
            />
        </View>
    )
}

/**
 * Flat or compact top-tab list. Does not own URL / history — caller passes onSelect.
 *
 * @param {string} [itemWrapperClassName] — native uses flex-none wrapper; web often ''
 */
export function TabList({
    routes,
    index,
    onSelect,
    itemWrapperClassName = 'flex-none items-center justify-center',
}) {
    const useCompactNav = hasConductorSubitems(routes)
    const visibleRoutes = routes.filter((item) => item.hideInTop != true)

    if (useCompactNav) {
        return (
            <CompactNav
                routes={routes}
                index={index}
                onSelect={onSelect}
            />
        )
    }

    if (!visibleRoutes.length) return null

    return visibleRoutes.map((item) => (
        <TabPill
            key={`tab-${item.index}`}
            item={item}
            selectedIndex={index}
            onPress={onSelect}
            className={itemWrapperClassName}
        />
    ))
}

export function CompactNav({ routes, index, onSelect }) {
    const { t } = useTranslation()
    if (!hasConductorSubitems(routes)) return null

    const entries = buildCompactNavEntries(routes, index)
    if (!entries.length) return null

    return (
        <Row className="items-center gap-2 shrink-0">
            {entries.map((entry) => {
                if (entry.type === 'dropdown') {
                    return (
                        <SubitemsDropdown
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
                    <TabPill
                        key={`pill-${entry.route.index}`}
                        item={entry.route}
                        selectedIndex={index}
                        onPress={onSelect}
                        className="flex-none items-center justify-center"
                    />
                )
            })}
        </Row>
    )
}

const EMPTY_LIST_ITEMS = []

/**
 * Shared conductor center-list chrome (native + small web).
 * Query / snackbar / page header stay in the platform shells.
 */
export function useListScene({
    route,
    skeleton,
    unitMode,
    skeletonCount = 1,
    listItems = EMPTY_LIST_ITEMS,
    includeSidebar = false,
    showMobileLeftColumn = includeSidebar,
    leftColumnExcludedFromMainIds = null,
    onFormChangedValues,
    leftColumnClassName = 'gap-y-4',
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

    const mobileLeftColumnItems = useMemo(() => {
        if (!showMobileLeftColumn) return []
        return getMobileLeftColumnItems(route?.leftbar?.content, leftColumnExcludedFromMainIds)
    }, [showMobileLeftColumn, route?.leftbar?.content, leftColumnExcludedFromMainIds])

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

    const hasLeftColumnItems = mobileLeftColumnItems.length > 0
    const hasForm = !!route?.endpoint?.filters
    const chrome = useMemo(() => {
        if (!hasForm && !hasLeftColumnItems) return null
        return (
            <>
                <ListForm route={route} onChange={onFormChangedValues} />
                {hasLeftColumnItems ? (
                    <LeftColumnContent
                        route={route}
                        items={mobileLeftColumnItems}
                        onChange={onFormChangedValues}
                        className={leftColumnClassName}
                    />
                ) : null}
            </>
        )
    }, [
        hasForm,
        hasLeftColumnItems,
        route,
        mobileLeftColumnItems,
        onFormChangedValues,
        leftColumnClassName,
    ])

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

function ListBody({
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
    const NoContent = registeredComponent('molecule', 'no_content')
    const emptyFooter =
        headerInList && scene.showNoContent && NoContent
            ? <NoContent endpoint={route?.endpoint} />
            : (uniListProps.ListFooterComponent ?? null)

    return (
        <>
            {!headerInList ? scene.chrome : null}
            <UniList
                {...uniListProps}
                ListHeaderComponent={headerInList ? scene.chrome : undefined}
                data={scene.rows}
                route={route}
                unit={route?.endpoint?.unit}
                endpoint={route?.endpoint}
                layout={scene.layout}
                renderItem={scene.renderItem}
                preloadComponent={
                    showListPreload && scene.showPreload ? scene.Preload : undefined
                }
                ListFooterComponent={emptyFooter}
                refer={listRef}
                onEndReached={handleEndReached}
                onRefresh={onRefresh}
                refreshing={refreshing}
            />
            {!headerInList && scene.showNoContent && NoContent ? (
                <NoContent endpoint={route?.endpoint} />
            ) : null}
        </>
    )
}

/**
 * UniList + form/left column/empty. Native: header in list; preload keeps
 * that header mounted (skeletons as ListEmptyComponent). Web: chrome as
 * siblings, window-scroll via uniListProps; optional reveal fade.
 */
export function ListScene({
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
    const scene = useListScene({
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
            <ListBody
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
