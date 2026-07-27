import { useEffect, useState } from 'react'
import { Platform } from 'react-native'

/** Sum of .header-fixed stacks (page header + cover/tab bar) — same as layout.web.js getTopOffset. */
export function measureHeaderFixedOffset() {
    if (typeof document === 'undefined') return 0
    let sum = 0
    document.querySelectorAll('.header-fixed').forEach((el) => {
        const rect = el.getBoundingClientRect()
        if (rect.height <= 0) return
        const style = getComputedStyle(el)
        sum += rect.height
            + parseFloat(style.marginTop || 0)
            + parseFloat(style.marginBottom || 0)
    })
    return sum
}

/**
 * Sticky sidebar top offset that clears the live header-fixed stack.
 * Prefer this over wiki's top:0 + padding when opaque fixed cover/tab bars exist.
 * Web-only listeners: on RN `window` exists as a stub without addEventListener.
 */
export function useStickyHeaderOffset(fallback = 0) {
    const [offset, setOffset] = useState(() => Number(fallback) || 0)

    useEffect(() => {
        if (
            Platform.OS !== 'web' ||
            typeof window === 'undefined' ||
            typeof window.addEventListener !== 'function'
        ) {
            setOffset(Number(fallback) || 0)
            return undefined
        }

        const update = () => {
            const next = measureHeaderFixedOffset()
            setOffset(next > 0 ? next : (Number(fallback) || 0))
        }
        update()
        window.addEventListener('scroll', update, { passive: true })
        window.addEventListener('resize', update)
        window.addEventListener('resize_panel', update)
        return () => {
            window.removeEventListener('scroll', update)
            window.removeEventListener('resize', update)
            window.removeEventListener('resize_panel', update)
        }
    }, [fallback])

    return offset
}

export function stickySidebarStyle(stickyTop) {
    const top = Number(stickyTop) || 0
    return {
        top,
        maxHeight: `calc(100dvh - ${top}px)`,
    }
}
