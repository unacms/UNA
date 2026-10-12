import { clearTabPageCache } from 'app/lib/cache/native-tab-page-cache'
import { clearConductorCache } from 'app/lib/cache/native-conductor-cache'
import { clearListScrollCache } from 'app/lib/cache/list-scroll-cache'
import { clearWikiPageCache } from 'app/lib/cache/wiki-page-cache'
import { clearObjectState } from 'app/lib/object-state'

/** Drop all in-memory page / conductor / scroll / wiki / object caches (logout, session switch). */
export function clearAllPageCache() {
    clearTabPageCache()
    clearConductorCache()
    clearListScrollCache()
    clearWikiPageCache()
    clearObjectState()
}
