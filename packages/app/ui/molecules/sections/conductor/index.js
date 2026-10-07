import { useCallback, useEffect, useMemo, useRef } from 'react'
import { View } from 'app/design/view'
import { deepEqual } from 'app/lib/util'
import {
    fillTabs,
    mergeConductorRoutes,
    ensureRouteInited,
    findConductorRouteIndex,
    conductorListQueryKey,
} from './helpers'
import {
    LeftColumnContent,
    FiltersButton,
    openFiltersSheet,
} from './shared-ui'
import { TabSceneHeader, TabBar, TabScene } from './native-ui'
import { useLeftColumn, useConductorFilters } from './use-conductor'
import { useConductorRoutes } from './use-conductor-routes'
import { useConductorList } from './use-conductor-list'
import { useConductorCover, resolveConductorHeaderMode } from './use-conductor-cover'
import { useConductorRevalidate } from './use-conductor-revalidate'
import { useConductorCommands } from './use-conductor-commands'
import { useConductorFocusRefresh } from './use-conductor-focus-refresh'
import { PageHeaderOptions } from 'app/ui/molecules/header/options'
import { useCurrentUser } from 'app/context/user'
import Snackbar from 'app/ui/atoms/snackbar'
import { useBottomSheetStore } from 'app/context/bottomsheet'
import emitter, { EVENTS } from 'app/context/emitter'
import { useIsFocused } from 'app/lib/hooks/router'
import {
    getCachedConductorState,
    setCachedConductorState,
} from 'app/lib/cache/native-conductor-cache'
import { useTranslation } from 'react-i18next'

/** Stable fallback so `useLeftColumn` memos survive tabs without a left column. */
const EMPTY_CONTENT = []

/**
 * Conductor — native shell (web lives in `index.web.js`).
 *
 * One UNA page = one menu turned into tabs (`routes`) + one list for the active
 * tab. This component composes five loosely coupled concerns, each in its own
 * hook, in the order the effects must run:
 *
 *  1. Routes / tabs   — `useConductorRoutes` + a native `adapter` built here
 *                       (cache bootstrap, focus-gated links, no URL change).
 *  2. List            — `useConductorList`; kept here, not in TabScene, so
 *                       pull-to-refresh, sockets and emitter commands share
 *                       one refetch.
 *  3. Revalidation    — `useConductorRevalidate`: timeline socket → snackbar.
 *  4. Global commands — `useConductorCommands`: emitter + pull-to-refresh.
 *  5. Chrome          — `useConductorCover` (morph state), filters sheet, tab
 *                       bar, and `PageHeaderOptions` (page header slots).
 *
 * Hook order in sections 1–2 is load-bearing: see the note above `qKey`.
 *
 * @param {object}   props
 * @param {boolean}  props.isCoverDisabled   Page asked for no cover image.
 * @param {array}    [props.leftSideBarBlocks] Extra blocks for the Filters sheet.
 * @param {object}   props.menu              UNA menu JSON the tabs are built from.
 * @param {string}   props.layoutName        'profile' | 'navigator' | …; drives chrome.
 * @param {object}   props.data              UNA page JSON for the current URL.
 * @param {object}   props.blocks            Page block map (already resolved).
 * @param {boolean}  [props.useSectionAsMenu=false] Match tabs by `?section=`, not by path.
 * @param {string}   [props.unitMode='']     Forwarded to ItemRenderer.
 * @param {string}   [props.skeleton='']     Skeleton override for the list.
 * @param {Function} [props.onChangeRoute]   Called with the route after a tab switch.
 * @param {string}   [props.keyword]         Search term; part of the list query key.
 * @param {*}        [props.ts]              Soft-refresh token from the page.
 */
