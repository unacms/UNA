import { useCallback, useLayoutEffect, useRef } from 'react'
import { useAnimatedScrollHandler, useSharedValue, runOnJS, type SharedValue } from 'react-native-reanimated'
import {
    useSetScrollDirection,
    useSetScrollValue,
    useSetListMaxScrollOffset,
} from 'app/context/jotai/layout'
import { useFocusEffect } from 'app/lib/hooks/router'
import { COVER_REFRESH_DISARM_Y } from './use-cover-refresh-arming'

/** Scroll direction is forced to 0 below this offset (header stays visible near top). */
const SCROLL_DIRECTION_THRESHOLD = 100
/**
 * Minimum travel (px) between UI-thread → JS scroll publishes. The cover
 * overlay reads `coverScrollY` on the UI thread every frame; JS only needs
 * coarse offsets for atoms, scroll caching, and threshold checks.
 */
const SCROLL_PUBLISH_DELTA = 8

/**
 * Bridges list scrolling from the UI thread to the page's Jotai scroll atoms.
 *
 * The worklet runs on the UI thread every frame (so the profile cover overlay
 * tracks the finger even while JS is busy rendering rows) and crosses to JS
 * only on meaningful changes: a direction flip, the refresh top-zone edge, the
 * top boundary (scrolled / not), or ~8px of travel. Drag end and momentum end
 * publish the exact resting offset so `getScrollValue()` and scroll caching
 * are precise once the gesture settles.
 *
 * Everything is reset when `url` changes: the atoms live in the tab's store,
 * and publishing a cached offset for the *previous* list collapsed the profile
 * cover on feed load. LegendList still restores position via
 * `initialScrollOffset`; `onScroll` then reports the real offset.
 *
 * @param {object}   opts
 * @param {string}   [opts.url]            List identity; change = reset.
 * @param {object}   [opts.coverScrollY]   Shared value written every frame for the cover.
 * @param {Function} [opts.onTopZoneChange] `(inTopZone) => void`, from useCoverRefreshArming.
 * @param {boolean}  [opts.pinHeader]      Never publish a scroll direction, so the
 *   collapsible page header stays put (chat lists: they open scrolled to the
 *   end, which would otherwise read as "scrolling down" and hide the header).
 * @param {Function} [opts.onOvershootEnd] Called when the list rests past its end
 *   without the user touching it (chat lists: LegendList can seed that offset).
 * @param {object}   [opts.clampPaused]    Shared value; true while something else
 *   drives the offset (the chat keyboard), so the end clamp waits.
 * @returns {{ handleScroll: Function, scrollYRef: { current: number }, scrollYSV: object, atEndSV: object }}
 *   `scrollYRef.current` is the last offset seen by JS (for scroll caching on unmount);
 *   `scrollYSV` / `atEndSV` are the latest offset and at-the-end state on the UI thread.
 */
