import { isPageCacheEnabled } from 'app/lib/cache/cache-flags'

/** Separates composite key parts; never appears in tabKey / url / session. */
const SEP = '\u0000'

const pageDataCache = new Map()
/** `${url}${SEP}${session}` → Set of full page cache keys (all tabs). */
const keysByUrlSession = new Map()

function sessionKey(userId: number | string, confirmed: boolean) {
    return userId ? `${userId}:${confirmed ? 1 : 0}` : 'guest'
}

function pageCacheKey(tabKey: string | null | undefined, url: string, session: any) {
    return `${tabKey}${SEP}${url}${SEP}${session}`
}

function urlSessionIndexKey(url: string, session: any) {
    return `${url}${SEP}${session}`
}

function indexAdd(url: string, session: any, key: string) {
    const indexKey = urlSessionIndexKey(url, session)
    let set = keysByUrlSession.get(indexKey)
    if (!set) {
        set = new Set()
        keysByUrlSession.set(indexKey, set)
    }
    set.add(key)
}

export function getCachedPageData(tabKey: string | null | undefined, url: string, userId: number | string, confirmed: boolean) {
    if (!isPageCacheEnabled()) return null
    if (!tabKey || !url) return null
    return pageDataCache.get(pageCacheKey(tabKey, url, sessionKey(userId, confirmed))) ?? null
}

export function setCachedPageData(tabKey: string | null | undefined, url: string, props: any, userId: number | string, confirmed: boolean) {
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
export function patchCachedPageDataByUrl(url: string, pageData: any, userId: number | string, confirmed: boolean) {
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
