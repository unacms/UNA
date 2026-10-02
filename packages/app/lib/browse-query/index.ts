import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { appSetting } from 'app/lib/util'
import emitter, { EVENTS } from 'app/context/emitter'
import {
    isSameItemsForUniList,
    flattenPagesForUniList,
    fetchUniListData,
    prependItemToUniListQueryCache,
    removeItemFromUniListQueryCache,
    cursorNextPageParam,
} from './helpers'

/*
 * ============================================================================
 * Data layer behind UniList: a TanStack infinite query over a UNA browse
 * endpoint. `helpers.ts` holds the pure parts (fetch, pagination cursors,
 * cache edits); this file is the hook. Import everything from
 * `app/lib/browse-query`.
 * ============================================================================
 */

export {
    fetchUniListData,
    refetchUniListReducer,
    flattenPagesForUniList,
    cursorNextPageParam,
    startPerPageNextPageParam,
    prependItemToUniListQueryCache,
    removeItemFromUniListQueryCache,
    matchesFeedOwnerFilter,
    isSameItemsForUniList,
} from './helpers'

/**
 * Shared UniList infinite query: TanStack is the store.
 * First page is always fetched (no page-JSON seed). Skeletons until that returns.
 */
export function useUniListQuery({
    queryKey,
    requestUrl,
    defaultParams,
    enabled = true,
    deferNewItems = true,
    refetchOnWindowFocus = false,
    refetchOnReconnect = true,
    gcTime,
    getNextPageParam = cursorNextPageParam,
    listenPageReload = false,
    listenFeed = false,
    matchesNewContent,
    canFetchNext,
}: { queryKey: any; requestUrl: string; defaultParams: any; enabled?: boolean; deferNewItems?: any; refetchOnWindowFocus?: any; refetchOnReconnect?: any; gcTime?: number; getNextPageParam?: any; listenPageReload?: boolean; listenFeed?: boolean; matchesNewContent?: any; canFetchNext?: any }) {
    const queryClient = useQueryClient()
    // Exposed as `skipToastRef` (tail skeleton count). Not read in render here:
    // whether a data change is shown or deferred is decided by `requested` below.
    const refetchRef = useRef<{ skipToast: boolean; [key: string]: any }>({
        skipToast: false,
    })
    /**
     * The next data change was asked for (next page, pull-to-refresh, page
     * reload, socket edit), so show it as is. State, not a ref: it is set from
     * child callbacks/effects (which run before ours) and consumed in render,
     * so it must not depend on effect order.
     */
    const [requested, setRequested] = useState(false)
    const [frozen, setFrozen] = useState<{ key: string; items: any[] } | null>(null)
    const requestUrlRef = useRef(requestUrl)
    const paramsRef = useRef(defaultParams)
    const qKeyRef = useRef(queryKey)
    const matchesNewContentRef = useRef(matchesNewContent)
    const canFetchNextRef = useRef(canFetchNext)

    requestUrlRef.current = requestUrl
    paramsRef.current = defaultParams
    qKeyRef.current = queryKey
    matchesNewContentRef.current = matchesNewContent
    canFetchNextRef.current = canFetchNext

    const qKeyId = JSON.stringify(queryKey)
    const queryEnabled = Boolean(enabled && requestUrl)

    const queryResult = useInfiniteQuery({
        queryKey,
        queryFn: ({ pageParam }) =>
            fetchUniListData({
                pageParam,
                requestUrl: requestUrlRef.current,
                defaultParams: paramsRef.current,
            }),
        getNextPageParam,
        staleTime: appSetting('browse', 'stale_time'),
        refetchOnWindowFocus,
        refetchOnReconnect,
        enabled: queryEnabled,
        // TanStack Query v4 name for `gcTime` (v5); undefined keeps the query-client default.
        cacheTime: gcTime,
    })
    const {
        status,
        data: pagesData,
        fetchNextPage,
        hasNextPage,
        isFetching,
        isFetchingNextPage,
        refetch,
        isRefetching,
    } = queryResult
    // TODO(react-query v4): `isPending` is v5-only, so this is always undefined here (v4: isLoading).
    const isPending = (queryResult as { isPending?: boolean }).isPending

    const cacheItems = useMemo(
        () => flattenPagesForUniList(pagesData),
        [pagesData]
    )

    useEffect(() => {
        if (listenPageReload !== true) return undefined

        const subscription = emitter.addListener(EVENTS.page, (data: { action?: string }) => {
            if (data.action == 'reload') {
                refetchRef.current.skipToast = true
                setRequested(true)
                refetch()
            }
        })
        return () => subscription.remove()
    }, [listenPageReload, refetch])

    useEffect(() => {
        if (listenFeed !== true) return undefined

        const subscription = emitter.addListener(EVENTS.feed, (data: any) => {
            const cacheKey = qKeyRef.current

            if (data.action == 'remove_content') {
                refetchRef.current.skipToast = true
                setRequested(true)
                removeItemFromUniListQueryCache(queryClient, cacheKey, data.id)
                setFrozen((f) => f && { ...f, items: f.items.filter((it: any) => it.id != data.id) })
            }

            if (data.action == 'new_content') {
                const item = data.data
                const allowed = matchesNewContentRef.current
                    ? matchesNewContentRef.current(item)
                    : true
                if (!allowed) return

                refetchRef.current.skipToast = true
                setRequested(true)
                prependItemToUniListQueryCache(queryClient, cacheKey, item)
                setFrozen((f) => f && { ...f, items: [item, ...f.items] })
            }
        })

        return () => subscription.remove()
    }, [listenFeed, queryClient])

    /*
     * Visible rows are derived from the query cache instead of being copied into
     * local state by effects (one extra commit per data change, plus a reset
     * commit per key change). Local state only holds `frozen`: the rows kept on
     * screen while a background refetch waits behind "Show New".
     *
     * `seen` is the cache snapshot last reconciled. Comparing it in render
     * ("adjust state when a prop changes") freezes the old rows before the new
     * ones are ever committed.
     */
    const [seen, setSeen] = useState(() => ({ key: qKeyId, items: cacheItems, hadData: !!pagesData }))
    if (seen.key !== qKeyId) {
        // Another list: show what the cache has for it, nothing to defer.
        setSeen({ key: qKeyId, items: cacheItems, hadData: !!pagesData })
        if (frozen) setFrozen(null)
        if (requested) setRequested(false)
    } else if (seen.items !== cacheItems) {
        const defer =
            deferNewItems &&
            seen.hadData &&
            !frozen &&
            !requested &&
            !isSameItemsForUniList(seen.items, cacheItems)
        if (defer) setFrozen({ key: qKeyId, items: seen.items })
        setSeen({ key: qKeyId, items: cacheItems, hadData: !!pagesData })
        if (requested) setRequested(false)
    }

    const isFrozen = !!frozen && frozen.key === qKeyId
    const listItems = isFrozen ? frozen.items : cacheItems
    const listReady = !queryEnabled || !!pagesData || status === 'error'

    // skipToastRef only: on for the first page of a key, off once data landed.
    useEffect(() => {
        refetchRef.current.skipToast = true
    }, [qKeyId])
    useEffect(() => {
        if (pagesData) refetchRef.current.skipToast = false
    }, [pagesData])

    const handleEndReached = useCallback(
        async (lastItemIndex: number | false) => {
            if (!requestUrlRef.current) return
            if (canFetchNextRef.current && canFetchNextRef.current() === false) return
            if (isFetchingNextPage) return
            if (hasNextPage === false) return
            if (lastItemIndex === false) return
            refetchRef.current.skipToast = true
            setRequested(true)
            fetchNextPage()
        },
        [isFetchingNextPage, hasNextPage, fetchNextPage]
    )

    const refetchList = useCallback(() => {
        refetchRef.current.skipToast = true
        setRequested(true)
        return refetch()
    }, [refetch])

    const acceptNewData = useCallback(() => setFrozen(null), [])

    return {
        queryClient,
        queryKey,
        status,
        pagesData,
        cacheItems,
        listItems,
        hasNewData: isFrozen,
        acceptNewData,
        fetchNextPage,
        hasNextPage,
        isFetching,
        isFetchingNextPage,
        isPending,
        isRefetching,
        refetch: refetchList,
        handleEndReached,
        listReady,
        skipToastRef: refetchRef,
    }
}
