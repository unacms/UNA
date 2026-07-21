import { appSetting } from 'app/config'

const wikiPageCache = new Map()

/** Private element slots for chrome the custom wiki layout rediscovers by identity. */
const WIKI_NAV_SLOT = '__wiki_nav'
const WIKI_TOC_SLOT = '__wiki_toc'

export function wikiCacheKey(path) {
    return String(path || '')
        .replace(/^https?:\/\/[^/]+/i, '')
        .split(/[?#]/)[0]
        .replace(/^\/+|\/+$/g, '')
}

function staleMs() {
    return Number(appSetting('wiki', 'page_cache_stale_ms'))
        || Number(appSetting('browse', 'stale_time'))
        || 30_000
}

function hasCenterContent(page) {
    const center = page?.elements?.cell_center
    if (!center) return false
    if (Array.isArray(center)) return center.length > 0
    return Object.keys(center).length > 0
}

function flattenPageBlocks(data) {
    return Object.values(data?.elements ?? {})
        .flatMap((level) => (Array.isArray(level) ? level : Object.values(level ?? {})))
        .filter(Boolean)
}

/**
 * UNA wiki TOC service block (TemplServiceWiki::page_contents).
 * Custom NEO layout ignores UNA cell placement — find it anywhere in the page.
 */
export function isWikiTocBlock(block) {
    if (!block) return false
    const source = String(block.source || '')
    if (source === 'system:page_contents' || source.includes('page_contents')) {
        return true
    }
    // Service payload / cached HTML marker from TemplServiceWiki::page_contents.
    try {
        return JSON.stringify(block.content || []).includes('bx_wiki_toc')
    } catch {
        return false
    }
}

export function findWikiTocBlock(data) {
    return flattenPageBlocks(data).find(isWikiTocBlock) || null
}

/** Left wiki pages menu — identity over cell_left index. */
export function findWikiNavBlock(data) {
    return flattenPageBlocks(data).find((block) => (
        Array.isArray(block?.content)
        && block.content.some((el) => el?.type === 'menu_wiki')
    )) || null
}

/**
 * Merge a content-only UNA page payload into an existing wiki page,
 * preserving sidebar chrome found by block identity (not UNA cell index).
 * Returns null when content-only data is missing center content so callers
 * do not cache/show the previous page under the new URL.
 */
export function mergeWikiPageContent(basePage, contentPage, url) {
    if (!hasCenterContent(contentPage)) return null

    const path = wikiCacheKey(url || contentPage.url || basePage?.url)
    const base = basePage || {}
    const shellNav = findWikiNavBlock(base)
    const shellToc = findWikiTocBlock(base)

    const elements = {
        ...(base.elements || {}),
        ...(contentPage.elements || {}),
        // Always take article body from the content response.
        cell_center: contentPage.elements.cell_center,
    }

    const merged = {
        ...base,
        ...contentPage,
        elements,
        // Cache/routing identity lives in `url` (full normalized path).
        url: path || base.url,
        // UNA `uri` is a page name (e.g. 'wiki'), not a path segment — never
        // fabricate one from the path or it can leak into key derivations.
        uri: contentPage.uri ?? base.uri,
        title: contentPage.title ?? base.title,
        module: contentPage.module ?? base.module,
    }

    // Content-only responses often omit shell sidebars (and composite TOC).
    // Re-attach by identity into private slots — wiki layout does not use cells.
    if (shellNav && !findWikiNavBlock(merged)) {
        merged.elements[WIKI_NAV_SLOT] = [shellNav]
    }
    if (shellToc && !findWikiTocBlock(merged)) {
        merged.elements[WIKI_TOC_SLOT] = [shellToc]
    }

    return merged
}

export function getCachedWikiPage(path) {
    const key = wikiCacheKey(path)
    if (!key) return null

    const entry = wikiPageCache.get(key)
    if (!entry?.data || !hasCenterContent(entry.data)) return null

    // Reject entries that were stored under the wrong path (corrupt/stale merges).
    const storedKey = wikiCacheKey(entry.path || entry.data.url)
    if (storedKey && storedKey !== key) {
        wikiPageCache.delete(key)
        return null
    }

    return {
        data: entry.data,
        isStale: Date.now() - entry.ts > staleMs(),
    }
}

export function setCachedWikiPage(path, data) {
    const key = wikiCacheKey(path)
    if (!key || !hasCenterContent(data)) return

    const dataKey = wikiCacheKey(data.url)
    // Avoid storing a page whose URL identity disagrees with the cache key.
    if (dataKey && dataKey !== key) return

    wikiPageCache.set(key, { data, path: key, ts: Date.now() })
}

export function clearWikiPageCache() {
    wikiPageCache.clear()
}
