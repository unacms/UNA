import { useCallback, useContext, useMemo, memo } from 'react'
import { View, Row, Pressable } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import DropdownMenu, { DropdownMenuOpenContext } from 'app/ui/atoms/dropdown-menu'
import UniList from 'app/ui/atoms/unilist'
import { BlockByName } from 'app/components/block'
import { ItemRenderer } from 'app/components/item-renderer'
import { NeoButton } from 'app/design/controls'
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

/*
 * ============================================================================
 * Cross-platform presentation for the Conductor: everything that looks the
 * same on web and native. Platform files (`web-ui.js`, `native-ui.js`) wrap
 * these; nothing here touches routes, the query or the URL.
 *
 *   LeftColumnContent / ListForm / FiltersButton   left-column & filter blocks
 *   MenuTrigger / LeftColumnMenuDropdown           dropdown pills
 *   TabItem / TabList / CompactNav                 the tabs themselves
 *   useListScene / ListScene                       rows + skeletons + UniList
 * ============================================================================
 */

/** Block name for BlockByName: string entry or object from UNA leftbar JSON. */
function resolveLeftColumnBlockName(block) {
    if (typeof block === 'string') return block
    return block?.block ?? block?.data?.source ?? null
}

/** Stable React key for a left-column block; falls back to position. */
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
            <NeoButton
                label={t('Filters')}
                controlSize="small"
                borderShape="capsule"
                onPress={onPress}
            />
        </View>
    )
}

/*
 * ============================================================================
 * Dropdown triggers — the pill with a chevron that opens a DropdownMenu.
 * Used both for left-column menus and for tabs that have sub-items.
 * ============================================================================
 */

/**
 * Pill-shaped dropdown trigger. Highlights while the menu is open (via
 * DropdownMenuOpenContext) or when `isActive` says the selection is inside.
 * `compact` truncates the title and drops the placeholder 'Circle' icon.
 */
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

/**
 * A left-column block flagged `use_as_menu` (categories, sub-navigation),
 * rendered as a dropdown next to the tabs instead of as a block in the column.
 * Items are plain links — selecting one navigates.
 */
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

/*
 * ============================================================================
 * Tabs: single pills, the flat list, and the compact (nested) variant.
 * ============================================================================
 */

/** Counter badge on a tab ("3 new"). Red when the addon is flagged primary. */
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

/**
 * A parent tab with children, shown as a dropdown of its child tabs.
 * Selecting a child switches the tab (via `onSelect`), same as a pill press.
 */
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

/** `TabItem` in a wrapper View; the wrapper class differs per platform. */
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

/**
 * Tab row for nested menus: root tabs without children are pills, root tabs
 * with children become `SubitemsDropdown`s. Children never appear at the top
 * level — they are reachable only through their parent's dropdown.
 */
