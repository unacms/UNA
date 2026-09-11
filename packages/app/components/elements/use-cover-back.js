import {
    useTabKey,
    getTabKeyFromPathname,
} from 'app/lib/navigation/tab-history'
import { useTabChromeKey, isTabScopedChromeKey } from 'app/context/tab-chrome'

/** Prefer screen-owned tab chrome key — pathname can point at another focused tab. */
export function useCoverBackTabKey() {
    const chromeKey = useTabChromeKey()
    const pathKey = useTabKey()
    if (isTabScopedChromeKey(chromeKey)) {
        return chromeKey
    }
    return getTabKeyFromPathname(pathKey)
}

/**
 * Always show cover back on web + native.
 * Press still uses in-tab history, then tab root via `navigateBackInTab`.
 */
export function useShowCoverBackButton() {
    return true
}
