import { isPageCacheEnabled } from 'app/lib/cache/cache-flags'

/** Separates composite key parts; never appears in tabKey / url / session. */
const SEP = '\u0000'

const pageDataCache = new Map()
/** `${url}${SEP}${session}` → Set of full page cache keys (all tabs). */
const keysByUrlSession = new Map()

function sessionKey(userId, confirmed) {
    return userId ? `${userId}:${confirmed ? 1 : 0}` : 'guest'
}

function pageCacheKey(tabKey, url, session) {
    return `${tabKey}${SEP}${url}${SEP}${session}`
}

function urlSessionIndexKey(url, session) {
    return `${url}${SEP}${session}`
}

function indexAdd(url, session, key) {
    const indexKey = urlSessionIndexKey(url, session)
    let set = keysByUrlSession.get(indexKey)
    if (!set) {
        set = new Set()
        keysByUrlSession.set(indexKey, set)
    }
    set.add(key)
}

export function getCachedPageData(tabKey, url, userId, confirmed) {
    if (!isPageCacheEnabled()) return null
    if (!tabKey || !url) return null
    return pageDataCache.get(pageCacheKey(tabKey, url, sessionKey(userId, confirmed))) ?? null
}

export function setCachedPageData(tabKey, url, props, userId, confirmed) {
    if (!isPageCacheEnabled()) return
    if (!tabKey || !url || !props) return
    const session = sessionKey(userId, confirmed)
    const key = pageCacheKey(tabKey, url, session)
    pageDataCache.set(key, props)
    indexAdd(url, session, key)
}

/**
 * Write-through after in-page soft-reload (e.g. Trust/connections).
 * Updates every tab entry for this URL + session via the url/session index
 * (no string parsing of composite keys).
 */
export function patchCachedPageDataByUrl(url, pageData, userId, confirmed) {
    if (!isPageCacheEnabled()) return
    if (!url || !pageData) return

    const session = sessionKey(userId, confirmed)
    const keys = keysByUrlSession.get(urlSessionIndexKey(url, session))
    if (!keys?.size) return

    const now = Date.now()
    for (const key of keys) {
        const props = pageDataCache.get(key)
        if (!props) continue
        pageDataCache.set(key, {
            ...props,
            data: {
                ...pageData,
                timestamp: now,
            },
        })
    }
}

export function clearTabPageCache() {
    pageDataCache.clear()
    keysByUrlSession.clear()
}
