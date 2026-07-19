'use client'

import { View, Pressable } from 'app/design/view'
import { Text } from 'app/design/typography'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Platform } from 'react-native'
import Svg, { ClipPath, Defs, Path, Rect } from 'react-native-svg'
import { useCSSVariable } from 'uniwind'
import DropdownPopup from 'app/ui/atoms/dropdown-popup'
import { useScrollValue } from 'app/context/jotai/layout'
import { useWindowHeight } from 'app/context/measure'

const isWeb = Platform.OS === 'web'

// The web spy uses its own window scroll listener. Never subscribe the wiki
// layout to the scroll atom on web — it updates every frame during scroll and
// would re-render the entire page tree. Platform is constant per bundle.
const useNativeScrollValue = isWeb ? () => 0 : useScrollValue
const useNativeWindowHeight = isWeb ? () => 0 : useWindowHeight

// Match Fumadocs TOC offsets (packages/base-ui/.../toc/default.tsx).
const LINE_BASE = 8

/** Horizontal offset of the tracking line for h2 / h3. */
function getLineOffset(level) {
    if (level <= 2) return LINE_BASE
    return LINE_BASE + 8
}

function getItemPaddingStart(level) {
    if (level <= 2) return LINE_BASE + 12
    return LINE_BASE + 24
}

function arraysEqual(a, b) {
    if (a === b) return true
    if (!a || !b || a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false
    }
    return true
}

function findHeadingElement(id, contentRoot) {
    if (!id || typeof document === 'undefined') return null
    // Prefer the wiki article root so stale nodes from a previous page aren't used.
    if (contentRoot?.querySelector) {
        try {
            const scoped = contentRoot.querySelector(`#${CSS.escape(id)}`)
            if (scoped) return scoped
        } catch {
            // CSS.escape may throw on odd ids — fall through.
        }
    }
    return document.getElementById(id)
}

/**
 * Compute which TOC headings' sections intersect the reading viewport.
 * A heading's "section" runs from its top to the next heading's top.
 */
function activeIdsFromPositions(positions, viewTop, viewBottom) {
    if (!positions.length) return []

    const active = []
    for (let i = 0; i < positions.length; i++) {
        const start = positions[i].top
        const end = positions[i + 1]?.top
            ?? (start + Math.max(positions[i].height, 1) + 240)
        if (end > viewTop && start < viewBottom) {
            active.push(positions[i].id)
        }
    }

    if (active.length) return active

    // Fallback: heading closest to the top reading line.
    let bestId = positions[0].id
    let bestDist = Number.POSITIVE_INFINITY
    for (const pos of positions) {
        const dist = Math.abs(pos.top - viewTop)
        if (dist < bestDist) {
            bestDist = dist
            bestId = pos.id
        }
    }
    return bestId ? [bestId] : []
}

/**
 * Scroll-spy for wiki TOC — multi-active range of headings whose sections
 * intersect the viewport (Fumadocs-style). Uses scroll geometry rather than
 * IntersectionObserver so in-layout wiki navigations don't leave a stale IO
 * map that collapses to a single fallback highlight.
 * @see https://github.com/fuma-nama/fumadocs (packages/core/src/toc.tsx)
 */