export function CompactNav({ routes, index, onSelect }) {
    const { t } = useTranslation()
    if (!hasConductorSubitems(routes)) return null

    const entries = buildCompactNavEntries(routes)
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

/*
 * ============================================================================
 * The list scene: rows, skeletons, empty state and the chrome around UniList.
 * Both platforms feed their own list state in and get a configured UniList out.
 * ============================================================================
 */

/** Stable default so a missing `listItems` does not re-run every memo. */
const EMPTY_LIST_ITEMS = []

/**
 * Shared conductor center-list chrome (native + small web).
 * Query / snackbar / page header stay in the platform shells.
 *
 * Turns a route + list state into everything `ListBody` needs to render:
 * - `rows`      page blocks + list items (+ sidebar blocks on phone), in order
 * - `renderItem` ItemRenderer bound to this route's unit / module
 * - `Preload`   skeleton matching the resolved unit type
 * - `chrome`    the filter form and mobile left-column blocks above the rows
 * - `showPreload` / `showNoContent`  the two non-list states
 *
 * @param {object}  opts
 * @param {object}  opts.route          Route whose list this is.
 * @param {string}  [opts.skeleton]     Skeleton override.
 * @param {string}  [opts.unitMode]     Forwarded to ItemRenderer.
 * @param {number}  [opts.skeletonCount=1]
 * @param {array}   [opts.listItems]    Rows from the query.
 * @param {boolean} [opts.includeSidebar=false]  Append sidebar blocks (phone).
 * @param {boolean} [opts.showMobileLeftColumn]  Render left-column blocks above.
 * @param {Set}     [opts.leftColumnExcludedFromMainIds]  Blocks shown elsewhere.
 * @param {Function} [opts.onFormChangedValues]
 * @param {string}  [opts.leftColumnClassName]
 * @param {boolean} [opts.isInited=true]   Route has its page JSON.
 * @param {boolean} [opts.listReady=true]  Query settled at least once.
 * @param {boolean} [opts.refreshing=false]
 * @param {boolean} [opts.hasNextPage]
 * @param {boolean} [opts.isPending=false]
 * @param {boolean} [opts.isFetching=false]
 * @param {boolean} [opts.preloadWhenEmpty=false]  Native: keep skeletons until
 *        the first rows land, even when `listReady` is already true.
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

    // Unit rows get primitives only: when the `route` object is rebuilt (tab
    // hydration, soft refresh, filters) the memoized ItemRenderer skips every
    // visible post. Page blocks do read the route, so they still update.
    const routeIndex = route?.index
    const endpointUnit = route?.endpoint?.unit
    const endpointModule = route?.endpoint?.module
    const renderItem = useCallback(
        ({ item }) => (
            item?.type === 'block' ? (
                <ItemRenderer route={route} item={item} />
            ) : (
                <ItemRenderer
                    unitType={unitType}
                    unitMode={unitMode}
                    routeIndex={routeIndex}
                    item={item}
                    unit={item?.unit || endpointUnit}
                    module={item?.module || endpointModule}
                />
            )
        ),
        [route, routeIndex, endpointUnit, endpointModule, unitType, unitMode]
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

    // "Empty" means no feed/profile rows — page blocks alone do not count.
    const isEmpty = !conductorListHasEntries(rows)
    const requestUrl = route?.endpoint?.request_url
    // Skeletons: always while the route has no page JSON; otherwise until the
    // query settles (and, with preloadWhenEmpty, until it actually has rows —
    // but never during a pull-to-refresh, that has its own spinner).
    const showPreload = preloadWhenEmpty
        ? (!isInited || !!(requestUrl && !listReady && !refreshing && isEmpty))
        : !!(requestUrl && !listReady) || !isInited
    // "No content": the query is fully done, there is no next page, and it
    // still produced nothing. Every condition guards a false positive.
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

/**
 * UniList plus the chrome and the empty state, placed according to
 * `headerInList`: native puts chrome in ListHeaderComponent and NoContent in
 * the footer (so they scroll with the rows); web renders them as siblings
 * because the list uses window scroll.
 */
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
 * siblings, window-scroll via uniListProps.
 *
 * Skeleton → list fade lives inside UniList on both platforms (it is the one
 * who knows when the virtualizer has laid the rows out); pass
 * `showListPreload` to hand it the skeleton.
 *
 * @param {object}   props
 * @param {object}   props.route
 * @param {boolean}  [props.headerInList=false]     See ListBody.
 * @param {boolean}  [props.showListPreload=false]  Hand skeletons to UniList's
 *        preloadComponent while the list is not ready.
 * @param {object}   [props.listRef]
 * @param {Function} [props.handleEndReached]
 * @param {Function} [props.onRefresh]
 * @param {boolean}  [props.refreshing]
 * @param {object}   [props.uniListProps]  Platform UniList settings, spread in.
 * @param {node|Function} [props.afterList] Rendered after the list; a function
 *        receives the `useListScene` result.
 * @param {...*}     sceneProps            Forwarded to `useListScene`.
 */
export function ListScene({
    route,
    headerInList = false,
    showListPreload = false,
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

    return (
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
}
