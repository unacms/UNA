import { useCallback, useState, useEffect, useMemo } from 'react'
import { View } from 'app/design/view'
import {
    appSetting,
    getHeaderSettings,
    getURI,
    getPageContentWidth,
} from 'app/lib/util'
import {
    fillTabs,
    ensureRouteInited,
    findConductorRouteIndex,
    getConductorLayoutCols,
    getConductorColumnsConfig,
    isConductorColumnShown,
} from './helpers'
import {
    LeftColumnContent,
    openFiltersSheet,
} from './shared-ui'
import {
    TabScene,
    TabSceneColumns,
    LeftColumnContainer,
    RightColumnContainer,
    HeaderContainer,
    TabSceneHeader,
} from './web-ui'
import { useLeftColumn, useConductorFilters } from './use-conductor'
import { useConductorRoutes } from './use-conductor-routes'
import { useTranslation } from 'react-i18next'
import { useCurrentUser } from 'app/context/user'
import { useBottomSheetStore } from 'app/context/bottomsheet'
import { useLayoutSettings } from 'app/context/layout-settings'
import { useIsDesktop, useWindowHeight, useBreakpointName } from 'app/context/measure'
import { useHeaderHeight, useFooterHeight } from 'app/context/jotai/layout'
import { isTasksHomeUri } from 'app/components/elements/tasks/helpers'
import { PageHeaderOptions } from 'app/ui/molecules/header/options'
import { useStickyHeaderOffset, stickySidebarStyle } from 'app/lib/hooks/use-sticky-header-offset'

/** `html` class that makes the page block, not the document, the scroller (global.web.css). */
const VIEWPORT_LOCK_CLASS = 'ns-viewport-lock'

/** Stable fallback so `useLeftColumn` memos survive tabs without a left column. */
const EMPTY_CONTENT = []

/**
 * Conductor — web shell (native lives in `index.js`).
 *
 * Same job as native: one UNA menu → tabs, one list for the active tab. The
 * differences are all structural, and they are why the two shells stay apart:
 *
 * - **Columns.** Desktop lays the page out as left / center / right resizable
 *   panels (`TabSceneColumns`); native has a single column.
 * - **URL is real.** Tab switches call `history.pushState` and the browser Back
 *   button must land on the right tab (`popstate` → `subscribeExternalHref`).
 * - **The list lives in `TabScene`**, not here — web has no pull-to-refresh or
 *   socket revalidation to share it with.
 * - **No cache.** Native bootstraps from `native-conductor-cache`; here the
 *   page JSON arrives with the document.
 *
 * Sections below mirror `index.js`, minus the ones that do not apply.
 *
 * @param {object}   props
 * @param {boolean}  props.isCoverDisabled   Page asked for no cover image.
 * @param {*}        [props.ts]              Soft-refresh token from the page.
 * @param {object}   props.menu              UNA menu JSON the tabs are built from.
 * @param {object}   props.data              UNA page JSON for the current URL.
 * @param {object}   props.blocks            Page block map (already resolved).
 * @param {boolean}  [props.useSectionAsMenu] Match tabs by `?section=`, not by path.
 * @param {string}   [props.skeleton='']     Skeleton override for the list.
 * @param {Function} [props.onChangeRoute]   Called with the route after a tab switch.
 * @param {string}   [props.keyword]         Search term; part of the list query key.
 * @param {string}   props.layoutName        'profile' | 'navigator' | …; drives chrome.
 */