export function useWikiTocSpy(tocItems, {
    headerOffset = 0,
    pageKey,
    contentRootRef,
    headingRefs,
    scrollRef,
} = {}) {
    const [activeIds, setActiveIds] = useState([])
    const scrollY = useNativeScrollValue()
    const windowHeight = useNativeWindowHeight()
    const idsKey = useMemo(
        () => (tocItems || []).map((item) => item.id).join('|'),
        [tocItems],
    )

    const setActiveSafe = useCallback((next) => {
        setActiveIds((prev) => (arraysEqual(prev, next) ? prev : next))
    }, [])

    // Web: measure heading boxes on scroll/resize (stable across client navigations).
    useEffect(() => {
        if (!isWeb) return
        if (!tocItems?.length) {
            setActiveSafe([])
            return
        }

        const ids = tocItems.map((item) => item.id)
        let raf = 0
        let mutateTimer = 0

        const publish = () => {
            const root = contentRootRef?.current || null
            const viewTop = Math.max(0, headerOffset)
            // Upper ~65% of the viewport = "reading" band (similar to Fumadocs rootMargin).
            const viewBottom = window.innerHeight * 0.65

            const positions = []
            for (const id of ids) {
                const el = findHeadingElement(id, root)
                if (!el) continue
                const rect = el.getBoundingClientRect()
                positions.push({ id, top: rect.top, height: rect.height })
            }

            setActiveSafe(activeIdsFromPositions(positions, viewTop, viewBottom))
        }

        const schedule = () => {
            cancelAnimationFrame(raf)
            raf = requestAnimationFrame(publish)
        }

        const scheduleFromMutation = () => {
            // Debounce: markdown/WASM swaps fire many mutations; don't thrash.
            clearTimeout(mutateTimer)
            mutateTimer = setTimeout(schedule, 64)
        }

        window.addEventListener('scroll', schedule, { passive: true })
        window.addEventListener('resize', schedule)

        const root = contentRootRef?.current
        const mo = root
            ? new MutationObserver(scheduleFromMutation)
            : null
        mo?.observe(root, { childList: true, subtree: true })

        schedule()

        return () => {
            cancelAnimationFrame(raf)
            clearTimeout(mutateTimer)
            window.removeEventListener('scroll', schedule)
            window.removeEventListener('resize', schedule)
            mo?.disconnect()
        }
    }, [contentRootRef, headerOffset, idsKey, pageKey, setActiveSafe, tocItems])

    // Native: derive visible range from scroll offset + measured heading Y.
    useEffect(() => {
        if (isWeb || !tocItems?.length) return

        let cancelled = false
        const scrollView = scrollRef?.current
        const refs = headingRefs?.current
        if (!scrollView || !refs) return

        const measureOne = (id) => new Promise((resolve) => {
            const node = refs.get(id)
            if (!node?.measureLayout) {
                resolve(null)
                return
            }
            node.measureLayout(
                scrollView,
                (_x, y, _w, h) => resolve({ id, top: y, height: h || 0 }),
                () => resolve(null),
            )
        })

        Promise.all(tocItems.map((item) => measureOne(item.id))).then((rows) => {
            if (cancelled) return
            const positions = rows.filter(Boolean)
            if (!positions.length) return

            const viewTop = Number(scrollY) + Math.max(0, headerOffset)
            const viewBottom = Number(scrollY) + (Number(windowHeight) || 600) * 0.65

            setActiveSafe(activeIdsFromPositions(positions, viewTop, viewBottom))
        })

        return () => {
            cancelled = true
        }
    }, [headerOffset, headingRefs, idsKey, pageKey, scrollRef, scrollY, setActiveSafe, tocItems, windowHeight])

    return activeIds
}

/**
 * Build the indent-following path. Connections use cubic Béziers like Fumadocs:
 * `C upperX (top-4) x (upperBottom+4) x top`
 */
function buildTrackGeometry(items, layouts) {
    let width = LINE_BASE + 8
    let height = 0
    let d = ''
    const positions = []
    const positionedItems = []

    for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const layout = layouts[item.id]
        if (!layout) continue

        const x = getLineOffset(item.level) + 0.5
        const top = layout.top
        const bottom = layout.bottom

        width = Math.max(width, x + 8)
        height = Math.max(height, bottom)

        if (!positions.length) {
            d += `M${x} ${top} L${x} ${bottom}`
        } else {
            const [, upperBottom, upperX] = positions[positions.length - 1]
            if (upperX === x) {
                // Same indent — continue the vertical run.
                d += ` L${x} ${bottom}`
            } else {
                // Smooth stair between indent levels (Fumadocs default TOC).
                d += ` C${upperX} ${top - 4} ${x} ${upperBottom + 4} ${x} ${top} L${x} ${bottom}`
            }
        }

        positions.push([top, bottom, x])
        positionedItems.push(item)
    }

    if (!positions.length) return null
    return { width, height: Math.ceil(height), d, positions, positionedItems }
}

