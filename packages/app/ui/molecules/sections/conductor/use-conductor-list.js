import { useCallback } from 'react'
import { matchesFeedOwnerFilter, useUniListQuery } from 'app/lib/browse-query'

/**
 * How long a native list stays in the TanStack cache after its tab unmounts.
 * Long on purpose: tab screens are revisited constantly and should paint from
 * cache. Web keeps TanStack's default instead — it refetches on window focus.
 */
const NATIVE_LIST_GC_MS = 30 * 60 * 1000

/**
 * Conductor list: UniList query keyed by the active tab endpoint.
 * First page is fetched (skeletons until it returns).
 *
 * Thin wrapper over `useUniListQuery` that pins the conductor-specific bits:
 * the endpoint comes from the route, the feed socket is always listened to,
 * and `matchesNewContent` filters socket items by the feed's owner filter so a
 * post on someone else's wall does not light up "Show New" on this one.
 *
 * @param {object}  opts
 * @param {object}  opts.route       Route whose `endpoint` is fetched.
 * @param {array}   opts.queryKey    From `conductorListQueryKey`.
 * @param {boolean} [opts.enabled=true]
 * @param {boolean} [opts.deferNewItems=true]  Hold socket items behind "Show New".
 * @param {boolean} [opts.refetchOnWindowFocus=false]
 * @param {number}  [opts.gcTime]    Override; else native 30min / web default.
 * @param {boolean} [opts.listenPageReload=false]  Refetch on `page/reload` (web).
 */
export function useConductorList({
    route,
    queryKey,
    enabled = true,
    deferNewItems = true,
    refetchOnWindowFocus = false,
    gcTime,
    listenPageReload = false,
}) {
    const matchesNewContent = useCallback(
        (item) => matchesFeedOwnerFilter(route, item),
        [route]
    )

    return useUniListQuery({
        queryKey,
        requestUrl: route?.endpoint?.request_url,
        defaultParams: route?.endpoint?.params,
        enabled,
        deferNewItems,
        refetchOnWindowFocus,
        refetchOnReconnect: true,
        gcTime: gcTime ?? (refetchOnWindowFocus ? undefined : NATIVE_LIST_GC_MS),
        listenPageReload,
        listenFeed: true,
        matchesNewContent,
    })
}
