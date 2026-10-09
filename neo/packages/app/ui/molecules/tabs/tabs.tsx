import {
    useState,
    useRef,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
} from 'react';
import { View, ScrollView, Platform, type LayoutChangeEvent } from 'react-native';
import { Text } from 'app/design/typography';
import * as TabsPrimitive from 'app/ui/primitives/tabs';
import { cn } from 'app/lib/util';
import { useTranslation } from 'react-i18next';
import DropdownMenu, { type DropdownMenuItemData } from 'app/ui/atoms/dropdown-menu';
import { Icon } from 'app/ui/atoms/icon';
import {
    tabsTheme,
    getTabsSizing,
    useTabsMoreMenu,
    getTabsBarLayout,
    getTabTextClass,
    hasTabContent,
    TabsMeasureRow,
} from 'app/ui/molecules/tabs/tabs-shared';
import type { TabItem, TabsProps } from './tabs.types';
import {
    TABS_UNDERLINE_HEIGHT_PX,
} from 'app/ui/molecules/tabs/tabs-selection-constants';
import { tabsDebug } from 'app/ui/molecules/tabs/tabs-debug';

/** Native: avoid synchronous layout+setState during the same commit as Fabric layout (use `useEffect` + rAF batching). Web: keep `useLayoutEffect` to avoid pill flicker. */
const useIsomorphicLayoutEffect =
    Platform.OS === 'web' ? useLayoutEffect : useEffect;

/** Underline height for the static (native scroll) line indicator. */
const staticLineStyle = { height: TABS_UNDERLINE_HEIGHT_PX };

type Layout = { x: number; y: number; width: number; height: number };
type IndicatorRect = { left: number; top: number; width: number; height: number };

/** RN layout often repeats with tiny float noise; always creating new objects in `onLayout` → `setState` re-renders forever. */
const LAYOUT_EPS = 0.5;

function isRnLayoutUnchanged(prev: Layout | undefined, next: Layout) {
    if (!prev || !next) return false;
    return (
        Math.abs(prev.x - next.x) < LAYOUT_EPS &&
        Math.abs(prev.y - next.y) < LAYOUT_EPS &&
        Math.abs(prev.width - next.width) < LAYOUT_EPS &&
        Math.abs(prev.height - next.height) < LAYOUT_EPS
    );
}

function isIndicatorUnchanged(prev: IndicatorRect, next: IndicatorRect) {
    return (
        Math.abs(prev.left - next.left) < LAYOUT_EPS &&
        Math.abs(prev.top - next.top) < LAYOUT_EPS &&
        Math.abs(prev.width - next.width) < LAYOUT_EPS &&
        Math.abs(prev.height - next.height) < LAYOUT_EPS
    );
}

/** Whole pixels — avoids subpixel layout ↔ indicator sync loops on Fabric. */
function normalizeRnLayout(layout: Layout): Layout {
    return {
        x: Math.round(layout.x),
        y: Math.round(layout.y),
        width: Math.round(layout.width),
        height: Math.round(layout.height),
    };
}

/**
 * Segmented tab bar (native; web is tabs.web.tsx). Styles come from `theme.tabs_variants`
 * (settings/theme/tabs.js): `variant="default"` is a flat segmented control, `"glass"` NeoButton
 * glass, `"secondary"` an underline. Props are documented in tabs.types.ts.
 */
