import { Platform } from 'react-native'
import { clearAllPageCache } from 'app/lib/cache/clear-page-cache'
import { dismissNavigationOverlays, resetAllTabHistory } from 'app/lib/navigation/tab-history'
import { queryClient } from 'app/lib/platform/query-client'
import { appSetting, storageClear } from 'app/lib/util'
import { usePrefsStore } from 'app/context/prefs'
import { useBottomSheetStore } from 'app/context/bottomsheet'
import emitter, { EVENTS } from 'app/context/emitter'
import { logoutOneSignal } from 'app/lib/platform/one-signal'

/**
 * Wipe in-memory client state that can leak across accounts on native
 * (page/conductor caches, tab history, React Query, overlays).
 * Call on sign-out and whenever auth session becomes guest.
 */
export function clearClientSessionState() {
    clearAllPageCache()
    resetAllTabHistory()
    storageClear()
    usePrefsStore.getState().resetSession()

    try {
        queryClient.clear()
    } catch {
        // QueryClient may not be mounted yet during early bootstrap
    }

    try {
        useBottomSheetStore.getState().setBottomSheetData(null)
    } catch {
        // store unavailable
    }

    dismissNavigationOverlays()
    emitter.emit(EVENTS.link, { action: 'pressed' })
    emitter.emit(EVENTS.dynamicMenu, { action: 'hide' })
    emitter.emit(EVENTS.editor, { action: 'blur' })

    void logoutOneSignal()
}

/**
 * Land on guest tab0 after sign-out. Also rewrite every tab's Expo params so a
 * leftover `/logout` cannot load later and kill the next session.
 *
 * In this app Sign out lives on Dashboard (`/tab4`), not a Profile tab.
 * `replace` only updates tab0 — without setParams the dashboard tab keeps `/logout`.
 */
export function resetNavigationAfterSignOut(router: any, { url, navigation }: { url?: string; navigation?: any } = {}) {
    if (!router) return

    const guestTabs = appSetting('menu_items', 'menu_tabbar_non_logged') || []
    const targetUrl = url && url !== '/' ? url : (guestTabs[0]?.url || '/home')
    const refresh = Date.now()

    resetAllTabHistory()

    if (Platform.OS === 'web') {
        window.location.replace(targetUrl)
        return
    }

    clearAllTabParams(navigation, guestTabs, refresh)

    router.replace({
        pathname: '/tab0',
        params: { url: targetUrl, name: 'tab0', refresh },
    })
}

function findTabNavigator(navigation: any) {
    let nav = navigation
    for (let i = 0; i < 8 && nav; i++) {
        const state = nav.getState?.()
        const names = state?.routeNames || state?.routes?.map((route: any) => route.name) || []
        if (names.some((name: string) => /tab0(?:\/|$)/.test(String(name)))) {
            return nav
        }
        nav = nav.getParent?.()
    }
    return null
}

function tabIndexFromName(name: string) {
    const match = String(name || '').match(/tab(\d+)/)
    return match ? Number(match[1]) : null
}

function guestUrlForTab(guestTabs: any[], index: number) {
    let tabUrl = guestTabs[index]?.url || '/home'
    if (tabUrl === '{profile}') tabUrl = '/home'
    return tabUrl
}

function dispatchSetParams(nav: any, routeKey: string, navigatorKey: string, params: Record<string, unknown>) {
    nav.dispatch({
        type: 'SET_PARAMS',
        payload: { params },
        source: routeKey,
        target: navigatorKey,
    })
}

function clearAllTabParams(navigation: any, guestTabs: any[], refresh: number) {
    if (!navigation) return
    const tabNav = findTabNavigator(navigation)
    const state = tabNav?.getState?.()
    if (!tabNav?.dispatch || !state?.routes?.length) return

    state.routes.forEach((route: any, index: number) => {
        if (!route?.key) return
        const tabIndex = tabIndexFromName(route.name) ?? index
        const params = {
            url: guestUrlForTab(guestTabs, tabIndex),
            name: `tab${tabIndex}`,
            refresh,
        }
        try {
            dispatchSetParams(tabNav, route.key, state.key, params)
            const nested = route.state
            const leaf = nested?.routes?.[nested.index ?? nested.routes.length - 1]
            if (nested?.key && leaf?.key) {
                dispatchSetParams(tabNav, leaf.key, nested.key, params)
            }
        } catch {
            // keep going — tab0 replace still signs the user out
        }
    })
}

/**
 * After email confirmation, never reopen a previous account's group deep link.
 * Prefer join-community for a blank slate; fall back to a non-/g/ props.url.
 */
export function resolvePostConfirmUrl(propsUrl: string | null | undefined) {
    const raw = Array.isArray(propsUrl) ? propsUrl[0] : propsUrl
    if (!raw || raw === '/') {
        return '/join-community'
    }
    const url = String(raw).startsWith('/') ? String(raw) : `/${raw}`
    if (url === '/logout' || url.startsWith('/g/') || url.startsWith('/group')) {
        return '/join-community'
    }
    return url
}
