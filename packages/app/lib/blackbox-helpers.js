import { appSetting, menuItemsByName, getURI, parseUrl, parseQueryString, storageKey, getDataFromCache, storageSet } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import { View } from 'app/design/view';
import { BlockByName2 } from 'app/components/block';
import Unit from 'app/components/unit';
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon';
import { Pressable } from 'app/design/view'
import { useMemo  } from 'react';

export function getBackButtonWeb() {
    if (history.length > 2){
        return (
            <Pressable className=" lg:hidden bg-bgrcard backdrop-blur dark:bg-bgrcard-d mr-4 w-10 h-10 text-neutral-800 dark:text-neutral-200 border border-bdrcard dark:border-bdrcard-d rounded-full justify-center items-center" onPress={() => history.back()} >
                <Icon icon="left" width={24} height={24} />
            </Pressable>
        )
    }
    return <></>
}
export function fillTabs(menu, data, blocks, useSectionAsMenu){
    const m = menuItemsByName(menu.object, menu.items, data.url);
    return m.map((item, index) => {
        item.link = item.link.replace('page/', '')
       //TOFIX
        const i = { key: item.link, title: item.title, index };
        let bCurrent = getURI(item.link) === data.uri;
        if (useSectionAsMenu)
            bCurrent = item.link.replace(' ', '') === data.url.replace('+', '');

        if (bCurrent) {

            let contentAndEndpoint = processUrl(data, blocks);
            i.data = contentAndEndpoint.content;
            i.inited = true;
            i.link = item.link;
            i.endpoint = contentAndEndpoint.endpoint;
            i.sidebar = contentAndEndpoint.sidebar;
            i.storageKeyValue = storageKey(i.link, false)
            i.blocks = blocks;
            
            if (appSetting('cache', 'list')){
                let stateC = getDataFromCache('ul:state', i.storageKeyValue);
                if (stateC){
                    i.endpoint = stateC.endpoint;
                    i.state = stateC.state
                }
                let stateD = getDataFromCache('ul:data', i.storageKeyValue);
                if (stateD){
                    i.data = stateD;
                }
            }

        } else {
            i.link = item.link;
            i.inited = false;
            i.storageKeyValue = storageKey(i.link, false);
            i.data = [];
            if (appSetting('cache', 'list')){
                let stateC = getDataFromCache('ul:state', i.storageKeyValue);
                if (stateC){
                    i.endpoint = stateC.endpoint;
                    i.state = stateC.state
                }
                let stateD = getDataFromCache('ul:data', i.storageKeyValue);
                if (stateD){
                    i.data = stateD;
                }
            }
        }
      
        return i;
    });
}

export async function parseData(routes, index, setRoutes, newData) {
    const currentRoute = routes.find((item) => item.index === index);
    if (currentRoute && currentRoute.endpoint && !currentRoute.endpoint.finished) {
        let params = { ...currentRoute.endpoint.params};

        const sRequest = currentRoute.endpoint.request_url + JSON.stringify({ params });

        const sResponse = await fetcher(sRequest);
        const newData = sResponse.data[0]?.data?.data? sResponse.data[0]?.data?.data : [];
        const finished = newData?.length === 0 || !newData;
        let isFinished = (currentRoute.endpoint.finished !== finished)
        let endpoint = currentRoute.endpoint
        endpoint.finished = finished;

        let ld = sResponse.data[0]?.data.params;
        if (ld){
            params.start = parseInt(ld.start) + parseInt(ld.per_page);
        }
        endpoint.params = params;


        if (newData.length > 0 || isFinished) {
            addMoreData(newData, endpoint, setRoutes, index,{}, routes);
        }
        return {data:newData, endpoint: endpoint};
    }
    return {data:[], endpoint: currentRoute.endpoint};
}

export async function fetchAndUpdateData(routes, index, setRoutes) {
   
    const currentRoute = routes.find((item) => item.index === index);
    if (!currentRoute.inited){
        let link = currentRoute.link
        if (currentRoute.link.includes('?')){
            const urlObj = parseUrl(currentRoute.link); // Base URL is required if your URL is relative
            const queryString = urlObj.queryString;

            let obj= parseQueryString(urlObj.queryString)
            link  = urlObj.path.replace('/', '') + '&params[]=&params[]='+JSON.stringify(obj);

        }
        const sResponse = await fetcher('/api.php?r=system/get_page_by_request/TemplServicePages&params[]=' + link);
        let settings = appSetting('layouts', getURI(currentRoute.link));
        let contentAndEndpoint = processUrl(sResponse.data, settings.blocks); 
        addMoreData(contentAndEndpoint.content, contentAndEndpoint.endpoint, setRoutes, index, settings.blocks, routes)
    }
}

export function addMoreData(newItems, endpoint, setRoutes, index, blocks, routes) {
    const updatedRoutes = routes.map((route) => {
        if (route.index === index) {
            route.endpoint = endpoint;
            
            if (blocks && !route.blocks)
                route.blocks = blocks

            route.inited = true;
            storageSet('ul:data', route.storageKeyValue, route.data.concat(newItems));
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
                acc.content = processContent(acc, b);
            }
        }
        return acc;
    }, { content: [], endpoint: null, sidebar: { endpoint: null, content: [] } });

    return contentAndEndpoint;
}

export function ItemRenderer({ route, numColumns, item, unit, module, unitMode, unitType }) {
    if (item?.type === 'block') {
        let b = BlockByName2({b:item.data, name:item.block})
        if (!b)
            return (<View className='h-[1px]'><Text>&nbsp;</Text></View>);

        return (
            <View key={`${route.index}-${item.id}`} className={numColumns > 1 ? 'w-full mt-2 ' : 'w-full'}>
            {b}
            </View>
        );
    } 
    else {
      return (
        <View key={`${route.index}-${item.id}`} className={numColumns > 1 ? 'w-full mt-2 ' : 'w-full'}>
            <Unit unitType={unitType} module={module} unit={unit} data={item} mode={unitMode} />
        </View>
        );
    }
}