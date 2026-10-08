import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { appSetting } from 'app/lib/util'
import emitter, { EVENTS } from 'app/context/emitter'
import { subscribe } from 'app/ui/atoms/socket'
import {
    isSameItemsForUniList,
    flattenPagesForUniList,
    dedupeUniListItems,
    fetchUniListData,
    prependItemToUniListQueryCache,
    removeItemFromUniListQueryCache,
    mergeFirstPageIntoUniListQueryCache,
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
    mergeFirstPageIntoUniListQueryCache,
    dedupeUniListItems,
    matchesFeedOwnerFilter,
    isSameItemsForUniList,
} from './helpers'

/** Batch window for timeline `added` events, plus a random spread so clients don't all hit UNA at once. */
const TIMELINE_BATCH_MS = 1000
const TIMELINE_JITTER_MS = 2000
/** Cap on timeline ids remembered as deleted, so a first page fetched before a deletion cannot bring the row back. */
const TIMELINE_DELETED_MAX = 200

type TimelineSocketEvent = { id?: number | string }

/** Timeline socket payload: a JSON string or an object (`{ id, author_id, peformer_id }`). */
function parseTimelinePayload(payload: unknown): TimelineSocketEvent | null {
    if (typeof payload === 'string') {
        try {
            return JSON.parse(payload)
        } catch {
            return null
        }
    }
    return payload && typeof payload === 'object' ? (payload as TimelineSocketEvent) : null
}

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
    listenTimeline = false,
    matchesNewContent,
    canFetchNext,
}: { queryKey: any; requestUrl: string; defaultParams: any; enabled?: boolean; deferNewItems?: any; refetchOnWindowFocus?: any; refetchOnReconnect?: any; gcTime?: number; getNextPageParam?: any; listenPageReload?: boolean; listenFeed?: boolean; listenTimeline?: boolean; matchesNewContent?: any; canFetchNext?: any }) {
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
        () => dedupeUniListItems(flattenPagesForUniList(pagesData)),
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
     * Timeline socket (`bx_timeline_0`): every client gets every post of the
     * site, so a full refetch here (all loaded pages, on every client at once)
     * loaded UNA on each post. A deleted row is dropped from the cache without
     * a request. Added posts are batched: one first-page request after a
     * jittered delay, merged on top of the cache; nothing changes when the new
     * post is not in this list. Own posts are not skipped: `EVENTS.feed` only
     * reaches the tab that posted, and the merge ignores rows already cached.
     */
    useEffect(() => {
        if (listenTimeline !== true) return undefined

        let timer: ReturnType<typeof setTimeout> | null = null
        let cancelled = false
        const deletedIds = new Set<string>()

        const loadNewItems = async () => {
            timer = null
            const cacheKey = qKeyRef.current
            try {
                const freshPage = await fetchUniListData({
                    pageParam: undefined,
                    requestUrl: requestUrlRef.current,
                    defaultParams: paramsRef.current,
                })
                if (cancelled || cacheKey !== qKeyRef.current) return
                const page = deletedIds.size
                    ? { ...freshPage, data: (freshPage?.data ?? []).filter((it: any) => !deletedIds.has(String(it.id))) }
                    : freshPage
                if (mergeFirstPageIntoUniListQueryCache(queryClient, cacheKey, page)) {
                    refetchRef.current.skipToast = true
                    setRequested(true)
                }
            } catch {
                // The next event or refetch catches up.
            }
        }

        const offAdded = subscribe('bx_timeline_0', 'added', () => {
            if (timer) return
            // Jitter only spreads the load; not security-sensitive.
            timer = setTimeout(loadNewItems, TIMELINE_BATCH_MS + Math.random() * TIMELINE_JITTER_MS) // NOSONAR
        })

        const offDeleted = subscribe('bx_timeline_0', 'deleted', (payload: unknown) => {
            const id = parseTimelinePayload(payload)?.id
            if (id == null) return
            deletedIds.add(String(id))
            if (deletedIds.size > TIMELINE_DELETED_MAX) deletedIds.delete(deletedIds.values().next().value as string)
            const cacheKey = qKeyRef.current
            const isShown = flattenPagesForUniList(queryClient.getQueryData(cacheKey)).some((it: any) => it.id == id)
            if (isShown) {
                refetchRef.current.skipToast = true
                setRequested(true)
                removeItemFromUniListQueryCache(queryClient, cacheKey, id)
            }
            setFrozen((f) => f?.items.some((it: any) => it.id == id)
                ? { ...f, items: f.items.filter((it: any) => it.id != id) }
                : f)
        })

        return () => {
            cancelled = true
            if (timer) clearTimeout(timer)
            offAdded()
            offDeleted()
        }
    }, [listenTimeline, queryClient])

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