export function useListScrollPublisher({ url, coverScrollY, onTopZoneChange, pinHeader = false, onOvershootEnd, clampPaused }: {
    url?: string
    coverScrollY?: SharedValue<number>
    onTopZoneChange?: (inTopZone: boolean) => void
    pinHeader?: boolean
    onOvershootEnd?: () => void
    clampPaused?: SharedValue<boolean>
}) {
    const setScrollDirection = useSetScrollDirection()
    const setScrollValue = useSetScrollValue()
    const setListMaxScrollOffset = useSetListMaxScrollOffset()

    // JS-side mirrors
    const scrollYRef = useRef(0)
    const directionRef = useRef(0)
    const lastPublishedRef = useRef(0)
    const isFocusedRef = useRef(true)

    // UI-thread state
    const prevScrollYSV = useSharedValue(0)
    const directionSV = useSharedValue(0)
    const publishedScrollYSV = useSharedValue(0)
    const coverTopZoneSV = useSharedValue(true)
    // A finger or a fling (incl. the bounce back) owns the offset: past-the-end is fine then.
    const userScrollingSV = useSharedValue(false)
    // Resting at the end (the iOS keyboard inset counts), as of the last scroll event.
    const atEndSV = useSharedValue(true)

    // Only the focused screen may write the shared atoms. On focus, re-publish
    // the current offset so the header picks the right state straight away.
    useFocusEffect(
        useCallback(() => {
            isFocusedRef.current = true
            setScrollDirection(0)
            directionRef.current = 0
            if (scrollYRef.current >= 0) {
                lastPublishedRef.current = Math.round(scrollYRef.current)
                setScrollValue(lastPublishedRef.current)
            }
            return () => {
                isFocusedRef.current = false
            }
        }, [setScrollDirection, setScrollValue])
    )

    const publishScrollValue = useCallback((y: number, maxOffset: number) => {
        if (!isFocusedRef.current) return
        scrollYRef.current = y
        setListMaxScrollOffset((prev) => (prev === maxOffset ? prev : maxOffset))
        const rounded = Math.round(y)
        if (rounded !== lastPublishedRef.current) {
            lastPublishedRef.current = rounded
            setScrollValue(rounded)
        }
    }, [setListMaxScrollOffset, setScrollValue])

    const publishScrollDirection = useCallback((direction: number) => {
        if (!isFocusedRef.current) return
        if (direction !== directionRef.current) {
            directionRef.current = direction
            setScrollDirection(direction)
        }
    }, [setScrollDirection])

    const publishTopZone = useCallback((inTopZone: boolean) => {
        if (!isFocusedRef.current) return
        onTopZoneChange?.(inTopZone)
    }, [onTopZoneChange])

    const handleScroll = useAnimatedScrollHandler({
        onScroll: (event) => {
            const y = event.contentOffset.y

            // iOS contentInset (the chat keyboard) extends the scrollable end.
            const maxY = event.contentSize.height + (event.contentInset?.bottom ?? 0) - event.layoutMeasurement.height
            atEndSV.set(y >= maxY - 2)
            if (onOvershootEnd && !userScrollingSV.get() && !clampPaused?.get()) {
                if (maxY > 0 && y > maxY + 1) runOnJS(onOvershootEnd)()
            }

            if (coverScrollY) {
                coverScrollY.set(y)
                const inTopZone = y <= COVER_REFRESH_DISARM_Y
                if (inTopZone !== coverTopZoneSV.get()) {
                    coverTopZoneSV.set(inTopZone)
                    runOnJS(publishTopZone)(inTopZone)
                }
            }

            const prevY = prevScrollYSV.get()
            prevScrollYSV.set(y)
            let direction = directionSV.get()
            if (pinHeader) {
                direction = 0
            } else if (y < SCROLL_DIRECTION_THRESHOLD) {
                direction = 0
            } else if (y > prevY) {
                direction = 1
            } else if (y < prevY) {
                direction = -1
            }
            if (direction !== directionSV.get()) {
                directionSV.set(direction)
                runOnJS(publishScrollDirection)(direction)
            }

            const published = publishedScrollYSV.get()
            const crossedTopBoundary = (y <= 0) !== (published <= 0)
            if (crossedTopBoundary || Math.abs(y - published) >= SCROLL_PUBLISH_DELTA) {
                publishedScrollYSV.set(y)
                runOnJS(publishScrollValue)(
                    y,
                    Math.max(0, event.contentSize.height - event.layoutMeasurement.height)
                )
            }
        },
        onBeginDrag: () => {
            userScrollingSV.set(true)
        },
        onEndDrag: (event) => {
            userScrollingSV.set(false)
            publishedScrollYSV.set(event.contentOffset.y)
            runOnJS(publishScrollValue)(
                event.contentOffset.y,
                Math.max(0, event.contentSize.height - event.layoutMeasurement.height)
            )
        },
        onMomentumBegin: () => {
            userScrollingSV.set(true)
        },
        onMomentumEnd: (event) => {
            userScrollingSV.set(false)
            publishedScrollYSV.set(event.contentOffset.y)
            runOnJS(publishScrollValue)(
                event.contentOffset.y,
                Math.max(0, event.contentSize.height - event.layoutMeasurement.height)
            )
        },
    }, [coverScrollY, pinHeader, onOvershootEnd, clampPaused, publishTopZone, publishScrollDirection, publishScrollValue])

    // Zero everything before paint when the list identity changes.
    // Shared values are stable objects; they are not in deps on purpose.
    useLayoutEffect(() => {
        scrollYRef.current = 0
        lastPublishedRef.current = 0
        directionRef.current = 0
        setScrollValue(0)
        setScrollDirection(0)
        setListMaxScrollOffset(0)
        coverScrollY?.set(0)
        prevScrollYSV.set(0)
        directionSV.set(0)
        publishedScrollYSV.set(0)
        coverTopZoneSV.set(true)
        // eslint-disable-next-line react-hooks/exhaustive-deps -- shared values are stable
    }, [url, coverScrollY, setScrollValue, setScrollDirection, setListMaxScrollOffset])

    return { handleScroll, scrollYRef, scrollYSV: prevScrollYSV, atEndSV }
}
