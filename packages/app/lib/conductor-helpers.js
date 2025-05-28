import { appSetting, menuItemsByName, getURI, parseUrl, parseQueryString, storageKey, getDataFromCache, storageSet } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import { View, Row } from 'app/design/view';
import { BlockByName2 } from 'app/components/block';
import Unit from 'app/components/unit';
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon';
import { Pressable } from 'app/design/view'
import { Button } from 'app/design/controls';
import { getBlocksFromData, getPageSettings, LAYOUT_BREAKPOINTS } from 'app/lib/util';
import { memo } from 'react';
import { Platform } from 'react-native'
import { callFn } from 'app/lib/functions/call';
import { useTranslation } from 'react-i18next';

const conductorTheme = appSetting('theme', 'conductor');

export function getBackButtonWeb() {
    const isWeb = Platform.OS === 'web';
    if (!isWeb) return <></>;
    if (history.length > 2) {
        return (
            <View className="lg:hidden mr-1"  >
               <Button rounded={true} variant="secondary" size="sm" ring="p-1" startDecorator="ArrowLeft" onPress={() => history.back()}/>
            </View>
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

export function fillTabs(menu, data, blocks, currentUser, useSectionAsMenu, leftSideBarBlocks) {
    let menuItems = menuItemsByName(menu.object, menu.items, currentUser, data.url, menu.config);
    // Forcefully filter out 'friend-suggestions'
    menuItems = menuItems.filter(item => item.link !== 'friend-suggestions' && item.key !== 'friend-suggestions' && item.name !== 'friend-suggestions');
    
    return menuItems.map((item, index) => {

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
                i.addon = { text: item.addon || '', variant: 'primary' };
            }
            i.menu_settings = item.settings;
            i.icon = item.icon;
            i.endpoint = contentAndEndpoint.endpoint;
            i.sidebar = contentAndEndpoint.sidebar;
            i.config = data.config
            i.storageKeyValue = storageKey(i.link, false)
            i.blocks = blocks;
            i.leftSideBarBlocks = leftSideBarBlocks;
            i.pageData = data;
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
                    i.cached = true;
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
                i.addon = { text: item.addon || '', variant: 'primary' };
            }
            i.menu_settings = item.settings;
            i.icon = item.icon;
            i.inited = false;
            i.storageKeyValue = storageKey(i.link, false);
            i.data = [];
            i.config = null
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
        let zeroRes =  newData?.length == 0 || newData?.length < params.per_page //Commented for valid timeline calculation if some items groupped
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

      //  let settings = appSetting('l-ayouts', getURI(currentRoute.link));
        const settings = getPageSettings(sResponse.data.config, getURI(currentRoute.link));
        let blocks = settings?.blocks;
        if (!blocks)
            blocks = getBlocksFromData(sResponse.data);

        let contentAndEndpoint = processUrl(sResponse.data, settings?.blocks);
        addMoreData(contentAndEndpoint.content, contentAndEndpoint.endpoint, setRoutes, index, blocks, routes, contentAndEndpoint.sidebar, sResponse.data)
    }
}

export function addMoreData(newItems, endpoint, setRoutes, index, blocks, routes, sidebar = false, pageData = null) {

    console.log("initedTabs2", pageData)
    let hasChanged = false;

    const updatedRoutes = routes.map((route) => {
        if (route.index !== index) {
            return route;
        }

        hasChanged = true;

        const updatedRoute = {
            ...route,
            endpoint,
            inited: true,
            data: route.data.concat(newItems),
        };

        if (blocks && !route.blocks) {
            updatedRoute.blocks = blocks;
        }

        if (pageData && !route.pageData) {
           
            updatedRoute.pageData = pageData;

            const blocks2 = processBlocks(updatedRoute.blocks);

            updatedRoute.leftSideBarBlocks = blocks2.leftBlocks;
            console.log("initedTabs3", updatedRoute.pageData)
        }

        if (pageData?.config && !route.config) {
            updatedRoute.config = pageData?.config;
        }

        if (sidebar) {
            updatedRoute.sidebar = sidebar;
        }

        storageSet('ul:data', updatedRoute.storageKeyValue, {
            data: updatedRoute.data,
            endpoint: updatedRoute.endpoint,
        });

        return updatedRoute;
    });


    if (hasChanged) {
        setRoutes(updatedRoutes);
    }
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
            if (block.sidebar ) {
                acc.sidebar.content = processContent(acc.sidebar, b);
            } 
            if (!block.sidebar || block.list) {
                if (!block.hidden && !block.leftbar)
                    acc.content = processContent(acc, b);
            }
        }
        return acc;
    }, { content: [], endpoint: null, sidebar: { endpoint: null, content: [] } });

    return contentAndEndpoint;
}

function ItemRenderer_({ route, numColumns, item, unit, module, unitMode, unitType, sidebar }) {

    // return <View className='bg-red-500 h-12 w-full'></View>
    //   const b = useMemo(() => {
    if (item?.type === 'block') {
        const block = BlockByName2({ b: item.data, name: item.block });
        if (!block) {
            return <View className='h-[1px]'><Text>&nbsp;</Text></View>;
        }
        return (
            <View className={`${block?.props?.extraProps?.list && !sidebar ? 'lg:h-[1px] overflow-hidden' : ''}`} key={`${route.index}-${item.id}`}>
                {block}
            </View>
        );
    } else {
        return (
            <View key={`${route.index}-${item.id}`}>
                <Unit unitType={unitType} module={module} unit={unit} data={item} mode={unitMode} />
            </View>
        );
    }
    /* }, [route.index, item, numColumns, unit, module, unitMode, unitType]);
 
     return b;*/
}

