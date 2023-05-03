import { appSetting, menuItemsByName, getURI } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';

export function fillTabs(menu, data, blocks){
    const m = menuItemsByName(menu.object, menu.items);

    return menuItemsByName(menu.object, menu.items).map((item, index) => {
        const i = { key: item.link, title: item.title, index };
        if (getURI(item.link) === data.uri) {
            let contentAndEndpoint = processUrl(data, blocks);
            i.data = contentAndEndpoint.content;
            i.inited = true;
            i.link = item.link;
            i.endpoint = contentAndEndpoint.endpoint;
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

export function processUrl(data, blocks) {
    const contentAndEndpoint = Object.values(blocks).reduce(
        (acc, block) => {
            const b = getContent(data, block);
            if (b.type === 'browse') {
                acc.endpoint = {
                    ...acc.endpoint,
                    params: b.data.params,
                    request_url: b.data.request_url,
                    finished: false,
                    unit: b.data.unit,
                };
                acc.content = [...acc.content, ...b.data.data];
            } else {
                acc.content.push({ ...b, id: `block-${b.data.id}`, type: 'block' });
            }

            return acc;
        },
        { content: [], endpoint: null }
    );
    return contentAndEndpoint;
}