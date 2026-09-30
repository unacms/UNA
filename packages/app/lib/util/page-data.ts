import { fetcher } from 'app/lib/fetcher';
import { appSetting } from './settings';
import { parseUrl } from './url';

/** UNA page data: `elements` is { cell: { key: block } }, each block has `id`, `source`, `content`. */
export type PageData = { elements?: Record<string, Record<string, any>>; [key: string]: any };

type BlockLayout = { name: string; showPad: boolean; perLine?: number };

export function getBlocksFromData(data: PageData | null | undefined): Record<string, BlockLayout> {
    let blocks: Record<string, BlockLayout> = {};
    if (!data || !data.elements || typeof data.elements !== 'object') {
        return blocks;
    }
    const elements: Record<string, Record<string, any>> = data.elements;
    Object.values(elements).forEach((cell) => {
        Object.values(cell).forEach((block) => {
            const blockKey = 'block' + block.id;
            blocks[blockKey] = { name: block.source, showPad: true }
            if (block && Array.isArray(block.content) && block.content[0] && block.content[0].type != 'browse') {
                blocks[blockKey].perLine = 1
            }
        })
    })
    return blocks;
}

export function getUnitModeBySource(endpoint: { request_url?: string; params?: { type?: string } } | null | undefined): string {

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

export const updateRouteDataForConnection = (
    endpoint: string,
    actions: string[],
    object: string,
    currentRoute: any,
    layoutData: any,
    routes: any[],
    index: number,
    setRoutes: (routes: any[]) => void,
) => {
    if (currentRoute.endpoint?.request_url.includes(endpoint) && layoutData && layoutData.data && (layoutData?.type === 'connections:action' && actions.includes(layoutData?.data?.action?.a) && layoutData?.data?.action?.o === object)) {
        let clonedData = currentRoute.data;
        let cid = Array.isArray(layoutData?.data?.action?.cid) ? layoutData?.data?.action?.cid[0] : layoutData?.data?.action?.cid
        const data = clonedData.filter((item: any) => item.id !== cid);
        const newRoutes = [...routes];
        newRoutes[index].data = data;
        setRoutes(newRoutes);
    }
};

/** Fetch a UNA page (layout + data) by URL; `codeOnly` fetches page content only. */
export async function getPageData(url: string, codeOnly = false, fetchOptions: Record<string, any> = {}): Promise<any> {
    const pagePath = parseUrl(url);
    let sAdd = "";

    if (pagePath.queryString) {
        // `let`: the nested params[] branch below reassigns it (was `const` and threw).
        let params: Record<string, any> = Object.fromEntries(
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

/** A block inside `PageData.elements`. */
export type PageElement = { id?: string | number; source?: string; type?: string; content?: any; [key: string]: any };

/**
 * First element in `data.elements` whose `source` equals `source`.
 * Cells may be objects or arrays. `filter` narrows the match (e.g. `hasNonEmptyContent`).
 * The one lookup for "block by source" — don't hand-roll another loop over `elements`.
 */
export function findElementBySource(
    data: PageData | null | undefined,
    source: string | number | null | undefined,
    filter?: (el: PageElement) => boolean
): PageElement | null {
    if (source == null || source === '' || !data?.elements || typeof data.elements !== 'object') return null;
    const wanted = String(source);
    for (const cell of Object.values(data.elements)) {
        if (!cell || typeof cell !== 'object') continue;
        for (const el of Object.values(cell) as PageElement[]) {
            if (el?.source === wanted && (!filter || filter(el))) return el;
        }
    }
    return null;
}

/** `content` present and has at least one entry (the check `BlockByName` has always made). */
export function hasNonEmptyContent(el: PageElement | null | undefined): boolean {
    return !!el?.content && Object.keys(el.content).length > 0;
}

export function BlockDataByName(data: PageData | null | undefined, name: string | number | null | undefined): any {
    if (!name) return null;
    return findElementBySource(data, name);
}

export function BlockDataByType(data: PageData | null | undefined, type: string | null | undefined): any {
    if (!type) return null;

    return Object.values(data?.elements ?? {})
        .flatMap((level: any) => Array.isArray(level) ? level : Object.values(level ?? {}))
        .find((block: any) =>
            Array.isArray(block?.content) &&
            block.content.some((el: any) => el?.type === type)
        ) || null;
}
