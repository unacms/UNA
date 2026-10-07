import { useCallback, useLayoutEffect, useRef } from 'react'
import { useAnimatedReaction, runOnJS } from 'react-native-reanimated'
import {
    MORPH_HYSTERESIS,
    computeMorphCollapseRange,
} from './constants'
import {
    coverTabScroll,
    resetCoverTabScroll,
} from './cover-tab-scroll'

/**
 * Native: same collapse thresholds as web, driven by list `coverScrollY`.
 * Metro resolves `./use-cover-morph-driver` → this file on native,
 * `use-cover-morph-driver.web.js` on web.
 */
export function useCoverMorphDriver({
    coverScrollY,
    pageKey,
    onProgress,
    avatarExpandedPx,
    slotHeightRef,
    scrollCollapseRangeRef,
    hasCoverBlock,
    setCollapsed,
    skipCollapse = false,
}) {
    const collapsedRef = useRef(false)

    useLayoutEffect(() => {
        collapsedRef.current = false
        resetCoverTabScroll()
        setCollapsed(false)
        coverScrollY?.set(0)
        onProgress?.(0)
    }, [pageKey, coverScrollY, onProgress, setCollapsed])

    const applyScroll = useCallback(
        (y) => {
            if (skipCollapse) {
                coverTabScroll.y = y
                return
            }
            const measuredRange = scrollCollapseRangeRef?.current ?? 0
            const range =
                measuredRange > 0
                    ? measuredRange
                    : computeMorphCollapseRange(
                          avatarExpandedPx,
                          slotHeightRef.current,
                          hasCoverBlock,
                      )
            // Tab switch remounts the list, which can report y=0 (or a small
            // offset) before initialScrollOffset. Do not expand while holding.
            if (coverTabScroll.hold && collapsedRef.current) {
                const stillCollapsed =
                    range <= 0 ? y > 0 : y > range - MORPH_HYSTERESIS
                if (!stillCollapsed) return
            }
            let collapsed
            if (range <= 0) {
                collapsed = y > 0
            } else if (collapsedRef.current) {
                collapsed = y > range - MORPH_HYSTERESIS
            } else {
                collapsed = y >= range
            }
            coverTabScroll.y = y
            coverTabScroll.range = range
            coverTabScroll.collapsed = collapsed
            if (collapsed === collapsedRef.current) return
            collapsedRef.current = collapsed
            setCollapsed(collapsed)
            onProgress?.(collapsed ? 1 : 0)
        },
        [
            avatarExpandedPx,
            hasCoverBlock,
            onProgress,
            setCollapsed,
            slotHeightRef,
            scrollCollapseRangeRef,
            skipCollapse,
        ],
    )

    useAnimatedReaction(
        () => (coverScrollY ? coverScrollY.get() : 0),
        (y) => {
            if (!coverScrollY) return
            runOnJS(applyScroll)(y)
        },
        [applyScroll, coverScrollY],
    )
}
