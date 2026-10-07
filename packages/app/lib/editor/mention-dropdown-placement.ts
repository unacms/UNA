/**
 * Web: where to pin the mention suggestions list relative to the editor
 * container. Pure geometry — no DOM access — so it is testable in isolation.
 */

export const MENTION_DROPDOWN_MAX_H = 160
export const MENTION_DROPDOWN_MIN_H = 72
export const MENTION_DROPDOWN_GAP = 6

const isEmptyRect = (rect: any) =>
    !rect || (rect.top === 0 && rect.left === 0 && rect.width === 0 && rect.height === 0)

/** Caret rect from the live DOM selection, or null when unavailable. */
export function getCaretRect() {
    if (typeof window === 'undefined') return null
    const sel = window.getSelection?.()
    if (!sel || sel.rangeCount === 0) return null
    const range = sel.getRangeAt(0)
    let rect = range.getBoundingClientRect()
    if (isEmptyRect(rect)) {
        // Collapsed selections often report an empty bounding box; the last
        // client rect is the caret line.
        const rects = range.getClientRects()
        if (rects?.length) rect = rects[rects.length - 1]!
    }
    return isEmptyRect(rect) ? null : rect
}

/**
 * Prefer above the caret; flip below when the editor has no room above (so the
 * list never covers the composer header) or the viewport itself doesn't.
 *
 * @returns {{ top: number, maxHeight: number } | { bottom: number, maxHeight: number }}
 *   Offsets are relative to `containerRect` (absolute positioning inside it).
 */
export function placeMentionDropdown({ caretRect, containerRect, viewportHeight }: { caretRect: { top: number; bottom: number; left: number; right?: number; height?: number }; containerRect: { top: number; bottom: number; left: number; width?: number; height?: number }; viewportHeight: number }) {
    const needed = MENTION_DROPDOWN_MIN_H + MENTION_DROPDOWN_GAP

    const aboveInEditor = Math.max(0, caretRect.top - containerRect.top)
    const belowInEditor = Math.max(0, containerRect.bottom - caretRect.bottom)
    const aboveInViewport = Math.max(0, caretRect.top)
    const belowInViewport = Math.max(0, viewportHeight - caretRect.bottom)

    const fitsAboveInEditor = aboveInEditor >= needed
    const fitsBelowInEditor = belowInEditor >= needed
    const fitsAboveInViewport = aboveInViewport >= needed
    const fitsBelowInViewport = belowInViewport >= needed

    const placeBelow =
        (!fitsAboveInEditor && fitsBelowInEditor) ||
        (!fitsAboveInViewport && fitsBelowInViewport) ||
        (!fitsAboveInViewport && !fitsBelowInViewport && belowInViewport > aboveInViewport + 24)

    const room = placeBelow
        ? (fitsBelowInEditor ? Math.min(belowInViewport, belowInEditor) : belowInViewport)
        : (fitsAboveInEditor ? Math.min(aboveInViewport, aboveInEditor) : aboveInViewport)
    const maxHeight = Math.min(
        MENTION_DROPDOWN_MAX_H,
        Math.max(MENTION_DROPDOWN_MIN_H, room - MENTION_DROPDOWN_GAP)
    )

    return placeBelow
        ? { top: caretRect.bottom - containerRect.top + MENTION_DROPDOWN_GAP, maxHeight }
        : { bottom: containerRect.bottom - caretRect.top + MENTION_DROPDOWN_GAP, maxHeight }
}
