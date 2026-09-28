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
    skipIdentityBar = false,
    skipCollapse = false,
}) {
    useLayoutEffect(() => {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            return undefined
        }
        let cleaned = false
        let remove = () => {}

        const start = () => {
            if (cleaned) return
            const content = document.querySelector('.ns--conductor-tab-content--')

            if (skipIdentityBar) {
                const tabbar = tabBarRef.current
                if (!tabbar?.classList) {
                    requestAnimationFrame(start)
                    return
                }
                const measure = () => {
                    if (!content) return
                    const reserve =
                        window.innerHeight -
                        stickyTop -
                        (tabbar?.offsetHeight || 0)
                    content.style.minHeight =
                        reserve > 0 ? `${Math.ceil(reserve)}px` : ''
                }
                measure()
                setCollapsed(false)
                onProgress?.(0)
                window.addEventListener('resize', measure)
                window.addEventListener('resize_panel', measure)
                remove = () => {
                    window.removeEventListener('resize', measure)
                    window.removeEventListener('resize_panel', measure)
                    if (content) content.style.minHeight = ''
                }
                return
            }

            const bar = barRef.current
            if (!bar?.classList) {
                requestAnimationFrame(start)
                return
            }
            const cover = coverRef.current
            const tabbar = tabBarRef.current

            if (skipCollapse) {
                const measure = () => {
                    if (!content) return
                    const reserve =
                        window.innerHeight -
                        stickyTop -
                        (bar?.offsetHeight || 0) -
                        (tabbar?.offsetHeight || 0)
                    content.style.minHeight =
                        reserve > 0 ? `${Math.ceil(reserve)}px` : ''
                }
                measure()
                setCollapsed(false)
                onProgress?.(0)
                window.addEventListener('resize', measure)
                window.addEventListener('resize_panel', measure)
                remove = () => {
                    window.removeEventListener('resize', measure)
                    window.removeEventListener('resize_panel', measure)
                    if (content) content.style.minHeight = ''
                }
                return
            }

            let range = 0
            let lastCollapsed = null

            // Chrome scroll anchoring shifts scrollTop by the bar's height delta on
            // every toggle, which flips the state back and forth (cover "shakes").
            const root = document.documentElement
            const prevOverflowAnchor = root.style.overflowAnchor
            root.style.overflowAnchor = 'none'

            const measure = () => {
                // Slot shrinks when collapsed; keep the expanded-state range.
                if (!lastCollapsed || range <= 0) {
                    const slot = bar.querySelector('.ns--cover-morph-slot--')
                    const slotH = slot?.offsetHeight || 44
                    range = computeMorphCollapseRange(
                        avatarExpandedPx,
                        slotH,
                        !!cover,
                    )
                }
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
                // Cover bottom = bar's in-flow top, and it keeps its height in both
                // states, so the threshold depends on scroll only, not on bar layout.
                const anchor = coverRef.current
                const dist =
                    (anchor
                        ? anchor.getBoundingClientRect().bottom
                        : bar.getBoundingClientRect().top) - stickyTop
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
                root.style.overflowAnchor = prevOverflowAnchor
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
        skipIdentityBar,
        skipCollapse,
    ])
}
