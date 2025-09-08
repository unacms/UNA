import {
    appSetting,
    menuItemsByName,
    getURI,
    parseUrl,
    parseQueryString,
    storageKey,
    getDataFromCache,
    storageSet,
} from 'app/lib/util'
import { fetcher } from 'app/lib/fetcher'
import { View, Row } from 'app/design/view'
import Unit from 'app/components/unit'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import { Pressable } from 'app/design/view'
import { Button } from 'app/design/controls'
import {
    getBlocksFromData,
    getPageSettings,
    LAYOUT_BREAKPOINTS,
} from 'app/lib/util'
import { memo } from 'react'
import { Platform } from 'react-native'
import { callFn } from 'app/lib/functions/call'
import { useTranslation } from 'react-i18next'
import { useCurrentUser } from 'app/context/user'
import { TextHeader } from 'app/ui/molecules/scroll_list_header'
import { cd } from 'app/lib/util'

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

export function handleFeedLayoutData(layoutData, data) {
    if (layoutData && layoutData?.type == 'feed:new_content') {
        if (layoutData.data?.id) {
            let insertIndex = data.findIndex((item) => item.type !== 'block')
            if (insertIndex === -1) {
                data.splice(data.length, 0, layoutData.data)
            } else {
                data.splice(insertIndex, 0, layoutData.data)
            }
        }
        if (Array.isArray(layoutData.data)) {
            let insertIndex = data.findIndex((item) => item.type !== 'block')
            if (insertIndex === -1) {
                data.splice(data.length, 0, ...layoutData.data)
            } else {
                data.splice(insertIndex, 0, ...layoutData.data)
            }
        }
    }
    if (layoutData && layoutData?.type == 'feed:remove_content') {
        data = data.filter((item) => item.id !== layoutData.data)
    }
    return data
}

