const scrollOffsetCache = new Map()

/** Scroll restore is view state, not page data — independent of cache flags. */
export function getListScrollOffset(url: string) {
    if (!url) return 0
    return scrollOffsetCache.get(url) ?? 0
}

export function setListScrollOffset(url: string, offset: number) {
    if (!url) return
    scrollOffsetCache.set(url, offset)
}

export function clearListScrollCache() {
    scrollOffsetCache.clear()
}
