import { appSetting, menuItemsByName, getURI, parseUrl, parseQueryString, storageKey, getDataFromCache, storageSet } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import { View, Row } from 'app/design/view';
import { BlockByName2 } from 'app/components/block';
import Unit from 'app/components/unit';
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon';
import { Pressable } from 'app/design/view'
import { Button } from 'app/design/controls';
import { getBlocksFromData } from 'app/lib/util';
import { memo,useCallback, useRef, useMemo  } from 'react';

export function getBackButtonWeb() {
    if (history.length > 2) {
        return (
            <Pressable className=" lg:hidden bg-bgrcard backdrop-blur dark:bg-bgrcard-d mr-2 w-10 h-10 text-neutral-800 dark:text-neutral-200 border border-bdrcard dark:border-bdrcard-d rounded-full justify-center items-center" onPress={() => history.back()} >
                <Icon icon="ArrowLeft" width={24} height={24} />
            </Pressable>
        )
    }
    return <></>
}

export function processBlocks(blocks) {
    let leftBlocks = [];

    if (blocks) {
        leftBlocks = Object.entries(blocks)
            .filter(([key, value]) => value.leftbar)
            .map(([key, value]) => ({
                key,
                ...value,
            }));
        blocks = Object.entries(blocks)
            .filter(([key, value]) => !value.leftbar)
            .map(([key, value]) => ({
                key,
                ...value,
            }));
    }

    return { mainBlocks: blocks, leftBlocks: leftBlocks }
}

export function handleFeedLayoutData(layoutData, data) {

    if (layoutData && layoutData?.type == 'feed:new_content') {
        if (layoutData.data?.id) {
            let insertIndex = data.findIndex(item => item.type !== 'block');
            if (insertIndex === -1) {
                data.splice(data.length, 0, layoutData.data);
            }
            else {
                data.splice(insertIndex, 0, layoutData.data);
            }
        }
        if (Array.isArray(layoutData.data)) {
            let insertIndex = data.findIndex(item => item.type !== 'block');
            if (insertIndex === -1) {
                data.splice(data.length, 0, ...layoutData.data);
            }
            else {
                data.splice(insertIndex, 0, ...layoutData.data);
            }
        }
    }
    if (layoutData && layoutData?.type == 'feed:remove_content') {
        data = data.filter(item => item.id !== layoutData.data);
    }
    return data;
}

export function fillTabs(menu, data, blocks, currentUser, useSectionAsMenu) {
    const m = menuItemsByName(menu.object, menu.items, currentUser, data.url);
    return m.map((item, index) => {

        item.link = item.link.replace('page/', '')
        //TOFIX
        const i = { key: item.link, title: item.title, index };
        //  let bCurrent = getURI(item.link) === data.uri;
        let bCurrent = data.url.includes(item.link);
        if (useSectionAsMenu) {
            let b = parseUrl(item.link);
            let d = parseQueryString(b?.queryString);
            let c = parseUrl(data.url);
            let e = parseQueryString(c?.queryString);

            bCurrent = e?.section == d?.section;
        }
        if (bCurrent) {

            let contentAndEndpoint = processUrl(data, blocks);
            i.data = contentAndEndpoint.content;
            i.inited = true;
            i.link = item.link;
            i.hideInTop = item.hideInTop;
            i.ident = item.ident;
            i.addon = item.addon;
            if (i.link == 'friend-requests') {
                i.addon = { text: item.addon, variant: 'primary' };
            }
            i.menu_settings = item.settings;
            i.icon = item.icon;
            i.endpoint = contentAndEndpoint.endpoint;
            i.sidebar = contentAndEndpoint.sidebar;
            i.storageKeyValue = storageKey(i.link, false)
            i.blocks = blocks;

            if (appSetting('cache', 'list')) {
                let stateC = getDataFromCache('ul:state', i.storageKeyValue);
                if (stateC) {
                    // i.endpoint = stateC.endpoint;
                    i.state = stateC.state
                }

                let stateD = getDataFromCache('ul:data', i.storageKeyValue);
                if (stateD) {
                    i.endpoint = stateD.endpoint;
                    i.data = stateD.data;
                }
            }

        } else {
            let contentAndEndpoint = processUrl(data, blocks);
            i.sidebar = contentAndEndpoint.sidebar;
            i.link = item.link;
            i.hideInTop = item.hideInTop;
            i.ident = item.ident;
            i.addon = item.addon;
            if (i.link == 'friend-requests') {
                i.addon = { text: item.addon, variant: 'primary' };
            }
            i.menu_settings = item.settings;
            i.icon = item.icon;
            i.inited = false;
            i.storageKeyValue = storageKey(i.link, false);
            i.data = [];
            if (appSetting('cache', 'list')) {
                let stateC = getDataFromCache('ul:state', i.storageKeyValue);
                if (stateC) {
                    //i.endpoint = stateC.endpoint;
                    i.state = stateC.state
                }
                let stateD = getDataFromCache('ul:data', i.storageKeyValue);
                if (stateD) {
                    i.endpoint = stateD.endpoint;
                    i.data = stateD.data;
                }
            }
        }

        return i;
    });
}

