import { appSetting, menuItemsByName, getURI } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import { View } from 'app/design/view';
import { BlockByName2 } from 'app/components/block';
import Unit from 'app/components/unit';

export function fillTabs(menu, data, blocks){
    const m = menuItemsByName(menu.object, menu.items, data.url);
    return m.map((item, index) => {
        const i = { key: item.link, title: item.title, index };
        if (getURI(item.link) === data.uri) {
            let contentAndEndpoint = processUrl(data, blocks);
            i.data = contentAndEndpoint.content;
            i.inited = true;
            i.link = item.link;
            i.endpoint = contentAndEndpoint.endpoint;
            i.sidebar = contentAndEndpoint.sidebar;
        } else {
            i.link = item.link;
            i.inited = false;
            i.data = [];
        }
      
        return i;
    });
}

export async function parseData(routes, index, setRoutes) {

    const currentRoute = routes.find((item) => item.index === index);
    if (currentRoute && currentRoute.endpoint && !currentRoute.endpoint.finished) {
        const params = { ...currentRoute.endpoint.params, start: parseInt(currentRoute.endpoint.params.start) + parseInt(currentRoute.endpoint.params.per_page) };
        const sRequest = currentRoute.endpoint.request_url + JSON.stringify({ params });

        const sResponse = await fetcher(sRequest);
        const newData = sResponse.data[0].data.data;
        const finished = newData.length === 0;
        let isFinished = (currentRoute.endpoint.finished !== finished)
        let endpoint = currentRoute.endpoint
        endpoint.finished = finished;
        endpoint.params = params;

        if (newData.length > 0 || isFinished) {
            addMoreData(newData, endpoint, setRoutes, index);
        }
    }
}

export async function fetchAndUpdateData(routes, index, setRoutes) {
    const currentRoute = routes.find((item) => item.index === index);
    if (!currentRoute.inited){
        const sResponse = await fetcher('/api.php?r=system/get_page_by_request/TemplServicePages&params[]=' + currentRoute.link);
        let settings = appSetting('layouts', getURI(currentRoute.link))
        let contentAndEndpoint = processUrl(sResponse.data, settings.blocks); 
        addMoreData(contentAndEndpoint.content, contentAndEndpoint.endpoint, setRoutes, index)

    }
}

export function addMoreData(newItems, endpoint, setRoutes, index) {
    setRoutes((prevRoutes) => {
        const updatedRoutes = prevRoutes.map((route) => {
            if (route.index === index) {
                route.endpoint = endpoint;
                route.inited =true
                return {
                    ...route,
                    data: route.data.concat(newItems),
                };
            }
            return route;
        });
        return updatedRoutes;
    });
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

export function ItemRenderer({ route, numColumns, item, unit, module }) {
    if (item?.type === 'block') {
      return (
        <View key={`${route.index}-${item.id}`} className={numColumns > 1 ? 'w-full mt-2 ' : 'w-full'}>
            <BlockByName2 b={item.data} name={item.block} />
        </View>
      );
    } else {
      return (
        <View key={`${route.index}-${item.id}`} className={numColumns > 1 ? 'w-full mt-2 ' : 'w-full'}>
            <Unit module={module} unit={unit} data={item} mode={appSetting('feed', 'default_view')} />
        </View>
      );
    }
  }