export default function Tabs({
    tabs,
    activeTab,
    equalWidth,
    fullWidth,
    variant = 'default',
    rounded = false,
    hug = false,
    overflow = 'scroll',
    moreMenuTitle,
    moreLabel,
    moreMenuIcon = 'ChevronDown',
    size,
    contentClassName = '',
    trackClassName,
    pillClassName,
    headerClassName,
    tabBarClassName,
    listWrapperClassName,
    listClassName,
    triggerClassName,
    onTabChange,
    disableScrollIntoView = false,
}: TabsProps) {
    /** `fullWidth` is deprecated — same as `equalWidth` (first wins if both are set). */
    const useEqualWidth = equalWidth ?? fullWidth ?? false;
    /**
     * Native horizontal scroll: the absolute pill + onLayout→setState sync can hang Fabric after tab
     * changes even when React only re-renders twice (see __NEO_TABS_DEBUG__). Rely on trigger active styles only.
     * Collapse / web keep the selection layer.
     */
    const nativeScrollSkipIndicator =
        Platform.OS !== 'web' && overflow === 'scroll';
    const { t } = useTranslation();
    const resolvedMoreMenuTitle = moreMenuTitle ?? moreLabel ?? t('More');
    const [currentTab, setCurrentTab] = useState(
        () => activeTab ?? tabs?.[0]?.key
    );
    /** Parent often passes a new `tabs` array each render; never key `useCallback`/`useLayoutEffect` off that reference. */
    // "Latest value" refs are written in a layout effect (not during render — React
    // Compiler rule) so they are current before any layout effect / callback below.
    const tabsRef = useRef(tabs);
    useIsomorphicLayoutEffect(() => {
        tabsRef.current = tabs;
    });

    const onTabChangeRef = useRef(onTabChange);
    useIsomorphicLayoutEffect(() => {
        onTabChangeRef.current = onTabChange;
    });

    const renderDiagRef = useRef(0);
    useIsomorphicLayoutEffect(() => {
        if (!__DEV__ || !(globalThis as { __NEO_TABS_DEBUG__?: boolean }).__NEO_TABS_DEBUG__) return;
        renderDiagRef.current += 1;
        tabsDebug('render', {
            n: renderDiagRef.current,
            currentTab,
            overflow,
            disableScrollIntoView,
            nativeScrollSkipIndicator,
        });
    });

    /** Layout of `TabsPrimitive.List` relative to the header row (same coords as the selection layer). */
    const listLayoutRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
    /** Per-tab `Pressable` layout relative to the list — avoids `measureLayout`, which can hang on Fabric. */
    const triggerLayoutsRef = useRef<Record<string, Layout>>({});
    /** "More" row view — `onLayout` is not relative to the tab list (Dropdown wraps the trigger). */
    const moreViewRef = useRef<View | null>(null);
    const currentTabRef = useRef(currentTab);
    useIsomorphicLayoutEffect(() => {
        currentTabRef.current = currentTab;
    });

    const headerRowLayoutRef = useRef<View | null>(null);
    const scrollViewRef = useRef<ScrollView | null>(null);
    const scrollXRef = useRef(0);
    const scrollViewWidthRef = useRef(0);
    const skipFirstScrollIntoViewRef = useRef(true);

    const [indicatorLayout, setIndicatorLayout] = useState<IndicatorRect>({
        left: 0,
        top: 0,
        width: 0,
        height: 0,
    });
    const {
        currentSizeKey,
        sizeCfg,
        variantCfg,
        indicator,
        radiusTrack,
        radiusRow,
        radiusPill,
        gapPx,
        listHorizontalPad,
        scrollInset,
        moreIconSize,
    } = getTabsSizing({ size, variant, rounded });
    const variantCfgRef = useRef(variantCfg);
    useIsomorphicLayoutEffect(() => {
        variantCfgRef.current = variantCfg;
    });

    const {
        collapseLayout,
        moreMenuOpen,
        setMoreMenuOpen,
        overflowMenuItems,
        markMenuSelect,
    } = useTabsMoreMenu({
        overflow,
        tabs,
        gapPx,
        listHorizontalPad,
        equalWidth: useEqualWidth && !hug,
        currentTab,
    });

    useEffect(() => {
        if (activeTab !== undefined) setCurrentTab(activeTab);
    }, [activeTab]);

    const syncIndicatorLayout = useCallback(() => {
        if (nativeScrollSkipIndicator) return;
        if (!variantCfgRef.current) return;
        const tabKey = currentTabRef.current;
        const list = listLayoutRef.current;

        const applyFromRect = (leftInHeader: number, topInHeader: number, width: number, height: number) => {
            const l = Math.round(leftInHeader);
            const t0 = Math.round(topInHeader);
            const w = Math.round(width);
            const rawH = Math.round(height);
            let top;
            let h;
            if (indicator === 'line') {
                top = t0 + rawH - TABS_UNDERLINE_HEIGHT_PX;
                h = TABS_UNDERLINE_HEIGHT_PX;
            } else {
                top = t0;
                h = rawH;
            }
            setIndicatorLayout((prev) => {
                const next = {
                    left: l,
                    top,
                    width: w,
                    height: h,
                };
                return isIndicatorUnchanged(prev, next) ? prev : next;
            });
        };

        if (overflow === 'collapse' && tabKey) {
            const idx = (tabsRef.current ?? []).findIndex((t) => t.key === tabKey);
            const inOverflow = idx >= 0 && idx >= collapseLayout.visibleCount;
            if (inOverflow) {
                const headerNode = headerRowLayoutRef.current;
                const moreNode = moreViewRef.current;
                if (!headerNode || !moreNode) return;
                /** Window-space rects — avoids `measureLayout` (Fabric) and wrong parent in onLayout (Dropdown wraps trigger). */
                moreNode.measureInWindow((mx, my, mw, mh) => {
                    headerNode.measureInWindow((hx, hy) => {
                        applyFromRect(mx - hx, my - hy, mw, mh);
                    });
                });
                return;
            }
        }

        if (!list || list.width <= 0) return;

        const triggerL = tabKey ? triggerLayoutsRef.current[tabKey] : undefined;
        if (!triggerL) return;

        applyFromRect(
            list.x + triggerL.x,
            list.y + triggerL.y,
            triggerL.width,
            triggerL.height
        );
    }, [
        indicator,
        overflow,
        collapseLayout.visibleCount,
        nativeScrollSkipIndicator,
    ]);

    const syncIndicatorLayoutRef = useRef(syncIndicatorLayout);
    useIsomorphicLayoutEffect(() => {
        syncIndicatorLayoutRef.current = syncIndicatorLayout;
    });

    /** Coalesce native indicator sync to one rAF — avoids layout↔setState reentrancy on Fabric when many triggers fire onLayout after a selection change. */
    const indicatorRafRef = useRef<number | null>(null);
    const indicatorSyncPendingRef = useRef(false);

    const scheduleIndicatorSync = useCallback((source: string) => {
        if (nativeScrollSkipIndicator) return;
        tabsDebug('schedule', { source });
        const flush = () => {
            indicatorRafRef.current = null;
            indicatorSyncPendingRef.current = false;
            tabsDebug('syncFlush', { source });
            syncIndicatorLayoutRef.current();
        };
        if (Platform.OS === 'web') {
            flush();
            return;
        }
        if (indicatorSyncPendingRef.current) return;
        indicatorSyncPendingRef.current = true;
        indicatorRafRef.current = requestAnimationFrame(flush);
    }, [nativeScrollSkipIndicator]);

    useEffect(
        () => () => {
            if (indicatorRafRef.current != null) {
                cancelAnimationFrame(indicatorRafRef.current);
                indicatorRafRef.current = null;
            }
            indicatorSyncPendingRef.current = false;
        },
        []
    );

    const onListLayout = useCallback(
        (e: LayoutChangeEvent) => {
            const layout = normalizeRnLayout(e.nativeEvent.layout);
            if (isRnLayoutUnchanged(listLayoutRef.current, layout)) return;
            listLayoutRef.current = layout;
            if (!nativeScrollSkipIndicator) scheduleIndicatorSync('list');
        },
        [scheduleIndicatorSync, nativeScrollSkipIndicator]
    );

    const onTriggerLayout = useCallback(
        (tabKey: string) => (e: LayoutChangeEvent) => {
            const layout = normalizeRnLayout(e.nativeEvent.layout);
            const prev = triggerLayoutsRef.current[tabKey];
            if (isRnLayoutUnchanged(prev, layout)) return;
            triggerLayoutsRef.current[tabKey] = layout;
            if (!nativeScrollSkipIndicator)
                scheduleIndicatorSync(`trigger:${tabKey}`);
        },
        [scheduleIndicatorSync, nativeScrollSkipIndicator]
    );

    const onMoreLayout = collapseLayout.onMoreLayout;
    const onMoreLayoutForTabs = useCallback(
        (e: LayoutChangeEvent) => {
            onMoreLayout(e);
            if (!nativeScrollSkipIndicator) scheduleIndicatorSync('more');
        },
        [onMoreLayout, scheduleIndicatorSync, nativeScrollSkipIndicator]
    );

    /**
     * Tab selection must always run sync (not merged into the rAF queue with onLayout), or we can skip
     * positioning when `pending` was set by a stale layout pass before styles update.
     */
    useIsomorphicLayoutEffect(() => {
        if (nativeScrollSkipIndicator) return;
        tabsDebug('syncImmediate', { reason: 'currentTab' });
        syncIndicatorLayoutRef.current();
    }, [currentTab, nativeScrollSkipIndicator]);

    const scrollActiveTabIntoView = useCallback(() => {
        if (overflow === 'collapse') return;
        const triggerL = currentTab ? triggerLayoutsRef.current[currentTab] : undefined;
        const list = listLayoutRef.current;
        const scrollView = scrollViewRef.current;
        if (!triggerL || !list || !scrollView) return;

        const padding = scrollInset;
        const vw = scrollViewWidthRef.current;
        if (!vw) return;
        const scrollX = scrollXRef.current;
        const absX = list.x + triggerL.x;
        const width = triggerL.width;
        const right = absX + width;
        const viewportRight = scrollX + vw;

        let targetX = scrollX;
        if (absX < scrollX + padding) {
            targetX = Math.max(0, absX - padding);
        } else if (right > viewportRight - padding) {
            targetX = Math.max(0, right - vw + padding);
        }
        if (Math.abs(targetX - scrollX) > 0.5) {
            scrollView.scrollTo({
                x: targetX,
                animated: Platform.OS === 'web',
            });
        }
    }, [currentTab, scrollInset, overflow]);

    useEffect(() => {
        if (overflow === 'collapse') return;
        if (disableScrollIntoView) return;
        if (skipFirstScrollIntoViewRef.current) {
            skipFirstScrollIntoViewRef.current = false;
            return;
        }
        const timer = setTimeout(() => scrollActiveTabIntoView(), 50);
        return () => clearTimeout(timer);
    }, [
        currentTab,
        scrollActiveTabIntoView,
        overflow,
        disableScrollIntoView,
    ]);

    /** Theme `u-controls-tabs-selection-layer`: absolute + pointer-events-none + z-1 */
    const selectionStyle = useMemo(
        () => ({
            position: 'absolute' as const,
            left: indicatorLayout.left,
            top: indicatorLayout.top,
            width: indicatorLayout.width,
            height: indicatorLayout.height,
            zIndex: 1,
        }),
        [indicatorLayout]
    );

    /** Stable identity for `TabsPrimitive.Root` — unstable parent `onTabChange` must not recreate context every render. */
    const handleTabChange = useCallback((value: string) => {
        tabsDebug('press', { from: currentTabRef.current, to: value });
        setCurrentTab(value);
        /** Defer sound/haptics so they do not run in the same sync stack as the press → commit (reduces native stalls). */
        const cb = onTabChangeRef.current;
        if (cb) queueMicrotask(() => cb(value));
    }, []);

    const handleOverflowMenuSelect = useCallback(
        (item: DropdownMenuItemData) => {
            markMenuSelect();
            handleTabChange(String(item.id));
        },
        [handleTabChange, markMenuSelect]
    );

    if (!tabs || tabs.length === 0) {
        return null;
    }

    const tabStretch =
        useEqualWidth && !hug
            ? /* min-w-min: never shrink below label + horizontal padding (min-w-0 was eating padding on long titles) */
              'flex-1 min-w-min basis-0 justify-center'
            : cn('shrink-0 flex-none');
    const { moreIsActive, moreTriggerEndAlign, collapseHugStrip, tabBarWidthClass } =
        getTabsBarLayout({ overflow, hug, equalWidth: useEqualWidth, collapseLayout, currentTab });

    /**
     * Native scroll mode has no sliding layer (see `nativeScrollSkipIndicator`), so the
     * active trigger draws the indicator itself: the pill as its own surface, the line
     * as a child on its bottom edge.
     */
    const staticPill =
        nativeScrollSkipIndicator && indicator === 'pill'
            ? cn(variantCfg.pill, pillClassName)
            : '';
    const staticLine =
        nativeScrollSkipIndicator && indicator === 'line'
            ? cn('absolute left-0 right-0 bottom-0 rounded-full', variantCfg.line, pillClassName)
            : '';

    const trackView = (
        <View
            className={cn(
                variantCfg.track,
                radiusTrack,
                trackClassName
            )}
        />
    );
    const selectionLayer = (
        <View
            style={selectionStyle}
            pointerEvents="none"
            collapsable={false}
        >
            {indicator === 'pill' ? (
                <View
                    className={cn(
                        'absolute inset-0',
                        radiusPill,
                        variantCfg.pill,
                        pillClassName
                    )}
                />
            ) : (
                <View
                    className={cn(
                        'absolute inset-0',
                        sizeCfg.indicator_inner,
                        variantCfg.line,
                        pillClassName
                    )}
                />
            )}
        </View>
    );

    const collapseListInner = (
        <>
            <TabsMeasureRow
                key={collapseLayout.measureKey}
                ViewComponent={View}
                tabs={tabs}
                collapseLayout={collapseLayout}
                variantCfg={variantCfg}
                radiusRow={radiusRow}
                radiusPill={radiusPill}
                sizeCfg={sizeCfg}
                tabStretch={tabStretch}
                equalWidth={useEqualWidth}
                hug={hug}
            />

            {!nativeScrollSkipIndicator && selectionLayer}

            <TabsPrimitive.List
                onLayout={onListLayout}
                className={cn(
                    tabsTheme['u-controls-tabs-header-row'],
                    variantCfg.row,
                    radiusRow,
                    sizeCfg.header,
                    'flex flex-row flex-1 min-w-0 overflow-hidden flex-nowrap',
                    hug
                        ? 'w-max !flex-none shrink-0'
                        : 'w-full !flex-none shrink-0',
                    collapseLayout.overflowTabs.length > 0
                        ? 'justify-start items-stretch'
                        : hug
                          ? 'w-max justify-start self-start'
                          : useEqualWidth
                            ? 'w-full min-w-full'
                            : 'w-max min-w-full',
                    'relative z-20',
                    listClassName
                )}
            >
                {collapseLayout.visibleTabs.map((tab: TabItem) => (
                    <TabsPrimitive.Trigger
                        key={tab.key}
                        value={tab.key}
                        onLayout={onTriggerLayout(tab.key)}
                        className={cn(
                            tabsTheme['u-controls-tabs-header-item'],
                            sizeCfg.item,
                            radiusPill,
                            tabStretch,
                            'relative z-30',
                            tab.key === currentTab
                                ? variantCfg.trigger_active
                                : variantCfg.trigger_inactive,
                            triggerClassName
                        )}
                    >
                        {({ isSelected }) => (
                            <Text
                                className={getTabTextClass(isSelected, sizeCfg, variantCfg)}
                            >
                                {tab.title}
                            </Text>
                        )}
                    </TabsPrimitive.Trigger>
                ))}
                {collapseLayout.overflowTabs.length > 0 && (
                    <DropdownMenu
                        mode="popup"
                        variant="tabs-overflow"
                        tabsOverflowSize={currentSizeKey}
                        openOnFocus={Platform.OS === 'web'}
                        open={moreMenuOpen}
                        onOpenChange={setMoreMenuOpen}
                        items={overflowMenuItems}
                        onSelect={handleOverflowMenuSelect}
                    >
                        <View
                            ref={moreViewRef}
                            onLayout={onMoreLayoutForTabs}
                            collapsable={
                                Platform.OS === 'android'
                                    ? false
                                    : undefined
                            }
                            className={cn(
                                tabsTheme['u-controls-tabs-header-item'],
                                sizeCfg.item,
                                radiusPill,
                                'shrink-0 flex-none flex-row items-center justify-center gap-1',
                                'relative z-30',
                                moreTriggerEndAlign && 'ml-auto',
                                moreIsActive
                                    ? variantCfg.trigger_active
                                    : variantCfg.trigger_inactive,
                                triggerClassName
                            )}
                        >
                            {resolvedMoreMenuTitle ? (
                                <Text
                                    className={getTabTextClass(moreIsActive, sizeCfg, variantCfg)}
                                >
                                    {resolvedMoreMenuTitle}
                                </Text>
                            ) : null}
                            <Icon
                                icon={moreMenuIcon}
                                size={moreIconSize}
                                className={getTabTextClass(moreIsActive, sizeCfg, variantCfg)}
                            />
                        </View>
                    </DropdownMenu>
                )}
                {collapseLayout.overflowTabs.map((tab: TabItem) => (
                    <TabsPrimitive.Trigger
                        key={tab.key}
                        value={tab.key}
                        onLayout={onTriggerLayout(tab.key)}
                        className="sr-only absolute h-px w-px overflow-hidden opacity-0 pointer-events-none"
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                    >
                        {({ isSelected }) => (
                            <Text
                                className={getTabTextClass(isSelected, sizeCfg, variantCfg)}
                            >
                                {tab.title}
                            </Text>
                        )}
                    </TabsPrimitive.Trigger>
                ))}
            </TabsPrimitive.List>
        </>
    );

    return (
        <TabsPrimitive.Root
            value={currentTab}
            onValueChange={handleTabChange}
            className={cn(tabsTheme['u-controls-tabs-container'], headerClassName)}
        >
            <View
                className={cn(
                    'relative min-w-0',
                    tabBarWidthClass,
                    overflow !== 'collapse' && tabBarClassName
                )}
            >
                {/* Track fills tab bar (in collapse+hug it lives inside the w-max strip). It sits outside the clipping box so its outer shadow (glass ring + drop) is not cut off. */}
                {!collapseHugStrip && trackView}
                <View
                    className={cn(
                        // Clips the row to the track's corners. In collapse + hug the track and its own
                        // clip live in the w-max strip below; clipping here would cut the track's shadow.
                        'relative min-w-0 w-full',
                        !collapseHugStrip && cn('overflow-hidden', radiusTrack)
                    )}
                >
                    {overflow === 'collapse' ? (
                        <View
                            ref={(node) => {
                                collapseLayout.setContainerRef(node);
                            }}
                            onLayout={collapseLayout.onContainerLayout}
                            className={cn(
                                'relative z-10 w-full min-w-0',
                                tabBarClassName
                            )}
                        >
                            {collapseHugStrip ? (
                                <View className="relative min-w-0 w-max max-w-full self-start">
                                    {trackView}
                                    <View
                                        className={cn(
                                            'relative min-w-0 w-full overflow-hidden',
                                            radiusTrack
                                        )}
                                    >
                                        <View
                                            ref={headerRowLayoutRef}
                                            collapsable={
                                                Platform.OS === 'android'
                                                    ? false
                                                    : undefined
                                            }
                                            className={cn(
                                                'relative web:isolate min-w-0 w-full',
                                                listWrapperClassName
                                            )}
                                        >
                                            {collapseListInner}
                                        </View>
                                    </View>
                                </View>
                            ) : (
                                <View
                                    ref={headerRowLayoutRef}
                                    collapsable={
                                        Platform.OS === 'android'
                                            ? false
                                            : undefined
                                    }
                                    className={cn(
                                        'relative web:isolate min-w-0 w-full',
                                        listWrapperClassName
                                    )}
                                >
                                    {collapseListInner}
                                </View>
                            )}
                        </View>
                    ) : (
                        <ScrollView
                            ref={scrollViewRef}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            nestedScrollEnabled
                            keyboardShouldPersistTaps="handled"
                            scrollEventThrottle={16}
                            className="relative z-10 w-full max-w-full"
                            onLayout={(e) => {
                                scrollViewWidthRef.current =
                                    e.nativeEvent.layout.width;
                            }}
                            onScroll={(e) => {
                                scrollXRef.current =
                                    e.nativeEvent.contentOffset.x;
                            }}
                            contentContainerStyle={{
                                flexGrow: 0,
                                flexDirection: 'row',
                                alignItems: 'stretch',
                                ...(hug ? { alignSelf: 'flex-start' } : {}),
                            }}
                        >
                            <View
                                ref={headerRowLayoutRef}
                                collapsable={
                                    Platform.OS === 'android' ? false : undefined
                                }
                                className={cn(
                                    'relative web:isolate',
                                    hug
                                        ? 'w-max self-start'
                                        : 'min-w-full w-max',
                                    listWrapperClassName
                                )}
                            >
                                {!nativeScrollSkipIndicator && selectionLayer}

                                <TabsPrimitive.List
                                    onLayout={onListLayout}
                                    className={cn(
                                        tabsTheme['u-controls-tabs-header-row'],
                                        variantCfg.row,
                                        radiusRow,
                                        sizeCfg.header,
                                        '!flex-none shrink-0 min-w-0',
                                        hug
                                            ? 'w-max justify-start self-start'
                                            : useEqualWidth
                                              ? 'w-full min-w-full'
                                              : 'w-max min-w-full',
                                        'relative z-20',
                                        listClassName
                                    )}
                                >
                                    {tabs.map((tab) => (
                                        <TabsPrimitive.Trigger
                                            key={tab.key}
                                            value={tab.key}
                                            onLayout={onTriggerLayout(tab.key)}
                                            className={cn(
                                                tabsTheme[
                                                    'u-controls-tabs-header-item'
                                                ],
                                                sizeCfg.item,
                                                radiusPill,
                                                tabStretch,
                                                'relative z-30',
                                                tab.key === currentTab
                                                    ? variantCfg.trigger_active
                                                    : variantCfg.trigger_inactive,
                                                staticPill &&
                                                    tab.key === currentTab &&
                                                    staticPill,
                                                triggerClassName
                                            )}
                                        >
                                            {({ isSelected }) => (
                                                <>
                                                    <Text
                                                        className={getTabTextClass(isSelected, sizeCfg, variantCfg)}
                                                    >
                                                        {tab.title}
                                                    </Text>
                                                    {staticLine && isSelected ? (
                                                        <View
                                                            pointerEvents="none"
                                                            className={staticLine}
                                                            style={staticLineStyle}
                                                        />
                                                    ) : null}
                                                </>
                                            )}
                                        </TabsPrimitive.Trigger>
                                    ))}
                                </TabsPrimitive.List>
                            </View>
                        </ScrollView>
                    )}
                </View>
            </View>

            {tabs.filter(hasTabContent).map((tab) => (
                <TabsPrimitive.Content
                    key={tab.key}
                    value={tab.key}
                    className={cn(
                        tabsTheme['u-controls-tabs-tab-content'],
                        contentClassName
                    )}
                >
                    {tab.content}
                </TabsPrimitive.Content>
            ))}
        </TabsPrimitive.Root>
    );
}