import { appSetting } from 'app/config'
import { isWeb } from 'app/lib/util'

/**
 * In-memory page / conductor / wiki caches.
 * Web: `cache.enable_web`. Native: `cache.enable_native`.
 * `false` disables them so navigation refetches from the server.
 *
 * Checked against `false` explicitly: a fork whose settings lack the key must
 * keep caching on rather than silently lose it.
 */
export function isPageCacheEnabled() {
    const key = isWeb ? 'enable_web' : 'enable_native'
    return appSetting('cache', key) !== false
}
