import { useCallback, useLayoutEffect, useRef } from 'react'
import { useAnimatedReaction, runOnJS } from 'react-native-reanimated'
import {
    MORPH_HYSTERESIS,
    computeMorphCollapseRange,
} from './constants'
import {
    coverTabScroll,
    resetCoverTabScroll,
    releaseCoverTabScrollHold,
} from './cover-tab-scroll'

/** Collapse state at offset `y`, with hysteresis once collapsed. No range: any scroll collapses. */
function isCollapsedAt(y, range, wasCollapsed) {
    if (range <= 0) return y > 0
    return wasCollapsed ? y > range - MORPH_HYSTERESIS : y >= range
}

/**
 * While a tab switch holds the cover collapsed, whether this scroll report counts.
 * The new list can report y=0 (or a small offset) before initialScrollOffset, so it
 * must not expand the cover. A pull past the top is the user asking for the cover:
 * the pinned list starts at its top, with no offset left to scroll back through.
 */
function passesTabSwitchHold(y, range) {
    if (y < -MORPH_HYSTERESIS) {
        releaseCoverTabScrollHold()
        return true
    }
    return isCollapsedAt(y, range, true)
}

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
            if (coverTabScroll.hold && collapsedRef.current && !passesTabSwitchHold(y, range)) {
                return
            }
            const collapsed = isCollapsedAt(y, range, collapsedRef.current)
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
        // No deps: native ignores them (and warns); the Babel plugin collects the closure.
    )
}
