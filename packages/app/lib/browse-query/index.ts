import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { appSetting } from 'app/lib/util'
import emitter from 'app/context/emitter'
import {
    refetchUniListReducer,
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
    const [refetchState, dispatch] = useReducer(refetchUniListReducer, {
        visibleItems: [],
        hasNewData: false,
    })
    const refetchRef = useRef<{ prevItems: any[] | null; skipToast: boolean; [key: string]: any }>({
        skipToast: false,
        isFirstLoad: true,
        prevItems: [],
    })
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

        const subscription = emitter.addListener('page', (data: { action?: string }) => {
            if (data.action == 'reload') {
                refetchRef.current.skipToast = true
                refetch()
            }
        })
        return () => subscription.remove()
    }, [listenPageReload, refetch])

    useEffect(() => {
        if (listenFeed !== true) return undefined

        const subscription = emitter.addListener('feed', (data: any) => {
            const cacheKey = qKeyRef.current

            if (data.action == 'remove_content') {
                removeItemFromUniListQueryCache(queryClient, cacheKey, data.id)
                dispatch({ type: 'REMOVE_ITEM', id: data.id })
                if (refetchRef.current?.prevItems) {
                    refetchRef.current.prevItems = refetchRef.current.prevItems.filter(
                        (item) => item.id != data.id
                    )
                }
                refetchRef.current.skipToast = true
            }

            if (data.action == 'new_content') {
                const item = data.data
                const allowed = matchesNewContentRef.current
                    ? matchesNewContentRef.current(item)
                    : true
                if (!allowed) return

                prependItemToUniListQueryCache(queryClient, cacheKey, item)
                dispatch({ type: 'PREPEND_ITEM', item })
                if (refetchRef.current?.prevItems) {
                    refetchRef.current.prevItems = [
                        item,
                        ...refetchRef.current.prevItems,
                    ]
                }
                refetchRef.current.skipToast = true
            }
        })

        return () => subscription.remove()
    }, [listenFeed, queryClient])

    const [listReady, setListReady] = useState(!queryEnabled)
    useEffect(() => {
        refetchRef.current.skipToast = true
        refetchRef.current.isFirstLoad = true
        refetchRef.current.prevItems = []
        dispatch({ type: 'SET_ITEMS', items: [] })
        setListReady(!queryEnabled)
    }, [qKeyId, queryEnabled])

    const handleEndReached = useCallback(
        async (lastItemIndex: number | false) => {
            if (!requestUrlRef.current) return
            if (canFetchNextRef.current && canFetchNextRef.current() === false) return
            if (isFetchingNextPage) return
            if (hasNextPage === false) return
            if (lastItemIndex === false) return
            refetchRef.current.skipToast = true
            fetchNextPage()
        },
        [isFetchingNextPage, hasNextPage, fetchNextPage]
    )

    useEffect(() => {
        if (status === 'error') {
            setListReady(true)
        }
    }, [status])

    useEffect(() => {
        if (!pagesData) return

        const items = flattenPagesForUniList(pagesData)

        if (refetchRef.current.isFirstLoad) {
            dispatch({ type: 'SET_ITEMS', items })
            refetchRef.current.prevItems = items
            refetchRef.current.isFirstLoad = false
            refetchRef.current.skipToast = false
            setListReady(true)
            return
        }

        if (!isSameItemsForUniList(refetchRef.current.prevItems, items)) {
            if (refetchRef.current.skipToast || !deferNewItems) {
                dispatch({ type: 'SET_ITEMS', items })
            } else {
                dispatch({ type: 'SHOW_NEW_DATA' })
            }
            refetchRef.current.skipToast = false
            refetchRef.current.prevItems = items
        }
    }, [pagesData, deferNewItems])

    const refetchList = useCallback(() => {
        refetchRef.current.skipToast = true
        return refetch()
    }, [refetch])

    const acceptNewData = useCallback(() => {
        dispatch({ type: 'SET_ITEMS', items: cacheItems })
        refetchRef.current.prevItems = cacheItems
    }, [cacheItems])

    return {
        queryClient,
        queryKey,
        status,
        pagesData,
        cacheItems,
        listItems: refetchState.visibleItems,
        hasNewData: refetchState.hasNewData,
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
