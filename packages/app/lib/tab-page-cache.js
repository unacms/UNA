const pageDataCache = new Map();
const conductorCache = new Map();
const scrollOffsetCache = new Map();

function pageCacheKey(tabKey, url) {
    return `${tabKey}:${url}`;
}

function conductorCacheKey(layoutName, url) {
    return `${layoutName}:${url}`;
}

export function getCachedPageData(tabKey, url) {
    if (!tabKey || !url) return null;
    return pageDataCache.get(pageCacheKey(tabKey, url)) ?? null;
}

export function setCachedPageData(tabKey, url, props) {
    if (!tabKey || !url || !props) return;
    pageDataCache.set(pageCacheKey(tabKey, url), props);
}

export function getCachedConductorState(layoutName, url) {
    if (!layoutName || !url) return null;
    return conductorCache.get(conductorCacheKey(layoutName, url)) ?? null;
}

export function setCachedConductorState(layoutName, url, state) {
    if (!layoutName || !url || !state?.routes?.length) return;
    conductorCache.set(conductorCacheKey(layoutName, url), state);
}

export function getListScrollOffset(url) {
    if (!url) return 0;
    return scrollOffsetCache.get(url) ?? 0;
}

export function setListScrollOffset(url, offset) {
    if (!url) return;
    scrollOffsetCache.set(url, offset);
}
