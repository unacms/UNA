/** Scroll distance from top before direction state is meaningful (matches previous behavior). */
export const SCROLL_OFFSET_THRESHOLD = 100;

/**
 * Minimum accumulated scroll delta (px) before emitting scroll direction 1 (down) or -1 (up).
 * Dampens jitter from tiny wheel / touch moves.
 */
export const SCROLL_DIRECTION_MIN_DELTA = 24;

/**
 * @param {number} prevScrollY
 * @param {number} currentScrollY
 * @param {{ current: number }} accDirRef — accumulated delta since last emitted direction
 * @returns {0 | 1 | -1 | null} next direction, or null to keep previous scrollState
 */
export function nextScrollDirectionFromDelta(prevScrollY: number, currentScrollY: number, accDirRef: { current: number }) {
    const delta = currentScrollY - prevScrollY;

    if (currentScrollY < SCROLL_OFFSET_THRESHOLD) {
        accDirRef.current = 0;
        return 0;
    }
    if (delta === 0) {
        return null;
    }

    if (delta > 0 && accDirRef.current < 0) accDirRef.current = 0;
    if (delta < 0 && accDirRef.current > 0) accDirRef.current = 0;
    accDirRef.current += delta;

    if (accDirRef.current >= SCROLL_DIRECTION_MIN_DELTA) {
        accDirRef.current = 0;
        return 1;
    }
    if (accDirRef.current <= -SCROLL_DIRECTION_MIN_DELTA) {
        accDirRef.current = 0;
        return -1;
    }
    return null;
}