export async function parseData(routes, index, setRoutes, newData) {
    const currentRoute = routes.find((item) => item.index === index);
    if (currentRoute && currentRoute.endpoint && !currentRoute.endpoint.finished) {
        let params = { ...currentRoute.endpoint.params };
        const sRequest = currentRoute.endpoint.request_url + JSON.stringify({ params });

        const sResponse = await fetcher(sRequest);
        const newData = sResponse.data[0]?.data?.data ? sResponse.data[0]?.data?.data : [];
        let finished = newData?.length === 0 || !newData;
        let zeroRes = currentRoute.endpoint.request_url.includes('bx_timeline') ? newData?.length == 0 : newData?.length < params.per_page //FIX COUNT FROM FEED less then per_page it's normal

        if (params?.per_page && zeroRes) {
            finished = true;
        }
        let isFinished = (currentRoute.endpoint.finished !== finished)
        let endpoint = currentRoute.endpoint
        endpoint.finished = finished;


        let ld = sResponse.data[0]?.data.params;

        if (ld) {
            params.start = parseInt(ld.start) + parseInt(ld.per_page);
        }
        endpoint.params = params;


        if (newData.length > 0 || isFinished) {
            addMoreData(newData, endpoint, setRoutes, index, {}, routes, false, null);
        }
        return { data: newData, endpoint: endpoint };
    }
    return { data: [], endpoint: currentRoute.endpoint };
}

export async function fetchAndUpdateData(routes, index, setRoutes) {

    const currentRoute = routes.find((item) => item.index === index);
    if (!currentRoute.inited) {
        let link = currentRoute.link
        if (currentRoute.link.includes('?')) {
            const urlObj = parseUrl(currentRoute.link); // Base URL is required if your URL is relative
            const queryString = urlObj.queryString;

            let obj = parseQueryString(urlObj.queryString)
            link = urlObj.path.replace('/', '') + '&params[]=&params[]=' + JSON.stringify(obj);

        }
        const sResponse = await fetcher('/api.php?r=system/get_page_by_request/TemplServicePages&params[]=' + link);
        let settings = appSetting('layouts', getURI(currentRoute.link));
        let blocks = settings?.blocks;
        if (!blocks)
            blocks = getBlocksFromData(sResponse.data);

        let contentAndEndpoint = processUrl(sResponse.data, settings?.blocks);
        addMoreData(contentAndEndpoint.content, contentAndEndpoint.endpoint, setRoutes, index, blocks, routes, contentAndEndpoint.sidebar, sResponse.data)
    }
}

