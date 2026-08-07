import { clearAllPageCache } from 'app/lib/tab-page-cache'
import { dismissNavigationOverlays, resetAllTabHistory } from 'app/lib/tab-history'
import { queryClient } from 'app/lib/query-client'
import { appSetting, clearNativeMemoryCache, storageClear } from 'app/lib/util'
import { useBottomSheetStore } from 'app/context/bottomsheet'
import emitter from 'app/context/emitter'
import { logoutOneSignal } from 'app/lib/one-signal'

/**
 * Wipe in-memory client state that can leak across accounts on native
 * (page/conductor caches, tab history, React Query, overlays).
 * Call on sign-out and whenever auth session becomes guest.
 */
export function clearClientSessionState() {
    clearAllPageCache()
    resetAllTabHistory()
    clearNativeMemoryCache()
    storageClear()

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
    emitter.emit('link', { action: 'pressed' })
    emitter.emit('dynamic_menu', { action: 'hide' })
    emitter.emit('editor', { action: 'blur' })

    void logoutOneSignal()
}

/**
 * Land on guest tab0 root after sign-out.
 * Do not walk other tabs with navigate() — that switches focus and can leave
 * stale deep-link params in a worse state. Tab remount via tabsSessionKey
 * (`user-guest`) resets inactive tabs' initialParams.
 */
export function resetNavigationAfterSignOut(router, { url } = {}) {
    if (!router) return

    const guestTabs = appSetting('menu_items', 'menu_tabbar_non_logged') || []
    const targetUrl = url && url !== '/' ? url : (guestTabs[0]?.url || '/home')

    resetAllTabHistory()

    router.replace({
        pathname: '/tab0',
        params: { url: targetUrl, name: 'tab0', refresh: Date.now() },
    })
}

/**
 * After email confirmation, never reopen a previous account's group deep link.
 * Prefer join-community for a blank slate; fall back to a non-/g/ props.url.
 */
export function resolvePostConfirmUrl(propsUrl) {
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
