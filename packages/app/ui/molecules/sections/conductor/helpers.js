import {
    appSetting,
    menuItemsByName,
    menuItemsFilter,
    getURI,
    parseUrl,
    parseQueryString,
    strToObj,
    decodeText,
    getBlocksFromData,
    getPageSettings,
    getUnitModeBySource,
    deepEqual,
    LAYOUT_BREAKPOINTS,
    findElementBySource,
} from 'app/lib/util'
import { fetcher } from 'app/lib/fetcher'
import { getSkeletonByEndPoint } from 'app/customization/functions'
import { components } from 'app/components/registry'

const conductorTheme = appSetting('theme', 'conductor')

/*
 * ============================================================================
 * Pure helpers for the Conductor. No React here (except through the
 * component registry) — everything is a function of its arguments, which is
 * what makes this file the right place for unit tests.
 *
 * Sections, in order:
 *   - route matching        URL ⇄ tab index
 *   - nested tabs           compact nav, sidebar tree, ancestors
 *   - route objects         fillTabs / merge / hydrate one tab
 *   - list rows & query     what goes into UniList and its query key
 *   - page JSON parsing     UNA page → content / endpoint / sidebar / leftbar
 *   - list presentation     unit type, skeleton key
 *   - left column           menus vs filters, exclusions
 *   - filters               form values → endpoint params
 *
 * Vocabulary:
 *   route     one tab, built from a menu item (see createConductorRoute)
 *   inited    the route has its page JSON (endpoint, blocks, sidebar…)
 *   endpoint  the browse block's request — what the list actually fetches
 *   leftbar / sidebar   UNA's left / right column blocks for that tab
 * ============================================================================
 */

const registeredComponents = Object.create(null)
/** Cache registry lookups; skip undefined so a late registry fill still works. */
export function registeredComponent(type, name) {
    const key = `${type}:${name}`
    const cached = registeredComponents[key]
    if (cached) return cached
    const component = components[type][name]
    if (component) registeredComponents[key] = component
    return component
}

// ---------------------------------------------------------------------------
// Route matching: URL ⇄ tab index
// ---------------------------------------------------------------------------

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

    // Pass 1: exact match, query string included.
    for (let i = 0; i < tabRoutes.length; i++) {
        const item = tabRoutes[i]
        if (item?.canNavigate === false) continue
        const itemLink = normalizeConductorLink(item.key || item.link)
        if (itemLink && pageLink === itemLink) return i
    }

    // A URL with a query that matched nothing exactly is a different page
    // (e.g. a filtered view) — do not fuzzy-match it onto a tab.
    if (pageLink.includes('?')) return -1

    // Pass 2: nested path — `groups/123/members` belongs to tab `groups/123`.
    // Longest matching tab wins so a parent never shadows a more specific child.
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

// ---------------------------------------------------------------------------
// Nested tabs: compact nav, sidebar tree, ancestors
// ---------------------------------------------------------------------------

/** Whether any route has nested children (compact/sidebar tree). */
export function hasConductorSubitems(routes = []) {
    return routes.some((route) => route?.hasChildren)
}