function WikiTocTrack({ geometry, activeIds }) {
    const clipId = `wiki-toc-clip-${useId().replace(/:/g, '')}`
    const [primaryToken, borderToken] = useCSSVariable(['--color-primary', '--color-border'])
    const primary = isWeb ? 'var(--color-primary)' : (primaryToken || '#f59e0b')
    const border = isWeb ? 'var(--color-border)' : (borderToken || 'rgba(128,128,128,0.35)')

    const startIdx = geometry
        ? geometry.positionedItems.findIndex((item) => activeIds.includes(item.id))
        : -1
    const endIdx = (() => {
        if (!geometry) return -1
        for (let i = geometry.positionedItems.length - 1; i >= 0; i--) {
            if (activeIds.includes(geometry.positionedItems[i].id)) return i
        }
        return -1
    })()

    if (!geometry) return null

    const hasActiveRange = startIdx >= 0 && endIdx >= 0
    const trackTop = hasActiveRange ? geometry.positions[startIdx][0] : 0
    const trackBottom = hasActiveRange ? geometry.positions[endIdx][1] : 0
    const clipHeight = Math.max(0, trackBottom - trackTop)

    return (
        <View
            pointerEvents="none"
            className="absolute top-0 left-0"
            style={{ width: geometry.width, height: geometry.height }}
        >
            <Svg
                width={geometry.width}
                height={geometry.height}
                viewBox={`0 0 ${geometry.width} ${geometry.height}`}
                style={{ display: 'block' }}
            >
                {hasActiveRange ? (
                    <Defs>
                        <ClipPath id={clipId}>
                            <Rect
                                x={0}
                                y={trackTop}
                                width={geometry.width}
                                height={clipHeight}
                            />
                        </ClipPath>
                    </Defs>
                ) : null}
                <Path
                    d={geometry.d}
                    stroke={border}
                    strokeWidth={1}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {hasActiveRange ? (
                    <Path
                        d={geometry.d}
                        stroke={primary}
                        strokeWidth={1}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        clipPath={`url(#${clipId})`}
                    />
                ) : null}
            </Svg>
        </View>
    )
}

function resolveDomNode(ref) {
    if (!ref) return null
    if (typeof ref.getBoundingClientRect === 'function') return ref
    // Some RN-web hosts keep the DOM node on _node / getNode().
    if (typeof ref.getNode === 'function') {
        const node = ref.getNode()
        if (node && typeof node.getBoundingClientRect === 'function') return node
    }
    if (ref._node && typeof ref._node.getBoundingClientRect === 'function') return ref._node
    return null
}

/**
 * Measure link content boxes relative to the TOC container (Fumadocs-style:
 * top = rowTop + paddingTop, bottom = rowTop + height - paddingBottom).
 */
function measureTocLayoutsWeb(containerRef, itemIds, itemNodeRefs) {
    const layouts = {}
    const container = resolveDomNode(containerRef)
    if (!container || !itemIds?.length) return layouts

    const containerRect = container.getBoundingClientRect()
    const scrollTop = container.scrollTop || 0

    for (const id of itemIds) {
        const el = resolveDomNode(itemNodeRefs.current.get(id))
        if (!el) continue
        const rect = el.getBoundingClientRect()
        const styles = window.getComputedStyle(el)
        const paddingTop = parseFloat(styles.paddingTop) || 0
        const paddingBottom = parseFloat(styles.paddingBottom) || 0
        const y = rect.top - containerRect.top + scrollTop
        layouts[id] = {
            top: y + paddingTop,
            bottom: y + rect.height - paddingBottom,
        }
    }
    return layouts
}

/**
 * @param {object} props
 * @param {Array} props.items
 * @param {string[]} [props.activeIds] — headings in the viewport reading band
 * @param {string|null} [props.focusedId] — last clicked TOC item (bg while in view)
 * @param {(id: string) => void} props.onPress
 * @param {boolean} [props.showTrack] — Fumadocs-style indent-following rail (sidebar)
 */
