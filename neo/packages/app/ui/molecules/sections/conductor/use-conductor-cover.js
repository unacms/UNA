import { useCallback, useEffect, useState } from 'react'
import { useSharedValue } from 'react-native-reanimated'
import { appSetting } from 'app/lib/util'
import {
    pinCollapsedCoverForTabSwitch,
    releaseCoverTabScrollHold,
} from 'app/components/elements/covers/cover-tab-scroll'

/**
 * Native cover state for the Conductor (section 5 of `index.js`).
 *
 * `CoverMorph` overlays the list and collapses on scroll. The list has to pad
 * for the overlay, and that pad must not jump when the user switches tabs
 * while the cover is collapsed — that is all this hook manages:
 *
 * - `coverScrollY`     Reanimated shared value the list writes and the morph reads
 * - `coverOverlayPad`  overlay height reported by the morph
 * - `coverPadPin`      subtracted from the pad after a tab switch while
 *                      collapsed; a live collapse keeps the full pad because the
 *                      list is already scrolled by `range`
 *
 * Header *mode* (dynamic / small / none) is a pure decision, see
 * `resolveConductorHeaderMode` below — it needs the route, which is only known
 * after `useConductorRoutes`, while this hook runs before it.
 *
 * @param {object} opts
 * @param {string} [opts.pageUrl] Current page URL; a change resets the pin.
 */
export function useConductorCover({ pageUrl }) {
    const coverScrollY = useSharedValue(0)
    const [coverOverlayPad, setCoverOverlayPad] = useState(0)
    const [coverPadPin, setCoverPadPin] = useState(0)

    /** CoverMorph reports its overlay height; 0 means the overlay is gone. */
    const onOverlayHeight = useCallback((height) => {
        if (height === 0) setCoverPadPin(0)
        setCoverOverlayPad((prev) => (prev === height ? prev : height))
    }, [])

    /** Any un-collapse drops the pin and hands scroll control back to the cover. */
    const onCoverProgress = useCallback((progress) => {
        if (progress < 1) {
            setCoverPadPin(0)
            releaseCoverTabScrollHold()
        }
    }, [])

    /**
     * Call right before a tab switch: freezes the collapsed cover so the new
     * list does not jump under a cover that is mid-animation.
     */
    const pinCoverForTabSwitch = useCallback(() => {
        setCoverPadPin(pinCollapsedCoverForTabSwitch())
    }, [])

    // A new page gets a fresh cover, so the pin from the old one must go.
    useEffect(() => {
        setCoverPadPin(0)
    }, [pageUrl])

    return {
        coverScrollY,
        coverOverlayPad,
        coverPadPin,
        onOverlayHeight,
        onCoverProgress,
        pinCoverForTabSwitch,
    }
}

/**
 * Which chrome the native conductor renders, decided by layout + cover config:
 *
 *   'none'    non-profile page — plain tab bar, page header stays on top
 *   'small'   profile without a cover image — static conductor chrome
 *   'dynamic' profile with a cover — CoverMorph collapses on scroll and the
 *             list pads for the overlay
 *
 * `useLocalHeader` is true for both profile modes: profile cover chrome
 * (including `none`) lives in the conductor tree, not in the collapsing page
 * header — same as web.
 *
 * @param {object}  opts
 * @param {string}  opts.layoutName
 * @param {boolean} opts.isCoverDisabled
 * @param {object}  [opts.data]      Page JSON (owner of `cover_block`).
 * @param {object}  [opts.tabRoute]  Fallback source for the profile module.
 * @returns {{ headerMode: 'none'|'small'|'dynamic', useLocalHeader: boolean }}
 */
export function resolveConductorHeaderMode({
    layoutName,
    isCoverDisabled,
    data,
    tabRoute,
}) {
    const coverMode = appSetting(
        'cover',
        'view_by_module',
        data?.cover_block?.profile?.module ?? tabRoute?.pageData?.cover_block?.profile?.module
    )
    const isProfileLayout = layoutName === 'profile'
    const hasDynamicCover = isProfileLayout && !isCoverDisabled && coverMode !== 'none'
    const headerMode = !isProfileLayout
        ? 'none'
        : hasDynamicCover
            ? 'dynamic'
            : 'small'
    return {
        headerMode,
        useLocalHeader: headerMode === 'dynamic' || headerMode === 'small',
    }
}
