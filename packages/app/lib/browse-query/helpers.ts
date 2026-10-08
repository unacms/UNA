import { fetcher } from 'app/lib/fetcher'
import type { QueryClient } from '@tanstack/react-query'

/**
 * Shared UniList + useInfiniteQuery helpers.
 * Used by browse, browse-list, comments, grid, and conductor — not conductor-specific.
 */

export async function fetchUniListData({ pageParam, requestUrl, defaultParams }: { pageParam: any; requestUrl: string; defaultParams: any }) {
    const currentParam = pageParam || defaultParams

    if (!requestUrl) {
        return { data: [], params: currentParam || {} }
    }

    const sUrl =
        requestUrl +
        JSON.stringify({ params: currentParam })

    const res = await fetcher(sUrl)
    const payload = Array.isArray(res?.data) ? res.data[0]?.data : undefined

    const params = payload?.params ?? currentParam ?? {}
    if (payload?.data) {
        return {
            data: payload.data,
            params: params,
            cursor:
                payload.unit != 'notifications'
                    ? params.start + params.per_page
                    : params.start,
        }
    }

    return { data: [], params: currentParam || {} }
}

/** Visible list items plus a "new data available" flag (deferred refetch results). */
export type UniListRefetchState = { visibleItems: any[]; hasNewData: boolean; [key: string]: any };

export const refetchUniListReducer = (state: UniListRefetchState, action: any): UniListRefetchState => {
    switch (action.type) {
        case 'SET_ITEMS':
            return {
                visibleItems: action.items,
                hasNewData: false
            }
        case 'PREPEND_ITEM':
            return {
                ...state,
                visibleItems: [action.item, ...state.visibleItems]
            }
        case 'APPEND_ITEM':
            return {
                ...state,
                visibleItems: [...state.visibleItems, action.item]
            }
        case 'REMOVE_ITEM':
            return {
                ...state,
                visibleItems: state.visibleItems.filter((item: any) => item.id != action.id)
            }
        case 'SHOW_NEW_DATA':
            return {
                ...state,
                hasNewData: true
            }
        default:
            return state
    }
}

export const flattenPagesForUniList = (pagesData: any) => (pagesData?.pages ?? []).flatMap((p: any) => p.data ?? [])

/** Cursor paging (browse, conductor). */
export function cursorNextPageParam(lastPage: any) {
    return lastPage?.data?.length > 0 && lastPage?.cursor
        ? { ...lastPage.params, start: lastPage.cursor }
        : undefined
}

/** start/per_page paging (browse-list). */
export function startPerPageNextPageParam(lastPage: any) {
    return lastPage?.data?.length > 0
        ? {
            ...lastPage.params,
            start: lastPage.params.start + lastPage.params.per_page,
        }
        : undefined
}

export const prependItemToUniListQueryCache = (queryClient: QueryClient, queryKey: unknown[], item: any) => {
    if (!item?.id || !queryClient) return

    queryClient.setQueryData(queryKey, (old: any) => {
        if (!old?.pages?.length) return old

        const exists = old.pages.some((page: any) =>
            (page.data ?? []).some((i: any) => i.id == item.id)
        )
        if (exists) return old

        const [firstPage, ...restPages] = old.pages
        return {
            ...old,
            pages: [
                {
                    ...firstPage,
                    data: [item, ...(firstPage.data ?? [])],
                },
                ...restPages,
            ],
        }
    })
}

/**
 * Put a freshly fetched first page on top of the cached pages: the fresh rows
 * (in server order, pinned rows included), then the old first-page rows that
 * fell out of it. Later pages stay; rows they now repeat are dropped by
 * `dedupeUniListItems`. Returns false (cache untouched) when every fresh row
 * is already cached.
 */
export const mergeFirstPageIntoUniListQueryCache = (queryClient: QueryClient, queryKey: unknown[], freshPage: any): boolean => {
    const freshItems: any[] = freshPage?.data ?? []
    if (!freshItems.length || !queryClient) return false

    let merged = false
    queryClient.setQueryData(queryKey, (old: any) => {
        if (!old?.pages?.length) return old

        const cachedIds = new Set<string>()
        for (const page of old.pages) {
            for (const item of page.data ?? []) cachedIds.add(String(item.id))
        }
        if (freshItems.every((item) => cachedIds.has(String(item.id)))) return old

        const freshIds = new Set(freshItems.map((item) => String(item.id)))
        const [firstPage, ...restPages] = old.pages
        merged = true
        return {
            ...old,
            pages: [
                {
                    ...firstPage,
                    data: [
                        ...freshItems,
                        ...(firstPage.data ?? []).filter((item: any) => !freshIds.has(String(item.id))),
                    ],
                },
                ...restPages,
            ],
        }
    })
    return merged
}

/**
 * Drop repeated ids, keeping the first. Offset paging repeats rows at a page
 * boundary after rows were added on top since the previous page was loaded.
 */
export const dedupeUniListItems = (items: any[]) => {
    const seen = new Set<string>()
    let hasDuplicates = false
    const result = items.filter((item) => {
        if (item?.id == null) return true
        const id = String(item.id)
        if (seen.has(id)) {
            hasDuplicates = true
            return false
        }
        seen.add(id)
        return true
    })
    return hasDuplicates ? result : items
}

export const removeItemFromUniListQueryCache =(queryClient: QueryClient, queryKey: unknown[], id: number | string) => {
    if (id == null || !queryClient) return

    queryClient.setQueryData(queryKey, (old: any) => {
        if (!old?.pages?.length) return old

        return {
            ...old,
            pages: old.pages.map((page: any) => ({
                ...page,
                data: (page.data ?? []).filter((item: any) => item.id != id),
            })),
        }
    })
}

export const matchesFeedOwnerFilter = (pageRoute: any, item: any) => {
    const ownerId = pageRoute?.endpoint?.params?.owner_id
    if (!ownerId) return true

    return (
        Math.abs(ownerId) == Math.abs(item?.owner_id) ||
        Math.abs(ownerId) == Math.abs(item?.object_privacy_view)
    )
}

export const isSameItemsForUniList = (a: any, b: any) => {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
        if (a[i].id !== b[i].id) {
            return false
        }
    }
    return true
}
