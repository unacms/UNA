import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    findConductorRouteIndex,
    findConductorRouteIndexOrZero,
} from './helpers'

/**
 * Shared routes + index state machine for Conductor.
 *
 * Platform behavior stays in index.js / index.web.js — pass it as `adapter`.
 * Do not put native cache, history.pushState, click sound, or focus gates here.
 *
 * Wired from both shells. Smoke-test: tab switch, back, soft-reload, re-enter
 * same page (native cache + web history).
 *
 * --- Adapter contract (build inline in the shell) ---
 * {
 *   getInitialRoutes(initedTabs) → routes          // required
 *   skipFirstPageRev?: boolean                     // native/web: true
 *   beforeSetIndex?(nextIndex, { indexRef, setPrevIndex, _setIndex })
 *   applyUrlChange?(ctx)                           // hard nav
 *   applySoftRefresh?(ctx)                         // ts / data.timestamp
 *   onSelectTab?(ctx)                              // tab press + URL policy
 *   onMenuChange?(ctx)                             // native menu merge
 *   subscribeExternalHref?(onHref, ctx) → cleanup  // link / popstate
 *   persist?: {
 *     write?(routes, index)
 *     subscribeUnmount?(getSnapshot) → cleanup
 *   }
 * }
 *
 * persistKey — native cache unmount / URL-change cleanup (same as the old
 * conductorCacheKey effect). persistWriteKey is layout+user only — do not
 * put the page URL in it, or a URL change would store the previous routes
 * under the new URL. Write-through stays on routes/index (+ persistWriteKey).
 *
 * ctx: { initedTabs, pageUrl, keyword, useSectionAsMenu, setRoutes, setIndex,
 *        indexRef, routesRef, onChangeRoute, tab? }
 */

export function useConductorRoutes({
    initedTabs,
    pageUrl,
    keyword,
    pageTimestamp,
    ts,
    useSectionAsMenu = false,
    onChangeRoute,
    menu,
    persistKey,
    persistWriteKey,
    adapter,
}) {
    if (!adapter?.getInitialRoutes) {
        throw new Error('useConductorRoutes: adapter.getInitialRoutes is required')
    }

    const [routes, setRoutes] = useState(() =>
        adapter.getInitialRoutes(initedTabs)
    )
    const routesRef = useRef(routes)
    routesRef.current = routes

    // Bootstrap index once from the same initial routes + page URL.
    const [index, _setIndex] = useState(() =>
        findConductorRouteIndexOrZero(
            routes,
            pageUrl,
            useSectionAsMenu
        )
    )
    const [prevIndex, setPrevIndex] = useState(index)
    const indexRef = useRef(index)

    useEffect(() => {
        indexRef.current = index
    }, [index])

    const onChangeRouteRef = useRef(onChangeRoute)
    onChangeRouteRef.current = onChangeRoute

    const adapterRef = useRef(adapter)
    adapterRef.current = adapter

    const callOnChangeRoute = useCallback((...args) => {
        onChangeRouteRef.current?.(...args)
    }, [])

    const setIndex = useCallback((newIndex) => {
        const a = adapterRef.current
        const ctx = { indexRef, setPrevIndex, _setIndex, routesRef }
        if (a.beforeSetIndex) {
            a.beforeSetIndex(newIndex, ctx)
            return
        }
        setPrevIndex(indexRef.current)
        _setIndex(newIndex)
    }, [])

    const onSelectTab = useCallback(
        (tab) => {
            const a = adapterRef.current
            const ctx = {
                tab,
                setIndex,
                indexRef,
                routesRef,
                onChangeRoute: callOnChangeRoute,
            }
            if (a.onSelectTab) {
                a.onSelectTab(ctx)
                return
            }
            setIndex(tab.index)
            callOnChangeRoute(routesRef.current?.[tab.index] ?? tab)
        },
        [setIndex, callOnChangeRoute]
    )

    // Page revision: URL/search vs soft-refresh (ts / data.timestamp).
    const pageRevRef = useRef({
        url: pageUrl,
        keyword,
        timestamp: pageTimestamp,
        ts,
        didMount: false,
    })

    useEffect(() => {
        const a = adapterRef.current
        const prev = pageRevRef.current
        const urlOrSearchChanged =
            prev.url !== pageUrl || prev.keyword !== keyword
        const softRefresh =
            prev.timestamp !== pageTimestamp || prev.ts !== ts

        pageRevRef.current = {
            url: pageUrl,
            keyword,
            timestamp: pageTimestamp,
            ts,
            didMount: true,
        }

        if (a.skipFirstPageRev && !prev.didMount) {
            return
        }

        const ctx = {
            initedTabs,
            pageUrl,
            keyword,
            useSectionAsMenu,
            setRoutes,
            setIndex,
            indexRef,
            routesRef,
            onChangeRoute: callOnChangeRoute,
        }

        if (urlOrSearchChanged) {
            a.applyUrlChange?.(ctx)
        } else if (softRefresh) {
            a.applySoftRefresh?.(ctx)
        }
    }, [
        keyword,
        pageUrl,
        pageTimestamp,
        ts,
        initedTabs,
        useSectionAsMenu,
        setIndex,
        callOnChangeRoute,
    ])

    // Optional: menu change (native merges tabs).
    const menuStateRef = useRef(menu)
    useEffect(() => {
        const a = adapterRef.current
        if (!a.onMenuChange) return
        if (menu === menuStateRef.current) return
        const prevMenu = menuStateRef.current
        menuStateRef.current = menu
        a.onMenuChange({
            menu,
            prevMenu,
            initedTabs,
            setRoutes,
            routesRef,
        })
    }, [menu, initedTabs])

    // Optional: emitter link / popstate → switch index by href.
    useEffect(() => {
        const a = adapterRef.current
        if (!a.subscribeExternalHref) return undefined

        return a.subscribeExternalHref(
            (href) => {
                const found = findConductorRouteIndex(
                    routesRef.current,
                    href,
                    useSectionAsMenu
                )
                if (found !== -1 && found !== indexRef.current) {
                    setIndex(found)
                    return routesRef.current?.[found]
                }
                return null
            },
            {
                setIndex,
                indexRef,
                routesRef,
                useSectionAsMenu,
                onChangeRoute: callOnChangeRoute,
            }
        )
    }, [useSectionAsMenu, setIndex, callOnChangeRoute])

    // Optional persist (native cache write-through + unmount).
    useEffect(() => {
        const persist = adapterRef.current.persist
        if (!persist?.write) return
        persist.write(routes, index)
    }, [routes, index, persistWriteKey])

    useEffect(() => {
        const persist = adapterRef.current.persist
        if (!persist?.subscribeUnmount) return undefined
        return persist.subscribeUnmount(() => ({
            routes: routesRef.current,
            index: indexRef.current,
        }))
    }, [persistKey])

    const activeRoute = useMemo(
        () => routes.find((item) => item.index === index),
        [routes, index]
    )
    const prevRoute = useMemo(
        () => routes.find((item) => item.index === prevIndex),
        [routes, prevIndex]
    )

    return {
        routes,
        setRoutes,
        routesRef,
        index,
        setIndex,
        indexRef,
        prevIndex,
        activeRoute,
        prevRoute,
        onSelectTab,
        findIndex: (url) =>
            findConductorRouteIndex(routesRef.current, url, useSectionAsMenu),
        findIndexOrZero: (url) =>
            findConductorRouteIndexOrZero(
                routesRef.current,
                url,
                useSectionAsMenu
            ),
    }
}
