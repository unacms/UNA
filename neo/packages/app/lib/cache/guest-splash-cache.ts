// The guest splash a native app showed last (iOS, Android), kept across launches: at the next launch, once
// the tabs bootstrap knows the viewer is a guest, the home tab shows it while the home page loads. It is the guest
// splash only. It is kept while the app's viewer is a guest, and dropped as soon as any page comes back
// for a signed-in member, so a member never gets it. The OS launch screen (expo-splash-screen, before
// JS runs) is a different thing and is not touched here.
import { persistedGet, persistedSet } from 'app/lib/util/storage'
import { UNA_URL } from 'app/config'

const KEY = 'guest_splash'

type StoredSplash = { una: string; path: string; props: any }

/** What a fetch said about the stored copy, so a page of the same kind writes storage once. */
let lastWrite: 'kept' | 'dropped' | null = null

/** A guest's home with UNA's splash: page data the app may show again at its next launch. */
function isGuestSplash(pageData: any): boolean {
    return !!pageData && !pageData.user && pageData.layout === 'splash' && pageData.uri === 'home'
}

/**
 * After a tab root page came back from UNA: keep a guest's splash, drop the copy when the page is a
 * member's, or a guest's home without the splash (Studio turned it off). Other guest pages leave it.
 */
export function updateGuestSplashCache(path: string | null | undefined, props: any): void {
    const pageData = props?.data
    if (!pageData) return
    if (pageData.user) {
        forgetGuestSplash()
        return
    }
    if (path && isGuestSplash(pageData)) {
        lastWrite = 'kept'
        void persistedSet(KEY, { una: String(UNA_URL || ''), path, props } satisfies StoredSplash)
    } else if (pageData.uri === 'home') {
        forgetGuestSplash()
    }
}

/** Signing in (or a member's page): the copy goes. */
export function forgetGuestSplash(): void {
    if (lastWrite === 'dropped') return
    lastWrite = 'dropped'
    void persistedSet(KEY, null)
}

/** The stored splash for this tab root path, from this UNA site; null when there is none. */
export async function readGuestSplash(path: string | null | undefined): Promise<any> {
    if (!path) return null
    const stored = (await persistedGet(KEY)) as StoredSplash | null
    if (stored?.path !== path || stored.una !== String(UNA_URL || '') || !isGuestSplash(stored.props?.data)) return null
    return stored.props
}
