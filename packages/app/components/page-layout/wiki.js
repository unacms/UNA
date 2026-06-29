import { View, Row, Pressable } from 'app/design/view'
import { Text } from 'app/design/typography'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { appSetting, LAYOUT_BREAKPOINTS } from 'app/lib/util'
import Page from 'app/ui/molecules/page'
import MenuFooter from 'app/components/nav/menu-footer'
import { useTranslation } from 'react-i18next'
import { Icon } from 'app/ui/atoms/icon'
import {
    Panel,
    PanelGroup,
    PanelHandler,
    resolvePanelProps
} from 'app/ui/molecules/resizable-panels'
import { useBreakpoint, useBreakpointName, useIsDesktop } from 'app/context/measure'
import { BlockWrapper } from 'app/components/block-wrapper'
import DropdownPopup from 'app/ui/atoms/dropdown-popup'
import { defaultHeader, useSetHeader } from 'app/context/jotai/layout'
import Html from 'app/ui/atoms/html'
import { useGlobalSearchParams, usePathname } from 'app/lib/hooks/router'
import { isEmoji } from 'app/lib/util'
import { getPageData } from 'app/lib/util'

const isWeb = Platform.OS === 'web';

const depthClassNameMap = {
    0: '',
    1: 'pl-4',
    2: 'pl-8',
    3: 'pl-12',
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

function WikiMenuItem({ title, icon, isActive, iconEnd }) {
    const iconClassName = isActive
        ? 'text-foreground'
        : 'text-secondary-foreground web:group-hover:text-foreground'
    const iconBackgroundClassName = isActive
        ? ' text-accent-foreground '
        : ' text-secondary-foreground '

    return (
        <Row className="min-h-9 px-3 items-center gap-3">
            <View className={`h-4 w-4 shrink-0 items-center justify-center rounded-full ${iconBackgroundClassName}`}>
                {isEmoji(icon) ? (
                    <Text className="text-xs leading-none">{icon}</Text>
                ) : (
                    <Icon icon={icon} size={20} className={iconClassName} />
                )}
            </View>

            <Text className={` flex-1 text-sm leading-4 font-medium ${isActive ? 'text-accent-foreground' : 'text-secondary-foreground web:group-hover:text-foreground'}`}>
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

function ActiveBranchExpander({ items, setExpandedMap }) {
    const currentPathComparable = useCurrentPathComparable();

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

function MenuWiki({ setPageData, block, url }) {
    const data = block.content[0].data;
    const currentPathComparable = useCurrentPathComparable();
    const initialPathComparable = normalizePathComparable(url);
    const topLevelItems = data?.content?.items || [];
    const [expandedMap, setExpandedMap] = useState(() => buildExpandedMapForPath(topLevelItems, initialPathComparable));

    const toggleExpanded = (id) => {
        setExpandedMap((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleMenuPress = async (itemPath) => {
        if (isWeb) {
            const currentPath = window.location.pathname
            if (currentPath !== itemPath) {
                window.history.pushState({}, '', itemPath)
            }
        }
        try {
            const sResponse = await getPageData(itemPath, false)
            setPageData({ data: sResponse.data, url: itemPath })
        } catch (error) {
            console.error('Failed to load wiki page:', error)
        }
    }



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
            const icon = item?.icon || 'Circle';
            const canNavigate = hasItemPath(item);
            const itemPathComparable = normalizePathComparable(itemPath);
            const isActive = Boolean(itemPathComparable && itemPathComparable === currentPathComparable);
            const menuIsActive = canNavigate ? isActive : false;
            const activeWrapperClassName = menuIsActive ? 'bg-accent/60 rounded-lg web:hover:bg-accent/90' : ' web:hover:bg-muted/50';

            const pressHandler = canNavigate
                ? () => handleMenuPress(itemPath)
                : hasChildren
                    ? () => toggleExpanded(itemId)
                    : undefined;
            const showChevron = !canNavigate && hasChildren;
            const menuIconEnd = showChevron ? (isExpanded ? 'ChevronDown' : 'ChevronRight') : null;

            return (
                <View key={`lmenu-${itemId}`} className={`w-full ${depthClassName}`}>
                    <Pressable
                        className={`web:group flex-1 rounded-lg ${activeWrapperClassName}`}
                        onPress={pressHandler}
                    >
                        <WikiMenuItem
                            title={title}
                            icon={icon}
                            isActive={menuIsActive}
                            iconEnd={menuIconEnd}
                        />
                    </Pressable>
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
            <ActiveBranchExpander items={topLevelItems} setExpandedMap={setExpandedMap} />
            <View className='w-full gap-1.5'>
                {renderItems(topLevelItems)}
            </View>
        </>
    );
}

function PageContentWiki({ data, url }) {
    const { t } = useTranslation()
    const isWeb = Platform.OS === 'web'
    const isDesktop = useIsDesktop()
    const setHeader = useSetHeader()
    const pathname = usePathname()
    const params = useGlobalSearchParams()
    const initialUrl = getRouteParam(params?.url) || url || pathname
    const [tocItems, setTocItems] = useState([])
    const centerContentRef = useRef(null)
    const [pageData, setPageData] = useState({ data, url: initialUrl })

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
    const showBothMobilePanels = showMobileLeftPanel && showMobileRightPanel && tocItems.length >= 2
    const handleTocPress = (id) => {
        if (!isWeb || !id) {
            return
        }

        const target = document.getElementById(id)
        if (!target) {
            return
        }

        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        window.history.replaceState(null, '', `#${id}`)
    }

    const onLayout = () => {
        if (isWeb) {
            setTimeout(() => window.dispatchEvent(new Event('resize_panel')), 100)
        }
    }

    useEffect(() => {
        if (isWeb) {
            groupRef.current?.setLayout([
                leftPanelProps.defaultSize,
                centerPanelProps.defaultSize,
                rightPanelProps.defaultSize
            ])
        }
    }, [currentBreakpointName, isWeb, leftPanelProps.defaultSize, centerPanelProps.defaultSize, rightPanelProps.defaultSize])

    const centerHtmlContent = pageData?.data?.elements?.cell_center?.[0]?.content?.[0]?.data?.content
    const leftMenu = pageData?.data?.elements?.cell_left?.[0]

    useEffect(() => {
        if (!isWeb) {
            setTocItems([])
            return
        }

        const root = centerContentRef.current
        if (!root) {
            setTocItems([])
            return
        }

        const seenIds = new Map()
        const headings = Array.from(root.querySelectorAll('h2, h3'))
        const items = headings
            .map((heading, index) => {
                const text = heading.textContent?.trim()
                if (!text) {
                    return null
                }

                const textBaseId = text
                    .toLowerCase()
                    .replace(/[^\w\s-]/g, '')
                    .trim()
                    .replace(/\s+/g, '-')

                const headingBaseId = String(heading.id || '').trim()
                const preferredBaseId = headingBaseId || textBaseId || 'section'
                const count = seenIds.get(preferredBaseId) || 0
                const uniqueId = count === 0 ? preferredBaseId : `${preferredBaseId}-${count + 1}`
                seenIds.set(preferredBaseId, count + 1)

                // Force unique id for React keys and reliable hash navigation.
                if (heading.id !== uniqueId) {
                    heading.id = uniqueId
                }

                return {
                    id: uniqueId,
                    key: `${uniqueId}-${index}`,
                    text,
                    level: Number(heading.tagName.slice(1))
                }
            })
            .filter(Boolean)

        setTocItems((prev) => {
            if (
                prev.length === items.length &&
                prev.every((prevItem, i) =>
                    prevItem.id === items[i]?.id &&
                    prevItem.key === items[i]?.key &&
                    prevItem.text === items[i]?.text &&
                    prevItem.level === items[i]?.level
                )
            ) {
                return prev;
            }
            return items
        })
    }, [isWeb, centerHtmlContent])

    const mobileHeaderControls = useMemo(() => {
        if (!showMobileLeftPanel && !(showMobileRightPanel && tocItems.length >= 2)) {
            return null
        }

        return (
            <View className="w-full py-2 ">
                <View className="flex-row flex-wrap gap-2">
                    {showMobileLeftPanel && (
                        <View className={`${showBothMobilePanels ? 'flex-1' : 'w-full'}`}>
                            <DropdownPopup
                                minPopupWidth={256}
                                contentClasses="rounded-xl border border-popover mt-2 bg-popover/60 backdrop-blur shadow-md"
                                buttonProps={{
                                    label: t('Navigation'),
                                    style: 'glass',
                                    controlSize: 'small',
                                    width: 'fill',
                                    image: 'Menu',
                                    borderShape: 'capsule',
                                }}
                            >
                                <View className="p-1">
                                    <MenuWiki setPageData={setPageData} block={leftMenu} url={pageData.url} />
                                </View>
                            </DropdownPopup>
                        </View>
                    )}
                    {showMobileRightPanel && tocItems.length >= 2 && (
                        <View className={`${showBothMobilePanels ? 'flex-1' : 'w-full'}`}>
                            <DropdownPopup
                                minPopupWidth={256}
                                contentClasses="rounded-xl border border-popover mt-2 bg-popover/60 backdrop-blur shadow-md"
                                buttonProps={{
                                    label: t('On this page'),
                                    style: 'glass',
                                    controlSize: 'small',
                                    width: 'fill',
                                    image: 'ScrollText',
                                    borderShape: 'capsule',
                                }}
                            >
                                <View className="p-1">
                                    <View className="gap-2">
                                        {tocItems.map((item) => (
                                            <Row key={`mobile-toc-${item.key}`} className={`items-center gap-2 ${item.level === 3 ? 'pl-4' : ''}`}>
                                                <Icon name={item.level === 2 ? 'List' : 'Minus'} size={14} className="text-muted-foreground" />
                                                <Pressable
                                                    onPress={() => handleTocPress(item.id)}
                                                    className="min-h-9 text-secondary-foreground flex-1 justify-center px-2 rounded-lg web:hover:bg-muted/50 web:hover:text-accent-foreground"
                                                >
                                                    <Text className="text-sm leading-tight native:text-secondary-foreground">
                                                        {item.text}
                                                    </Text>
                                                </Pressable>
                                            </Row>
                                        ))}
                                    </View>
                                </View>
                            </DropdownPopup>
                        </View>
                    )}
                </View>
            </View>
        )
    }, [showMobileLeftPanel, showMobileRightPanel, showBothMobilePanels, tocItems, t])

    useEffect(() => {
        if (isWeb) {
            setHeader(isDesktop ? defaultHeader : { subHeader: mobileHeaderControls });
        }
    }, [isDesktop, mobileHeaderControls, setHeader]);

    return (
        <View className={`${appSetting('layout', 'max_width')}`}>
            <PanelGroup
                ref={groupRef}
                key={`cells-wiki${cellsCustomConfig.sizable ? 'sizable' : 'static'}`}
                direction="horizontal"
                className={`mx-auto flex-auto relative flex-row`}
                onLayout={onLayout}
            >
                <Panel className={`hidden ${leftBreakpoint}:block ${currentBreakpointName}:w-full`} {...leftPanelProps}>
                    <View className={`fixed-process fixed-process-clamp p-4 ${appSetting('conductor', 'sidebar_container')}`}>
                        <View className="gap-3">
                            <BlockWrapper block={{ designbox_id: leftMenu.designbox_id, id: 'wiki-toc', title: leftMenu.title }}  >
                                <MenuWiki setPageData={setPageData} block={leftMenu} url={pageData.url} />
                            </BlockWrapper>
                        </View>
                    </View>
                </Panel>
                <PanelHandler gap={`hidden ${leftBreakpoint}:block`} sizable={cellsCustomConfig.sizable} />
                <Panel className={`native:w-full ${currentBreakpointName}:w-full`} {...centerPanelProps}>
                    <View ref={centerContentRef} className={`p-4 sm:p-6 xl:p-8 gap-3`}>
                        <Html data={centerHtmlContent} />
                    </View>
                </Panel>
                <PanelHandler gap={`hidden ${rightBreakpoint}:block`} sizable={cellsCustomConfig.sizable} />
                <Panel className={`hidden ${rightBreakpoint}:block ${currentBreakpointName}:w-full`} {...rightPanelProps}>
                    <View className="fixed-process fixed-process-clamp">
                        <BlockWrapper
                            showTitle={true}
                            block={{
                                id: 'wiki-toc',
                                title: t('On this page'),
                                designbox_id: 14
                            }}
                        >
                            <View className="gap-2">
                                {tocItems.length >= 2 && (
                                    tocItems.map((item) => (
                                        <Row key={`desktop-toc-${item.key}`} className={`items-center gap-2 ${item.level === 3 ? 'pl-4' : ''}`}>
                                            <Icon name={item.level === 2 ? 'List' : 'Minus'} size={14} className="text-muted-foreground" />
                                            <Pressable
                                                onPress={() => handleTocPress(item.id)}
                                                className="py-0.5"
                                            >
                                                <Text className="text-sm leading-tight   text-secondary-foreground web:group-hover:text-foreground">
                                                    {item.text}
                                                </Text>
                                            </Pressable>
                                        </Row>
                                    ))
                                )}
                            </View>
                        </BlockWrapper>
                    </View>
                </Panel>
            </PanelGroup>
        </View>
    )
}

export default function PageLayoutWiki({ data }) {
    return (
        <Page data={data}>
            <PageContentWiki data={data} />
            <View className="flex-1" />
            <MenuFooter />
        </Page>
    )
}
