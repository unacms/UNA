import {
    appSetting,
    menuItemsByName,
    getURI,
    parseUrl,
    parseQueryString,
    storageKey,
    strToObj
} from 'app/lib/util'
import { fetcher } from 'app/lib/fetcher'
import { View, Row } from 'app/design/view'
import { Button } from 'app/design/controls'
import {
    getBlocksFromData,
    getPageSettings,
} from 'app/lib/util'
import { Platform } from 'react-native'

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

export const isSameItemsForUniList = (a, b) => {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
        if (a[i].id !== b[i].id) {
            return false
        }
    }
    return true
}

export function fillTabs(
    menu,
    data,
    blocks,
    currentUser,
    useSectionAsMenu
) {

    let menuItems = menuItemsByName(
        menu.object,
        menu.items,
        currentUser,
        data.url,
        menu?.config
    )

    return menuItems.map((item, index) => {
        
        //const menu_settings = item.config ? JSON.parse(item.config): null;

        item.link = item.link.replace('page/', '')
        //TOFIX
        const i = { key: item.link, title: item.title, index }
        //  let bCurrent = getURI(item.link) === data.uri;
        let bCurrent = data.url.includes(item.link)
        if (useSectionAsMenu) {
            let b = parseUrl(item.link)
            let d = parseQueryString(b?.queryString)
            let c = parseUrl(data.url)
            let e = parseQueryString(c?.queryString)

            bCurrent = e?.section == d?.section
        }
        
        if (bCurrent) {
            let contentAndEndpoint = processUrl(data, blocks)
            i.data = contentAndEndpoint.content
            i.inited = true
            i.link = item.link
            i.hideInTop = item.hideInTop
            i.item = item
            i.ident = item.ident
            i.addon = item.addon
            if (i.link == 'friend-requests') {
                i.addon = { text: item.addon || '', variant: 'primary' }
            }
            i.menu_settings = appSetting('layout', 'user_remote_config') && item.config ? (strToObj(item.config)).settings : item.settings;
            i.icon = item.icon
            i.endpoint = contentAndEndpoint.endpoint
            i.sidebar = contentAndEndpoint.sidebar
            i.leftbar = contentAndEndpoint.leftbar
            i.config = data?.config
            i.storageKeyValue = storageKey(i.link, false)
            i.blocks = blocks
            i.pageData = data
            if (appSetting('cache', 'list')) {
                /*let stateC = getDataFromCache('ul:state', i.storageKeyValue)
                if (stateC) {
                    // i.endpoint = stateC.endpoint;
                    i.state = stateC.state
                }
*/
                /*let stateD = getDataFromCache('ul:data', i.storageKeyValue)
                if (stateD) {
                    i.endpoint = stateD.endpoint
                    i.data = stateD.data
                    i.cached = true
                }*/
            }
        } else {
            let contentAndEndpoint = processUrl(data, blocks)
            i.sidebar = contentAndEndpoint.sidebar
            i.leftbar = contentAndEndpoint.leftbar
            i.link = item.link
            i.hideInTop = item.hideInTop
            i.item = item
            i.ident = item.ident
            i.addon = item.addon
            if (i.link == 'friend-requests') {
                i.addon = { text: item.addon || '', variant: 'primary' }
            }
            i.menu_settings = appSetting('layout', 'user_remote_config') && item.config ? strToObj(item.config) : item.settings;
            i.icon = item.icon
            i.inited = false
            i.storageKeyValue = storageKey(i.link, false)
            i.data = []
            i.config = null
            /*if (appSetting('cache', 'list')) {
                let stateC = getDataFromCache('ul:state', i.storageKeyValue)
                if (stateC) {
                    //i.endpoint = stateC.endpoint;
                    i.state = stateC.state
                }
                let stateD = getDataFromCache('ul:data', i.storageKeyValue)
                if (stateD) {
                    i.endpoint = stateD.endpoint
                    i.data = stateD.data
                }
            }*/
        }

        return i
    })
}

