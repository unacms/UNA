import { clearWikiPageCache } from 'app/lib/wiki-page-cache'

const pageDataCache = new Map();
const conductorCache = new Map();
const scrollOffsetCache = new Map();

function pageCacheKey(tabKey, url, userId, confirmed) {
    const session = userId ? `${userId}:${confirmed ? 1 : 0}` : 'guest';
    return `${tabKey}:${url}:${session}`;
}

function conductorCacheKey(layoutName, url) {
    return `${layoutName}:${url}`;
}

export function getCachedPageData(tabKey, url, userId, confirmed) {
    if (!tabKey || !url) return null;
    return pageDataCache.get(pageCacheKey(tabKey, url, userId, confirmed)) ?? null;
}

export function setCachedPageData(tabKey, url, props, userId, confirmed) {
    if (!tabKey || !url || !props) return;
    pageDataCache.set(pageCacheKey(tabKey, url, userId, confirmed), props);
}

/**
 * Write-through after in-page soft-reload (e.g. Trust/connections).
 * Updates every tab cache entry for this URL + session so the next visit
 * shows fresh menu/actions before background revalidate finishes.
 */
export function patchCachedPageDataByUrl(url, pageData, userId, confirmed) {
    if (!url || !pageData) return;
    const session = userId ? `${userId}:${confirmed ? 1 : 0}` : 'guest';
    const sessionSuffix = `:${session}`;
    const now = Date.now();

    for (const [key, props] of pageDataCache.entries()) {
        if (!key.endsWith(sessionSuffix)) continue;
        const withoutSession = key.slice(0, -sessionSuffix.length);
        const sep = withoutSession.indexOf(':');
        if (sep < 0) continue;
        const cachedUrl = withoutSession.slice(sep + 1);
        if (cachedUrl !== url) continue;

        pageDataCache.set(key, {
            ...props,
            data: {
                ...pageData,
                timestamp: now,
            },
        });
    }
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

export function clearAllPageCache() {
    pageDataCache.clear();
    conductorCache.clear();
    scrollOffsetCache.clear();
    clearWikiPageCache();
}
