import { useCallback, useEffect, useMemo, useRef } from 'react'
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
                // Structural compare: key order from the form may differ from UNA's.
                if (deepEqual(currentFilters, nextFilters)) {
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