export async function parseData(routes, index, setRoutes, newData) {
    const currentRoute = routes.find((item) => item.index === index)
    if (
        currentRoute &&
        currentRoute.endpoint &&
        !currentRoute.endpoint.finished
    ) {
        let params = { ...currentRoute.endpoint.params }
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
        let isFinished = currentRoute.endpoint.finished !== finished
        let endpoint = currentRoute.endpoint

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
                routes,
                false,
                false,
                null
            )
        }
        return { data: newData, endpoint: endpoint }
    }
    return { data: [], endpoint: currentRoute.endpoint }
}

export async function fetchAndUpdateData(routes, index, setRoutes) {
    const currentRoute = routes.find((item) => item.index === index)
    if (!currentRoute.inited) {
        let link = currentRoute.link
        if (currentRoute.link.includes('?')) {
            const urlObj = parseUrl(currentRoute.link) 

            let obj = parseQueryString(urlObj.queryString)
            link =
                urlObj.path.replace('/', '') +
                '&params[]=&params[]=' +
                JSON.stringify(obj)
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
            routes,
            contentAndEndpoint.sidebar,
            contentAndEndpoint.leftbar,
            sResponse.data
        )
    }
}
/* new logic */
export async function getDataForRoute(routes, index, setRoutes) {
    const currentRoute = routes.find((item) => item.index === index)
    if (!currentRoute.inited) {
        let link = currentRoute.link
        if (currentRoute.link.includes('?')) {
            const urlObj = parseUrl(currentRoute.link) 

            let obj = parseQueryString(urlObj.queryString)
            link =
                urlObj.path.replace('/', '') +
                '&params[]=&params[]=' +
                JSON.stringify(obj)
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
            routes,
            contentAndEndpoint.sidebar,
            contentAndEndpoint.leftbar,
            sResponse.data
        )
    }
}

export function addMoreData(
    newItems,
    endpoint,
    setRoutes,
    index,
    blocks,
    routes,
    sidebar = false,
    leftbar = false,
    pageData = null
) {
    let hasChanged = false

    const updatedRoutes = routes.map((route) => {
        if (route.index !== index) {
            return route
        }

        hasChanged = true

        const updatedRoute = {
            ...route,
            endpoint,
            inited: true,
            data: route.data.concat(newItems),
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

    if (hasChanged) {
        setRoutes(updatedRoutes)
    }
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
    const content = items.filter(item => (item?.content?.[0].type !== 'browse' && item?.content?.[0].type !== 'browse_list')).map(block => ({
        data: block,
        id: `block-${block?.id}`,
        type: 'block',
        block: { name: block?.source },
    }));
    const endpoint = items.find(item => (item?.content?.[0].type === 'browse' || item?.content?.[0].type === 'browse_list'));
    return { content: content, endpoint: endpoint?.content?.[0].data }
}

function processParsedUrl(data, blocks) {
    const cellCenter = mapLayoutBlocks(data.elements.cell_center);
    const cellRight = mapLayoutBlocks(data.elements.cell_right);
    const cellLeft = mapLayoutBlocks(data.elements.cell_left);
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
                className={`${isHideOnDesktop ? '' : 'mx-auto'} w-full ${conductorTheme.menu_max_width
                    }`}
            >
                <Row
                    className=" items-center justify-between ">
                    {children}
                    {layout != 'mixed' && (
                        <Row className={`hidden ${conductorTheme.hide_top_menu_from}:flex cond-buttons-add`}>
                            {addButtons}
                        </Row>
                    )}
                </Row>
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
    const settings = getPageSettings(item?.config, item.key);
    let icon = !item.ident
        ? settings?.icon
            ? settings?.icon
            : item?.icon.replace('*', '')
        : item.icon.replace('*', '')

    const addon = getAddon(a.addon)
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