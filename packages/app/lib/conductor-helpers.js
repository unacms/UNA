import { useContext, useEffect, useState } from 'react'
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
} from 'app/lib/util'
import { fetcher } from 'app/lib/fetcher'
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import { Icon } from 'app/ui/atoms/icon'
import DropdownMenu, { DropdownMenuOpenContext } from 'app/ui/atoms/dropdown-menu'
import { getComponent } from 'app/components/registry'
import { useTranslation } from 'react-i18next'
import {
    getBlocksFromData,
    getPageSettings,
} from 'app/lib/util'
import { Platform } from 'react-native'
import { conductorTrace, pageTraceShape } from 'app/lib/conductor-trace'

const conductorTheme = appSetting('theme', 'conductor')

export function getBackButtonWeb() {
    const isWeb = Platform.OS === 'web'
    if (!isWeb) return <></>
    if (history.length > 2) {
        return (
            <View className="lg:hidden mr-1">
                <Button
                    rounded={true}
                    variant="secondary"
                    size="base"
                    startDecorator="ArrowLeft"
                    onPress={() => history.back()}
                />
            </View>
        )
    }
    return <></>
}

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

export async function fetchUniListData({ pageParam, requestUrl, defaultParams }) {
    const currentParam = pageParam || defaultParams

    if (!requestUrl) {
        return { data: [], params: currentParam || {} }
    }

    const sUrl =
        requestUrl +
        JSON.stringify({ params: currentParam })
        
    const res = await fetcher(sUrl)
    const payload = Array.isArray(res?.data) ? res.data[0]?.data : undefined

    const params = payload?.params ?? currentParam ?? {}
    if (payload?.data) {
        return {
            data: payload.data,
            params: params,
            cursor:
                payload.unit != 'notifications'
                    ? params.start + params.per_page
                    : params.start,
        }
    }

    return { data: [], params: currentParam || {} }
}

export const refetchUniListReducer = (state, action) => {
    switch (action.type) {
        case 'SET_ITEMS':
            return {
                visibleItems: action.items,
                hasNewData: false
            }
        case 'PREPEND_ITEM':
            return {
                ...state,
                visibleItems: [action.item, ...state.visibleItems]
            }
        case 'APPEND_ITEM':
            return {
                ...state,
                visibleItems: [...state.visibleItems, action.item]
            }
        case 'REMOVE_ITEM':
            return {
                ...state,
                visibleItems: state.visibleItems.filter(item => item.id != action.id)
            }
        case 'SHOW_NEW_DATA':
            return {
                ...state,
                hasNewData: true
            }
        default:
            return state
    }
}

export const flattenPagesForUniList = (pagesData) => (pagesData?.pages ?? []).flatMap((p) => p.data ?? [])

export const prependItemToUniListQueryCache = (queryClient, queryKey, item) => {
    if (!item?.id || !queryClient) return

    queryClient.setQueryData(queryKey, (old) => {
        if (!old?.pages?.length) return old

        const exists = old.pages.some((page) =>
            (page.data ?? []).some((i) => i.id == item.id)
        )
        if (exists) return old

        const [firstPage, ...restPages] = old.pages
        return {
            ...old,
            pages: [
                {
                    ...firstPage,
                    data: [item, ...(firstPage.data ?? [])],
                },
                ...restPages,
            ],
        }
    })
}

export const removeItemFromUniListQueryCache = (queryClient, queryKey, id) => {
    if (id == null || !queryClient) return

    queryClient.setQueryData(queryKey, (old) => {
        if (!old?.pages?.length) return old

        return {
            ...old,
            pages: old.pages.map((page) => ({
                ...page,
                data: (page.data ?? []).filter((item) => item.id != id),
            })),
        }
    })
}

export const matchesFeedOwnerFilter = (pageRoute, item) => {
    const ownerId = pageRoute?.endpoint?.params?.owner_id
    if (!ownerId) return true

    return (
        Math.abs(ownerId) == Math.abs(item?.owner_id) ||
        Math.abs(ownerId) == Math.abs(item?.object_privacy_view)
    )
}

export const isSameItemsForUniList = (a, b) => {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
        if (a[i].id !== b[i].id) {
            return false
        }
    }
    return true
}

