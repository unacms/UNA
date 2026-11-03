import { Platform } from 'react-native'
import {
    useTabKey,
    getTabKeyFromPathname,
    isTabRootUrl,
} from 'app/lib/navigation/tab-history'
import {
    useTabChromeKey,
    isTabScopedChromeKey,
    useIsPushedScreen,
    useScreenPagePath,
} from 'app/context/tab-chrome'
import { useCurrentUser } from 'app/context/user'
import { usePathname } from 'app/lib/hooks/router'
import { useTabList } from 'app/lib/navigation/tab-bar-menu'

/** Prefer screen-owned tab chrome key — pathname can point at another focused tab. */
export function useCoverBackTabKey() {
    const chromeKey = useTabChromeKey()
    const pathKey = useTabKey()
    if (isTabScopedChromeKey(chromeKey)) {
        // A pushed page's key is `/tab0/page#…`: the tab is its first segment.
        return getTabKeyFromPathname(chromeKey)
    }
    return getTabKeyFromPathname(pathKey)
}

/** A page's path without origin, query or empty segments (`https://x/u/me?a=1` → `u/me`). */
function pagePath(url) {
    return String(url || '')
        .replace(/^https?:\/\/[^/]+/i, '')
        .split(/[?#]/)[0]
        .split('/')
        .filter(Boolean)
        .join('/')
}

/**
 * The cover's Back shows only where there is somewhere to go back to, as the header's does: never on
 * a tab's own page (the Profile tab's profile, opened from the tab bar).
 * - Native: a page pushed onto its tab, or a tab root showing another page than its own. Read from
 *   the screen's page during render: the tab history is written in an effect after it.
 * - Web: any page that isn't one of the tab bar's (the press goes back, or home without history).
 * The press still uses in-tab history, then the tab root, via `navigateBackInTab`.
 */
export function useShowCoverBackButton() {
    const isPushedScreen = useIsPushedScreen()
    const screenPagePath = useScreenPagePath()
    const tabKey = useCoverBackTabKey()
    const pathname = usePathname()
    const { currentUser } = useCurrentUser()
    const { tabList } = useTabList(currentUser)

    if (Platform.OS !== 'web') {
        return isPushedScreen || (!!screenPagePath && !isTabRootUrl(tabKey, screenPagePath, currentUser))
    }
    const here = pagePath(pathname)
    return !(tabList || []).some((tab) => pagePath(tab.url === '{profile}' ? currentUser?.url : tab.url) === here)
}