export function WikiTocList({ items, activeIds = [], focusedId = null, onPress, showTrack = false }) {
    const containerRef = useRef(null)
    const itemNodeRefs = useRef(new Map())
    const [layouts, setLayouts] = useState({})
    const activeSet = useMemo(() => new Set(activeIds), [activeIds])
    const itemsKey = useMemo(() => (items || []).map((item) => item.id).join('|'), [items])
    const itemIds = useMemo(() => (items || []).map((item) => item.id), [items])

    const remeasure = useCallback(() => {
        if (!showTrack) return

        if (isWeb) {
            const next = measureTocLayoutsWeb(containerRef.current, itemIds, itemNodeRefs)
            setLayouts((prev) => {
                const prevKey = JSON.stringify(prev)
                const nextKey = JSON.stringify(next)
                return prevKey === nextKey ? prev : next
            })
            return
        }

        const container = containerRef.current
        if (!container) return

        const pending = itemIds.map((id) => new Promise((resolve) => {
            const node = itemNodeRefs.current.get(id)
            if (!node?.measureLayout) {
                resolve(null)
                return
            }
            node.measureLayout(
                container,
                (_x, y, _w, h) => {
                    const pad = 6
                    resolve({ id, top: y + pad, bottom: y + h - pad })
                },
                () => resolve(null),
            )
        }))

        Promise.all(pending).then((rows) => {
            const next = {}
            for (const row of rows) {
                if (row) next[row.id] = { top: row.top, bottom: row.bottom }
            }
            setLayouts(next)
        })
    }, [itemIds, showTrack])

    useEffect(() => {
        if (!showTrack) return
        setLayouts({})
        const id = requestAnimationFrame(() => {
            requestAnimationFrame(remeasure)
        })
        return () => cancelAnimationFrame(id)
    }, [itemsKey, remeasure, showTrack])

    useEffect(() => {
        if (!showTrack || !isWeb) return
        const container = resolveDomNode(containerRef.current)
        if (!container || typeof ResizeObserver === 'undefined') return

        const observer = new ResizeObserver(() => remeasure())
        observer.observe(container)
        remeasure()
        return () => observer.disconnect()
    }, [remeasure, showTrack, itemsKey])

    const geometry = useMemo(
        () => (showTrack ? buildTrackGeometry(items, layouts) : null),
        [items, layouts, showTrack],
    )

    if (!items?.length) return null

    return (
        <View ref={containerRef} className="relative">
            {showTrack ? (
                <WikiTocTrack
                    geometry={geometry}
                    activeIds={activeIds}
                />
            ) : null}
            {items.map((item, index) => {
                const isInView = activeSet.has(item.id)
                const isFocused = Boolean(focusedId && focusedId === item.id && isInView)
                const padStart = showTrack
                    ? getItemPaddingStart(item.level)
                    : (item.level === 3 ? 12 : 0)
                const isFirst = index === 0
                const isLast = index === items.length - 1

                return (
                    <Pressable
                        key={item.key}
                        ref={(node) => {
                            if (node) itemNodeRefs.current.set(item.id, node)
                            else itemNodeRefs.current.delete(item.id)
                        }}
                        href={`#${item.id}`}
                        onPress={() => onPress(item.id)}
                        className={`justify-center pe-2 rounded-md ${
                            showTrack
                                ? `${isFirst ? 'pt-1.5' : 'pt-1.5'} ${isLast ? 'pb-1.5' : 'pb-1.5'}`
                                : 'min-h-8 py-1.5'
                        } ${
                            isFocused
                                ? 'bg-accent/60'
                                : 'web:hover:bg-muted/50'
                        }`}
                        style={{ paddingInlineStart: padStart }}
                        accessibilityRole="link"
                        accessibilityState={{ selected: isFocused || isInView }}
                    >
                        <Text
                            className={`text-sm leading-snug ${
                                isInView
                                    ? 'text-primary font-medium'
                                    : 'text-muted-foreground web:hover:text-foreground'
                            }`}
                        >
                            {item.text}
                        </Text>
                    </Pressable>
                )
            })}
        </View>
    )
}

/** Compact TOC for transient dropdowns — no scroll-spy rail (closes on navigate). */
function WikiTocMenuList({ items, activeIds = [], focusedId = null, onPress }) {
    const activeSet = useMemo(() => new Set(activeIds), [activeIds])
    if (!items?.length) return null

    return (
        <View className="gap-0.5">
            {items.map((item) => {
                const isInView = activeSet.has(item.id)
                const isFocused = Boolean(focusedId && focusedId === item.id && isInView)
                return (
                    <Pressable
                        key={item.key}
                        href={`#${item.id}`}
                        onPress={() => onPress(item.id)}
                        className={`min-h-9 justify-center px-3 py-1.5 rounded-lg ${
                            item.level === 3 ? 'ms-3' : ''
                        } ${isFocused ? 'bg-accent/60' : 'web:hover:bg-muted/50'}`}
                        accessibilityRole="link"
                        accessibilityState={{ selected: isFocused || isInView }}
                    >
                        <Text
                            className={`text-sm leading-snug ${
                                isInView
                                    ? 'text-primary font-medium'
                                    : 'text-muted-foreground web:hover:text-foreground'
                            }`}
                        >
                            {item.text}
                        </Text>
                    </Pressable>
                )
            })}
        </View>
    )
}

export function WikiTocDropdown({ items, activeIds, focusedId = null, onPress, label }) {
    if (!items?.length || items.length < 2) return null

    return (
        <DropdownPopup
            minPopupWidth={256}
            contentClasses="rounded-xl border border-popover mt-2 bg-popover/60 backdrop-blur shadow-md"
            buttonProps={{
                label,
                style: 'borderless',
                controlSize: 'small',
                image: 'ChevronDown',
                borderShape: 'capsule',
                imagePlacement: 'trailing',
            }}
        >
            <View className="p-1">
                <WikiTocMenuList
                    items={items}
                    activeIds={activeIds}
                    focusedId={focusedId}
                    onPress={onPress}
                />
            </View>
        </DropdownPopup>
    )
}
