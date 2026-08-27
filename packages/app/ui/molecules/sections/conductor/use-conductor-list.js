import { useCallback } from 'react'
import { matchesFeedOwnerFilter } from 'app/lib/unilist-helpers'
import { useUniListQuery } from 'app/lib/use-unilist-query'

const NATIVE_LIST_GC_MS = 30 * 60 * 1000

/**
 * Conductor list: UniList query keyed by the active tab endpoint.
 * First page is fetched (skeletons until it returns).
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
