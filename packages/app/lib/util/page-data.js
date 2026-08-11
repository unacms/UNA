import { fetcher } from 'app/lib/fetcher';
import { appSetting } from './settings';
import { parseUrl } from './url';

export function getBlocksFromData(data) {
    let blocks = {};
    if (!data || !data.elements || typeof data.elements !== 'object') {
        return blocks;
    }
    Object.keys(data.elements).forEach(key => {
        Object.keys(data.elements[key]).forEach(key2 => {
            blocks['block' + data.elements[key][key2].id] = { name: data.elements[key][key2].source, showPad: true }
            if (data.elements[key][key2] && Array.isArray(data.elements[key][key2].content) && data.elements[key][key2].content[0] && data.elements[key][key2].content[0].type != 'browse') {
                blocks['block' + data.elements[key][key2].id].perLine = 1
            }
        })
    })
    return blocks;
}

export function getUnitModeBySource(endpoint) {

    const source = endpoint?.request_url
    if (!source)
        return 'default';

    let unit_by_source = appSetting('browse', 'unit_by_source');

    for (let key in unit_by_source) {
        if (source.includes(key))
            return unit_by_source[key];
    }

    if (endpoint?.params?.type == 'context') {
        return 'context';
    }

    if (endpoint?.params?.type == 'author') {
        return 'author';
    }

    return 'default';
}

export const updateRouteDataForConnection = (endpoint, actions, object, currentRoute, layoutData, routes, index, setRoutes) => {
    if (currentRoute.endpoint?.request_url.includes(endpoint) && layoutData && layoutData.data && (layoutData?.type === 'connections:action' && actions.includes(layoutData?.data?.action?.a) && layoutData?.data?.action?.o === object)) {
        let clonedData = currentRoute.data;
        let cid = Array.isArray(layoutData?.data?.action?.cid) ? layoutData?.data?.action?.cid[0] : layoutData?.data?.action?.cid
        const data = clonedData.filter(item => item.id !== cid);
        const newRoutes = [...routes];
        newRoutes[index].data = data;
        setRoutes(newRoutes);
    }
};

export async function getPageData(url, codeOnly = false, fetchOptions = {}) {
    const pagePath = parseUrl(url);
    let sAdd = "";

    if (pagePath.queryString) {
        const params = Object.fromEntries(
            pagePath.queryString.split('&').map(param => param.split('='))
        );

        // this shit to fix double leveled params in feed form like 
        //?r=system/get_page_content_by_request/TemplServicePages&params[]=fanfeed-view/corey-dozier&params[]=&params[]=%7B%22params%22:%7B%22context_id%22:-17%7D%7D&lang=en
        //?r=system/get_page_content_by_request/TemplServicePages&params[]=page/timeline-view&params[]=&params[]=%7B%22profile_id%22:%221496%22,%22params[]%22:%22%7B\%22params\%22:%7B\%22context_id\%22:-17%7D%7D%22%7D&lang=en
        // on pages /crowd/football

        if (params['params[]']) {
            let a = JSON.parse(params['params[]']);
            if (a.params) {
                params = { ...params, ...a.params };
            }
            delete params['params[]'];
            sAdd = `&params[]=&params[]=${JSON.stringify({ params: params })}`;
        }
        else {
            sAdd = `&params[]=&params[]=${JSON.stringify(params)}`;
        }
    }

    const path = pagePath.path.startsWith('/') ? pagePath.path.slice(1) : pagePath.path;

    return await fetcher(
        `/api.php?r=system/get_page_${codeOnly ? 'content_' : ''}by_request/TemplServicePages&params[]=${path}${sAdd}`,
        false,
        fetchOptions
    );
}

export function BlockDataByName(data, name) {

    if (!name) return null;

    return Object.values(data?.elements ?? {})
        .flatMap(level1 =>
            Object.values(level1).filter(item => item?.source === name.toString())
        )
        .find(Boolean) || null;
}

export function BlockDataByType(data, type) {
    if (!type) return null;

    return Object.values(data?.elements ?? {})
        .flatMap(level => Array.isArray(level) ? level : Object.values(level ?? {}))
        .find(block =>
            Array.isArray(block?.content) &&
            block.content.some(el => el?.type === type)
        ) || null;
}