export function Conductor({
    isCoverDisabled,
    leftSideBarBlocks,
    menu,
    layoutName,
    data,
    blocks,
    useSectionAsMenu = false,
    unitMode = '',
    skeleton = '',
    onChangeRoute,
    keyword,
    ts,
}) {
    const { t } = useTranslation()
    const { currentUser } = useCurrentUser()
    // Setter only: subscribing to the sheet data would re-render the whole
    // conductor on every sheet open/close.
    const setBottomSheetData = useBottomSheetStore((state) => state.setBottomSheetData)
    // Tab screens stay mounted when blurred (see tabs.js) — every write to the
    // shared header atom and every global emitter command must be gated on
    // focus, otherwise a background conductor clobbers the visible submenu.
    const isFocused = useIsFocused()
    const isFocusedRef = useRef(isFocused)
    isFocusedRef.current = isFocused

    // ==================================================================
    // 1. Routes / tabs
    // ==================================================================

    /** Menu JSON → tab routes, with the current URL's tab already hydrated. */
    const initedTabs = useMemo(
        () => fillTabs(menu, data, blocks, currentUser, useSectionAsMenu),
        [menu, data, blocks, currentUser, useSectionAsMenu]
    )

    /** Identity of the cached entry: layout + page + user. */
    const conductorCacheKey = `${layoutName}:${data?.url ?? ''}:${currentUser?.id ?? 'guest'}`
    // Read cache once for bootstrap; later URL changes go through applyUrlChange.
    const cachedConductorRef = useRef(null)
    if (cachedConductorRef.current === null) {
        cachedConductorRef.current = getCachedConductorState(
            layoutName,
            data?.url,
            currentUser?.id
        )
    }

    const listRef = useRef(null)

    const {
        coverScrollY,
        coverOverlayPad,
        coverPadPin,
        onOverlayHeight,
        onCoverProgress,
        pinCoverForTabSwitch,
    } = useConductorCover({ pageUrl: data?.url })

    // Snapshot for persist.write / unmount. Unmount cleanup captures url at
    // subscribe time so a URL change still writes the previous page (same as
    // the old conductorCacheKey effect). write() does not key on data.url.
    const persistCtxRef = useRef({
        layoutName,
        url: data?.url,
        userId: currentUser?.id,
    })
    persistCtxRef.current = {
        layoutName,
        url: data?.url,
        userId: currentUser?.id,
    }

    /**
     * Native half of the `useConductorRoutes` contract (see the JSDoc there).
     * Native: cache, focus-gated links, no URL change on tab. Web adapter lives
     * in index.web.js (history).
     *
     * `deps: []` is deliberate — every value it closes over is a ref that is
     * refreshed on each render above, so the adapter never needs to be rebuilt.
     */
    const routesAdapter = useMemo(
        () => ({
            skipFirstPageRev: true,
            // Prefer the cached routes so a re-entered page paints instantly.
            getInitialRoutes: (tabs) => cachedConductorRef.current?.routes ?? tabs,
            // Hard nav: swap in fresh tabs and follow the URL to its tab.
            applyUrlChange: ({
                setRoutes,
                setIndex,
                initedTabs: tabs,
                pageUrl,
                useSectionAsMenu: sectionMenu,
                indexRef,
            }) => {
                setRoutes(tabs)
                const foundIndex = findConductorRouteIndex(tabs, pageUrl, sectionMenu)
                if (foundIndex !== -1 && foundIndex !== indexRef.current) {
                    setIndex(foundIndex)
                }
            },
            // Soft refresh: merge, never replace — replacing would drop the
            // already-loaded data of the other tabs and flash skeletons.
            applySoftRefresh: ({ setRoutes, initedTabs: tabs }) => {
                setRoutes((current) => mergeConductorRoutes(tabs, current))
            },
            // Submenu switches in place — do not change the screen URL (cover/shell).
            onSelectTab: ({ tab, setIndex, routesRef, onChangeRoute: notify }) => {
                setIndex(tab.index)
                notify?.(routesRef.current?.[tab.index] ?? tab)
            },
            // Menu can be re-sent identical on every page poll; merge only on a real change.
            onMenuChange: ({ menu: nextMenu, prevMenu, initedTabs: tabs, setRoutes }) => {
                if (deepEqual(nextMenu, prevMenu)) return
                setRoutes((prev) => mergeConductorRoutes(tabs, prev))
            },
            // In-app links (`emitter`) may target another tab of this same page.
            subscribeExternalHref: (onHref) => {
                const sub = emitter.addListener(EVENTS.link, (payload) => {
                    if (!isFocusedRef.current) return
                    const href = payload?.href
                    if (!href) return
                    onHref(href)
                })
                return () => sub.remove()
            },
            // Native cache. Both writers refuse to store a state where no tab
            // was ever hydrated — that would cache an empty page.
            persist: {
                /** Write-through on every routes/index change. */
                write(nextRoutes, nextIndex) {
                    const { layoutName: layout, url, userId } = persistCtxRef.current
                    if (!layout || !url || !nextRoutes?.some((route) => route.inited)) {
                        return
                    }
                    setCachedConductorState(layout, url, {
                        routes: nextRoutes,
                        index: nextIndex,
                    }, userId)
                },
                /**
                 * Final write on unmount. `url` is captured here, at subscribe
                 * time, so a URL change still saves under the *previous* page.
                 */
                subscribeUnmount(getSnapshot) {
                    const { layoutName: layout, url, userId } = persistCtxRef.current
                    return () => {
                        const { routes: nextRoutes, index: nextIndex } = getSnapshot()
                        if (!url || !nextRoutes?.some((route) => route.inited)) {
                            return
                        }
                        setCachedConductorState(layout, url, {
                            routes: nextRoutes,
                            index: nextIndex,
                        }, userId)
                    }
                },
            },
        }),
        []
    )

    const {
        routes,
        setRoutes,
        routesRef,
        index,
        setIndex,
        indexRef,
        activeRoute,
        prevRoute,
        onSelectTab: onSelectTabRoute,
    } = useConductorRoutes({
        initedTabs,
        pageUrl: data?.url,
        keyword,
        pageTimestamp: data?.timestamp,
        ts,
        useSectionAsMenu,
        onChangeRoute,
        menu,
        persistKey: conductorCacheKey,
        persistWriteKey: `${layoutName}:${currentUser?.id ?? 'guest'}`,
        adapter: routesAdapter,
    })

    /** Tab press: pin the cover first, then switch. */
    const onSelectTab = useCallback((tab) => {
        pinCoverForTabSwitch()
        onSelectTabRoute(tab)
    }, [pinCoverForTabSwitch, onSelectTabRoute])

    /**
     * Route the *chrome* renders from. While a newly selected tab is still
     * loading, keep showing the previous one instead of flashing empty chrome.
     * The list itself always follows `activeRoute`.
     */
    const tabRoute = useMemo(
        () => (activeRoute?.inited ? activeRoute : (prevRoute ?? activeRoute)),
        [activeRoute, prevRoute]
    )
    const activeRequestUrl = activeRoute?.endpoint?.request_url

    // ==================================================================
    // 2. List
    // ==================================================================

    // List lives here (web: inside TabScene) so pull-to-refresh, sockets, and
    // emitter commands can share one refetch. Keep this immediately after
    // tabRoute — moving it below ensureRouteInited collapsed the profile cover.
    //
    // An uninited tab contributes `null` to the key so it cannot be confused
    // with the previous tab's cache entry.
    const qKey = useMemo(
        () => conductorListQueryKey({
            requestUrl: activeRoute?.inited ? activeRequestUrl : null,
            tabId: index,
            keyword,
            params: activeRoute?.inited ? (activeRoute?.endpoint?.params ?? null) : null,
            ts,
        }),
        [activeRoute?.inited, activeRequestUrl, activeRoute?.endpoint?.params, index, keyword, ts]
    )

    const {
        cacheItems,
        listItems,
        isPending,
        isFetching,
        hasNextPage,
        refetch: refetchList,
        handleEndReached,
        listReady,
    } = useConductorList({
        route: activeRoute?.inited ? activeRoute : {},
        queryKey: qKey,
        enabled: !!activeRoute?.inited,
        deferNewItems: false,
        refetchOnWindowFocus: false,
        listenPageReload: false,
    })

    // ==================================================================
    // 3. Revalidation: timeline socket → "Show New Posts" snackbar
    // ==================================================================

    const { snackbarVisible, hideSnackbar, showNewContent } = useConductorRevalidate({
        tabRoute,
        index,
        cacheItems,
        refetchList,
        currentUserId: currentUser?.id,
        bootstrappedFromCache: Boolean(cachedConductorRef.current?.routes),
    })

    // ==================================================================
    // 4. Global commands (emitter) + pull-to-refresh
    // ==================================================================

    // Only the URL tab is hydrated up front; the rest load their page JSON the
    // first time they are selected.
    useEffect(() => {
        ensureRouteInited(routes, index, setRoutes)
    }, [index])

    const { isRefreshing, onStartRefresh } = useConductorCommands({
        isFocusedRef,
        routesRef,
        indexRef,
        setIndex,
        listRef,
        activeRequestUrl,
        refetchList,
    })

    // ==================================================================
    // 5. Chrome: filters sheet, left column, tab bar, cover, shared header
    // ==================================================================

    // Filter form values → route.endpoint.params.filters → new list query key.
    const { setFilterValue, onFormChangedValues, formValuesToFilterEntries } =
        useConductorFilters({
            index,
            setRoutes,
            routesRef,
            skipFirstChange: true,
            isFocusedRef,
        })

    // UNA's left column carries two different things: dropdown menus (shown next
    // to the tabs) and filter blocks (shown in the bottom sheet).
    const leftColumnContent = tabRoute?.leftbar?.content ?? EMPTY_CONTENT
    const {
        leftColumnMenuBlocks,
        leftColumnFilterBlocks,
        leftColumnExcludedFromMainIds,
    } = useLeftColumn({
        leftColumnContent,
        layoutName,
    })

    const showFiltersBtn =
        leftColumnFilterBlocks.length > 0 ||
        (Array.isArray(leftSideBarBlocks) && leftSideBarBlocks.length > 0)

    /** Filters sheet submit: apply the values to the route, then close the sheet. */
    const onFormSubmit = useCallback((formData, d) => {
        setFilterValue(formValuesToFilterEntries(d), d)
        setBottomSheetData(false)
    }, [setFilterValue, formValuesToFilterEntries, setBottomSheetData])

    /**
     * Open the Filters sheet. Content is the page's own filter blocks, or the
     * blocks the page passed in when it has none of its own.
     */
    const showFilters = useCallback(() => {
        openFiltersSheet(setBottomSheetData, {
            t,
            snapPoints: ['60%', '60%'],
            content: (
                <LeftColumnContent
                    route={tabRoute}
                    items={
                        leftColumnFilterBlocks.length > 0
                            ? leftColumnFilterBlocks
                            : (Array.isArray(leftSideBarBlocks) ? leftSideBarBlocks : [])
                    }
                    onChange={onFormChangedValues}
                    restoreFormValues
                    className="my-3 mx-2 "
                    onFormSubmit={onFormSubmit}
                    saveOnChanges
                />
            ),
        })
    }, [leftColumnFilterBlocks, leftSideBarBlocks, tabRoute, onFormSubmit, onFormChangedValues, t, setBottomSheetData])

    /** "Filters" trigger, rendered by the cover/header, not by the list. */
    const filter = useMemo(
        () => (
            <FiltersButton
                visible={showFiltersBtn}
                onPress={showFilters}
                className="items-start ml-3 mt-2 mb-1"
            />
        ),
        [showFiltersBtn, showFilters]
    )

    /** The tab strip itself; the cover embeds it and collapses around it. */
    const sceneHeader = useMemo(
        () => (
            <TabBar
                routes={routes}
                routesRef={routesRef}
                index={index}
                setIndex={setIndex}
                onChangeRoute={onChangeRoute}
                onSelectTab={onSelectTab}
                leftColumnMenus={leftColumnMenuBlocks}
            />
        ),
        [routes, index, setIndex, onChangeRoute, onSelectTab, leftColumnMenuBlocks]
    )

    const { headerMode, useLocalHeader } = resolveConductorHeaderMode({
        layoutName,
        isCoverDisabled,
        data,
        tabRoute,
    })

    const coverBlock = data?.cover_block
    // Cover chrome (context selector, actions menu) belongs to the page that owns
    // cover_block, so it must not follow the active subtab — otherwise every tab
    // switch hands the cover a new uri and re-renders it.
    const pageUri = data?.uri ?? tabRoute?.pageData?.uri
    const pageContext = data?.context

    /**
     * The whole conductor chrome as one element. Rendered inline for profile
     * layouts (the page header is hidden), or handed to the page header as
     * its `sub` row for the rest.
     */
    const headerComponent = useMemo(
        () => (
            <TabSceneHeader
                headerMode={headerMode}
                coverBlock={coverBlock}
                pageUri={pageUri}
                pageContext={pageContext}
                sceneHeader={sceneHeader}
                filter={filter}
                ts={ts}
                coverScrollY={coverScrollY}
                onOverlayHeight={onOverlayHeight}
                onProgress={onCoverProgress}
            />
        ),
        [headerMode, coverBlock, pageUri, pageContext, sceneHeader, filter, ts, coverScrollY, onOverlayHeight, onCoverProgress]
    )

    useConductorFocusRefresh({ routesRef, indexRef, onStartRefresh })

    // ==================================================================
    // Render
    // ==================================================================
    //
    // The chrome is rendered *after* the list when it is a dynamic cover: the
    // morph overlays the list and must paint on top of it. In 'small' mode it
    // is a normal block above the list, and in 'none' mode it is not here at
    // all — it is the page header's `sub` row.

    return (
        <View className="w-full h-full ">
            {useLocalHeader
                ? <PageHeaderOptions hidden />
                : <PageHeaderOptions sub={headerComponent} />}
            <View className="w-full flex-1 " style={headerMode === 'dynamic' ? { overflow: 'hidden' } : undefined}>
                <Snackbar
                    visible={snackbarVisible}
                    onPress={showNewContent}
                    onDismiss={hideSnackbar}
                    variant="primary"
                    title={t('Show New Posts')}
                    size="sm"
                />
                {useLocalHeader && headerMode !== 'dynamic' ? headerComponent : null}
                <TabScene
                    skeleton={skeleton}
                    numColumns={1}
                    onRefresh={onStartRefresh}
                    refreshing={isRefreshing}
                    route={activeRoute ?? tabRoute}
                    unitMode={unitMode}
                    handleEndReached={handleEndReached}
                    listItems={listItems}
                    listReady={listReady}
                    isPending={isPending}
                    isFetching={isFetching}
                    hasNextPage={hasNextPage}
                    onFormChangedValues={onFormChangedValues}
                    skipHeaderOffset={useLocalHeader}
                    listRef={listRef}
                    leftColumnExcludedFromMainIds={leftColumnExcludedFromMainIds}
                    coverOverlayPad={headerMode === 'dynamic' ? Math.max(0, coverOverlayPad - coverPadPin) : 0}
                    coverScrollY={headerMode === 'dynamic' ? coverScrollY : undefined}
                    isInited={!!activeRoute?.inited}
                />
                {useLocalHeader && headerMode === 'dynamic' ? headerComponent : null}
            </View>
        </View>
    )
}