export function fillTabs(
    menu,
    data,
    blocks,
    currentUser,
    useSectionAsMenu,
    leftSideBarBlocks
) {
    let menuItems = menuItemsByName(
        menu.object,
        menu.items,
        currentUser,
        data.url,
        menu?.config
    )
    // Forcefully filter out 'friend-suggestions'
    menuItems = menuItems.filter(
        (item) =>
            item.link !== 'friend-suggestions' &&
            item.key !== 'friend-suggestions' &&
            item.name !== 'friend-suggestions'
    )

    return menuItems.map((item, index) => {
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
            i.menu_settings = item.settings
            i.icon = item.icon
            i.endpoint = contentAndEndpoint.endpoint
            i.sidebar = contentAndEndpoint.sidebar
            i.config = data?.config
            i.storageKeyValue = storageKey(i.link, false)
            i.blocks = blocks
            i.leftSideBarBlocks = leftSideBarBlocks
            i.pageData = data
            if (appSetting('cache', 'list')) {
                let stateC = getDataFromCache('ul:state', i.storageKeyValue)
                if (stateC) {
                    // i.endpoint = stateC.endpoint;
                    i.state = stateC.state
                }

                let stateD = getDataFromCache('ul:data', i.storageKeyValue)
                if (stateD) {
                    i.endpoint = stateD.endpoint
                    i.data = stateD.data
                    i.cached = true
                }
            }
        } else {
            let contentAndEndpoint = processUrl(data, blocks)
            i.sidebar = contentAndEndpoint.sidebar
            i.link = item.link
            i.hideInTop = item.hideInTop
            i.item = item
            i.ident = item.ident
            i.addon = item.addon
            if (i.link == 'friend-requests') {
                i.addon = { text: item.addon || '', variant: 'primary' }
            }
            i.menu_settings = item.settings
            i.icon = item.icon
            i.inited = false
            i.storageKeyValue = storageKey(i.link, false)
            i.data = []
            i.config = null
            if (appSetting('cache', 'list')) {
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
            }
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
        let zeroRes = newData?.length == 0 || newData?.length < params.per_page //Commented for valid timeline calculation if some items groupped
        if (params?.per_page && zeroRes) {
            finished = true
        }
        let isFinished = currentRoute.endpoint.finished !== finished
        let endpoint = currentRoute.endpoint

        endpoint.finished = finished

        let ld = sResponse.data[0]?.data.params

        if (ld) {
            params.start = parseInt(ld.start) + parseInt(ld.per_page)
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
            const urlObj = parseUrl(currentRoute.link) // Base URL is required if your URL is relative
            const queryString = urlObj.queryString

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

        //  let settings = appSetting('l-ayouts', getURI(currentRoute.link));
        const settings = getPageSettings(
            sResponse.data?.config,
            getURI(currentRoute.link)
        )
        let blocks = settings?.blocks
        if (!blocks) blocks = getBlocksFromData(sResponse.data)

        let contentAndEndpoint = processUrl(sResponse.data, settings?.blocks)
        addMoreData(
            contentAndEndpoint.content,
            contentAndEndpoint.endpoint,
            setRoutes,
            index,
            blocks,
            routes,
            contentAndEndpoint.sidebar,
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
            const blocks2 = processBlocks(updatedRoute.blocks)
            updatedRoute.leftSideBarBlocks = blocks2.leftBlocks
        }

        if (pageData?.config && !route.config) {
            updatedRoute.config = pageData?.config
        }

        if (sidebar) {
            updatedRoute.sidebar = sidebar
        }

        storageSet('ul:data', updatedRoute.storageKeyValue, {
            data: updatedRoute.data,
            endpoint: updatedRoute.endpoint,
        })

        return updatedRoute
    })

    if (hasChanged) {
        setRoutes(updatedRoutes)
    }
}

export function getContent(data, block) {
    const blockName = block.name
    const b = Object.values(data?.elements)
        .flatMap(Object.values)
        .find((element) => element.content && element.source === blockName)

    return b?.content[0]?.type === 'browse' && !block.sidebar
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

function processContent(acc, b) {
    if (b?.data?.id || b.block?.id) {
        return [
            ...acc.content,
            { ...b, id: `block-${b.data?.id || b.block?.id}`, type: 'block' },
        ]
    }
    return acc.content
}

function processBrowse(acc, b) {
    acc.endpoint = processEndpoint(acc, b)
    acc.content = [...acc.content, ...b.data.data]
    return acc
}

export function processUrl(data, blocks) {
    if (!blocks) blocks = getBlocksFromData(data)

    const contentAndEndpoint = Object.values(blocks).reduce(
        (acc, block) => {
            const b = getContent(data, block)

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
            return acc
        },
        {
            content: [],
            endpoint: null,
            sidebar: { endpoint: null, content: [] },
        }
    )

    return contentAndEndpoint
}

export function getNumCols(currentBreakpoint, currentRoute, leftSideBar) {
    const customNumCol = callFn('getNumColsForConductor', [
        currentBreakpoint,
        currentRoute,
        leftSideBar,
    ])
    if (customNumCol > 0) return customNumCol
    const isWeb = Platform.OS === 'web'
    const blocksroutes = currentRoute?.blocks

    if (currentRoute?.endpoint == null) return 1

    if (blocksroutes) {
        const blockKeys = Object.keys(blocksroutes)
        for (const key of blockKeys) {
            if (blocksroutes[key].perLine > 0 && currentBreakpoint > 0) {
                return blocksroutes[key].perLine
            }
        }
    }
    if (currentRoute?.endpoint?.unit == 'feed') return 1

    let perLineSettings = []
    if (currentRoute?.endpoint && currentRoute?.endpoint?.request_url) {
        perLineSettings = appSetting('browse', 'per_line_profile')
    }
    if (
        currentRoute?.endpoint?.request_url.includes('TemplServiceProfiles') ||
        currentRoute?.endpoint?.unit.includes('-profile-') ||
        currentRoute?.endpoint?.unit.includes('-context-')
    ) {
        perLineSettings = appSetting('browse', 'per_line_profile')
    }
    if (
        leftSideBar &&
        currentRoute?.endpoint &&
        currentRoute?.endpoint?.request_url
    ) {
        perLineSettings = appSetting('browse', 'per_line_left_side_bar')
    }
    const perLineSettingsByModule = appSetting(
        'browse',
        'per_line_' + currentRoute?.endpoint?.module
    )
    if (perLineSettingsByModule) {
        perLineSettings = perLineSettingsByModule
    }

    for (let i = 0; i < perLineSettings.length; i++) {
        if (currentBreakpoint >= perLineSettings[i].width) {
            const count = perLineSettings[i].count
            return isWeb ? count : count > 1 ? count - 1 : count
        }
    }

    return 1
}

export function LeftSidebar({ title, addButtons, children, width, menu }) {
    const { t } = useTranslation()
    return (
        <View className={` ${appSetting('conductor', 'sidebar_container')}`}>
            <View style={{ height: 64 }} />
                {(!!title || !!addButtons?.length > 0) && (
                    <Row className="sticky top-[64px] z-10 justify-between items-center h-12 px-2 py-1.5 mb-2.5 z-10 ">
                        <Text className=" text-2xl tracking-tight truncate mr-auto font-bold leading-11 text-card-foreground hidden lg:flex  ">
                            {t(title)}
                        </Text>
                        <Row>{addButtons}</Row>
                    </Row>
                )}
                <View className="flex-1">
                {children}
                </View>
            
        </View>
    )
}

export function TopSidebar({
    styles,
    leftSideBar,
    addButtons,
    children,
    title,
    layout,
    omitDefaultBackground = false,
}) {
    const { currentUser } = useCurrentUser()
    return (
        <View
            style={styles}
            className={` ${!omitDefaultBackground ? conductorTheme.menu : ''} ${
                leftSideBar ? 'lg:hidden' : ''
            }`}
        >
            <View
                className={`${leftSideBar ? '' : 'mx-auto'} w-full ${
                    conductorTheme.menu_max_width
                }`}
            >
                <Row
                    className=" items-center justify-between ">
             
                    <Text className="text-2xl text-card-foreground tracking-tight hidden ">
                        {title}
                    </Text>
                    {!currentUser && title ? (
                        <View className="">
                            <TextHeader text={title} />
                        </View>
                    ) : null}
                    {children}
                    {layout != 'mixed' && (
                        <Row className="hidden lg:flex cond-buttons-add">
                            {addButtons}
                        </Row>
                    )}
                </Row>
            </View>
        </View>
    )
}
