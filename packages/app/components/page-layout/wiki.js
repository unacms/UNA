import { View } from 'app/design/view'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { appSetting, LAYOUT_BREAKPOINTS, stripTags } from 'app/lib/util'
import Page from 'app/ui/molecules/page/page'
import MenuFooter from 'app/components/nav/menu-footer'
import { useTranslation } from 'react-i18next'
import {
  Panel,
  PanelGroup,
  PanelHandler,
  resolvePanelProps,
} from 'app/ui/molecules/page/resizable-panels'
import { useBreakpoint, useBreakpointName, useIsDesktop } from 'app/context/measure'
import { BlockWrapper } from 'app/components/block-wrapper'
import { BlockByData } from 'app/components/block'
import DropdownPopup from 'app/ui/atoms/dropdown-popup'
import { useHeaderHeight, DEFAULT_HEADER_HEIGHT } from 'app/context/jotai/layout'
import { PageHeaderOptions } from 'app/ui/molecules/header/options'
import emitter, { EVENTS } from 'app/context/emitter'
import { parseWikiFrontMatter } from 'app/lib/markdown/frontmatter'
import { wikiCacheKey } from 'app/lib/cache/wiki-page-cache'
import {
  buildWikiBreadcrumbs,
  extractMarkdownHeadings,
  findWikiNavBlock,
  findWikiTocBlock,
  getWikiCenterBlocks,
  getWikiHeaderOffset,
  getWikiMarkdownContents,
  isWikiActionBlock,
  isWeb,
  TOC_SCROLL_GAP,
} from 'app/components/elements/wiki/helpers'
import { useWikiTocSpy, WikiTocDropdown, WikiTocList } from 'app/components/elements/wiki/toc'
import { WikiArticleBlock } from 'app/components/elements/wiki/document'
import { MenuWiki, WikiBreadcrumb } from 'app/components/elements/wiki/nav'
import { useWikiNavigation } from 'app/components/elements/wiki/use-navigation'

/**
 * Wiki page layout — 3-column docs chrome (nav / article / TOC).
 *
 * Private modules in app/components/elements/wiki/:
 *   helpers         — path/block/heading utils + content merge
 *   use-navigation  — cache, pushState, soft reload
 *   toc             — scroll-spy + TOC list/dropdown
 *   document        — article header + markdown block
 *   nav             — sidebar menu + breadcrumbs
 */
