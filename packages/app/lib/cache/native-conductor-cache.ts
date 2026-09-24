import { isPageCacheEnabled } from 'app/lib/cache/cache-flags'

const SEP = '\u0000'

const conductorCache = new Map()
/** normalizedUrl → Set of full conductor keys (all layouts). */
const keysByUrl = new Map()

function sanitizeCachedRoutes(routes: any) {
    if (!Array.isArray(routes)) return routes || []
    return routes.map((route) => ({
        ...route,
        data: (route?.data || []).filter((item: any) => item?.type === 'block'),
    }))
}

function normalizeConductorCacheUrl(url: string) {
    return String(url || '').replace(/^\/+/, '').replace(/\/+$/, '')
}

function conductorCacheKey(layoutName: string, url: string) {
    return `${layoutName}${SEP}${url}`
}

function indexAdd(url: string, key: string) {
    let set = keysByUrl.get(url)
    if (!set) {
        set = new Set()
        keysByUrl.set(url, set)
    }
    set.add(key)
}

function indexRemove(url: string, key: string) {
    const set = keysByUrl.get(url)
    if (!set) return
    set.delete(key)
    if (set.size === 0) keysByUrl.delete(url)
}

export function getCachedConductorState(layoutName: string, url: string) {
    if (!isPageCacheEnabled()) return null
    if (!layoutName || !url) return null
    const normalized = normalizeConductorCacheUrl(url)
    const state = conductorCache.get(conductorCacheKey(layoutName, normalized)) ?? null
    if (!state?.routes?.length) return state
    return {
        ...state,
        routes: sanitizeCachedRoutes(state.routes),
    }
}

export function setCachedConductorState(layoutName: string, url: string, state: any) {
    if (!isPageCacheEnabled()) return
    if (!layoutName || !url || !state?.routes?.length) return
    const normalized = normalizeConductorCacheUrl(url)
    const key = conductorCacheKey(layoutName, normalized)
    conductorCache.set(key, {
        ...state,
        routes: sanitizeCachedRoutes(state.routes),
    })
    indexAdd(normalized, key)
}

/**
 * Drop a conductor list snapshot. Prefer url-only (omit layoutName) so both
 * `navigator` and `notif` page layouts are covered.
 */
export function clearCachedConductorState(layoutName: string, url: string) {
    if (!url) return
    const normalized = normalizeConductorCacheUrl(url)
    if (!normalized) return

    if (layoutName) {
        const key = conductorCacheKey(layoutName, normalized)
        conductorCache.delete(key)
        indexRemove(normalized, key)
        return
    }

    const keys = keysByUrl.get(normalized)
    if (!keys) return
    for (const key of keys) {
        conductorCache.delete(key)
    }
    keysByUrl.delete(normalized)
}

let notificationsConductorStale = false

export function markNotificationsConductorStale() {
    notificationsConductorStale = true
}

export function consumeNotificationsConductorStale() {
    if (!notificationsConductorStale) return false
    notificationsConductorStale = false
    return true
}

export function clearConductorCache() {
    conductorCache.clear()
    keysByUrl.clear()
    notificationsConductorStale = false
}