export function addMoreData(newItems, endpoint, setRoutes, index, blocks, routes, sidebar, pageData) {
    sidebar = sidebar || false;
    pageData = pageData || null;

    const updatedRoutes = routes.map((route) => {
        if (route.index === index) {
            route.endpoint = endpoint;

            if (blocks && !route.blocks)
                route.blocks = blocks

            if (pageData && !route.pageData)
                route.pageData = pageData


            if (sidebar)
                route.sidebar = sidebar

            route.inited = true;
            storageSet('ul:data', route.storageKeyValue, { data: route.data.concat(newItems), endpoint: route.endpoint });
            return {
                ...route,
                data: route.data.concat(newItems),
            };


        }

        return route;
    });
    if (routes != updatedRoutes)
        setRoutes(updatedRoutes);
};

export function getContent(data, block) {
    const blockName = block.name;
    const b = Object.values(data?.elements)
        .flatMap(Object.values)
        .find(element => element.content && element.source === blockName);

    return b?.content[0]?.type === 'browse'
        ? { data: b.content[0].data, type: 'browse' }
        : { data: b, type: 'block', block: block };
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
    };
}

function processContent(acc, b) {
    if (b?.data?.id) {
        return [...acc.content, { ...b, id: `block-${b.data.id}`, type: 'block' }];
    }
    return acc.content;
}

function processBrowse(acc, b) {
    acc.endpoint = processEndpoint(acc, b);
    acc.content = [...acc.content, ...b.data.data];
    return acc;
}

export function processUrl(data, blocks) {
    if (!blocks)
        blocks = getBlocksFromData(data);

    const contentAndEndpoint = Object.values(blocks).reduce((acc, block) => {
        const b = getContent(data, block);

        if (b.type === 'browse') {
            if (block.sidebar) {
                acc.sidebar = processBrowse(acc.sidebar, b);
            } else {
                acc = processBrowse(acc, b);
            }
        } else {
            if (block.sidebar) {
                acc.sidebar.content = processContent(acc.sidebar, b);
            } else {
                if (!block.hidden && !block.leftbar)
                    acc.content = processContent(acc, b);
            }
        }
        return acc;
    }, { content: [], endpoint: null, sidebar: { endpoint: null, content: [] } });

    return contentAndEndpoint;
}

function ItemRenderer_({ route, numColumns, item, unit, module, unitMode, unitType, sidebar }) {
    const b = useMemo(() => {
        if (item?.type === 'block') {
            let block = BlockByName2({ b: item.data, name: item.block });
            if (!block) {
                return <View className='h-[1px]'><Text>&nbsp;</Text></View>;
            }
            return (
                <View key={`${route.index}-${item.id}`} className={numColumns > 1 ? 'w-full' : 'w-full'}>
                    {block}
                </View>
            );
        } else {
            return (
                <View key={`${route.index}-${item.id}`} className={numColumns > 1 ? 'w-full' : 'w-full'}>
                    <Unit unitType={unitType} module={module} unit={unit} data={item} mode={unitMode} />
                </View>
            );
        }
    }, [route.index, item, numColumns, unit, module, unitMode, unitType]);

    return b;
}
export function ItemRenderer({ route, numColumns, item, unit, module, unitMode, unitType, sidebar }) {
    const renderedItemsRef = useRef(new Map());

    const key = `${item.id}`;
    const renderedItem = useMemo(() => {
        if (renderedItemsRef.current.has(key)) {
            return renderedItemsRef.current.get(key);
        }
        const newItem = (
            <ItemRenderer_
                unitType={unitType}
                unitMode={unitMode}
                route={route}
                item={item}
                unit={route?.endpoint?.unit}
                module={route?.endpoint?.module}
            />
        );
        renderedItemsRef.current.set(key, newItem);
        return newItem;
    }, [key, unitType, unitMode, route, item]);

    return renderedItem;
}
//export const ItemRenderer = memo(ItemRenderer_);
/*
const ItemRenderer = memo(function ItemRenderer({ route, numColumns, item, unit, module, unitMode, unitType, sidebar }) {
    console.log("ItemRenderer_", item?.id);
    
    const renderBlock = useCallback(() => {
        let b = BlockByName2({ b: item.data, name: item.block });
        if (!b) return <View className='h-[1px]'><Text>&nbsp;</Text></View>;
        return b;
    }, [item.data, item.block]);

    const renderUnit = useCallback(() => (
        <Unit unitType={unitType} module={module} unit={unit} data={item} mode={unitMode} />
    ), [unitType, module, unit, item, unitMode]);

    if (item?.type === 'block') {
        return (
            <View key={`${route.index}-${item.id}`} className={numColumns > 1 ? 'w-full' : 'w-full'}>
                {renderBlock()}
            </View>
        );
    } else {
        return (
            <View key={`${route.index}-${item.id}`} className={numColumns > 1 ? 'w-full' : 'w-full'}>
                {renderUnit()}
            </View>
        );
    }
});
*/

