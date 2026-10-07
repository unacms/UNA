import { useCallback, useEffect, useRef, useState } from 'react'
import { subscribe } from 'app/ui/atoms/socket'
import { fetcher } from 'app/lib/fetcher'

/**
 * Pusher sends the timeline payload either as a JSON string or as an object,
 * depending on the event. Normalize to an object; keep the raw value when it
 * is not JSON at all.
 */
function parseRevalidatePayload(value) {
    if (typeof value === 'string') {
        try {
            return JSON.parse(value)
        } catch {
            return value
        }
    }
    return value
}

/**
 * Timeline socket → "Show New Posts" snackbar (section 3 of `index.js`).
 *
 * Feed tabs subscribe to the `bx_timeline_0` channel. On every added/deleted
 * event we ask the server whether the ids currently on screen are still the
 * newest; if not, the snackbar offers a refetch. The same check runs once
 * after bootstrapping from the native cache, since cached rows are stale by
 * definition.
 *
 * @param {object}   opts
 * @param {object}   [opts.tabRoute]      Route whose endpoint is validated.
 * @param {number}   opts.index           Active tab; a switch hides the snackbar.
 * @param {array}    opts.cacheItems      Rows currently shown (from the query).
 * @param {Function} opts.refetchList     Query refetch, run on snackbar press.
 * @param {*}        [opts.currentUserId] Own posts do not trigger the hint.
 * @param {boolean}  opts.bootstrappedFromCache  Routes came from the native cache.
 * @returns {{ snackbarVisible: boolean, hideSnackbar: Function, showNewContent: Function }}
 */
export function useConductorRevalidate({
    tabRoute,
    index,
    cacheItems,
    refetchList,
    currentUserId,
    bootstrappedFromCache,
}) {
    const [snackbarVisible, setSnackbarVisible] = useState(false)

    // Socket payload + monotonic seq. The raw payload alone is not enough: two
    // identical string payloads in a row are Object.is-equal, React bails out
    // of the setState, and the revalidation is silently dropped.
    const [revalidateTrigger, setRevalidateTrigger] = useState(null)
    const revalidateSeqRef = useRef(0)
    const onRevalidateEvent = useCallback((payload) => {
        revalidateSeqRef.current += 1
        setRevalidateTrigger({ payload, seq: revalidateSeqRef.current })
    }, [])

    const hideSnackbar = useCallback(() => setSnackbarVisible(false), [])

    // A tab switch invalidates a pending "new posts" hint from the old tab.
    useEffect(() => {
        setSnackbarVisible(false)
    }, [index])

    /** Snackbar press: hide it and pull the fresh first page. */
    const showNewContent = useCallback(async () => {
        setSnackbarVisible(false)
        await refetchList()
    }, [refetchList])

    /**
     * Ask the server whether the ids currently on screen are still the newest.
     * Verdict 'valid' → nothing to show; 'invalid' → offer "Show New Posts".
     *
     * Skipped when the event is the current user's own post (they already see
     * it optimistically) and for extended search, which has no validate mode.
     */
    const revalidateData = useCallback(async () => {
        const endpoint = tabRoute?.endpoint
        if (!endpoint?.request_url) return

        const event = parseRevalidatePayload(revalidateTrigger?.payload)
        // Loose compare on purpose: socket author_id is a string, currentUser.id a number.
        const isOwnPost = event?.author_id == currentUserId
        const isExtendedSearch = endpoint.request_url.includes(
            'system/get_results/TemplSearchExtendedServices'
        )
        if (isOwnPost || isExtendedSearch) return

        // The server compares against the 10 newest ids we are showing.
        const shownIds = [...new Set(cacheItems.map((item) => item.id))]
            .slice(0, 10)
            .join(',')
        const validateUrl = endpoint.request_url + JSON.stringify({
            params: { ...endpoint.params, validate: shownIds },
        })

        const verdict = (await fetcher(validateUrl)).data?.[0]?.data?.data
        if (verdict === 'valid' || verdict === 'invalid') {
            setSnackbarVisible(verdict !== 'valid')
        }
    }, [tabRoute, revalidateTrigger, currentUserId, cacheItems])

    // Endpoint arrives late for tabs hydrated by ensureRouteInited, so the unit
    // must stay in deps — with `[]` the feed subscription was never created for
    // them, and stayed bound after switching away from a feed tab.
    useEffect(() => {
        if (tabRoute?.endpoint?.unit !== 'feed')
            return

        const sub1 = subscribe('bx_timeline_0', 'added', onRevalidateEvent)
        const sub2 = subscribe('bx_timeline_0', 'deleted', onRevalidateEvent)

        return () => {
            sub1()
            sub2()
        }
    }, [tabRoute?.endpoint?.unit, onRevalidateEvent])

    // Socket said the timeline moved — check whether it affects this list.
    useEffect(() => {
        if (!revalidateTrigger) return
        revalidateData().catch(() => {})
    }, [revalidateTrigger])

    // Bootstrapped from the native cache → the shown ids are stale by
    // definition. Validate them once, after the first page is in hand
    // (`validate` is built from cacheItems, so an empty list tells us nothing).
    const cacheRevalidatePendingRef = useRef(Boolean(bootstrappedFromCache))
    useEffect(() => {
        if (!cacheRevalidatePendingRef.current) return
        if (!cacheItems.length || !tabRoute?.endpoint) return
        cacheRevalidatePendingRef.current = false
        revalidateData().catch(() => {})
    }, [cacheItems.length, tabRoute?.endpoint, revalidateData])

    return { snackbarVisible, hideSnackbar, showNewContent }
}
