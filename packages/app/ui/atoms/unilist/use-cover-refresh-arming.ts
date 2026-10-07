import { useCallback, useEffect, useRef, useState } from 'react'
import type { SharedValue } from 'react-native-reanimated'

/**
 * Android's SwipeRefreshLayout treats "scroll back to 0 + overscroll" as a
 * pull-to-refresh. A collapsing profile cover does exactly that on every
 * expand, so the RefreshControl must stay *disarmed* until the list has been
 * at rest near the top for a moment.
 */
const DISARM_BELOW_Y = 16
const REARM_AFTER_MS = 400

/**
 * Arms / disarms pull-to-refresh under a collapsing cover.
 *
 * Without a cover (`coverScrollY` undefined) it is always armed and the hook
 * is inert. With one:
 * - leaving the top zone (y > 16px) disarms immediately;
 * - entering it schedules a re-arm 400ms later;
 * - a change of `coverOverlayPad` (spacer inserted at the top of the list)
 *   also disarms and re-arms — the spacer shifts content the same way a
 *   cover expand does.
 *
 * @param {object} opts
 * @param {object} [opts.coverScrollY]     Reanimated shared value; presence = cover.
 * @param {number} [opts.coverOverlayPad]
 * @returns {{ armed: boolean, onTopZoneChange: (inTopZone: boolean) => void }}
 *   `armed` is state (for the RefreshControl prop); `onTopZoneChange` is what
 *   the scroll handler calls when the offset crosses the 16px line.
 */
export function useCoverRefreshArming({ coverScrollY, coverOverlayPad }: {
    coverScrollY?: SharedValue<number>
    coverOverlayPad?: number
}) {
    const hasCover = Boolean(coverScrollY)
    const [armed, setArmed] = useState(!hasCover)
    const armedRef = useRef(!hasCover)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
    }, [])

    const disarm = useCallback(() => {
        clearTimer()
        if (armedRef.current) {
            armedRef.current = false
            setArmed(false)
        }
    }, [clearTimer])

    const scheduleRearm = useCallback(() => {
        if (armedRef.current || timerRef.current) return
        timerRef.current = setTimeout(() => {
            timerRef.current = null
            armedRef.current = true
            setArmed(true)
        }, REARM_AFTER_MS)
    }, [])

    const onTopZoneChange = useCallback((inTopZone: boolean) => {
        if (inTopZone) scheduleRearm()
        else disarm()
    }, [scheduleRearm, disarm])

    // Spacer insertion at the list top can trip Android's refresh layout.
    useEffect(() => {
        if (!hasCover) return undefined
        disarm()
        scheduleRearm()
        return clearTimer
    }, [hasCover, coverOverlayPad, disarm, scheduleRearm, clearTimer])

    useEffect(() => clearTimer, [clearTimer])

    return { armed, armedRef, onTopZoneChange }
}

export { DISARM_BELOW_Y as COVER_REFRESH_DISARM_Y }
