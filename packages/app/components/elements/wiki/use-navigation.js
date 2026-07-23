import { useCallback, useEffect, useRef, useState } from 'react'
import { getPageData } from 'app/lib/util'
import { useGlobalSearchParams, usePathname } from 'app/lib/hooks/router'
import emitter from 'app/context/emitter'
import {
  getCachedWikiPage,
  setCachedWikiPage,
  wikiCacheKey,
} from 'app/lib/wiki-page-cache'
import {
  getRouteParam,
  isWeb,
  mergeWikiPageContent,
  normalizePathComparable,
} from './helpers'

/**
 * In-layout wiki navigation: cache, content-only merge, pushState / popstate,
 * and soft reload after wiki mutations. Owns pageData + headingRefs.
 */
export function useWikiNavigation({ data, url }) {
  const pathname = usePathname()
  const params = useGlobalSearchParams()
  const routeUrl = getRouteParam(params?.url) || url || pathname

  const [pageData, setPageData] = useState({ data, url: routeUrl })
  const pageDataRef = useRef(pageData)
  pageDataRef.current = pageData

  const headingRefs = useRef(new Map())
  // Set by in-layout wiki nav. While set, ignore Next props unless they
  // describe the same page (prevents stale RSC overwriting cache hits).
  const clientNavKeyRef = useRef(null)
  const navigateRequestIdRef = useRef(0)

  const navigateToWikiPath = useCallback(async (itemPath) => {
    if (!itemPath) return

    const pathKey = normalizePathComparable(itemPath)
    clientNavKeyRef.current = pathKey || null

    if (isWeb) {
      const currentPath = window.location.pathname
      if (currentPath !== itemPath) {
        window.history.pushState({}, '', itemPath)
      }
    }

    // Dismiss mobile DropdownPopup menus (listens for link:pressed).
    emitter.emit('link', { action: 'pressed' })

    const requestId = ++navigateRequestIdRef.current
    const cached = getCachedWikiPage(pathKey)

    // Show cached page immediately; revalidate in the background when stale.
    if (cached?.data) {
      setPageData({ data: cached.data, url: itemPath })
      if (!cached.isStale) return
    }

    try {
      // Content-only: smaller payload; left nav is merged from the current shell.
      const contentResponse = await getPageData(itemPath, true)
      if (requestId !== navigateRequestIdRef.current) return

      const shellPage = cached?.data || pageDataRef.current?.data
      const merged = mergeWikiPageContent(shellPage, contentResponse?.data, itemPath)

      if (merged) {
        setCachedWikiPage(pathKey, merged)
        setPageData({ data: merged, url: itemPath })
        return
      }

      // Content-only missing center (or failed) — fetch the full page.
      // Never cache/show the previous shell under the new path.
      const fullResponse = await getPageData(itemPath, false)
      if (requestId !== navigateRequestIdRef.current) return
      if (!fullResponse?.data?.elements?.cell_center) return

      setCachedWikiPage(pathKey, fullResponse.data)
      setPageData({ data: fullResponse.data, url: itemPath })
    } catch (error) {
      console.error('Failed to load wiki page:', error)
    }
  }, [])

  // Next preserves this client layout while navigating between wiki routes, so
  // useState's initializer does not run again. Sync the newly streamed page
  // data into the layout when the route changes.
  useEffect(() => {
    // Key off `url` only — UNA `uri` is a page name (e.g. 'wiki'), not a
    // path, and would produce colliding cache keys across doc pages.
    const incomingKey = wikiCacheKey(data?.url)
    const clientKey = clientNavKeyRef.current

    if (clientKey) {
      // Adopt props once they describe the page we're actually on — either
      // the in-layout navigation caught up, or a real router navigation
      // moved to another wiki page (clientKey is then obsolete).
      const routeKey = wikiCacheKey(routeUrl)
      if (incomingKey && (incomingKey === clientKey || incomingKey === routeKey)) {
        clientNavKeyRef.current = null
        headingRefs.current.clear()
        setPageData({ data, url: routeUrl })
        if (data?.elements?.cell_center) {
          setCachedWikiPage(incomingKey, data)
        }
      }
      // Otherwise keep the client-driven page (cache/fetch) and do not
      // warm the cache from a mismatched payload.
      return
    }

    setPageData((current) => {
      if (current.data === data && wikiCacheKey(current.url) === wikiCacheKey(routeUrl)) {
        return current
      }
      // Drop native TOC scroll targets from the previous page before
      // section refs re-register for the new content.
      headingRefs.current.clear()
      return { data, url: routeUrl }
    })

    // Warm the sidebar cache from full page payloads (SSR / Next soft nav /
    // native). routeUrl (not uri) is the fallback so keys stay full paths.
    if (data?.elements?.cell_center) {
      setCachedWikiPage(data?.url || routeUrl, data)
    }
  }, [data, routeUrl])

  // Back/forward across pushState entries: Next may not refetch for shallow
  // history, so resolve the popped path from the wiki cache (or fetch).
  useEffect(() => {
    if (!isWeb) return

    const onPopState = () => {
      const path = window.location.pathname
      if (wikiCacheKey(path) === wikiCacheKey(pageDataRef.current?.url)) return
      // pushState is skipped inside (location already matches the target).
      navigateToWikiPath(path)
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [navigateToWikiPath])

  // Reload current wiki page after add-page / add-block form success.
  useEffect(() => {
    const subscription = emitter.addListener('wiki', async (payload) => {
      if (payload?.action !== 'reload') return
      const path = pageDataRef.current?.url || routeUrl
      if (!path) return

      const itemPath = path.startsWith('/') ? path : `/${path}`
      const pathKey = normalizePathComparable(itemPath)
      // Keep soft-reloaded data if Next still holds the pre-create props.
      clientNavKeyRef.current = pathKey || null

      try {
        const fullResponse = await getPageData(itemPath, false)
        if (!fullResponse?.data?.elements?.cell_center) return
        setCachedWikiPage(itemPath, fullResponse.data)
        headingRefs.current.clear()
        setPageData({ data: fullResponse.data, url: itemPath })
      } catch (error) {
        console.error('Failed to reload wiki page:', error)
      }
    })
    return () => subscription.remove()
  }, [routeUrl])

  return {
    pageData,
    routeUrl,
    navigateToWikiPath,
    headingRefs,
  }
}
