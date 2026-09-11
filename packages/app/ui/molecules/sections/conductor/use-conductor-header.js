import { useCallback, useEffect, useRef } from 'react'
import {
    useSetHeader,
    defaultHeader,
    useSetHeaderHeight,
    getHeaderWriteGeneration,
} from 'app/context/jotai/layout'
import { isTabScopedChromeKey, useTabChromeKey } from 'app/context/tab-chrome'
import { useFocusEffect } from 'app/lib/hooks/router'
import { consumeNotificationsConductorStale } from 'app/lib/cache/native-conductor-cache'

/**
 * Ownership of the shared header atom (section 5 of `index.js`).
 *
 * The header atom is global: several mounted screens can write it, and the
 * last writer wins. Three rules keep that from turning into a race:
 *   a) only the focused screen writes  (isFocused / useFocusEffect)
 *   b) on blur we only reset what *we* wrote  (write-generation check)
 *   c) subtab switches are not a blur and must not reset anything
 *
 * Two placements, decided by `useLocalHeader`:
 * - true  (profile) → the conductor renders its chrome inline and tells the
 *   page header to disappear (`header: false`, height 0)
 * - false            → the chrome is pushed into the atom as `subHeader`
 *
 * Also the natural place for "catch up on notifications that arrived while
 * this screen was in the background", since that is a focus event too.
 *
 * @param {object}   opts
 * @param {node}     opts.headerComponent   The conductor chrome element.
 * @param {boolean}  opts.useLocalHeader    Render inline vs push to the atom.
 * @param {boolean}  opts.isFocused
 * @param {object}   opts.routesRef
 * @param {object}   opts.indexRef
 * @param {Function} opts.onStartRefresh    For the notifications catch-up.
 */
export function useConductorHeader({
    headerComponent,
    useLocalHeader,
    isFocused,
    routesRef,
    indexRef,
    onStartRefresh,
}) {
    const setHeader = useSetHeader()
    const setHeaderHeight = useSetHeaderHeight()
    const tabScopedHeader = isTabScopedChromeKey(useTabChromeKey())

    const subHeaderRef = useRef(headerComponent)
    subHeaderRef.current = headerComponent
    /** Generation of our last write, compared against the atom's on blur. */
    const headerWriteRef = useRef(0)
    /** setHeader + remember that this write was ours. */
    const setOwnedHeader = useCallback((value) => {
        setHeader(value)
        headerWriteRef.current = getHeaderWriteGeneration()
    }, [setHeader])

    // (a) On focus: claim the header. Also catch up on notifications that
    // arrived while this screen was in the background.
    useFocusEffect(
        useCallback(() => {
            if (useLocalHeader) {
                setOwnedHeader({ header: false })
                setHeaderHeight(0)
            } else {
                setOwnedHeader({ subHeader: subHeaderRef.current })
            }
            const unit =
                routesRef.current?.[indexRef.current]?.endpoint?.unit
            if (unit === 'notifications' && consumeNotificationsConductorStale()) {
                onStartRefresh()
            }
        }, [useLocalHeader, setOwnedHeader, setHeaderHeight, onStartRefresh])
    )

    // (b) + (c) Reset chrome only on a real blur. Subtab switches remount this conductor
    // while the screen stays focused — a focus-effect cleanup would clear
    // subHeader, zero the list offset, and PageHeader would not re-measure.
    // Skip if another screen already wrote the shared header in this commit
    // (sibling useEffects run in tree order; useFocusEffect can run first).
    const wasFocusedRef = useRef(isFocused)
    useEffect(() => {
        const wasFocused = wasFocusedRef.current
        wasFocusedRef.current = isFocused
        if (
            wasFocused
            && !isFocused
            && !tabScopedHeader
            && headerWriteRef.current === getHeaderWriteGeneration()
        ) {
            setHeader(defaultHeader)
        }
    }, [isFocused, setHeader, tabScopedHeader])

    // (a) Keep the pushed subHeader in sync while focused. The ref guard stops
    // an identical element from re-writing the atom on every render.
    const lastPushedSubHeaderRef = useRef(null)
    useEffect(() => {
        // Only the focused screen may update the shared subHeader; on refocus
        // the useFocusEffect above restores it from subHeaderRef.
        if (!useLocalHeader && isFocused) {
            if (lastPushedSubHeaderRef.current === headerComponent) return
            lastPushedSubHeaderRef.current = headerComponent
            setOwnedHeader({ subHeader: headerComponent })
        }
    }, [useLocalHeader, isFocused, headerComponent, setOwnedHeader])
}