export function LeftSidebar({ title, addButtons, children, width }) {
    return (
        <View className={" hidden lg:block " + width}>
            <View className={' fixed-process ' + width + ' lg:px-4 lg:py-3 '}>
                {(!!title && !!addButtons) && <Row className="justify-between items-center mt-1 mb-4 ml-1 ">
                    <Text className="text-2xl truncate mr-auto font-bold  text-neutral-700 dark:text-neutral-100 hidden lg:flex flex-row items-center gap-x-2 ">
                        {title}
                    </Text>
                    <Row className=" ">
                        {addButtons}
                    </Row>
                </Row>}
                <View className=' hidden flex-col gap-y-1 lg:flex '>
                    {children}
                </View>
            </View>
        </View>
    )
}

export function TopSidebar({ styles, isWeb, leftSideBar, header, headerSettings, addButtons, children, isSmall, title, layout, showMenu, isDrawer }) {
    const isUseBg = appSetting('layout', 'use_background');
    return (
        <View style={styles} className={(leftSideBar ? 'lg:hidden' : '') + " w-full items-left justify-center lg:h-16 bg-bgrnavbar dark:bg-bgrnavbar-d " + (isUseBg ? "  bg-white dark:bg-neutral-800 border-b border-bdr dark:border-bdr-d  " : (isSmall ? "   bg-white dark:bg-neutral-800 border-b border-bdr dark:border-bdr-d  " : "  border-b border-bdr dark:border-bdr-d "))}  >
            <View className={(leftSideBar ? appSetting('layout', 'max_width') : appSetting('layout', 'max_width') + ' mx-auto ') + ' lala w-full '}>
                {!header && isWeb && <Row className="lg:hidden flex-row gap-x-1 flex-none items-center justify-between h-16 border-b bg-bgrnavbar dark:bg-bgrnavbar-d backdrop-blur border-bdrnavbar dark:border-bdrnavbar-d">
                    <Row className="items-center px-3 sm:px-4">

                        {headerSettings.header && getBackButtonWeb()}
                        {(headerSettings.header == false && headerSettings.menu == true && isDrawer) && <View className="lg:hidden mr-3 sm:mr-4"><Pressable onPress={showMenu}>
                            <Button
                                variant="outline"
                                startDecorator="List"
                                rounded
                                align="start"
                            />

                        </Pressable></View>}
                        {headerSettings.title && <Text className="text-2xl sm:text-3xl lg:hidden font-bold text-neutral-800 dark:text-neutral-200">{title}</Text>}
                    </Row>
                    <Row className="px-3 sm:px-4">
                        {addButtons}
                    </Row>
                </Row>
                }
                <Row className="items-center ">
                    {title ? <Text className="text-3xl my-auto mx-5 font-semibold text-neutral-800  tracking-tight dark:text-neutral-200 hidden lg:flex">{title}</Text> : <Text className=" hidden lg:flex"></Text>}
                    {children}
                    {layout != 'mixed' && <Row className="hidden lg:flex px-4 cond-buttons-add">
                        {addButtons}
                    </Row>}
                </Row>
            </View>
        </View>
    );

}