export function Conductor({
    isCoverDisabled,
    ts,
    menu,
    data,
    blocks,
    useSectionAsMenu,
    skeleton = '',
    onChangeRoute,
    keyword,
    layoutName,
}) {
    // Frozen at mount: busts the list cache once per page visit, so a browser
    // back/forward to the same URL refetches instead of showing stale rows.
    const [timestamp] = useState(Date.now());
    const { t } = useTranslation()
    const { currentUser } = useCurrentUser()
    // Setter only: subscribing to the sheet data would re-render the whole
    // conductor on every sheet open/close.
    const setBottomSheetData = useBottomSheetStore((state) => state.setBottomSheetData)
    const { layoutName: tmplLayout } = useLayoutSettings()
    const isDesktop = useIsDesktop()
    const breakpointName = useBreakpointName()
    const pageHeaderHeight = useHeaderHeight()
    const footerHeight = useFooterHeight()
    const windowHeight = useWindowHeight()
    // Clear page header + cover/tab `header-fixed` stack (profile menus). Wiki's top:0
    // padding trick overlaps Conductor's opaque fixed cover bar when scrolled.
    const stickyTop = useStickyHeaderOffset(pageHeaderHeight)
    const stickyColumnStyle = useMemo(() => stickySidebarStyle(stickyTop), [stickyTop])

    const coverMode = appSetting('cover', 'view_by_module', data.cover_block?.profile?.module)
    const isCover = Boolean(data.cover_block) && coverMode != 'none'

    // ==================================================================
    // 1. Routes / tabs
    // ==================================================================

    /** Menu JSON → tab routes, with the current URL's tab already hydrated. */
    const initedTabs = useMemo(
        () => fillTabs(menu, data, blocks, currentUser, useSectionAsMenu),
        [menu, data, blocks, currentUser, useSectionAsMenu]
    )

    /**
     * Web half of the `useConductorRoutes` contract (see the JSDoc there).
     * Web: history. Tab menu items still pushState themselves; adapter covers
     * soft/hard page sync + popstate. Do not play click here — `setIndex` also
     * runs on load / URL sync, and menu items already fire haptics on press.
     *
     * `deps: []` is safe — the adapter closes over no render values.
     */
    const routesAdapter = useMemo(() => {
        /**
         * Take the freshly built tabs and point the index at whichever one the
         * page URL belongs to (0 when nothing matches). Both a hard nav and a
         * soft refresh do exactly this on web — unlike native, where a soft
         * refresh merges instead, because there we have cached tab data to keep.
         *
         * Re-syncing the index is not optional: without it the index can point
         * past the new tabs array and `activeRoute` comes back undefined.
         */
        const syncTabsToUrl = ({
            setRoutes,
            setIndex,
            initedTabs: tabs,
            pageUrl,
            useSectionAsMenu: sectionMenu,
            indexRef,
        }) => {
            setRoutes(tabs)
            const foundIndex = findConductorRouteIndex(tabs, pageUrl, sectionMenu)
            const nextIndex = foundIndex !== -1 ? foundIndex : 0
            if (nextIndex !== indexRef.current) {
                setIndex(nextIndex)
            }
        }

        return {
            skipFirstPageRev: true,
            // No cache on web: the server already sent this page's tabs.
            getInitialRoutes: (tabs) => tabs,
            applyUrlChange: syncTabsToUrl,
            applySoftRefresh: syncTabsToUrl,
            // Browser Back/Forward: tab switches only pushState, they do not
            // re-render the page, so the index has to follow the popped URL.
            subscribeExternalHref: (onHref, { onChangeRoute: notify }) => {
                if (typeof window === 'undefined') return undefined
                const handlePopState = () => {
                    const currentPath = `${window.location.pathname.slice(1)}${window.location.search}`
                    const route = onHref(currentPath)
                    if (route) notify?.(route)
                }
                window.addEventListener('popstate', handlePopState)
                return () => window.removeEventListener('popstate', handlePopState)
            },
        }
    }, [])

    const {
        routes,
        setRoutes,
        index,
        setIndex,
        activeRoute,
        prevRoute,
    } = useConductorRoutes({
        initedTabs,
        pageUrl: data.url,
        keyword,
        // Web historically soft-refreshed only on `ts`, not data.timestamp.
        pageTimestamp: undefined,
        ts,
        useSectionAsMenu,
        onChangeRoute,
        adapter: routesAdapter,
    })

    // ==================================================================
    // 2. Layout config (columns, widths, page header)
    // ==================================================================

    const cellsCustomConfig = appSetting('layouts', 'navigator') || appSetting('layouts', `cols-l-c`)
    const contentWidth = getPageContentWidth(layoutName, data?.uri)
    // Per-tab header config from UNA. An adjustable columns layout manages its
    // own top offset, so the header must not add one on top.
    const headerSettings = useMemo(() => {
        const settings = getHeaderSettings(
            getURI(activeRoute?.key),
            isDesktop,
            layoutName,
            activeRoute?.config
        )
        if (!cellsCustomConfig?.adjustable) return settings
        return { ...settings, offset: false }
    }, [activeRoute?.key, activeRoute?.config, isDesktop, layoutName, cellsCustomConfig?.adjustable])

    // ==================================================================
    // 3. Filters, left column, tab-local chrome
    // ==================================================================

    // The sheet belongs to the tab that opened it; a switch closes it.
    useEffect(() => {
        setBottomSheetData(false)
    }, [index])

    // Filter form values → route.endpoint.params.filters → new list query key.
    // Unlike native, web forms do not fire a bogus onChange on mount.
    const { onFormChangedValues } = useConductorFilters({
        index,
        setRoutes,
        skipFirstChange: false,
    })

    // Only the URL tab is hydrated up front; the rest load their page JSON the
    // first time they are selected.
    useEffect(() => {
        ensureRouteInited(routes, index, setRoutes)
    }, [index])

    // UNA's left column carries two different things: dropdown menus (shown next
    // to the tabs) and filter blocks (sidebar on desktop, sheet on mobile).
    const leftColumnContent = activeRoute?.leftbar?.content ?? EMPTY_CONTENT

    const {
        leftColumnMenuBlocks,
        leftColumnFilterBlocks,
        leftColumnExcludedFromMainIds,
    } = useLeftColumn({
        leftColumnContent,
        layoutName,
        isDesktop,
    })

    /**
     * Route the *columns* render from. While a newly selected tab is still
     * loading, keep the previous one so the side columns do not collapse and
     * re-expand. The center list always follows `activeRoute`.
     */
    const tabRoute = activeRoute?.inited ? activeRoute : prevRoute
    // Navigator always keeps its left column: it holds the section nav itself.
    const hasLeftColumn = tabRoute?.leftbar?.content?.length > 0 || layoutName === 'navigator'
    const hasRightColumn = (tabRoute?.sidebar?.content?.length > 0) || !!tabRoute?.blocks?.browse_sidebar
    // TabSceneColumns hides each side panel below its configured breakpoint,
    // which need not match the desktop switch (`tablet_mode_from`). The list
    // takes over the blocks of whichever panel is hidden right now.
    const { cells: columnCells = {} } = getConductorColumnsConfig(
        tabRoute?.pageData?.uri,
        getConductorLayoutCols(hasLeftColumn, hasRightColumn)
    ) || {}
    const isLeftColumnShown = isConductorColumnShown(columnCells.left?.breakpoint, breakpointName)
    const isRightColumnShown = isConductorColumnShown(columnCells.right?.breakpoint, breakpointName)
    // /tasks-home only: pin the shell to the leftover viewport and scroll the
    // list inside it so the site header + task toolbar stay put.
    const isTasksHome = isTasksHomeUri(activeRoute?.pageData?.uri) || isTasksHomeUri(activeRoute?.key)
    const pageHeight = windowHeight > 0
        ? Math.max(0, windowHeight - pageHeaderHeight - (isDesktop ? 0 : footerHeight))
        : 0

    // Viewing your own profile on desktop: the cover would just repeat what the
    // page context bar already shows.
    const isHideCover =
        data?.cover_block?.profile &&
        appSetting('cover', 'hide_cover_for_context') &&
        data?.cover_block?.profile?.id === data?.context?.current?.id &&
        isDesktop

    // Mobile: Filters sheet for use_as_filter (any layout) + navigator non-menu left column.
    // On desktop the same blocks live in the left column, so no button is needed.
    const showFiltersBtn = !isDesktop && leftColumnFilterBlocks.length > 0
    /** Profile chrome is rendered inline here instead of in the page header. */
    const isUseCurrentHeader = layoutName === 'profile' && (!isCoverDisabled || !isDesktop)

    /** Open the Filters sheet with the tab's own filter blocks. */
    const showFilters = useCallback(() => {
        openFiltersSheet(setBottomSheetData, {
            t,
            content: (
                <LeftColumnContent
                    route={activeRoute}
                    items={leftColumnFilterBlocks}
                    onChange={onFormChangedValues}
                    restoreFormValues
                />
            ),
            snapPoints: ['50%', '75%'],
            modal: true,
        })
    }, [activeRoute, onFormChangedValues, leftColumnFilterBlocks, t, setBottomSheetData])

    // Resizable panels measure themselves on `resize_panel`; nudge them once the
    // first paint settled, otherwise columns keep their pre-mount widths.
    useEffect(() => {
        const timer = setTimeout(
            () => window.dispatchEvent(new Event('resize_panel')),
            100
        )
        return () => clearTimeout(timer)
    }, [])

    // Class toggle (see global.web.css) rather than inline overflow: dropdowns
    // and dialogs save/restore body's inline style, and an inline lock here
    // could be restored onto the next page by their cleanup.
    useEffect(() => {
        if (!isTasksHome || typeof document === 'undefined') return undefined
        const html = document.documentElement
        html.classList.add(VIEWPORT_LOCK_CLASS)
        return () => html.classList.remove(VIEWPORT_LOCK_CLASS)
    }, [isTasksHome])

    // ==================================================================
    // 4. Chrome: cover + tab bar, and who renders it
    // ==================================================================

    /**
     * Cover + tab bar as one element. It goes to one of two places:
     * inline in this tree (desktop, or mobile profile), or into the shared
     * header atom as a subHeader (mobile non-profile) — see the effects below.
     *
     * Deps list `data.*` fields rather than `data` itself: the page object is a
     * new reference on every poll, and rebuilding this would remount the cover.
     */
    const headerComponent = useMemo(
        () => (
            <HeaderContainer
                contentWidth={contentWidth}
                isCover={isCover}
                isCoverDisabled={isCoverDisabled}
                isHideCover={isHideCover}
                headerSettings={headerSettings}
                pageData={data}
                menu={menu}
                routes={routes}
                layoutName={layoutName}
                index={index}
                setIndex={setIndex}
                onChangeRoute={onChangeRoute}
                leftColumnMenus={leftColumnMenuBlocks}
                showFilters={showFiltersBtn}
                onShowFilters={showFilters}
            />
        ),
        [
            contentWidth,
            isCover,
            isCoverDisabled,
            isHideCover,
            headerSettings,
            data?.uri,
            data?.ts,
            data?.cover_block,
            data?.context,
            data?.module,
            menu,
            routes,
            layoutName,
            index,
            setIndex,
            onChangeRoute,
            leftColumnMenuBlocks,
            showFiltersBtn,
            showFilters,
        ]
    )

    // ==================================================================
    // Render
    // ==================================================================

    // Both side columns are built here and handed to TabSceneColumns, which
    // decides whether there is room for them at the current breakpoint.
    const leftColumn = hasLeftColumn ? (
        <LeftColumnContainer
            layoutName={layoutName}
            index={index}
            setIndex={setIndex}
            menu={menu}
            routes={routes}
            stickyColumnStyle={stickyColumnStyle}
        >
            <LeftColumnContent route={tabRoute} onChange={onFormChangedValues} />
        </LeftColumnContainer>
    ) : null

    const rightColumn = hasRightColumn ? (
        <RightColumnContainer
            route={tabRoute}
            stickyColumnStyle={stickyColumnStyle}
        />
    ) : null

    return (
        <View
            className={`ns--conductor-wrapper-- w-full h-full ne--${isTasksHome ? ' min-h-0 overflow-hidden' : ''}`}
            style={{
                minHeight: `calc(100dvh - ${pageHeaderHeight}px)`,
                ...(isTasksHome && pageHeight > 0 ? { height: pageHeight } : {}),
            }}
        >
            {/* Desktop keeps the normal page header. Mobile profile hides it
                (the cover owns the top of the screen); everything else on
                mobile rides the tab bar in the page header so it stays
                visible while the content scrolls. */}
            {isUseCurrentHeader
                ? <PageHeaderOptions hidden mobileOnly />
                : <PageHeaderOptions sub={headerComponent} mobileOnly />}
            {(isUseCurrentHeader || isDesktop) && headerComponent}
            <View
                className={`ns--conductor-tab-content-- ${contentWidth} mx-auto ${tmplLayout == 'mixed' ? 'mt-12' : ''}${isTasksHome ? ' min-h-0 flex-1 h-full overflow-hidden' : ''}`}
            >
                <TabSceneHeader
                    route={activeRoute}
                    contentWidth={contentWidth}
                />
                <TabSceneColumns
                    layoutName={layoutName}
                    tabIndex={index}
                    pageRoute={tabRoute}
                    leftColumn={leftColumn}
                    rightColumn={rightColumn}
                    fillViewport={isTasksHome}
                >
                    <TabScene
                        pageRoute={activeRoute}
                        isInited={!!activeRoute?.inited}
                        onFormChangedValues={onFormChangedValues}
                        keyword={keyword}
                        ts={ts}
                        timestamp={timestamp}
                        skeleton={skeleton}
                        leftColumnExcludedFromMainIds={leftColumnExcludedFromMainIds}
                        fillViewport={isTasksHome}
                        isLeftColumnShown={isLeftColumnShown}
                        isRightColumnShown={isRightColumnShown}
                    />
                </TabSceneColumns>
            </View>
        </View>
    )
}