export function normalizeConductorLink(link) {
    const raw = String(link || '').trim()
    if (!raw || raw === 'javascript:void(0)') return ''
    return raw.replace(/^page\//, '').replace(/^\/+/, '')
}

export function conductorHref(link) {
    const normalized = normalizeConductorLink(link)
    return normalized ? `/${normalized}` : undefined
}

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

export function findConductorRouteIndexOrZero(tabRoutes, url, useSectionAsMenu) {
    const index = findConductorRouteIndex(tabRoutes, url, useSectionAsMenu)
    return index !== -1 ? index : 0
}

export function hasConductorSubitems(routes = []) {
    return routes.some((route) => route?.hasChildren)
}

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

/** Indent class for conductor sidebar tree depth. */
export function getConductorDepthClassName(depth) {
    const depthClassNameMap = {
        0: '',
        1: conductorTheme.menu_categ_indent,
        2: 'pl-12',
        3: 'pl-16',
    }
    return depthClassNameMap[depth] || ''
}

export function getConductorRouteChildren(route, routes = []) {
    return (route?.childIndices || [])
        .map((childIndex) => routes[childIndex])
        .filter(Boolean)
}

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

export function isConductorSubitemsDropdownActive(route, routes, selectedIndex) {
    if (selectedIndex === route?.index) return true
    return getConductorRouteChildren(route, routes).some(
        (child) => child.index === selectedIndex
    )
}

export function getConductorAncestorIndices(routes = [], selectedIndex = 0) {
    const indices = []
    let current = routes[selectedIndex]
    while (current && current.parentIndex != null) {
        indices.push(current.parentIndex)
        current = routes[current.parentIndex]
    }
    return indices
}

export function buildConductorSidebarExpandedMap(routes = [], selectedIndex = 0) {
    const map = {}
    for (const parentIndex of getConductorAncestorIndices(routes, selectedIndex)) {
        map[parentIndex] = true
    }
    return map
}

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

export function getConductorSidebarRootRoutes(routes = []) {
    return routes.filter(
        (route) => route.depth === 0 && !(route.hideInTop && !route.hasChildren)
    )
}

function resolvePageRequestLink(link) {
    const normalized = normalizeConductorLink(link)
    if (!normalized) return ''
    if (!normalized.includes('?')) return normalized
    const urlObj = parseUrl(normalized)
    const obj = parseQueryString(urlObj.queryString)
    return `${String(urlObj.path || '').replace(/^\/+/, '')}&params[]=&params[]=${JSON.stringify(obj)}`
}

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

function applyCurrentPageToRoute(route, data, blocks) {
    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now()
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
    conductorTrace(data?.url, 'hydrate:currentTab', {
        ms: Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0),
        link: route.link,
        items: route.data?.length ?? 0,
        unit: route.endpoint?.unit,
        browse: Boolean(route.endpoint?.request_url),
        page: pageTraceShape(data),
    })
}

function conductorListItemCount(route) {
    return (route?.data || []).filter((item) => item?.type !== 'block').length
}

function conductorBlockItems(route) {
    return (route?.data || []).filter((item) => item?.type === 'block')
}

function conductorNonBlockItems(route) {
    return (route?.data || []).filter((item) => item?.type !== 'block')
}

function sameConductorEndpoint(a, b) {
    const left = a?.request_url || ''
    const right = b?.request_url || ''
    if (!left || !right) return true
    return left === right
}

