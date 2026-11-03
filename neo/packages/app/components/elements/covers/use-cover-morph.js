'use client'

import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { appSetting } from 'app/lib/util'
import { useIsDesktop } from 'app/context/measure'
import { useCoverMorphDriver } from './use-cover-morph-driver'
import { getCoverMorphSizing } from './constants'
import { coverTabScroll } from './cover-tab-scroll'

/**
 * Native CoverMorph: overlay measure + list-scroll collapse.
 * Web: `./use-cover-morph.web.js`
 */
export function useCoverMorph({
    data,
    mode,
    showImage = true,
    pageKey,
    onProgress,
    coverScrollY,
    onOverlayHeight,
    onCollapseRange,
    skipCollapse = false,
    stickyTop = 0,
}) {
    const isDesktop = useIsDesktop()
    const sizing = getCoverMorphSizing(isDesktop)
    const [collapsed, setCollapsed] = useState(false)
    const [expandedHeight, setExpandedHeight] = useState(0)
    const [pinnedRowsHeight, setPinnedRowsHeight] = useState(0)
    const overlayMaxRef = useRef(0)
    const slotHeightRef = useRef(44)
    const scrollCollapseRangeRef = useRef(0)

    const coverMode =
        appSetting('cover', 'view_by_module', data?.profile?.module) || mode
    const hasCoverBlock =
        showImage && coverMode !== 'min' && coverMode !== 'none'
    // Collapsed, the overlay is the status bar inset (cover-morph.js pads it), the compact bar
    // (stripH) and the rows pinned under it (tabs, filter). The list reserves the expanded height, so
    // the range leaves exactly that much of it showing, or the bar covers the top of the content.
    const parallaxRange = Math.max(0, expandedHeight - sizing.stripH - stickyTop - pinnedRowsHeight)

    useCoverMorphDriver({
        coverScrollY,
        pageKey,
        onProgress,
        avatarExpandedPx: sizing.avatarExpandedPx,
        slotHeightRef,
        scrollCollapseRangeRef,
        hasCoverBlock,
        setCollapsed,
        skipCollapse,
    })

    useLayoutEffect(() => {
        overlayMaxRef.current = 0
        setExpandedHeight(0)
        slotHeightRef.current = 44
        scrollCollapseRangeRef.current = 0
        onOverlayHeight?.(0)
    }, [pageKey, onOverlayHeight])

    useLayoutEffect(() => {
        scrollCollapseRangeRef.current = parallaxRange
        if (parallaxRange > 0) {
            coverTabScroll.range = parallaxRange
            // Only this cover's conductor: a pinned tab switch follows the new tab's rows.
            onCollapseRange?.(parallaxRange)
        }
    }, [parallaxRange, onCollapseRange])

    const onSlotLayout = useCallback((e) => {
        const h = e.nativeEvent.layout.height
        if (h > 0) slotHeightRef.current = h
    }, [])

    const onInnerLayout = useCallback((e) => {
        const height = e.nativeEvent.layout.height
        if (height <= 0) return
        setExpandedHeight((prev) => (height > prev ? height : prev))
    }, [])

    const onPinnedRowsLayout = useCallback((e) => {
        const height = e.nativeEvent.layout.height
        setPinnedRowsHeight((prev) => (prev === height ? prev : height))
    }, [])

    const onRootLayout = useCallback(
        (e) => {
            const height = e.nativeEvent.layout.height
            if (height > overlayMaxRef.current) {
                overlayMaxRef.current = height
                onOverlayHeight?.(height)
            }
        },
        [onOverlayHeight],
    )

    return {
        collapsed,
        onSlotLayout,
        onInnerLayout,
        onPinnedRowsLayout,
        onRootLayout,
        parallaxRange,
        coverScrollY,
    }
}