function PageContentWiki({ data, scrollRef, url }) {
    const { t } = useTranslation()
    const isDesktop = useIsDesktop()
    const centerContentRef = useRef(null)
    const {
        pageData,
        routeUrl,
        navigateToWikiPath,
        headingRefs,
    } = useWikiNavigation({ data, url })

    const cellsCustomConfig = useMemo(() => {
        return appSetting('layouts', 'wiki') || appSetting('layouts', 'cols-l-c-r')
    }, [])
    const groupRef = useRef(null)
    const currentBreakpoint = useBreakpoint()
    const currentBreakpointName = useBreakpointName()
    const { cells = {} } = cellsCustomConfig || {}

    const {
        breakpoint: leftBreakpoint = 'lg',
        responsive: leftResponsive,
        ...leftBase
    } = cells.left ?? {}
    const leftPanelProps = resolvePanelProps(leftBase, leftResponsive, currentBreakpointName)

    const {
        breakpoint: centerBreakpoint,
        responsive: centerResponsive,
        ...centerBase
    } = cells.center ?? {}
    const centerPanelProps = resolvePanelProps(centerBase, centerResponsive, currentBreakpointName)

    const {
        breakpoint: rightBreakpoint = 'xl',
        responsive: rightResponsive,
        ...rightBase
    } = cells.right ?? {}
    const rightPanelProps = resolvePanelProps(rightBase, rightResponsive, currentBreakpointName)
    const leftBreakpointMinWidth = LAYOUT_BREAKPOINTS[leftBreakpoint] ?? Number.POSITIVE_INFINITY
    const rightBreakpointMinWidth = LAYOUT_BREAKPOINTS[rightBreakpoint] ?? Number.POSITIVE_INFINITY
    const showMobileLeftPanel = currentBreakpoint < leftBreakpointMinWidth
    const showMobileRightPanel = currentBreakpoint < rightBreakpointMinWidth
    const headerHeight = useHeaderHeight()
    // pendingScrollId: optimistic highlight while smooth-scrolling to a click.
    // focusedTocId: last clicked item — keeps bg while that heading stays in view.
    const [pendingScrollId, setPendingScrollId] = useState(null)
    const [focusedTocId, setFocusedTocId] = useState(null)

    const centerCell = pageData?.data?.elements?.cell_center
    const wikiCenterBlocks = useMemo(
        () => getWikiCenterBlocks(centerCell),
        [centerCell]
    )
    const rawCenterMarkdownContents = useMemo(
        () => getWikiMarkdownContents(centerCell),
        [centerCell]
    )
    const wikiDocument = useMemo(
        () => parseWikiFrontMatter(rawCenterMarkdownContents),
        [rawCenterMarkdownContents]
    )
    // Bodies only (frontmatter stripped) — feeds TOC heading extraction.
    const centerMarkdownContents = wikiDocument.contents
    const centerHtmlContent = useMemo(
        () => centerMarkdownContents.join('\n\n'),
        [centerMarkdownContents]
    )
    // Custom wiki layout ignores UNA cell placement (classic uses a composite
    // 3-column page). Resolve nav/TOC chrome by block identity anywhere on the page.
    const leftMenu = findWikiNavBlock(pageData?.data)
        || pageData?.data?.elements?.cell_left?.[0]
    // Right chrome from TemplServiceWiki::page_contents when present; TOC links
    // below are still derived from page headings (API returns legacy jQuery HTML).
    // Do not fall back to cell_right[0] — that cell may hold unrelated blocks.
    const rightBlock = findWikiTocBlock(pageData?.data)
    const breadcrumbs = useMemo(
        () => buildWikiBreadcrumbs(
            leftMenu?.content?.[0]?.data?.content?.items,
            pageData.url || routeUrl,
        ),
        [leftMenu, pageData.url, routeUrl],
    )

    // TOC entries derived from the Markdown source (see extractMarkdownHeadings).
    const markdownHeadings = useMemo(
        () => extractMarkdownHeadings(centerHtmlContent),
        [centerHtmlContent]
    )
    const tocItems = markdownHeadings
    const showTocMenu = isWeb && tocItems.length >= 2
    const showBothMobilePanels = showMobileLeftPanel && showMobileRightPanel && showTocMenu
    // Avoid DOM reads during render; measured offset is used for click-to-scroll.
    const headerOffset = (Number(headerHeight) || DEFAULT_HEADER_HEIGHT) + TOC_SCROLL_GAP

    // Scroll-spy active anchors (Fumadocs-style multi-highlight).
    const spyActiveIds = useWikiTocSpy(tocItems, {
        headerOffset,
        pageKey: wikiCacheKey(pageData.url),
        contentRootRef: centerContentRef,
        headingRefs,
        scrollRef,
    })

    useEffect(() => {
        setPendingScrollId(null)
        setFocusedTocId(null)
        if (isWeb && typeof window !== 'undefined') {
            const hashId = window.location.hash.replace(/^#/, '')
            if (hashId) setFocusedTocId(hashId)
        }
    }, [isWeb, pageData.url])

    useEffect(() => {
        if (pendingScrollId && spyActiveIds.includes(pendingScrollId)) {
            setPendingScrollId(null)
        }
    }, [pendingScrollId, spyActiveIds])

    const activeTocIds = useMemo(() => {
        if (pendingScrollId && !spyActiveIds.includes(pendingScrollId)) {
            return [pendingScrollId]
        }
        return spyActiveIds
    }, [pendingScrollId, spyActiveIds])

    const handleTocPress = useCallback((id) => {
        if (!id) return

        setFocusedTocId(id)
        setPendingScrollId(id)

        // Dismiss mobile DropdownPopup menus before scrolling.
        emitter.emit(EVENTS.link, { action: 'pressed' })

        const offset = getWikiHeaderOffset(headerHeight)

        if (isWeb) {
            const target = document.getElementById(id)
            if (!target) return

            const top = target.getBoundingClientRect().top + window.scrollY - offset
            window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
            window.history.replaceState(null, '', `#${id}`)
            return
        }

        const target = headingRefs.current.get(id)
        const scrollView = scrollRef?.current
        if (!target?.measureLayout || !scrollView?.scrollTo) return

        target.measureLayout(
            scrollView,
            (_x, y) => {
                scrollView.scrollTo({ y: Math.max(0, y - offset), animated: true })
            },
            () => { },
        )
    }, [headerHeight, isWeb, scrollRef])

    // Assign ids to the rendered headings so TOC clicks can scroll to them. The
    // web renderer emits h2/h3 in source order but without ids, and it renders
    // asynchronously (WASM) — a MutationObserver re-applies ids once ready.
    useEffect(() => {
        if (!isWeb) return
        const root = centerContentRef.current
        if (!root) return

        const scrollMargin = `${headerOffset}px`

        const assignIds = () => {
            const headings = Array.from(root.querySelectorAll('h2, h3'))
            headings.forEach((heading, index) => {
                const item = tocItems[index]
                if (item && heading.id !== item.id) {
                    heading.id = item.id
                }
                // Keep native hash / scrollIntoView clear of the fixed header.
                if (heading.style.scrollMarginTop !== scrollMargin) {
                    heading.style.scrollMarginTop = scrollMargin
                }
            })
        }

        assignIds()
        const observer = new MutationObserver(assignIds)
        observer.observe(root, { childList: true, subtree: true })
        return () => observer.disconnect()
    }, [headerOffset, isWeb, tocItems])

    const mountRightSidebar = showTocMenu
    // Without the TOC panel the group has two panels; center absorbs the right share.
    const centerPanelLayoutProps = mountRightSidebar
        ? centerPanelProps
        : {
            ...centerPanelProps,
            defaultSize: 100 - (leftPanelProps.defaultSize ?? 0),
            maxSize: 100,
        }
    const leftDefaultSize = leftPanelProps.defaultSize
    const centerDefaultSize = centerPanelLayoutProps.defaultSize
    const rightDefaultSize = rightPanelProps.defaultSize

    useEffect(() => {
        if (!isWeb) return
        groupRef.current?.setLayout(
            mountRightSidebar
                ? [leftDefaultSize, centerDefaultSize, rightDefaultSize]
                : [leftDefaultSize, centerDefaultSize]
        )
    }, [currentBreakpointName, mountRightSidebar, leftDefaultSize, centerDefaultSize, rightDefaultSize])

    const tocMenuLabel = stripTags(rightBlock?.title) || t('On this page')

    // Below left-nav breakpoint only. From lg–xl the TOC trigger sits on the
    // breadcrumb row; at xl+ the right sidebar owns TOC.
    const mobileHeaderControls = useMemo(() => {
        if (!showMobileLeftPanel || !leftMenu) {
            return null
        }

        return (
            <View className="w-full py-2 px-3 sm:px-4 ">
                <View className="flex-row flex-auto items-center flex-wrap gap-2">
                    <View className={`flex-row items-center gap-1.5 min-w-0 ${showBothMobilePanels ? 'flex-auto' : 'flex-1'}`}>
                        <View className="shrink-0">
                            <DropdownPopup
                                minPopupWidth={256}
                                contentClasses={isWeb ? 'rounded-xl border border-popover mt-2 bg-popover/60 backdrop-blur shadow-md' : undefined}
                                buttonProps={{
                                    style: 'borderless',
                                    controlSize: 'regular',
                                    image: 'Menu',
                                    borderShape: 'capsule',
                                }}
                            >
                                <View className="p-1">
                                    <MenuWiki
                                        onNavigate={navigateToWikiPath}
                                        block={leftMenu}
                                        url={pageData.url}
                                    />
                                </View>
                            </DropdownPopup>
                        </View>
                        <WikiBreadcrumb
                            compact
                            items={breadcrumbs}
                            onNavigate={navigateToWikiPath}
                        />
                    </View>
                    {showBothMobilePanels && showTocMenu ? (
                        <View className="flex-none">
                            <WikiTocDropdown
                                items={tocItems}
                                activeIds={activeTocIds}
                                focusedId={focusedTocId}
                                onPress={handleTocPress}
                                label={tocMenuLabel}
                            />
                        </View>
                    ) : null}
                </View>
            </View>
        )
    }, [
        activeTocIds,
        breadcrumbs,
        focusedTocId,
        handleTocPress,
        isWeb,
        leftMenu,
        navigateToWikiPath,
        pageData.url,
        showBothMobilePanels,
        showMobileLeftPanel,
        showTocMenu,
        tocItems,
        tocMenuLabel,
    ])

    // Sticky pin stays at top:0; header clearance lives in scroll content padding so tall
    // sidebars can still scroll behind translucent/floating headers. Negative margin cancels
    // the page header spacer so sidebars align with center content before stick engages.
    const stickySidebarScrollStyle = {
        marginTop: -(Number(headerHeight) || 0),
        paddingTop: Number(headerHeight) || 0,
    }

    return (
        <View className={`${appSetting('layout', 'max_width')}`}>
            <PageHeaderOptions sub={mobileHeaderControls} mobileOnly />
                <PanelGroup
                    ref={groupRef}
                    key={`cells-wiki${cellsCustomConfig.sizable ? 'sizable' : 'static'}`}
                    direction="horizontal"
                    className={`mx-auto flex-auto relative flex-row `}
                    // Default panel-group overflow:hidden creates a scrollport and breaks
                    // window-scroll sticky. clip still contains resize overflow without that.
                    style={isWeb ? { overflow: 'clip' } : undefined}
                >
                    <Panel id="wiki-left" order={1} className={`hidden ${leftBreakpoint}:block ${currentBreakpointName}:w-full`} {...leftPanelProps}>
                        {/* Stretch with the panel group (driven by center column). Sticky stays at
                            top:0 so overflow scroll can pass behind translucent / floating headers.
                            Header clearance is padding inside the scrollport (not sticky top);
                            matching negative margin cancels the in-flow header spacer so content
                            lines up with the center column at rest. Panel group is the sticky
                            bound — sidebars release above the footer with no footer measurement. */}
                        <View className="h-full border-r border-border/60">
                            <View
                                className={`web:sticky web:top-0 web:max-h-screen web:overflow-y-auto gap-3 ${appSetting('conductor', 'sidebar_container')}`}
                                style={isWeb ? stickySidebarScrollStyle : undefined}
                            >
                                <BlockWrapper
                                    block={leftMenu}
                                    config={leftMenu?.config_api}
                                >
                                    <MenuWiki
                                        onNavigate={navigateToWikiPath}
                                        block={leftMenu}
                                        url={pageData.url}
                                    />
                                </BlockWrapper>
                            </View>
                        </View>
                    </Panel>
                    <PanelHandler gap={`hidden ${leftBreakpoint}:block`} sizable={cellsCustomConfig.sizable} panelLine={cellsCustomConfig['panel-line']} />
                    <Panel id="wiki-center" order={2} className={`native:w-full   ${currentBreakpointName}:w-full`} {...centerPanelLayoutProps}>
                        <View ref={centerContentRef} className="sm:p-4 lg:px-6 lg:py-6 xl:px-8 2xl:px-12 gap-6 lg:gap-8">
                            {(breadcrumbs.length >1 || showTocMenu) ? (
                                <View className={`gap-3  hidden ${leftBreakpoint}:flex`}>
                                    {/* CSS visibility only — do not gate on useBreakpoint (SSR mismatch).
                                        Breadcrumb from left-nav bp; TOC trigger until right sidebar bp. */}
                                    <View className={`hidden ${leftBreakpoint}:flex flex-row items-center justify-between gap-2 min-w-0`}>
                                        {breadcrumbs.length >1 ? (
                                            <View className="min-w-0 flex-1">
                                                <WikiBreadcrumb
                                                    items={breadcrumbs}
                                                    onNavigate={navigateToWikiPath}
                                                />
                                            </View>
                                        ) : (
                                            <View className="flex-1" />
                                        )}
                                        {showTocMenu ? (
                                            <View className={`shrink-0 ${rightBreakpoint}:hidden`}>
                                                <WikiTocDropdown
                                                    items={tocItems}
                                                    activeIds={activeTocIds}
                                                    focusedId={focusedTocId}
                                                    onPress={handleTocPress}
                                                    label={tocMenuLabel}
                                                />
                                            </View>
                                        ) : null}
                                    </View>
                                </View>
                            ) : null}
                           {wikiCenterBlocks.map((block) => (
                                isWikiActionBlock(block) ? (
                                    <BlockByData
                                        key={`wiki-action-${block.id || block.source}`}
                                        data={block}
                                        url={pageData.url || routeUrl}
                                        uri={pageData?.data?.uri}
                                    />
                                ) : (
                                    <WikiArticleBlock
                                        key={`wiki-block-${block.id || block.source}`}
                                        block={block}
                                        pageUrl={pageData.url || routeUrl}
                                    />
                                )
                            ))}
                        </View>
                    </Panel>
                    {mountRightSidebar ? (
                    <PanelHandler gap={`hidden ${rightBreakpoint}:block`} sizable={cellsCustomConfig.sizable} panelLine={cellsCustomConfig['panel-line']} />
                    ) : null}
                    {mountRightSidebar ? (
                    <Panel id="wiki-right" order={3} className={`${showTocMenu ? `hidden ${rightBreakpoint}:block` : 'hidden'} ${currentBreakpointName}:w-full`} {...rightPanelProps}>
                        <View className="h-full">
                            <View
                                className={`web:sticky web:top-0 web:max-h-screen web:overflow-y-auto gap-3 ${appSetting('conductor', 'sidebar_container')}`}
                                style={isWeb ? stickySidebarScrollStyle : undefined}
                            >
                                <BlockWrapper
                                    block={rightBlock || {
                                        id: 'wiki-toc',
                                        title: t('On this page'),
                                        designbox_id: 14,
                                    }}
                                    config={rightBlock?.config_api}
                                >
                                    <WikiTocList
                                        items={tocItems}
                                        activeIds={activeTocIds}
                                        focusedId={focusedTocId}
                                        onPress={handleTocPress}
                                        showTrack
                                    />
                                </BlockWrapper>
                            </View>
                        </View>
                    </Panel>
                    ) : null}
                </PanelGroup>
        </View>
    )
}

export default function PageLayoutWiki({ data }) {
    const scrollRef = useRef(null)

    return (
        <Page data={data} processKeyboard={false} scrollRef={scrollRef}>
            <PageContentWiki data={data} scrollRef={scrollRef} />
            <View className="flex-1" />
            <MenuFooter />
        </Page>
    )
}
