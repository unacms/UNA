import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
    partitionConductorLeftbar,
    getLeftbarExcludedFromMainIds,
    formValuesToFilterEntries,
    patchConductorRouteFilters,
} from './helpers'

/**
 * Shared conductor pieces that are identical on web and native:
 * leftbar partition + filter form → route.endpoint.
 *
 * Routes / index: `use-conductor-routes.js` (shared state machine).
 * Platform specifics stay inline in index.js / index.web.js as `adapter`.
 * Presentational UI: `shared-ui.js`, `native-ui.js`, `web-ui.js`.
 */

/**
 * Leftbar menu vs filters vs “don’t also render in main list” ids.
 *
 * @param {object} opts
 * @param {array}  opts.leftbarContent
 * @param {string} opts.layoutName
 * @param {boolean} [opts.isDesktop=false] — web only; native always false
 */
export function useConductorLeftbar({
    leftbarContent = [],
    layoutName,
    isDesktop = false,
}) {
    const { menuBlocks, filterBlocks } = useMemo(
        () => partitionConductorLeftbar(leftbarContent, layoutName),
        [leftbarContent, layoutName]
    )

    const excludedFromMainIds = useMemo(
        () =>
            getLeftbarExcludedFromMainIds({
                layoutName,
                leftbarContent,
                menuBlocks,
                filterBlocks,
                isDesktop,
            }),
        [layoutName, leftbarContent, menuBlocks, filterBlocks, isDesktop]
    )

    return {
        leftbarMenuBlocks: menuBlocks,
        leftbarFilterBlocks: filterBlocks,
        leftbarExcludedFromMainIds: excludedFromMainIds,
    }
}

/**
 * Filter form → route.endpoint.params.filters.
 *
 * Always reads the latest tab index via ref so callers can keep a stable
 * onFormChangedValues without going through platform setIndex wrappers
 * (web’s setIndex also plays click / updates prevIndex).
 *
 * @param {object} opts
 * @param {number} opts.index — active tab
 * @param {Function} opts.setRoutes
 * @param {object} [opts.routesRef] — optional; skip no-op filter updates early
 * @param {boolean} [opts.skipFirstChange=false] — native ignores first onChange (form init)
 */
export function useConductorFilters({
    index,
    setRoutes,
    routesRef,
    skipFirstChange = false,
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
                if (JSON.stringify(currentFilters) === JSON.stringify(nextFilters)) {
                    return
                }
            }

            setFilterValue(filterEntries, values)
        },
        [routesRef, setFilterValue, skipFirstChange]
    )

    return {
        setFilterValue,
        onFormChangedValues,
        formValuesToFilterEntries,
    }
}