/**
 * Rebuild tab chrome from fresh page JSON without dropping already-fetched
 * list pages. fillTabs() only hydrates the URL-matching tab, and parsed
 * layouts put browse rows in the list only after parseData() — so a naive
 * setRoutes(fillTabs()) on SWR/timestamp flashes skeletons then an empty list.
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

    conductorTrace(data?.url, 'fillTabs', {
        routes: routes.length,
        currentIndex,
        hydrated: currentIndex !== -1,
        links: routes.slice(0, 8).map((r) => r.link),
        pageUrl: data?.url,
    })

    return routes
}

export async function parseData(routes, index, setRoutes, newData) {
    const currentRoute = routes.find((item) => item.index === index)
    const url = currentRoute?.pageData?.url || currentRoute?.link
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

        conductorTrace(url, 'parseData:fetch:start', {
            index,
            start: params?.start,
            unit: endpoint.unit,
            request: String(currentRoute.endpoint.request_url || '').slice(0, 120),
        })
        const tFetch = typeof performance !== 'undefined' ? performance.now() : Date.now()
        const sResponse = await fetcher(sRequest)
        const fetchMs = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - tFetch)
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

        conductorTrace(url, 'parseData:fetch:done', {
            ms: fetchMs,
            items: Array.isArray(newData) ? newData.length : 0,
            finished,
            nextStart: params.start,
        })

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
    conductorTrace(url, 'parseData:skip', {
        index,
        hasEndpoint: Boolean(currentRoute?.endpoint),
        finished: currentRoute?.endpoint?.finished,
    })
    return { data: [], endpoint: currentRoute?.endpoint }
}

export async function fetchAndUpdateData(routes, index, setRoutes) {
    const currentRoute = routes.find((item) => item.index === index)
    const url = currentRoute?.pageData?.url || currentRoute?.link
    if (!currentRoute || currentRoute.inited || currentRoute.canNavigate === false) {
        conductorTrace(url, 'fetchAndUpdateData:skip', {
            index,
            reason: !currentRoute ? 'no-route' : currentRoute.inited ? 'already-inited' : 'no-navigate',
            link: currentRoute?.link,
        })
        return
    }
    const link = resolvePageRequestLink(currentRoute.link)
    if (!link) {
        conductorTrace(url, 'fetchAndUpdateData:skip', { index, reason: 'no-link', link: currentRoute.link })
        return
    }

    conductorTrace(url, 'fetchAndUpdateData:page:start', { index, link })
    const tFetch = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const sResponse = await fetcher(
        '/api.php?r=system/get_page_by_request/TemplServicePages&params[]=' +
        link
    )
    const fetchMs = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - tFetch)

        const settings = getPageSettings(sResponse.data?.config, getURI(currentRoute.link));

        const tProcess = typeof performance !== 'undefined' ? performance.now() : Date.now()
        const blocks = settings?.blocks || getBlocksFromData(sResponse.data)

        const contentAndEndpoint = processUrl(sResponse.data, settings?.blocks)
        const processMs = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - tProcess)

        conductorTrace(url, 'fetchAndUpdateData:page:done', {
            fetchMs,
            processMs,
            link,
            items: contentAndEndpoint.content?.length ?? 0,
            unit: contentAndEndpoint.endpoint?.unit,
            browse: Boolean(contentAndEndpoint.endpoint?.request_url),
            page: pageTraceShape(sResponse.data),
        })

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
/* new logic */
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

function processBrowse(acc, b) {
    acc.endpoint = processEndpoint(acc, b)
    acc.content = [...acc.content, ...b.data.data]
    return acc
}


function processContent(acc, b) {
    if (b?.data?.id || b.block?.id) {
        return [
            ...acc.content,
            { ...b, id: `block-${b.data?.id || b.block?.id}`, type: 'block' },
        ]
    }
    return acc.content
}

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
    const isHideOnDesktop = layoutName !== 'profile';
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
                    {layout != 'mixed' && (
                        <Row className={`hidden ${conductorTheme.hide_top_menu_from}:flex cond-buttons-add`}>
                            {addButtons}
                        </Row>
                    )}
            </View>
        </View>
    )
}

export function getAddon(addon) {
    const show = appSetting('conductor', 'show_nav_counters');
    if (show == 'primary' && addon > 0 )
        return {variant: 'primary', text: addon}
    return !!show && addon > 0 ? addon : null
}

export function Addon({item, index}) {
    let addonContent = null;
    const settings = getPageSettings(item?.config, item?.key);
    let icon = !item.ident
        ? settings?.icon
            ? settings?.icon
            : String(item?.icon || '').replace('*', '')
        : String(item?.icon || '').replace('*', '')

    const addon = getAddon(item?.addon)
    if (addon) {
        const addonClasses = addon.variant === 'primary' ? "bg-destructive" : "bg-secondary";
        const addonText = addon.variant === 'primary' ? addon.text : addon;
        if (addonText) {
            addonContent = (
                <Text className={`${addonClasses} rounded-full px-2 py-0.5  text-center items-center text-white text-xs font-semibold`}>
                    {addonText}
                </Text>
            );
        }
    }
    return addonContent;
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

export const getUnitType = (currentRoute) =>
    Object.values(currentRoute?.blocks ?? {}).find(
        (b) => !b.sidebar && b.unitType
    )?.unitType

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