import { View, Row, Pressable } from 'app/design/view'
import { Text } from 'app/design/typography'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { appSetting, LAYOUT_BREAKPOINTS, stripTags } from 'app/lib/util'
import Page from 'app/ui/molecules/page'
import MenuFooter from 'app/components/nav/menu-footer'
import { useTranslation } from 'react-i18next'
import { Icon } from 'app/ui/atoms/icon'
import { NeoButton, NeoButtonLink } from 'app/design/controls'
import {
    Panel,
    PanelGroup,
    PanelHandler,
    resolvePanelProps
} from 'app/ui/molecules/resizable-panels'
import { useBreakpoint, useBreakpointName, useIsDesktop } from 'app/context/measure'
import { BlockWrapper } from 'app/components/block-wrapper'
import { BlockByData } from 'app/components/block'
import Menu from 'app/components/menu'
import DropdownPopup from 'app/ui/atoms/dropdown-popup'
import { DEFAULT_HEADER_HEIGHT, defaultHeader, useHeaderHeight, useSetHeader } from 'app/context/jotai/layout'
import Markdown from 'app/ui/atoms/markdown'
import { useFocusEffect, useGlobalSearchParams, usePathname } from 'app/lib/hooks/router'
import { isEmoji } from 'app/lib/util'
import { getPageData } from 'app/lib/util'
import emitter from 'app/context/emitter'
import Image from 'app/ui/atoms/image'
import { getComponent } from 'app/components/registry'
import { parseWikiFrontMatter, parseFrontMatter } from 'app/lib/markdown/frontmatter'
import Time from 'app/ui/atoms/time'
import {
    findWikiNavBlock,
    findWikiTocBlock,
    getCachedWikiPage,
    isWikiTocBlock,
    mergeWikiPageContent,
    setCachedWikiPage,
    wikiCacheKey,
} from 'app/lib/wiki-page-cache'
import {
    useWikiTocSpy,
    WikiTocDropdown,
    WikiTocList,
} from 'app/components/page-layout/wiki-toc'

const isWeb = Platform.OS === 'web';
/** Extra space below the fixed header when scrolling to a TOC heading. */
const TOC_SCROLL_GAP = 12

function getWikiHeaderOffset(headerHeight) {
    if (isWeb && typeof document !== 'undefined') {
        let sum = 0
        document.querySelectorAll('.header-fixed').forEach((el) => {
            const rect = el.getBoundingClientRect()
            if (rect.height <= 0) return
            const style = getComputedStyle(el)
            sum += rect.height
                + parseFloat(style.marginTop || 0)
                + parseFloat(style.marginBottom || 0)
        })
        if (sum > 0) return sum + TOC_SCROLL_GAP
    }

    return (Number(headerHeight) || DEFAULT_HEADER_HEIGHT) + TOC_SCROLL_GAP
}

const depthClassNameMap = {
    0: '',
    1: 'ps-3',
    2: 'ps-6',
    3: 'ps-9',
};

