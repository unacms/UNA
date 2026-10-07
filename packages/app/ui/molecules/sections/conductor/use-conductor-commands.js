import { useCallback, useEffect, useState } from 'react'
import emitter, { EVENTS } from 'app/context/emitter'
import { useGetScrollValue } from 'app/context/jotai/layout'
import { consumeNotificationsConductorStale } from 'app/lib/cache/native-conductor-cache'
import { setListScrollOffset } from 'app/lib/cache/list-scroll-cache'
import { AT_TOP_SCROLL_THRESHOLD } from './native-ui'

/**
 * Pull-to-refresh + app-wide emitter commands (section 4 of `index.js`).
 *
 * Three commands land here. All of them are focus-gated: tab screens stay
 * mounted when blurred, so an ungated handler would refresh a list the user
 * is not looking at.
 *
 *   notifications/arrived     → refresh, but only on the notifications tab
 *   page/reload               → plain refresh
 *   conductor/reset_to_first  → consecutive tap on the active bottom tab
 *                               while already at that tab's root: first go to
 *                               tab 0, then scroll to top, and only then refresh
 *
 * @param {object}   opts
 * @param {object}   opts.isFocusedRef        `.current` = screen is focused.
 * @param {object}   opts.routesRef
 * @param {object}   opts.indexRef
 * @param {Function} opts.setIndex
 * @param {object}   opts.listRef             UniList ref, for scroll-to-top.
 * @param {string}   [opts.activeRequestUrl]  request_url of the active tab.
 * @param {Function} opts.refetchList         Query refetch.
 * @returns {{ isRefreshing: boolean, onStartRefresh: Function }}
 */
export function useConductorCommands({
    isFocusedRef,
    routesRef,
    indexRef,
    setIndex,
    listRef,
    activeRequestUrl,
    refetchList,
}) {
    const getScrollValue = useGetScrollValue()
    const [isRefreshing, setIsRefreshing] = useState(false)

    /** Refresh from the top: reset the stored scroll offset, then refetch. */
    const onStartRefresh = useCallback(() => {
        if (activeRequestUrl) {
            setListScrollOffset(activeRequestUrl, 0)
        }
        setIsRefreshing(true)
        Promise.resolve(refetchList()).finally(() => setIsRefreshing(false))
    }, [activeRequestUrl, refetchList])

    // CounterChecker emits when unread grows; only act if notifications list is focused.
    // Keep the badge until the user leaves the tab (tabs/navigator still clear on enter).
    useEffect(() => {
        const notifications = emitter.addListener(EVENTS.notifications, (payload) => {
            if (payload?.action !== 'arrived') return
            if (!isFocusedRef.current) return
            const unit = routesRef.current?.[indexRef.current]?.endpoint?.unit
            if (unit !== 'notifications') return

            consumeNotificationsConductorStale()
            onStartRefresh()
        })
        const page = emitter.addListener(EVENTS.page, (payload) => {
            if (!isFocusedRef.current) return
            if (payload?.action === 'reload') {
                onStartRefresh()
            }
        })
        const conductor = emitter.addListener(EVENTS.conductor, (payload) => {
            if (!isFocusedRef.current) return
            if (payload?.action !== 'reset_to_first') return

            if (indexRef.current !== 0) {
                setIndex(0)
                return
            }

            if (getScrollValue() > AT_TOP_SCROLL_THRESHOLD) {
                if (activeRequestUrl) {
                    setListScrollOffset(activeRequestUrl, 0)
                }
                if (listRef.current?.scrollToOffset) {
                    listRef.current.scrollToOffset({ offset: 0, animated: true })
                } else {
                    listRef.current?.scrollToIndex?.({ index: 0, animated: true })
                }
                return
            }

            onStartRefresh()
        })
        return () => {
            notifications.remove()
            page.remove()
            conductor.remove()
        }
    }, [onStartRefresh, setIndex, getScrollValue, activeRequestUrl])

    return { isRefreshing, onStartRefresh }
}
