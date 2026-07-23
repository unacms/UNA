import { appSetting } from 'app/config'

const wikiPageCache = new Map()

export function wikiCacheKey(path) {
    return String(path || '')
        .replace(/^https?:\/\/[^/]+/i, '')
        .split(/[?#]/)[0]
        .replace(/^\/+|\/+$/g, '')
}

function staleMs() {
    return Number(appSetting('wiki', 'page_cache_stale_ms'))
        || Number(appSetting('browse', 'stale_time'))
        || 30_000
}

function hasCenterContent(page) {
    const center = page?.elements?.cell_center
    if (!center) return false
    if (Array.isArray(center)) return center.length > 0
    return Object.keys(center).length > 0
}

export function getCachedWikiPage(path) {
    const key = wikiCacheKey(path)
    if (!key) return null

    const entry = wikiPageCache.get(key)
    if (!entry?.data || !hasCenterContent(entry.data)) return null

    // Reject entries that were stored under the wrong path (corrupt/stale merges).
    const storedKey = wikiCacheKey(entry.path || entry.data.url)
    if (storedKey && storedKey !== key) {
        wikiPageCache.delete(key)
        return null
    }

    return {
        data: entry.data,
        isStale: Date.now() - entry.ts > staleMs(),
    }
}

export function setCachedWikiPage(path, data) {
    const key = wikiCacheKey(path)
    if (!key || !hasCenterContent(data)) return

    const dataKey = wikiCacheKey(data.url)
    // Avoid storing a page whose URL identity disagrees with the cache key.
    if (dataKey && dataKey !== key) return

    wikiPageCache.set(key, { data, path: key, ts: Date.now() })
}

export function clearWikiPageCache() {
    wikiPageCache.clear()
}