const getDepthClassName = (depth) => depthClassNameMap[depth] || '';
const getItemId = (item, indexPath) => String(item?.id || item?.name || item?.url || item?.link || indexPath);
const hasItemPath = (item) => Boolean(String(item?.url || item?.link || ''));
const normalizePathComparable = (path) => String(path || '')
    .replace(/^https?:\/\/[^/]+/i, '')
    .split(/[?#]/)[0]
    .replace(/^\/+|\/+$/g, '');

const getItemPath = (item) => {
    const p = String(item?.url || item?.link || '');
    return p ? (p.startsWith('/') ? p : `/${p}`) : '';
};

const getRouteParam = (value) => Array.isArray(value) ? value[0] : value;

function findWikiBreadcrumbTrail(items, currentPathComparable, ancestors = []) {
    for (const item of items || []) {
        const title = item?.title || item?.name
        if (!title) continue

        const path = getItemPath(item)
        const pathKey = normalizePathComparable(path)
        const crumb = {
            key: `${pathKey || title}-${ancestors.length}`,
            title,
            path: path || null,
            isCurrent: false,
        }

        if (pathKey && pathKey === currentPathComparable) {
            return [...ancestors, { ...crumb, isCurrent: true }]
        }

        const found = findWikiBreadcrumbTrail(
            item?.subitems || [],
            currentPathComparable,
            [...ancestors, crumb],
        )
        if (found) return found
    }

    return null
}

function buildWikiBreadcrumbs(menuItems, currentPath) {
    const currentKey = normalizePathComparable(currentPath)
    const trail = findWikiBreadcrumbTrail(menuItems, currentKey) || []
    const root = appSetting('wiki', 'breadcrumb') || {}
    const rootLabel = String(root.root_label || '').trim()
    const rootPath = root.root_path
        ? (String(root.root_path).startsWith('/') ? String(root.root_path) : `/${root.root_path}`)
        : null
    const rootKey = normalizePathComparable(rootPath)

    if (!rootLabel) return trail

    const rootCrumb = {
        key: 'wiki-breadcrumb-root',
        title: rootLabel,
        path: rootPath,
        isCurrent: Boolean(rootKey && rootKey === currentKey),
    }

    if (trail[0] && normalizePathComparable(trail[0].path) === rootKey) {
        return trail
    }

    if (rootCrumb.isCurrent && !trail.length) {
        return [rootCrumb]
    }

    if (rootCrumb.isCurrent) {
        return trail
    }

    return [rootCrumb, ...trail]
}

function WikiBreadcrumb({ items, onNavigate, compact = false }) {
    if (!items?.length) return null

    return (
        <Row
            className={`items-center flex-wrap min-w-0 ${compact ? 'gap-1 flex-1' : 'gap-1.5'}`}
            accessibilityRole="navigation"
            accessibilityLabel="Breadcrumb"
        >
            {items.map((item, index) => (
                <Row key={item.key} className="items-center gap-1 min-w-0 max-w-full">
                    {index > 0 ? (
                        <Icon
                            icon="ChevronRight"
                            size={14}
                            className="shrink-0 text-muted-foreground"
                        />
                    ) : null}
                    {item.isCurrent || !item.path || !onNavigate ? (
                        <Text
                            numberOfLines={1}
                            className={`text-sm leading-5 ${
                                item.isCurrent
                                    ? 'text-foreground font-medium'
                                    : 'text-muted-foreground'
                            }`}
                        >
                            {item.title}
                        </Text>
                    ) : (
                        <Pressable
                            href={item.path}
                            onPress={() => onNavigate(item.path)}
                            className="min-w-0 rounded-md px-1 py-0.5 web:hover:bg-muted/50"
                            accessibilityRole="link"
                            accessibilityLabel={item.title}
                        >
                            <Text
                                numberOfLines={1}
                                className="text-sm leading-5 text-muted-foreground web:hover:text-foreground"
                            >
                                {item.title}
                            </Text>
                        </Pressable>
                    )}
                </Row>
            ))}
        </Row>
    )
}

// Strip inline Markdown markers so TOC entries show clean heading text.
const stripMarkdownInline = (text) => String(text || '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .trim();

const slugifyHeading = (text) => String(text || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-') || 'section';

// Build the TOC from the Markdown source (h2/h3). Parsing the source is reliable
// and synchronous — the web renderer parses Markdown asynchronously via WASM, so
// reading the rendered DOM here would race the render and often yield an empty TOC.
function extractMarkdownHeadings(markdown) {
    if (!markdown || typeof markdown !== 'string') return [];

    const lines = markdown.split(/\r?\n/);
    const seenIds = new Map();
    const items = [];
    let inFence = false;

    lines.forEach((line) => {
        if (/^\s*(```|~~~)/.test(line)) {
            inFence = !inFence;
            return;
        }
        if (inFence) return;

        const match = line.match(/^\s{0,3}(#{2,3})\s+(.+?)\s*#*\s*$/);
        if (!match) return;

        const level = match[1].length;
        const text = stripMarkdownInline(match[2]);
        if (!text) return;

        const base = slugifyHeading(text);
        const count = seenIds.get(base) || 0;
        const id = count === 0 ? base : `${base}-${count + 1}`;
        seenIds.set(base, count + 1);

        items.push({ id, key: `${id}-${items.length}`, text, level });
    });

    return items;
}

const WIKI_ACTION_TYPES = new Set(['wiki_add_block', 'wiki_add_page']);

function getWikiCenterContentItems(cell) {
    const blocks = Array.isArray(cell) ? cell : Object.values(cell || {});

    return blocks.flatMap((block) => {
        // Skip UNA wiki TOC service HTML (jQuery #bx_wiki_toc) — TOC links are
        // built client-side from headings; the block is chrome for the right rail.
        if (!block?.content || block.hidden == true || isWikiTocBlock(block)) return [];

        const contentItems = Array.isArray(block.content)
            ? block.content
            : Object.values(block.content);

        return contentItems.filter(Boolean);
    });
}

/** Markdown sources from every article block (skip add-page / add-block CTAs). */
function getWikiMarkdownContents(cell) {
    return getWikiCenterContentItems(cell).flatMap((item) => {
        if (WIKI_ACTION_TYPES.has(item?.type)) return [];
        const content = item?.data?.content;
        return typeof content === 'string' ? [content] : [];
    });
}

/** All non-TOC center blocks (article + add CTAs). */
function getWikiCenterBlocks(cell) {
    const blocks = Array.isArray(cell) ? cell : Object.values(cell || {});
    return blocks.filter((block) => (
        block
        && block.hidden != true
        && !isWikiTocBlock(block)
        && block.content
    ));
}

function isWikiActionBlock(block) {
    const contentItems = Array.isArray(block?.content)
        ? block.content
        : Object.values(block?.content || {});
    return contentItems.some((item) => WIKI_ACTION_TYPES.has(item?.type));
}

function getWikiBlockPayload(block) {
    const contentItems = Array.isArray(block?.content)
        ? block.content
        : Object.values(block?.content || {});
    const item = contentItems.find((entry) => !WIKI_ACTION_TYPES.has(entry?.type)) || contentItems[0];
    const raw = typeof item?.data?.content === 'string' ? item.data.content : '';
    const parsed = parseFrontMatter(raw);
    return {
        item,
        menu: item?.data?.menu || null,
        added: item?.data?.info?.added,
        attributes: parsed.attributes,
        body: parsed.attributes ? parsed.body : raw,
        raw,
    };
}

/** UNA-style article block: docs header + manage menu + Markdown body. */
function WikiArticleBlock({
    block,
    pageUrl,
    WikiDocumentHeader,
}) {
    const { menu, added, attributes, body, raw } = getWikiBlockPayload(block);
    const hasDocHeader = Boolean(attributes?.title && WikiDocumentHeader);

    return (
        <BlockWrapper block={block} config={block?.config_api} showTitle={!hasDocHeader}>
            {hasDocHeader ? (
                <WikiDocumentHeader
                    markdownSource={raw}
                    metadata={attributes}
                    pageUrl={pageUrl}
                />
            ) : null}
            {body ? <Markdown data={body} /> : null}
            {menu?.items?.length ? (
                <Row className="mb-2 justify-end ">
                    <View className="w-full  ">
                    
                    <Menu
                     {...menu}
                   // displayType="element"
                    alignItems="start"
                   // showMatched={true}
                    autoSize={true}
                    autoFilter={false}
                    params={{
                        className: 'gap-x-2',
                        button_variant: 'default',
                        button_size: 'sm',
                        button_rounded: false,
                        button_full_width: false, show_action: true, show_counter: true, show_combined: true
                    }}
                />
                    </View>
                </Row>
            ) : null}
            {added ? (
                <Time
                    className="text-muted-foreground text-xs leading-5"
                    ts={added}
                />
            ) : null}
        </BlockWrapper>
    );
}

function useCurrentPathComparable() {
    const pathname = usePathname();
    const params = useGlobalSearchParams();
    return normalizePathComparable(getRouteParam(params?.url) || pathname);
}

function buildExpandedMapForPath(items = [], currentPathComparable, parentIndexPath = '') {
    const map = {};

    items.forEach((item, index) => {
        const indexPath = parentIndexPath ? `${parentIndexPath}-${index}` : String(index);
        const itemId = getItemId(item, indexPath);
        const children = item?.subitems || [];

        if (!children.length) return;

        if (hasActiveDescendant(item, currentPathComparable)) {
            map[itemId] = true;
        }

        Object.assign(map, buildExpandedMapForPath(children, currentPathComparable, indexPath));
    });

    return map;
}

function hasActiveDescendant(item, currentPathComparable) {
    const itemPath = String(item?.url || item?.link || '');
    const itemPathComparable = normalizePathComparable(itemPath);
    if (itemPathComparable && itemPathComparable === currentPathComparable) return true;
    const children = item?.subitems || [];
    return children.some((child) => hasActiveDescendant(child, currentPathComparable));
}

function isImageSource(icon) {
    if (typeof icon === 'number') return true; // require('./x.png')
    if (typeof icon === 'object' && icon !== null && 'uri' in icon) return true;
    if (typeof icon === 'string' && /^(https?:|file:|content:|data:)/i.test(icon)) return true;
    return false;
}

function WikiMenuItem({ title, icon, isActive, iconEnd }) {
    const iconClassName = isActive
        ? 'text-accent-foreground'
        : 'text-secondary-foreground web:group-hover:text-foreground'
    const iconBackgroundClassName = isActive
        ? 'text-accent-foreground'
        : 'text-secondary-foreground'

    return (
        <Row className="w-full items-center gap-2">
            <View className={`h-6 w-6 shrink-0 items-center justify-center rounded-full ${iconBackgroundClassName}`}>
                {isImageSource(icon) ? (
                    <Image
                        src={icon}
                        className="h-5 w-5 rounded"
                        view="cover"
                        sizes="auto"
                    />
                ) : isEmoji(icon) ? (
                    <Text className="text-xs leading-none">{icon}</Text>
                ) : (
                    <Icon icon={icon} size={20} className={iconClassName} />
                )}
            </View>

            <Text className={`flex-1 text-sm leading-5 font-semibold ${isActive ? 'text-accent-foreground' : 'text-secondary-foreground web:group-hover:text-foreground'}`}>
                {title}
            </Text>

            {!!iconEnd && (
                <View className="ml-auto h-6 w-6 shrink-0 items-center justify-center rounded-full">
                    {isEmoji(iconEnd) ? (
                        <Text className="text-xs leading-none text-secondary-foreground">{iconEnd}</Text>
                    ) : (
                        <Icon icon={iconEnd} size={15} className="text-secondary-foreground web:group-hover:text-foreground" />
                    )}
                </View>
            )}
        </Row>
    )
}

function ActiveBranchExpander({ currentPathComparable, items, setExpandedMap }) {
    useEffect(() => {
        const activeExpandedMap = buildExpandedMapForPath(items, currentPathComparable);
        const activeExpandedIds = Object.keys(activeExpandedMap);

        if (!activeExpandedIds.length) return;

        setExpandedMap((prev) => {
            let hasChanges = false;
            const next = { ...prev };

            activeExpandedIds.forEach((id) => {
                if (!next[id]) {
                    next[id] = true;
                    hasChanges = true;
                }
            });

            return hasChanges ? next : prev;
        });
    }, [currentPathComparable, items, setExpandedMap]);

    return null;
}

function MenuWiki({ onNavigate, block, url }) {
    const data = block.content[0].data;
    const routePathComparable = useCurrentPathComparable();
    // Prefer pageData.url so sidebar pushState (web) and in-layout swaps (native)
    // keep the active item in sync without waiting on the router.
    const currentPathComparable = normalizePathComparable(url) || routePathComparable;
    const initialPathComparable = normalizePathComparable(url);
    const topLevelItems = data?.content?.items || [];
    const [expandedMap, setExpandedMap] = useState(() => buildExpandedMapForPath(topLevelItems, initialPathComparable));

    const toggleExpanded = (id) => {
        setExpandedMap((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const renderItems = (items = [], depth = 0, parentIndexPath = '') =>
        items.map((item, index) => {
            const indexPath = parentIndexPath ? `${parentIndexPath}-${index}` : String(index);
            const itemId = getItemId(item, indexPath);
            const itemPath = getItemPath(item);
            const children = item?.subitems || [];
            const hasChildren = children.length > 0;
            const isExpanded = Boolean(expandedMap[itemId]);
            const depthClassName = getDepthClassName(depth);
            const title = item?.title || item?.name;
            const icon = item?.icon || item?.image || 'Circle';
            const canNavigate = hasItemPath(item);
            const itemPathComparable = normalizePathComparable(itemPath);
            const isActive = Boolean(itemPathComparable && itemPathComparable === currentPathComparable);
            const menuIsActive = canNavigate ? isActive : false;
            // Parent-only nodes (no path) toggle expand/collapse; leaves navigate.
            const showChevron = !canNavigate && hasChildren;
            const menuIconEnd = showChevron ? (isExpanded ? 'ChevronDown' : 'ChevronRight') : null;
            const menuItem = (
                <WikiMenuItem
                    title={title}
                    icon={icon}
                    isActive={menuIsActive}
                    iconEnd={menuIconEnd}
                />
            );

            return (
                <View key={`lmenu-${itemId}`} className={`w-full ${depthClassName}`}>
                    {canNavigate ? (
                        <NeoButtonLink
                            href={itemPath}
                            alt={title}
                            style="borderless"
                            controlSize="large"
                            width="fill"
                            align="start"
                            contentInsets={{ x: 8 }}
                            selected={menuIsActive}
                            selectedState="pressed"
                            className="group"
                            onPress={(event) => {
                                onNavigate?.(itemPath)
                                event?.preventDefault?.()
                            }}
                        >
                            {menuItem}
                        </NeoButtonLink>
                    ) : (
                        <NeoButton
                            alt={title}
                            style="borderless"
                            controlSize="large"
                            width="fill"
                            align="start"
                            contentInsets={{ x: 8 }}
                            interactive
                            className="group"
                            onPress={hasChildren ? () => toggleExpanded(itemId) : undefined}
                        >
                            {menuItem}
                        </NeoButton>
                    )}
                    {hasChildren && isExpanded && (
                        <View className="mt-1 gap-1">
                            {renderItems(children, depth + 1, indexPath)}
                        </View>
                    )}
                </View>
            );
        });

    return (
        <>
            <ActiveBranchExpander
                currentPathComparable={currentPathComparable}
                items={topLevelItems}
                setExpandedMap={setExpandedMap}
            />
            <View className=' gap-1 lg:-mx-2'>
                {renderItems(topLevelItems)}
            </View>
        </>
    );
}

function PageContentWiki({ data, scrollRef, url }) {
    const { t } = useTranslation()
    const isWeb = Platform.OS === 'web'
    const isDesktop = useIsDesktop()
    const setHeader = useSetHeader()
    const pathname = usePathname()
    const params = useGlobalSearchParams()
    const routeUrl = getRouteParam(params?.url) || url || pathname
    const centerContentRef = useRef(null)
    const headingRefs = useRef(new Map())
    const [pageData, setPageData] = useState({ data, url: routeUrl })
    const pageDataRef = useRef(pageData)
    pageDataRef.current = pageData
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
    }, [isWeb])

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

    useEffect(() => {
        if (isWeb) {
            groupRef.current?.setLayout([
                leftPanelProps.defaultSize,
                centerPanelProps.defaultSize,
                rightPanelProps.defaultSize
            ])
        }
    }, [currentBreakpointName, isWeb, leftPanelProps.defaultSize, centerPanelProps.defaultSize, rightPanelProps.defaultSize])

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
    const WikiDocumentHeader = getComponent('molecule', 'wiki_document_header')
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
    const showBothMobilePanels = showMobileLeftPanel && showMobileRightPanel && tocItems.length >= 2
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
        emitter.emit('link', { action: 'pressed' })

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

    const showTocMenu = tocItems.length >= 2
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
                                contentClasses="rounded-xl border border-popover mt-2 bg-popover/60 backdrop-blur shadow-md"
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
        leftMenu,
        navigateToWikiPath,
        pageData.url,
        showBothMobilePanels,
        showMobileLeftPanel,
        showTocMenu,
        tocItems,
        tocMenuLabel,
    ])

    useEffect(() => {
        if (isWeb) {
            setHeader(isDesktop ? defaultHeader : { subHeader: mobileHeaderControls });
        }
    }, [isDesktop, isWeb, mobileHeaderControls, setHeader]);

    useFocusEffect(
        useCallback(() => {
            if (!isWeb) {
                setHeader(isDesktop ? defaultHeader : { subHeader: mobileHeaderControls });
            }
        }, [isDesktop, isWeb, mobileHeaderControls, setHeader])
    );

    // Sticky pin stays at top:0; header clearance lives in scroll content padding so tall
    // sidebars can still scroll behind translucent/floating headers. Negative margin cancels
    // the page header spacer so sidebars align with center content before stick engages.
    const stickySidebarScrollStyle = {
        marginTop: -(Number(headerHeight) || 0),
        paddingTop: Number(headerHeight) || 0,
    }

    return (
        <View className={`${appSetting('layout', 'max_width')}`}>
            <View className='w-full mx-auto'>
                <PanelGroup
                    ref={groupRef}
                    key={`cells-wiki${cellsCustomConfig.sizable ? 'sizable' : 'static'}`}
                    direction="horizontal"
                    className={`mx-auto flex-auto relative flex-row`}
                    // Default panel-group overflow:hidden creates a scrollport and breaks
                    // window-scroll sticky. clip still contains resize overflow without that.
                    style={isWeb ? { overflow: 'clip' } : undefined}
                >
                    <Panel className={`hidden ${leftBreakpoint}:block ${currentBreakpointName}:w-full`} {...leftPanelProps}>
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
                    <Panel className={`native:w-full ${currentBreakpointName}:w-full`} {...centerPanelProps}>
                        <View ref={centerContentRef} className="p-3 sm:p-4 lg:px-6 lg:py-6 xl:px-8 2xl:px-12 gap-6 lg:gap-8">
                            {(breadcrumbs.length || showTocMenu) ? (
                                <View className="gap-3">
                                    {/* CSS visibility only — do not gate on useBreakpoint (SSR mismatch).
                                        Breadcrumb from left-nav bp; TOC trigger until right sidebar bp. */}
                                    <View className={`hidden ${leftBreakpoint}:flex flex-row items-center justify-between gap-2 min-w-0`}>
                                        {breadcrumbs.length ? (
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
                                        WikiDocumentHeader={WikiDocumentHeader}
                                    />
                                )
                            ))}
                        </View>
                    </Panel>
                    <PanelHandler gap={`hidden ${rightBreakpoint}:block`} sizable={cellsCustomConfig.sizable} panelLine={cellsCustomConfig['panel-line']} />
                    <Panel className={`${showTocMenu ? `hidden ${rightBreakpoint}:block` : 'hidden'} ${currentBreakpointName}:w-full`} {...rightPanelProps}>
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
                </PanelGroup>
            </View>
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