// AVOID BLINKING
export const ItemRenderer = memo(ItemRenderer_);
export const ItemRendererMemo = memo(ItemRenderer);
/*export const ItemRenderer = memo(ItemRenderer_, (prevProps, nextProps) => {
    return prevProps.item.id === nextProps.item.id; 
});*/


export function getNumCols(width, currentRoute, leftSideBar) {
    const customNumCol = callFn("getNumColsForConductor", [width, currentRoute, leftSideBar]);
    if (customNumCol > 0)
        return customNumCol;
    const isWeb = Platform.OS === 'web';
    const blocksroutes = currentRoute?.blocks;

    if (blocksroutes) {
        const blockKeys = Object.keys(blocksroutes);
        for (const key of blockKeys) {
            if (blocksroutes[key].perLine > 0 && width> LAYOUT_BREAKPOINTS.sm) {
                return blocksroutes[key].perLine;
            }
        }
    }
    if (currentRoute?.endpoint?.unit == 'feed')
        return 1;

    let perLineSettings = [];
    if (currentRoute?.endpoint && currentRoute?.endpoint?.request_url){
        perLineSettings = appSetting('browse', 'per_line_profile');
    }
    if (currentRoute?.endpoint?.request_url.includes('TemplServiceProfiles') || currentRoute?.endpoint?.unit.includes('-profile-') || currentRoute?.endpoint?.unit.includes('-context-')) {
        perLineSettings = appSetting('browse', 'per_line_profile');
    }
    if (leftSideBar && currentRoute?.endpoint && currentRoute?.endpoint?.request_url) {
        perLineSettings = appSetting('browse', 'per_line_left_side_bar');
    }
    const perLineSettingsByModule = appSetting('browse', 'per_line_'+currentRoute?.endpoint?.module);
    if (perLineSettingsByModule){
        perLineSettings=perLineSettingsByModule;
    }

    for (let i = 0; i < perLineSettings.length; i++) {
        if (width > perLineSettings[i].width) {
            const count = perLineSettings[i].count;
            return isWeb ? count : (count > 1 ? count - 1 : count);
        }
    }

    return 1;
};

export function LeftSidebar({ title, addButtons, children, width, menu }) {
    const sidebar = appSetting('conductor', 'sidebar_position')
    const { t } = useTranslation();
    return (
        <View className={`lg:${width}`}>
            <View className={` ${sidebar =='fixed'? 'fixed-process' : ''} lg:${width} p-4 gap-y-1`}>
                {(!!title || !!addButtons?.length > 0) && <Row className="justify-between items-center px-[4px] pb-2 z-10 ">
                    <Text className=" text-2xl tracking-tight truncate mr-auto font-bold leading-[48px] text-neutral-900 dark:text-neutral-100 hidden lg:flex  ">
                        {t(title)}
                    </Text>
                    <Row className=" ">
                        {addButtons}
                    </Row>
                </Row>}
                
                    {children}
                
            </View>
        </View>
    )
}

export function TopSidebar({ styles, isWeb, leftSideBar, header, headerSettings, addButtons, children, isSmall, title, layout, showMenu, isDrawer }) {
    const isUseBg = appSetting('cover', 'use_background');
    
    return (
        <View
            style={styles}
            className={ ` ${conductorTheme.menu} ${leftSideBar ? 'lg:hidden' : ''
                } ${isUseBg
                    ? ' '
                    : /*isSmall
                        ? ' backdrop-blur-xl '
                        : */''
                }`}
        >
            <View className={`${leftSideBar ? '' : ' mx-auto'}  w-full ${conductorTheme.menu_max_width}`}>
                {/*!header && isWeb && <Row className="lg:hidden flex-row gap-x-1 flex-none items-center justify-between h-16 bg-bgrnavbar dark:bg-bgrnavbar-d ">
                    
                    { layout === 'ver' && (<><Row className="items-center px-3 sm:px-4">
                        {headerSettings.header && getBackButtonWeb()}
                        {(headerSettings.header == false && headerSettings.menu == true && isDrawer) && <View className="lg:hidden mr-3 sm:mr-4"><Pressable onPress={showMenu}>
                            <Button
                                variant="secondary"
                                startDecorator="List"
                                rounded
                                align="start"
                            />

                        </Pressable></View>}
                        {headerSettings.title && <Text className="text-3xl leading-[40px] lg:hidden font-bold text-neutral-800 dark:text-neutral-200">{title}</Text>}
                    </Row>
                    <Row className="px-3 sm:px-4">
                        {addButtons}
                    </Row></>)
}
                </Row>
                */}
                <Row className=" ml-[8px] sm:ml-[12px] pb-[8px] items-center">
                    {title ? <Text className="text-2xl my-auto mx-5 pb-1 font-medium text-neutral-800 tracking-tight dark:text-neutral-200 hidden lg:flex">{title}</Text> : <Text className=" hidden lg:flex"></Text>}
                    {children}
                    {layout != 'mixed' && <Row className="hidden lg:flex px-4 cond-buttons-add">
                        {addButtons}
                    </Row>}
                </Row>
            </View>
        </View>
    );

}