import {
    appSetting,
    menuItemsByName,
    menuItemsFilter,
    getURI,
    parseUrl,
    parseQueryString,
    storageKey,
    strToObj,
    decodeText,
    getBlocksFromData,
    getPageSettings,
    getUnitModeBySource,
} from 'app/lib/util'
import { fetcher } from 'app/lib/fetcher'
import { getSkeletonByEndPoint } from 'app/customization/functions'

const conductorTheme = appSetting('theme', 'conductor')

/** Split page blocks into main list vs leftbar. */
export function processBlocks(blocks) {
    let leftBlocks = []

    if (blocks) {
        leftBlocks = Object.entries(blocks)
            .filter(([key, value]) => value.leftbar)
            .map(([key, value]) => ({
                key,
                ...value,
            }))
        blocks = Object.entries(blocks)
            .filter(([key, value]) => !value.leftbar)
            .map(([key, value]) => ({
                key,
                ...value,
            }))
    }

    return { mainBlocks: blocks, leftBlocks: leftBlocks }
}

/** Strip page/ prefix and leading slashes from a conductor link. */
export function normalizeConductorLink(link) {
    const raw = String(link || '').trim()
    if (!raw || raw === 'javascript:void(0)') return ''
    return raw.replace(/^page\//, '').replace(/^\/+/, '')
}

/** Absolute path href from a conductor link, or undefined if empty. */
export function conductorHref(link) {
    const normalized = normalizeConductorLink(link)
    return normalized ? `/${normalized}` : undefined
}

/** Match URL to a tab index; supports nested paths. Returns -1 if none. */
export function findConductorRouteIndex(tabRoutes, url, useSectionAsMenu) {
    if (!tabRoutes?.length || url == null || url === '') return -1

    if (useSectionAsMenu) {
        for (let i = 0; i < tabRoutes.length; i++) {
            if (url === tabRoutes[i].key) return i
        }
        return -1
    }

    const pageLink = normalizeConductorLink(url)
    if (!pageLink) return -1

    for (let i = 0; i < tabRoutes.length; i++) {
        const item = tabRoutes[i]
        if (item?.canNavigate === false) continue
        const itemLink = normalizeConductorLink(item.key || item.link)
        if (itemLink && pageLink === itemLink) return i
    }

    if (pageLink.includes('?')) return -1

    const cleanUrl = pageLink.split('?')[0]
    let bestIndex = -1
    let bestLen = -1
    for (let i = 0; i < tabRoutes.length; i++) {
        const item = tabRoutes[i]
        if (item?.canNavigate === false) continue
        const itemLink = normalizeConductorLink(item.key || item.link)
        if (!itemLink || itemLink.includes('?')) continue
        const itemKey = itemLink.split('?')[0]
        if (!itemKey) continue
        const matches =
            cleanUrl === itemKey ||
            cleanUrl.startsWith(`${itemKey}/`) ||
            `/${cleanUrl}`.includes(`/${itemKey}`)
        if (matches && itemKey.length > bestLen) {
            bestIndex = i
            bestLen = itemKey.length
        }
    }
    return bestIndex
}

/** Like findConductorRouteIndex, but defaults to 0 when no match. */
export function findConductorRouteIndexOrZero(tabRoutes, url, useSectionAsMenu) {
    const index = findConductorRouteIndex(tabRoutes, url, useSectionAsMenu)
    return index !== -1 ? index : 0
}

/** Whether any route has nested children (compact/sidebar tree). */
export function hasConductorSubitems(routes = []) {
    return routes.some((route) => route?.hasChildren)
}

/** Root-level pill/dropdown entries for the compact top nav. */
export function buildCompactNavEntries(routes = [], selectedIndex = 0) {
    const entries = []
    routes.forEach((route) => {
        if (route.depth !== 0) return
        if (route.hideInTop && !route.hasChildren) return

        if (route.hasChildren) {
            entries.push({ type: 'dropdown', route })
            return
        }

        if (route.hideInTop) return
        entries.push({ type: 'pill', route })
    })
    return entries
}

/** Indent className for sidebar tree depth. */
export function getConductorDepthClassName(depth) {
    const depthClassNameMap = {
        0: '',
        1: conductorTheme.menu_categ_indent,
        2: 'pl-12',
        3: 'pl-16',
    }
    return depthClassNameMap[depth] || ''
}

/** Resolve child route objects from a parent's childIndices. */
export function getConductorRouteChildren(route, routes = []) {
    return (route?.childIndices || [])
        .map((childIndex) => routes[childIndex])
        .filter(Boolean)
}

/** DropdownMenu items for a parent route's children. */
export function buildConductorSubitemsDropdownItems(route, routes, selectedIndex) {
    return getConductorRouteChildren(route, routes).map((child) => ({
        id: child.key || child.index,
        title: child.title,
        icon: child.icon,
        image: child.image,
        selected: child.index === selectedIndex,
        routeIndex: child.index,
        route: child,
    }))
}

/** True if the selected tab is this route or one of its children. */
export function isConductorSubitemsDropdownActive(route, routes, selectedIndex) {
    if (selectedIndex === route?.index) return true
    return getConductorRouteChildren(route, routes).some(
        (child) => child.index === selectedIndex
    )
}

/** Parent indices from selected tab up to the root. */
export function getConductorAncestorIndices(routes = [], selectedIndex = 0) {
    const indices = []
    let current = routes[selectedIndex]
    while (current && current.parentIndex != null) {
        indices.push(current.parentIndex)
        current = routes[current.parentIndex]
    }
    return indices
}

/** Expanded-map for sidebar: ancestors of the selected tab open. */
export function buildConductorSidebarExpandedMap(routes = [], selectedIndex = 0) {
    const map = {}
    for (const parentIndex of getConductorAncestorIndices(routes, selectedIndex)) {
        map[parentIndex] = true
    }
    return map
}

/** Merge ancestor expansion into an existing sidebar expanded map. */
export function mergeConductorSidebarExpandedMap(prev, routes, selectedIndex) {
    const next = { ...prev }
    let changed = false
    for (const parentIndex of getConductorAncestorIndices(routes, selectedIndex)) {
        if (!next[parentIndex]) {
            next[parentIndex] = true
            changed = true
        }
    }
    return changed ? next : prev
}

/** Depth-0 routes shown as sidebar roots. */
export function getConductorSidebarRootRoutes(routes = []) {
    return routes.filter(
        (route) => route.depth === 0 && !(route.hideInTop && !route.hasChildren)
    )
}

/** Build get_page_by_request link (path + optional query as params). */
function resolvePageRequestLink(link) {
    const normalized = normalizeConductorLink(link)
    if (!normalized) return ''
    if (!normalized.includes('?')) return normalized
    const urlObj = parseUrl(normalized)
    const obj = parseQueryString(urlObj.queryString)
    return `${String(urlObj.path || '').replace(/^\/+/, '')}&params[]=&params[]=${JSON.stringify(obj)}`
}

/** Whether a menu item matches the current page URL/section. */
function isCurrentMenuItem(item, data, useSectionAsMenu, link) {
    if (!link) return false
    if (useSectionAsMenu) {
        const itemUrl = parseUrl(link)
        const itemQuery = parseQueryString(itemUrl?.queryString)
        const pageUrl = parseUrl(data.url)
        const pageQuery = parseQueryString(pageUrl?.queryString)
        return pageQuery?.section == itemQuery?.section
    }
    return normalizeConductorLink(data.url) === link
}

/** Create one conductor route object from a menu item. */
function createConductorRoute(item, index, depth, parentIndex, link, canNavigate, hasChildren) {
    const routeLink = canNavigate ? link : ''
    let addon = item.addon
    if (routeLink == 'friend-requests') {
        addon = { text: item.addon || '', variant: 'primary' }
    }
    return {
        key: canNavigate ? link : (item.name || `menu-${index}`),
        title: decodeText(item.title || item.name || ''),
        index,
        depth,
        parentIndex,
        hasChildren,
        canNavigate,
        childIndices: [],
        link: routeLink,
        hideInTop: Boolean(item.hideInTop) || (hasChildren && !canNavigate) || depth > 0,
        item,
        ident: item.ident || (depth > 0 ? 1 : 0),
        addon,
        image: item.image || '',
        icon: item.icon || 'Circle',
        menu_settings: appSetting('layout', 'user_remote_config') && item.config
            ? strToObj(item.config)
            : item.settings,
        storageKeyValue: storageKey(routeLink, false),
        sidebar: {},
        leftbar: {},
        inited: false,
        data: [],
        config: null,
    }
}

/** Hydrate a route with the current page's content/endpoint/sidebar. */
function applyCurrentPageToRoute(route, data, blocks) {
    const contentAndEndpoint = processUrl(data, blocks)
    route.data = contentAndEndpoint.content
    route.inited = true
    route.endpoint = contentAndEndpoint.endpoint
    route.sidebar = contentAndEndpoint.sidebar
    route.leftbar = contentAndEndpoint.leftbar
    route.config = data?.config
    route.blocks = blocks
    route.pageData = data
    if (appSetting('layout', 'user_remote_config') && route.item?.config) {
        route.menu_settings = (strToObj(route.item.config)).settings
    }
}

/** Count non-block list items on a route. */
function conductorListItemCount(route) {
    return (route?.data || []).filter((item) => item?.type !== 'block').length
}

/** Block-type items only from route.data. */
function conductorBlockItems(route) {
    return (route?.data || []).filter((item) => item?.type === 'block')
}

/** Non-block list items from route.data. */
function conductorNonBlockItems(route) {
    return (route?.data || []).filter((item) => item?.type !== 'block')
}

/** True if endpoints share the same request_url (or either missing). */
function sameConductorEndpoint(a, b) {
    const left = a?.request_url || ''
    const right = b?.request_url || ''
    if (!left || !right) return true
    return left === right
}

/**
 * Merge fresh fillTabs routes with prev inited list data so soft-reload
 * does not flash empty skeletons.
 */
export function mergeConductorRoutes(freshTabs, prevRoutes) {
    if (!Array.isArray(freshTabs) || freshTabs.length === 0) return freshTabs || []
    if (!Array.isArray(prevRoutes) || prevRoutes.length === 0) return freshTabs

    const prevByLink = new Map()
    for (const route of prevRoutes) {
        const key = normalizeConductorLink(route?.link || route?.key)
        if (key) prevByLink.set(key, route)
    }

    return freshTabs.map((route, i) => {
        const routeKey = normalizeConductorLink(route?.link || route?.key)
        const prev = (routeKey && prevByLink.get(routeKey))
            || (normalizeConductorLink(prevRoutes[i]?.link || prevRoutes[i]?.key) === routeKey
                ? prevRoutes[i]
                : null)
        if (!prev?.inited) return route

        // fillTabs hydrates only the URL-matching tab; keep other inited tabs as-is.
        if (!route.inited) {
            return {
                ...route,
                inited: true,
                data: prev.data,
                endpoint: prev.endpoint,
                sidebar: prev.sidebar,
                leftbar: prev.leftbar,
                pageData: prev.pageData,
                blocks: prev.blocks,
                config: prev.config,
            }
        }

        const freshCount = conductorListItemCount(route)
        const prevCount = conductorListItemCount(prev)
        const keepPrevList = freshCount === 0
            && (prevCount > 0 || Boolean(prev.endpoint?.finished))
            && sameConductorEndpoint(route.endpoint, prev.endpoint)

        if (!keepPrevList) return route

        return {
            ...route,
            inited: true,
            data: conductorBlockItems(route).concat(conductorNonBlockItems(prev)),
            endpoint: prev.endpoint ?? route.endpoint,
            sidebar: route.sidebar?.content?.length ? route.sidebar : prev.sidebar,
            leftbar: route.leftbar?.content?.length ? route.leftbar : prev.leftbar,
            pageData: route.pageData ?? prev.pageData,
            blocks: route.blocks ?? prev.blocks,
            config: route.config ?? prev.config,
        }
    })
}

/** Build conductor tab routes from menu; hydrate the current URL tab. */
export function fillTabs(
    menu,
    data,
    blocks,
    currentUser,
    useSectionAsMenu
) {
    const menuItems = menuItemsByName(
        menu.object,
        menu.items,
        currentUser,
        data.url,
        menu?.config
    )
    const routes = []

    const visit = (items, depth, parentIndex) => {
        const indices = []
        ;(items || []).forEach((item) => {
            const children = menuItemsFilter(item?.subitems || [], currentUser)
            const link = normalizeConductorLink(item?.link || item?.url)
            const canNavigate = Boolean(link)
            const hasChildren = children.length > 0
            const index = routes.length
            const route = createConductorRoute(
                item,
                index,
                depth,
                parentIndex,
                link,
                canNavigate,
                hasChildren
            )
            routes.push(route)
            indices.push(index)
            if (hasChildren) {
                route.childIndices = visit(children, depth + 1, index)
            }
        })
        return indices
    }

    visit(menuItems, 0, null)

    const currentIndex = routes.findIndex((route) =>
        isCurrentMenuItem(route.item, data, useSectionAsMenu, route.link)
    )
    if (currentIndex !== -1) {
        applyCurrentPageToRoute(routes[currentIndex], data, blocks)
    }

    return routes
}

/** Fetch next page for an unfinished list endpoint and append via addMoreData. */
export async function parseData(routes, index, setRoutes, newData) {
    const currentRoute = routes.find((item) => item.index === index)
    if (
        currentRoute &&
        currentRoute.endpoint &&
        !currentRoute.endpoint.finished
    ) {
        const prevFinished = currentRoute.endpoint.finished
        const endpoint = {
            ...currentRoute.endpoint,
            params: { ...currentRoute.endpoint.params },
        }
        let params = { ...endpoint.params }
        const sRequest =
            currentRoute.endpoint.request_url + JSON.stringify({ params })

        const sResponse = await fetcher(sRequest)
        const newData = sResponse.data[0]?.data?.data
            ? sResponse.data[0]?.data?.data
            : []
        let finished = newData?.length === 0 || !newData
        let zeroRes = newData?.length == 0 //|| newData?.length < params.per_page //Commented for valid timeline calculation if some items groupped
        if (params?.per_page && zeroRes) {
            finished = true
        }
        const isFinished = prevFinished !== finished

        endpoint.finished = finished

        const ld = sResponse.data[0]?.data.params

        if (ld) {
            if (sResponse.data[0]?.data?.unit != 'notifications')
                params.start = parseInt(ld.start) + parseInt(ld.per_page)
            else {
                params.start = parseInt(ld.start)
            }
        }
        endpoint.params = params

        if (newData.length > 0 || isFinished) {
            addMoreData(
                newData,
                endpoint,
                setRoutes,
                index,
                {},
                false,
                false,
                null
            )
        }
        return { data: newData, endpoint: endpoint }
    }
    return { data: [], endpoint: currentRoute?.endpoint }
}

/** Load page JSON for an uninited navigable tab and merge into routes. */
export async function fetchAndUpdateData(routes, index, setRoutes) {
    const currentRoute = routes.find((item) => item.index === index)
    if (!currentRoute || currentRoute.inited || currentRoute.canNavigate === false) {
        return
    }
    const link = resolvePageRequestLink(currentRoute.link)
    if (!link) {
        return
    }

    const sResponse = await fetcher(
        '/api.php?r=system/get_page_by_request/TemplServicePages&params[]=' +
        link
    )

        const settings = getPageSettings(sResponse.data?.config, getURI(currentRoute.link));

        const blocks = settings?.blocks || getBlocksFromData(sResponse.data)

        const contentAndEndpoint = processUrl(sResponse.data, settings?.blocks)

        addMoreData(
            contentAndEndpoint.content,
            contentAndEndpoint.endpoint,
            setRoutes,
            index,
            blocks,
            contentAndEndpoint.sidebar,
            contentAndEndpoint.leftbar,
            sResponse.data
        )
}

/** Same as fetchAndUpdateData (web path alias). */
export async function getDataForRoute(routes, index, setRoutes) {
    const currentRoute = routes.find((item) => item.index === index)
    if (!currentRoute || currentRoute.inited || currentRoute.canNavigate === false) {
        return
    }
    const link = resolvePageRequestLink(currentRoute.link)
    if (!link) return

    const sResponse = await fetcher(
        '/api.php?r=system/get_page_by_request/TemplServicePages&params[]=' +
        link
    )

        const settings = getPageSettings(sResponse.data?.config, getURI(currentRoute.link));

        const blocks = settings?.blocks || getBlocksFromData(sResponse.data)

        const contentAndEndpoint = processUrl(sResponse.data, settings?.blocks)

        addMoreData(
            contentAndEndpoint.content,
            contentAndEndpoint.endpoint,
            setRoutes,
            index,
            blocks,
            contentAndEndpoint.sidebar,
            contentAndEndpoint.leftbar,
            sResponse.data
        )
}

/** Append items / mark route inited in setRoutes state. */
export function addMoreData(
    newItems,
    endpoint,
    setRoutes,
    index,
    blocks,
    sidebar = false,
    leftbar = false,
    pageData = null
) {
    setRoutes((prevRoutes) => {
        let hasChanged = false

        const updatedRoutes = prevRoutes.map((route) => {
            if (route.index !== index) {
                return route
            }

            hasChanged = true

            const updatedRoute = {
                ...route,
                endpoint,
                inited: true,
                data: (route.data || []).concat(newItems || []),
            }

            if (blocks && !route.blocks) {
                updatedRoute.blocks = blocks
            }

            if (pageData && !route.pageData) {
                updatedRoute.pageData = pageData
            }

            if (pageData?.config && !route.config) {
                updatedRoute.config = pageData?.config
            }

            if (sidebar) {
                updatedRoute.sidebar = sidebar
            }
            if (leftbar) {
                updatedRoute.leftbar = leftbar
            }

            /*storageSet('ul:data', updatedRoute.storageKeyValue, {
                data: updatedRoute.data,
                endpoint: updatedRoute.endpoint,
            })*/

            return updatedRoute
        })

        return hasChanged ? updatedRoutes : prevRoutes
    })
}

/** Resolve block content from page elements (browse vs generic block). */
export function getContent(data, block) {
    const blockName = block.name
    if (!data || !data.elements || typeof data.elements !== 'object') {
        return { data: null, type: 'block', block }
    }
    const b = Object.values(data.elements)
        .flatMap((v) => (v && typeof v === 'object' ? Object.values(v) : []))
        .find((element) => element?.content && element?.source === blockName)

    return b?.content[0]?.type === 'browse' && !block.sidebar && !block.leftbar
        ? { data: b.content[0].data, type: 'browse' }
        : { data: b, type: 'block', block: block }
}

/** Copy browse endpoint fields onto the accumulator. */
function processEndpoint(acc, b) {
    return {
        ...acc.endpoint,
        params: b.data.params,
        request_url: b.data.request_url,
        filters: b.data.filters,
        finished: false,
        unit: b.data.unit,
        module: b.data.module,
    }
}

/** Merge a browse block into content + endpoint. */
function processBrowse(acc, b) {
    acc.endpoint = processEndpoint(acc, b)
    acc.content = [...acc.content, ...b.data.data]
    return acc
}

/** Append a non-browse block into an accumulator content array. */
function processContent(acc, b) {
    if (b?.data?.id || b.block?.id) {
        return [
            ...acc.content,
            { ...b, id: `block-${b.data?.id || b.block?.id}`, type: 'block' },
        ]
    }
    return acc.content
}

/** Split parsed layout cells into content blocks vs browse endpoint. */
function mapLayoutBlocks(items = []) {
    const list = Array.isArray(items) ? items : []
    const getFirstContentType = (item) => item?.content?.[0]?.type

    const content = list
        .filter(item => {
            const type = getFirstContentType(item)
            return type && type !== 'browse' && type !== 'browse_list'
        })
        .map(block => ({
            data: block,
            id: `block-${block?.id}`,
            type: 'block',
            block: { name: block?.source },
        }))
    const endpoint = list.find(item => {
        const type = getFirstContentType(item)
        return type === 'browse' || type === 'browse_list'
    })
    return { content, endpoint: endpoint?.content?.[0]?.data }
}

/** Build content/endpoint/sidebar/leftbar from layout_parsed page data. */
function processParsedUrl(data, blocks) {
    const elements = data?.elements || {}
    const cellCenter = mapLayoutBlocks(elements.cell_center)
    const cellRight = mapLayoutBlocks(elements.cell_right)
    const cellLeft = mapLayoutBlocks(elements.cell_left)
    return {
        content: cellCenter.content,
        endpoint: cellCenter.endpoint,
        sidebar: { endpoint: cellRight.endpoint, content: cellRight.content },
        leftbar: { endpoint: cellLeft.endpoint, content:  cellLeft.content },
    }
}

/** Derive list content, browse endpoint, sidebar and leftbar from page JSON. */
export function processUrl(data, blocks) {
    if (data.layout_parsed){
        const a = processParsedUrl(data, blocks);
        return a;
    }
    if (!blocks) blocks = getBlocksFromData(data)
  
    const contentAndEndpoint = Object.values(blocks).reduce(
        (acc, block) => {
            const b = getContent(data, block)

            if (block.leftbar) {
                acc.leftbar.content = processContent(acc.leftbar, b)
            }
            else {
                if (b.type === 'browse' && !block.sidebar) {
                    acc = processBrowse(acc, b)
                } else {
                    if (block.sidebar) {
                        acc.sidebar.content = processContent(acc.sidebar, b)
                    }
                    if (!block.sidebar || block.list) {
                        if (!block.hidden && !block.leftbar)
                            acc.content = processContent(acc, b)
                    }
                }
            }
            return acc
        },
        {
            content: [],
            endpoint: null,
            sidebar: { endpoint: null, content: [] },
            leftbar: { endpoint: null, content: [] },
        }
    )
    return contentAndEndpoint
}

/** Nav counter payload from addon count + conductor show_nav_counters setting. */
export function getAddon(addon) {
    const show = appSetting('conductor', 'show_nav_counters');
    if (show == 'primary' && addon > 0 )
        return {variant: 'primary', text: addon}
    return !!show && addon > 0 ? addon : null
}

/** First non-sidebar block unitType on the current route. */
export const getUnitType = (currentRoute) =>
    Object.values(currentRoute?.blocks ?? {}).find(
        (b) => !b.sidebar && b.unitType
    )?.unitType

/** Resolve list unitType for ItemRenderer / skeletons (web + native). */
export function resolveConductorUnitType(route) {
    console.log('route?.endpoint', route?.endpoint)
    const type = getUnitModeBySource(route?.endpoint)
    console.log('route?.endpoint-type', type)
    return type === 'default' ? getUnitType(route) : type
}

/**
 * Skeleton key for getSkeletonForList — same rules on web and native.
 * Prefer endpoint override, then module/unit. Pair with unitType only when
 * browse.skeletons remaps it (friends → bx_persons); otherwise keep base.
 */
export function resolveConductorSkeletonKey(route, skeletonProp, unitType) {
    const fromEndpoint = getSkeletonByEndPoint(route)
    if (fromEndpoint) return fromEndpoint
    const baseSkeleton =
        skeletonProp ||
        route?.endpoint?.module ||
        route?.endpoint?.unit
    if (!unitType || !baseSkeleton) return baseSkeleton
    const map = appSetting('browse', 'skeletons') || {}
    return map[unitType] ? [baseSkeleton, unitType] : baseSkeleton
}

/** Re-apply stored filter form values into pageData form inputs. */
export function pageDataWithRestoredFormValues(pageData, formValues) {
    if (!pageData?.elements || !formValues || Object.keys(formValues).length === 0) {
        return pageData
    }
    const elements = JSON.parse(JSON.stringify(pageData.elements))
    const visit = (node) => {
        if (!node || typeof node !== 'object') return
        if (Array.isArray(node)) {
            node.forEach(visit)
            return
        }
        if (
            (node.type === 'form' || node.content_type === 'form') &&
            node.data?.inputs
        ) {
            Object.keys(formValues).forEach((key) => {
                if (!node.data.inputs[key]) return
                node.data.inputs[key].value = formValues[key]
            })
        }
        Object.values(node).forEach(visit)
    }
    visit(elements)
    return { ...pageData, elements }
}

/** Normalize a leftbar link item for DropdownMenu. */
export function normalizeLeftbarMenuItem(item, index) {
    const rawLink = item?.url || item?.link || ''
    const link =
        rawLink && rawLink !== 'javascript:void(0)'
            ? rawLink.startsWith('/')
                ? rawLink
                : `/${rawLink}`
            : ''
    return {
        id: item?.id ?? item?.name ?? index,
        title: item?.title || item?.name || '',
        icon: item?.icon || 'Circle',
        link,
    }
}

/** Extract dropdown link items from a leftbar menu/categories block. */
export function getDropdownItemsFromLeftbarBlock(blockItem) {
    const elements = blockItem?.data?.content
    if (!Array.isArray(elements)) return []

    return elements
        .flatMap((el) => {
            const type = el?.type || el?.content_type
            if (type === 'menu') {
                const items = el?.data?.content?.items ?? el?.content?.items ?? []
                return items.map(normalizeLeftbarMenuItem)
            }
            if (type === 'categories_list') {
                const items = Array.isArray(el?.data)
                    ? el.data
                    : Array.isArray(el?.data?.content)
                        ? el.data.content
                        : []
                return items.map(normalizeLeftbarMenuItem)
            }
            if (
                Array.isArray(el?.data) &&
                el.data[0] &&
                (el.data[0].url || el.data[0].link || el.data[0].name || el.data[0].title)
            ) {
                return el.data.map(normalizeLeftbarMenuItem)
            }
            return []
        })
        .filter((item) => item.title)
}

/** Leftbar blocks visible on phone (not hidden_on phone / not excluded). */
export function getMobileLeftbarItems(leftbarContent = [], excludedIds = null) {
    return leftbarContent.filter((item) => {
        if (item.data?.hidden_on?.includes?.('phone')) return false
        if (excludedIds?.has?.(item?.id)) return false
        return true
    })
}

/** Split leftbar into top-menu dropdowns vs filter-sheet blocks. */
export function partitionConductorLeftbar(leftbarContent = [], layoutName) {
    const menuBlocks = leftbarContent.filter(
        (item) =>
            !item?.data?.config_api?.use_as_filter &&
            !!item?.data?.config_api?.use_as_menu &&
            getDropdownItemsFromLeftbarBlock(item).length > 0
    )
    const filterBlocks = leftbarContent.filter((item) => {
        if (item?.data?.config_api?.use_as_filter) return true
        if (layoutName !== 'navigator') return false
        if (!item?.data?.config_api?.use_as_menu) return true
        // Menu flag set but no extractable links → keep in Filters
        return getDropdownItemsFromLeftbarBlock(item).length === 0
    })
    return { menuBlocks, filterBlocks }
}

/**
 * Ids that should not also render in the main list.
 * Desktop web: nothing excluded (sidebar owns leftbar).
 * Navigator: all leftbar ids. Else: menu + filter blocks only.
 */
export function getLeftbarExcludedFromMainIds({
    layoutName,
    leftbarContent = [],
    menuBlocks = [],
    filterBlocks = [],
    isDesktop = false,
}) {
    if (isDesktop) return new Set()
    if (layoutName === 'navigator') {
        return new Set(
            leftbarContent.map((item) => item?.id).filter((id) => id != null)
        )
    }
    return new Set(
        [...menuBlocks, ...filterBlocks]
            .map((item) => item?.id)
            .filter((id) => id != null)
    )
}

/** Form object → [{ name, value }] for conductor filter params. */
export function formValuesToFilterEntries(values = {}) {
    const filterValues = []
    for (const key in values) {
        filterValues.push({
            name: key,
            value: Array.isArray(values[key])
                ? values[key].join(',')
                : values[key],
        })
    }
    return filterValues
}

/**
 * Apply filter entries to one route. Returns next routes array, or `routes`
 * unchanged when filters are identical (and optional raw form matches).
 */
export function patchConductorRouteFilters(
    routes,
    routeIndex,
    filterEntries,
    rawFormValues
) {
    if (!routes?.[routeIndex]?.endpoint?.params) return routes

    const filters = {}
    filterEntries.forEach((v) => {
        filters[v.name] = v.value
    })

    const currentFilters = routes[routeIndex]?.endpoint?.params?.filters || {}
    if (
        JSON.stringify(currentFilters) === JSON.stringify(filters) &&
        (rawFormValues == null ||
            JSON.stringify(routes[routeIndex]?.endpoint?.filterFormValues) ===
                JSON.stringify(rawFormValues))
    ) {
        return routes
    }

    const next = [...routes]
    next[routeIndex] = {
        ...next[routeIndex],
        data: [],
        endpoint: {
            ...next[routeIndex].endpoint,
            finished: false,
            params: {
                ...next[routeIndex].endpoint.params,
                filters,
                start: 0,
            },
            ...(rawFormValues != null ? { filterFormValues: rawFormValues } : {}),
        },
    }
    return next
}
