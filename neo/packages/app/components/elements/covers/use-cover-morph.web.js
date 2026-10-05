'use client'

import { useCallback, useRef, useState } from 'react'
import { useIsDesktop } from 'app/context/measure'
import { useCoverMorphDriver } from './use-cover-morph-driver'
import { getCoverMorphSizing } from './constants'

/**
 * Web CoverMorph: sticky-bar collapse, no overlay measure.
 */
export function useCoverMorph({
    pageKey,
    stickyTop = 0,
    onProgress,
    skipIdentityBar = false,
    skipCollapse = false,
    hideCollapsedBar = false,
}) {
    const isDesktop = useIsDesktop()
    const sizing = getCoverMorphSizing(isDesktop)
    const [collapsed, setCollapsed] = useState(false)
    const [flowH, setFlowH] = useState(sizing.stripH)
    const barRef = useRef(null)
    const coverRef = useRef(null)
    const tabBarRef = useRef(null)

    useCoverMorphDriver({
        barRef,
        coverRef,
        tabBarRef,
        stickyTop,
        stripH: hideCollapsedBar ? 0 : sizing.stripH,
        pageKey,
        onProgress,
        avatarExpandedPx: sizing.avatarExpandedPx,
        setCollapsed,
        skipIdentityBar,
        skipCollapse,
    })

    const onBarLayout = useCallback((e) => {
        const h = Math.round(e?.nativeEvent?.layout?.height || 0)
        if (h > 0) setFlowH((prev) => (prev === h ? prev : h))
    }, [])

    return {
        collapsed,
        flowH,
        barRef,
        coverRef,
        tabBarRef,
        onBarLayout,
    }
}
