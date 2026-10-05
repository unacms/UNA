import { useCallback, useEffect, useMemo, useRef } from 'react'
import emitter, { EVENTS } from 'app/context/emitter'
import { deepEqual } from 'app/lib/util'
import {
    partitionLeftColumn,
    getLeftColumnExcludedFromMainIds,
    formValuesToFilterEntries,
    patchConductorRouteFilters,
} from './helpers'

/**
 * Shared conductor pieces that are identical on web and native:
 * left column partition + filter form → route.endpoint.
 *
 * Routes / index: `use-conductor-routes.js` (shared state machine).
 * Platform specifics stay inline in index.js / index.web.js as `adapter`.
 * Presentational UI: `shared-ui.js`, `native-ui.js`, `web-ui.js`.
 */

/**
 * Left column menu vs filters vs “don’t also render in main list” ids.
 * Source data is still route.leftbar (UNA JSON).
 *
 * @param {object} opts
 * @param {array}  opts.leftColumnContent
 * @param {string} opts.layoutName
 * @param {boolean} [opts.isDesktop=false] — web only; native always false
 */
export function useLeftColumn({
    leftColumnContent = [],
    layoutName,
    isDesktop = false,
}) {
    const { menuBlocks, filterBlocks } = useMemo(
        () => partitionLeftColumn(leftColumnContent, layoutName),
        [leftColumnContent, layoutName]
    )

    const excludedFromMainIds = useMemo(
        () =>
            getLeftColumnExcludedFromMainIds({
                layoutName,
                leftColumnContent,
                menuBlocks,
                filterBlocks,
                isDesktop,
            }),
        [layoutName, leftColumnContent, menuBlocks, filterBlocks, isDesktop]
    )

    return {
        leftColumnMenuBlocks: menuBlocks,
        leftColumnFilterBlocks: filterBlocks,
        leftColumnExcludedFromMainIds: excludedFromMainIds,
    }
}

/**
 * Filter form → route.endpoint.params.filters.
 *
 * Always reads the latest tab index via ref so callers can keep a stable
 * onFormChangedValues without going through platform setIndex wrappers.
 *
 * Blocks that are not the filter form (e.g. the AI search block) set the same
 * filters through the emitter:
 *
 *   emitter.emit(EVENTS.conductor, { action: 'filters', values: { cat: [2], price: ['', '50'] } })
 *
 * `values` is a plain { input name: value } map, exactly what the search form
 * would submit; `merge: true` keeps the filters already applied.
 *
 * A block can also take over the list itself, when its own endpoint returns results the page's
 * block cannot produce (semantically ranked search, for one):
 *
 *   emitter.emit(EVENTS.conductor, { action: 'endpoint', request_url, params, unit, module })
 *   emitter.emit(EVENTS.conductor, { action: 'endpoint', restore: true })
 *
 * The page's own endpoint is kept and restored on `restore`, so clearing the query brings the
 * original list back.
 *
 * @param {object} opts
 * @param {number} opts.index — active tab
 * @param {Function} opts.setRoutes
 * @param {object} [opts.routesRef] — optional; skip no-op filter updates early
 * @param {boolean} [opts.skipFirstChange=false] — native ignores first onChange (form init)
 * @param {object} [opts.isFocusedRef] — native: only the focused screen reacts to emitter filters
 */
export function useConductorFilters({
    index,
    setRoutes,
    routesRef,
    skipFirstChange = false,
    isFocusedRef,
}) {
    // Native forms fire onChange once on mount with defaults — ignore that.
    const readyRef = useRef(!skipFirstChange)
    const indexRef = useRef(index)
    indexRef.current = index

    useEffect(() => {
        if (skipFirstChange) readyRef.current = false
    }, [index, skipFirstChange])

    const setFilterValue = useCallback(
        (filterEntries, rawFormValues) => {
            setRoutes((prevRoutes) =>
                patchConductorRouteFilters(
                    prevRoutes,
                    indexRef.current,
                    filterEntries,
                    rawFormValues
                )
            )
        },
        [setRoutes]
    )

    const onFormChangedValues = useCallback(
        (values) => {
            if (skipFirstChange && !readyRef.current) {
                readyRef.current = true
                return
            }

            const filterEntries = formValuesToFilterEntries(values)
            const routeIndex = indexRef.current

            if (routesRef) {
                const currentFilters =
                    routesRef.current?.[routeIndex]?.endpoint?.params?.filters
                const nextFilters = {}
                filterEntries.forEach((f) => {
                    nextFilters[f.name] = f.value
                })
                // Structural compare: key order from the form may differ from UNA's.
                if (deepEqual(currentFilters, nextFilters)) {
                    return
                }
            }

            setFilterValue(filterEntries, values)
        },
        [routesRef, setFilterValue, skipFirstChange]
    )

    // The endpoint a block took over from, per route index.
    const originalEndpointRef = useRef({})

    /** Replace the active route's list source, or put the page's own back. */
    const setEndpoint = useCallback((endpoint) => {
        setRoutes((prevRoutes) => {
            const routeIndex = indexRef.current
            const route = prevRoutes?.[routeIndex]
            if (!route?.endpoint) return prevRoutes

            const saved = originalEndpointRef.current[routeIndex]

            if (!endpoint) {
                if (!saved) return prevRoutes
                delete originalEndpointRef.current[routeIndex]
                const restored = [...prevRoutes]
                restored[routeIndex] = { ...route, data: [], endpoint: { ...saved, finished: false } }
                return restored
            }

            if (!saved) originalEndpointRef.current[routeIndex] = route.endpoint

            const next = [...prevRoutes]
            next[routeIndex] = {
                ...route,
                data: [],
                endpoint: {
                    ...route.endpoint,
                    ...endpoint,
                    finished: false,
                },
            }
            return next
        })
    }, [setRoutes])

    // Filters and list source coming from a block instead of the filter form.
    useEffect(() => {
        const sub = emitter.addListener(EVENTS.conductor, (payload) => {
            if (isFocusedRef && !isFocusedRef.current) return

            if (payload?.action === 'endpoint') {
                setEndpoint(payload.restore ? null : {
                    request_url: payload.request_url,
                    params: payload.params,
                    ...(payload.unit ? { unit: payload.unit } : {}),
                    ...(payload.module ? { module: payload.module } : {}),
                })
                return
            }

            if (payload?.action !== 'filters') return

            const values = payload.values && typeof payload.values === 'object' ? payload.values : {}
            const routeIndex = indexRef.current
            const current = payload.merge
                ? routesRef?.current?.[routeIndex]?.endpoint?.params?.filters || {}
                : {}
            const next = { ...current, ...values }

            setFilterValue(
                Object.keys(next).map((name) => ({ name, value: next[name] })),
                null
            )
        })
        return () => sub.remove()
    }, [routesRef, setFilterValue, setEndpoint, isFocusedRef])

    return {
        setFilterValue,
        setEndpoint,
        onFormChangedValues,
        formValuesToFilterEntries,
    }
}
