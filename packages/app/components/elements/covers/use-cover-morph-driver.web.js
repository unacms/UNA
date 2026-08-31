import { useLayoutEffect } from 'react'
import {
    MORPH_HYSTERESIS,
    computeMorphCollapseRange,
} from './constants'

/**
 * Web: toggles collapsed when the morph bar crosses the sticky header.
 * Resolved via `./use-cover-morph-driver` → this file on web.
 */
export function useCoverMorphDriver({
    barRef,
    coverRef,
    tabBarRef,
    stickyTop,
    pageKey,
    onProgress,
    avatarExpandedPx,
    stripH,
    setCollapsed,
}) {
    useLayoutEffect(() => {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            return undefined
        }
        let cleaned = false
        let remove = () => {}

        const start = () => {
            if (cleaned) return
            const bar = barRef.current
            if (!bar?.classList) {
                requestAnimationFrame(start)
                return
            }
            const cover = coverRef.current
            const tabbar = tabBarRef.current
            const content = document.querySelector('.ns--conductor-tab-content--')
            let range = 0
            let lastCollapsed = null

            const measure = () => {
                const slot = bar.querySelector('.ns--cover-morph-slot--')
                const slotH = slot?.offsetHeight || 44
                range = computeMorphCollapseRange(
                    avatarExpandedPx,
                    slotH,
                    !!cover,
                )
                if (content) {
                    const reserve =
                        window.innerHeight -
                        stickyTop -
                        stripH -
                        (tabbar?.offsetHeight || 0)
                    content.style.minHeight =
                        reserve > 0 ? `${Math.ceil(reserve)}px` : ''
                }
            }

            const apply = () => {
                const dist = bar.getBoundingClientRect().top - stickyTop
                let collapsed
                if (range <= 0) {
                    collapsed = dist <= 1
                } else if (lastCollapsed) {
                    collapsed = dist <= range + MORPH_HYSTERESIS
                } else {
                    collapsed = dist <= range
                }
                if (collapsed === lastCollapsed) return
                lastCollapsed = collapsed
                setCollapsed(collapsed)
                onProgress?.(collapsed ? 1 : 0)
            }

            const onResize = () => {
                measure()
                apply()
            }

            measure()
            apply()
            window.addEventListener('scroll', apply, { passive: true, capture: true })
            document.addEventListener('scroll', apply, { passive: true, capture: true })
            window.addEventListener('resize', onResize)
            window.addEventListener('resize_panel', onResize)
            const resizeObserver =
                typeof ResizeObserver !== 'undefined' && cover
                    ? new ResizeObserver(onResize)
                    : null
            resizeObserver?.observe(cover)

            remove = () => {
                window.removeEventListener('scroll', apply, { capture: true })
                document.removeEventListener('scroll', apply, { capture: true })
                window.removeEventListener('resize', onResize)
                window.removeEventListener('resize_panel', onResize)
                resizeObserver?.disconnect()
                if (content) content.style.minHeight = ''
            }
        }

        start()
        return () => {
            cleaned = true
            remove()
        }
    }, [
        barRef,
        coverRef,
        tabBarRef,
        stickyTop,
        pageKey,
        onProgress,
        avatarExpandedPx,
        stripH,
        setCollapsed,
    ])
}
