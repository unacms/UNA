/**
 * Native: keep the profile cover collapsed across conductor tab switches.
 * Web has the same idea in conductor/web-ui.js (`coverTabScroll`).
 *
 * `range` is the overlay collapse distance (expanded inner − strip).
 * On tab switch the list remounts at y=0; conductor subtracts `range` from
 * `coverOverlayPad` so content sits under the compact bar. `hold` stops that
 * y=0 report from expanding the cover.
 */
export const coverTabScroll = {
    collapsed: false,
    hold: false,
    y: 0,
    range: 0,
}

const rangeListeners = new Set()

/**
 * The morph's latest collapse range. A pinned conductor follows it: the next tab's pinned rows
 * (a filter row or none) change the collapsed overlay, and so how much pad the list must drop.
 */
export function setCoverTabScrollRange(range) {
    if (coverTabScroll.range === range) return
    coverTabScroll.range = range
    rangeListeners.forEach((listener) => listener(range))
}

/** Returns the unsubscribe function. */
export function subscribeCoverTabScrollRange(listener) {
    rangeListeners.add(listener)
    return () => rangeListeners.delete(listener)
}

export function resetCoverTabScroll() {
    coverTabScroll.collapsed = false
    coverTabScroll.hold = false
    coverTabScroll.y = 0
    coverTabScroll.range = 0
}

export function holdCollapsedCoverForTabSwitch() {
    if (!coverTabScroll.collapsed) return
    coverTabScroll.hold = true
}

/** Hold the cover and return how much overlay pad to subtract for the new list. */
export function pinCollapsedCoverForTabSwitch() {
    holdCollapsedCoverForTabSwitch()
    if (!coverTabScroll.collapsed) return 0
    return Math.max(0, coverTabScroll.range)
}

export function releaseCoverTabScrollHold() {
    coverTabScroll.hold = false
}