/** Root-level pill/dropdown entries for the compact top nav. */
export function buildCompactNavEntries(routes = []) {
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
export function buildSubitemsDropdownItems(route, routes, selectedIndex) {
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
export function isSubitemsDropdownActive(route, routes, selectedIndex) {
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

// ---------------------------------------------------------------------------
// Route objects: build from menu, hydrate, merge
// ---------------------------------------------------------------------------

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
        storageKeyValue: routeLink,
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

/** Block-type items only from route.data (list items live in TanStack). */
export function conductorBlockItems(route) {
    return (route?.data || []).filter((item) => item?.type === 'block')
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
        if (!prev?.inited) {
            return {
                ...route,
                data: conductorBlockItems(route),
            }
        }

        // fillTabs hydrates only the URL-matching tab; keep other inited tabs as-is.
        if (!route.inited) {
            return {
                ...route,
                inited: true,
                data: conductorBlockItems(prev),
                endpoint: prev.endpoint,
                sidebar: prev.sidebar,
                leftbar: prev.leftbar,
                pageData: prev.pageData,
                blocks: prev.blocks,
                config: prev.config,
            }
        }

        const keepPrevEndpoint =
            Boolean(prev.endpoint)
            && sameConductorEndpoint(route.endpoint, prev.endpoint)

        return {
            ...route,
            inited: true,
            data: conductorBlockItems(route).length
                ? conductorBlockItems(route)
                : conductorBlockItems(prev),
            endpoint: keepPrevEndpoint ? (prev.endpoint ?? route.endpoint) : route.endpoint,
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

// ---------------------------------------------------------------------------
// List rows & query key
// ---------------------------------------------------------------------------

/**
 * TanStack query key for a conductor list.
 * `tabId` is tab index on native and `pageRoute.link` on web.
 * Pass `timestamp` only on web (mount bust); omit on native so gcTime cache survives.
 */
export function conductorListQueryKey({ requestUrl, tabId, keyword, params, ts, timestamp }) {
    const key = [
        requestUrl ?? null,
        tabId ?? null,
        keyword,
        JSON.stringify(params ?? null),
        ts,
    ]
    if (timestamp !== undefined) {
        key.push(timestamp)
    }
    return key
}

/** Page JSON blocks that have a resolvable block name (no React tree). */
export function filterConductorPageBlocks(pageBlocks) {
    return (pageBlocks ?? []).filter((item) => {
        if (!item) return false
        const name = item.block
        const blockName = typeof name === 'string' ? name : name?.name
        return Boolean(blockName)
    })
}

/**
 * Center-column list rows (small web + native).
 * Desktop omits sidebar (`includeSidebar: false`); phone always appends it.
 */
export function buildConductorListRows({
    pageBlocks,
    listItems = [],
    sidebarContent,
    includeSidebar = false,
    feedType,
}) {
    const blocks = filterConductorPageBlocks(pageBlocks)
    const sidebar = includeSidebar
        ? (sidebarContent ?? []).filter(
            (item) => !item.data?.hidden_on?.includes?.('phone')
        )
        : []
    const base = [...blocks, ...(listItems ?? []), ...sidebar]
    if (!feedType) return base
    return base.map((item) =>
        item.feed_type === feedType ? item : { ...item, feed_type: feedType }
    )
}

/** True when the list has feed/profile items (not only page blocks). */
export function conductorListHasEntries(items) {
    return (items ?? []).some((item) => item.type != 'block')
}

// ---------------------------------------------------------------------------
// Lazy tab init: fetch page JSON for a tab the first time it is opened
// ---------------------------------------------------------------------------

/** In-flight page requests, keyed by link → the pending fetch promise. */
const routeInitInFlight = new Map()

/** Fetch page JSON once per link; concurrent callers share the same promise. */
function fetchRoutePage(link) {
    const pending = routeInitInFlight.get(link)
    if (pending) return pending
    const request = fetcher(
        '/api.php?r=system/get_page_by_request/TemplServicePages&params[]=' + link
    ).finally(() => {
        routeInitInFlight.delete(link)
    })
    routeInitInFlight.set(link, request)
    return request
}

/**
 * Load page JSON for an uninited navigable tab and merge into routes.
 *
 * Guarded against fast tab switching: concurrent calls for the same link
 * share one request (two mounted conductors with the same tab both still get
 * their route hydrated), and a response is dropped if the tab got hydrated
 * meanwhile — addMoreData writes by index, so a late response would clobber
 * fresh state.
 */
export async function ensureRouteInited(routes, index, setRoutes) {
    const currentRoute = routes.find((item) => item.index === index)
    if (!currentRoute || currentRoute.inited || currentRoute.canNavigate === false) {
        return
    }
    const link = resolvePageRequestLink(currentRoute.link)
    if (!link) {
        return
    }

    let sResponse
    try {
        sResponse = await fetchRoutePage(link)
    } catch {
        return
    }

    if (!sResponse?.data) {
        return
    }

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
        sResponse.data,
        link
    )
}

/** Merge page chrome / blocks into setRoutes. List items live in TanStack, not route.data. */
export function addMoreData(
    newItems,
    endpoint,
    setRoutes,
    index,
    blocks,
    sidebar = false,
    leftbar = false,
    pageData = null,
    expectedLink = null
) {
    setRoutes((prevRoutes) => {
        let hasChanged = false

        const updatedRoutes = prevRoutes.map((route) => {
            if (route.index !== index) {
                return route
            }

            // Late response for a tab that has since been hydrated, or whose
            // slot now holds a different page (routes rebuilt) — drop it.
            if (expectedLink !== null) {
                if (route.inited) return route
                if (resolvePageRequestLink(route.link) !== expectedLink) return route
            }

            hasChanged = true

            const updatedRoute = {
                ...route,
                endpoint,
                inited: true,
                data: conductorBlockItems({
                    data: (route.data || []).concat(newItems || []),
                }),
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

            return updatedRoute
        })

        return hasChanged ? updatedRoutes : prevRoutes
    })
}

// ---------------------------------------------------------------------------
// Page JSON parsing: UNA page → content / endpoint / sidebar / leftbar
// ---------------------------------------------------------------------------

/** Resolve block content from page elements (browse vs generic block). */
export function getContent(data, block) {
    const blockName = block.name
    if (!data || !data.elements || typeof data.elements !== 'object') {
        return { data: null, type: 'block', block }
    }
    const b = findElementBySource(data, blockName, (element) => !!element.content)

    return b?.content[0]?.type === 'browse' && !block.sidebar && !block.leftbar
        ? { data: b.content[0].data, type: 'browse', designbox: b.config_api?.designbox }
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
        ...(b.designbox ? { designbox: b.designbox } : null),
    }
}

/** Browse payload → conductor endpoint (no list items on the object). */
function endpointFromBrowsePayload(payload) {
    if (!payload?.request_url) return payload ?? null
    return {
        params: payload.params,
        request_url: payload.request_url,
        filters: payload.filters,
        finished: false,
        unit: payload.unit,
        module: payload.module,
        ...(payload.designbox ? { designbox: payload.designbox } : null),
    }
}

/** Merge a browse block into the endpoint (list items are fetched, not stored here). */
function processBrowse(acc, b) {
    acc.endpoint = processEndpoint(acc, b)
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
    const browseBlock = list.find(item => {
        const type = getFirstContentType(item)
        return type === 'browse' || type === 'browse_list'
    })
    const payload = browseBlock?.content?.[0]?.data
    // The browse block's App config styles the list: its card per breakpoint (`paddingForList`).
    const designbox = browseBlock?.config_api?.designbox
    return { content, endpoint: payload && designbox ? { ...payload, designbox } : payload }
}

/** Build content/endpoint/sidebar/leftbar from layout_parsed page data. */
function processParsedUrl(data) {
    const elements = data?.elements || {}
    const cellCenter = mapLayoutBlocks(elements.cell_center)
    const cellRight = mapLayoutBlocks(elements.cell_right)
    const cellLeft = mapLayoutBlocks(elements.cell_left)
    const browsePayload = cellCenter.endpoint
    return {
        content: cellCenter.content,
        endpoint: endpointFromBrowsePayload(browsePayload),
        sidebar: { endpoint: cellRight.endpoint, content: cellRight.content },
        leftbar: { endpoint: cellLeft.endpoint, content:  cellLeft.content },
    }
}

/**
 * Derive list content, browse endpoint, sidebar and leftbar from page JSON.
 *
 * Two page formats come from UNA:
 * - `layout_parsed` — cells already split into left / center / right; each
 *   cell is a list of blocks. Handled by `processParsedUrl`.
 * - classic — a flat `elements` map plus a `blocks` config that says which
 *   block is sidebar / leftbar / hidden. Walked here.
 *
 * In both, the first `browse` block in the center becomes the `endpoint`;
 * every other block becomes a `{ type: 'block' }` row for its column.
 */
export function processUrl(data, blocks) {
    if (data.layout_parsed) {
        return processParsedUrl(data)
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

// ---------------------------------------------------------------------------
// List presentation: counters, unit type, skeleton key
// ---------------------------------------------------------------------------

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
    const type = getUnitModeBySource(route?.endpoint)
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

// ---------------------------------------------------------------------------
// Left column: menus vs filters, exclusions, form restore
// ---------------------------------------------------------------------------

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

/** Normalize a left-column link item for DropdownMenu. */
export function normalizeLeftColumnMenuItem(item, index) {
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

/** Extract dropdown link items from a left-column menu/categories block. */
export function getDropdownItemsFromLeftColumnBlock(blockItem) {
    const elements = blockItem?.data?.content
    if (!Array.isArray(elements)) return []

    return elements
        .flatMap((el) => {
            const type = el?.type || el?.content_type
            if (type === 'menu') {
                const items = el?.data?.content?.items ?? el?.content?.items ?? []
                return items.map(normalizeLeftColumnMenuItem)
            }
            if (type === 'categories_list') {
                const items = Array.isArray(el?.data)
                    ? el.data
                    : Array.isArray(el?.data?.content)
                        ? el.data.content
                        : []
                return items.map(normalizeLeftColumnMenuItem)
            }
            if (
                Array.isArray(el?.data) &&
                el.data[0] &&
                (el.data[0].url || el.data[0].link || el.data[0].name || el.data[0].title)
            ) {
                return el.data.map(normalizeLeftColumnMenuItem)
            }
            return []
        })
        .filter((item) => item.title)
}

/** Left-column blocks visible on phone (not hidden_on phone / not excluded). */
export function getMobileLeftColumnItems(leftColumnContent = [], excludedIds = null) {
    return leftColumnContent.filter((item) => {
        if (item.data?.hidden_on?.includes?.('phone')) return false
        if (excludedIds?.has?.(item?.id)) return false
        return true
    })
}

/** Split left column into top-menu dropdowns vs filter-sheet blocks. */
export function partitionLeftColumn(leftColumnContent = [], layoutName) {
    const menuBlocks = leftColumnContent.filter(
        (item) =>
            !item?.data?.config_api?.use_as_filter &&
            !!item?.data?.config_api?.use_as_menu &&
            getDropdownItemsFromLeftColumnBlock(item).length > 0
    )
    const filterBlocks = leftColumnContent.filter((item) => {
        if (item?.data?.config_api?.use_as_filter) return true
        if (layoutName !== 'navigator') return false
        if (!item?.data?.config_api?.use_as_menu) return true
        // Menu flag set but no extractable links → keep in Filters
        return getDropdownItemsFromLeftColumnBlock(item).length === 0
    })
    return { menuBlocks, filterBlocks }
}

/**
 * Ids that should not also render in the main list.
 * Desktop web: nothing excluded (right sidebar owns the left column).
 * Navigator: all left-column ids. Else: menu + filter blocks only.
 */
export function getLeftColumnExcludedFromMainIds({
    layoutName,
    leftColumnContent = [],
    menuBlocks = [],
    filterBlocks = [],
    isDesktop = false,
}) {
    if (isDesktop) return new Set()
    if (layoutName === 'navigator') {
        return new Set(
            leftColumnContent.map((item) => item?.id).filter((id) => id != null)
        )
    }
    return new Set(
        [...menuBlocks, ...filterBlocks]
            .map((item) => item?.id)
            .filter((id) => id != null)
    )
}

/** Which side columns exist, as the `layouts` settings key suffix: 'c' | 'c-r' | 'l-c' | 'l-c-r'. */
export function getConductorLayoutCols(hasLeft, hasRight) {
    if (hasLeft && hasRight) return 'l-c-r'
    if (hasLeft) return 'l-c'
    if (hasRight) return 'c-r'
    return 'c'
}

/**
 * Web column config (sizes, `breakpoint`, `responsive`): the page's own
 * `layouts` entry, else the generic one for this column combination.
 */
export function getConductorColumnsConfig(uri, layoutCols) {
    return appSetting('layouts', uri) || appSetting('layouts', `cols-${layoutCols}`)
}

/**
 * Side column is on screen at `breakpointName` (from `useBreakpointName`).
 * The panel is CSS-hidden below its `breakpoint`, and the list shows the
 * column's blocks inline exactly when this is false — both must agree, or a
 * width range ends up with the blocks in neither place.
 */
export function isConductorColumnShown(breakpoint, breakpointName) {
    const minWidth = LAYOUT_BREAKPOINTS[breakpoint]
    if (!minWidth) return false
    return (LAYOUT_BREAKPOINTS[breakpointName] ?? 0) >= minWidth
}

// ---------------------------------------------------------------------------
// Filters: form values → endpoint params
// ---------------------------------------------------------------------------

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

    // Structural compare, not JSON.stringify: the form and UNA may emit the
    // same filters with keys in a different order, and that must not refetch.
    const currentFilters = routes[routeIndex]?.endpoint?.params?.filters || {}
    if (
        deepEqual(currentFilters, filters) &&
        (rawFormValues == null ||
            deepEqual(routes[routeIndex]?.endpoint?.filterFormValues, rawFormValues))
    ) {
        return routes
    }

    const next = [...routes]
    next[routeIndex] = {
        ...next[routeIndex],
        data: conductorBlockItems(next[routeIndex]),
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
