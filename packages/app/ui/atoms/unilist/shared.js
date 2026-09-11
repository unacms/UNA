/*
 * ============================================================================
 * UniList — the one virtualized list used by every UNA browse / feed / panel.
 *
 * Two implementations behind one import (`app/ui/atoms/unilist`):
 *   index.js      native — LegendList + reanimated scroll bridge
 *   index.web.js  web    — react-virtuoso (list or grid) + SortableList
 *
 * This file holds what both share: the prop contract and small helpers.
 * ============================================================================
 */

/**
 * @typedef {object} UniListProps
 *
 * Common
 * @property {array}    data              Rows; deduped by `id` before render.
 * @property {Function} renderItem        `({ item, index }) => node`.
 * @property {string}   [url]             Identity of the list (scroll cache, remount key).
 * @property {string}   [unit]            UNA unit ('feed', 'notifications', …) — sizing hints.
 * @property {object}   [endpoint]        Browse endpoint — drives `paddingForList`.
 * @property {string}   [layout]          Tailwind class wrapped around each row ('w-full', 'w-1/2', …).
 * @property {node|Function} [preloadComponent]  Skeleton shown while the list is not ready;
 *                                        the list stays mounted underneath on both platforms.
 * @property {node|Function} [ListHeaderComponent]
 * @property {node|Function} [ListFooterComponent]
 * @property {node|Function} [ListEmptyComponent]
 * @property {Function} [onEndReached]
 * @property {Function} [onStartReached]
 * @property {Function} [onRefresh]
 * @property {boolean}  [refreshing]
 * @property {object|Function} [refer]   Ref to the underlying list instance.
 *
 * Native only (ignored on web)
 * @property {boolean}  [inverted]        Chat-style: newest at the bottom.
 * @property {boolean}  [isModal]         Inside a modal — no page-header offset.
 * @property {boolean}  [skipHeaderOffset] Caller renders its own header (profile cover).
 * @property {number}   [coverOverlayPad] Space to leave for the collapsing cover overlay.
 * @property {object}   [coverScrollY]    Reanimated shared value the cover reads.
 * @property {number}   [estimatedItemSize]
 * @property {...}      RN ScrollView / FlatList props (`keyboardDismissMode`,
 *                      `onScrollBeginDrag`, `numColumns`, …) pass straight through.
 *
 * Web only (ignored on native)
 * @property {'simple'|''} [mode]        'simple' = single column list, else grid.
 * @property {number|string} [height]     Fixed height → own scroller; none → window scroll.
 * @property {boolean}  [useWindowScroll]
 * @property {boolean}  [sortable]        Drag-and-drop reorder (not virtualized).
 * @property {Function} [onSort]          DnD result handler.
 * @property {boolean}  [scrollToLastItem]
 * @property {number|string} [paddingTop]
 * @property {object}   [components]      Extra Virtuoso `components`.
 * @property {boolean}  [no_scroll]       Plain column, no virtualization.
 */

/** Rows with a duplicate `id` are dropped, first occurrence wins. O(n). */
export function dedupeById(rows) {
    if (!rows?.length) return rows ?? []
    const seen = new Set()
    const out = []
    for (const row of rows) {
        const id = row?.id
        if (seen.has(id)) continue
        seen.add(id)
        out.push(row)
    }
    return out.length === rows.length ? rows : out
}

/** Slot props may be an element, a component, or a render function. */
export function renderSlot(slot) {
    if (!slot) return null
    return typeof slot === 'function' ? slot() : slot
}

/** Time the list stays at opacity 0 before fading in (web). */
export const REVEAL_DELAY_MS = 140

/** Handled only by index.web.js; must never reach LegendList. */
export const WEB_ONLY_PROPS = [
    'mode', 'height', 'useWindowScroll', 'sortable', 'onSort',
    'scrollToLastItem', 'paddingTop', 'components', 'no_scroll',
]

/**
 * RN ScrollView / FlatList props and native-only UniList props. Native passes
 * them through to LegendList; web must strip them or they land on a DOM node.
 */
export const NATIVE_ONLY_PROPS = [
    'inverted', 'isModal', 'skipHeaderOffset', 'coverOverlayPad', 'coverScrollY',
    'estimatedItemSize', 'refreshControl', 'progressViewOffset', 'scrollProps',
    'contentContainerStyle', 'contentContainerClassName',
    'maxToRenderPerBatch', 'initialNumToRender', 'initialScrollIndex', 'numColumns',
    'keyExtractor', 'extraData', 'keyboardShouldPersistTaps', 'keyboardDismissMode',
    'onScrollBeginDrag', 'onScrollEndDrag', 'onMomentumScrollBegin', 'onMomentumScrollEnd',
]

/** Accepted for backwards compatibility, used by nobody. Stripped everywhere. */
export const IGNORED_PROPS = [
    'useCustomScrollHandler', 'isInPanel', 'viewParams', 'topItemCount',
    'listState', 'storagekey', 'onScrollToIndex',
]

/** Copy of `props` without the given keys. */
export function omitProps(props, keys) {
    const rest = { ...props }
    for (const key of keys) delete rest[key]
    return rest
}
