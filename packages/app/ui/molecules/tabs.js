import {
    useState,
    useRef,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
} from 'react';
import { View, ScrollView, Platform } from 'react-native';
import { Text } from 'app/design/typography';
import * as TabsPrimitive from 'app/ui/primitives/tabs';
import { appSetting } from 'app/lib/util';
import { cn } from 'app/lib/util';
import { useTranslation } from 'react-i18next';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { Icon } from 'app/ui/atoms/icon';
import { useTabsCollapseLayout } from 'app/ui/molecules/use-tabs-collapse-layout';
import {
    TABS_SCROLL_INTO_VIEW_PADDING_PX,
    TABS_UNDERLINE_HEIGHT_PX,
} from 'app/ui/molecules/tabs-selection-constants';
import { tabsDebug } from 'app/ui/molecules/tabs-debug';

/** Native: avoid synchronous layout+setState during the same commit as Fabric layout (use `useEffect` + rAF batching). Web: keep `useLayoutEffect` to avoid pill flicker. */
const useIsomorphicLayoutEffect =
    Platform.OS === 'web' ? useLayoutEffect : useEffect;

const tabsTheme = appSetting('theme', 'tabs');
const tabsSizes = appSetting('theme', 'tabs_sizes');
const rawTabsVariants = appSetting('theme', 'tabs_variants');
const tabsVariants =
    rawTabsVariants && typeof rawTabsVariants === 'object'
        ? rawTabsVariants
        : {};

/** RN layout often repeats with tiny float noise; always creating new objects in `onLayout` → `setState` re-renders forever. */
const LAYOUT_EPS = 0.5;

function isRnLayoutUnchanged(prev, next) {
    if (!prev || !next) return false;
    return (
        Math.abs(prev.x - next.x) < LAYOUT_EPS &&
        Math.abs(prev.y - next.y) < LAYOUT_EPS &&
        Math.abs(prev.width - next.width) < LAYOUT_EPS &&
        Math.abs(prev.height - next.height) < LAYOUT_EPS
    );
}

function isIndicatorUnchanged(prev, next) {
    return (
        Math.abs(prev.left - next.left) < LAYOUT_EPS &&
        Math.abs(prev.top - next.top) < LAYOUT_EPS &&
        Math.abs(prev.width - next.width) < LAYOUT_EPS &&
        Math.abs(prev.height - next.height) < LAYOUT_EPS
    );
}

/** Whole pixels — avoids subpixel layout ↔ indicator sync loops on Fabric. */
function normalizeRnLayout(layout) {
    return {
        x: Math.round(layout.x),
        y: Math.round(layout.y),
        width: Math.round(layout.width),
        height: Math.round(layout.height),
    };
}

/**
 * @param {Array} tabs - { key, title, content }
 * @param {string} [activeTab]
 * @param {boolean} [equalWidth] — When true (and `hug` is false), tabs share extra space equally; each tab keeps at least `min-content` width (label + padding), never shrinking below that.
 * @param {boolean} [fullWidth] — Deprecated: use `equalWidth` instead (same behavior).
 * @param {'default'|'secondary'} [variant]
 * @param {string} [size] sm | md | lg
 * @param {string} [contentClassName]
 * @param {string} [trackClassName]
 * @param {string} [headerClassName] — classes on `Tabs` root (container)
 * @param {string} [tabBarClassName] — Bar wrapper: with `overflow="scroll"`, outer tab bar; with `overflow="collapse"`, the full-width measure row — use `flex flex-row justify-center` (web) / `flex-row justify-center` (native) to center a `hug` strip in the parent.
 * @param {string} [listWrapperClassName] — inner box that contains track + list (e.g. `mx-auto` with `hug`)
 * @param {string} [listClassName] — `TabsList` row only (e.g. `gap-1`, `justify-center`)
 * @param {string} [triggerClassName] — each tab trigger only (e.g. `mx-1`); does not affect tab panel content
 * @param {boolean} [rounded] — pill/track/row use `rounded-full`; when false, radii come from `tabs_sizes` (track, row, pill)
 * @param {boolean} [hug] — triggers only as wide as labels (no equal flex stretch). Combine with `equalWidth={false}` so the strip does not span the parent.
 * @param {'scroll'|'collapse'} [overflow] — `scroll`: horizontal scroll (default). `collapse`: overflow tabs move into a "More" menu.
 * @param {string} [moreMenuTitle] — label for the overflow trigger (default: translated "More"). Pass `""` for icon-only.
 * @param {string} [moreLabel] — alias for `moreMenuTitle` (deprecated).
 * @param {string} [moreMenuIcon] — Lucide icon name for the overflow trigger (default: `ChevronDown`).
 * @param {(key: string) => void} [onTabChange] — fired after the user selects a tab (new tab key).
 * @param {boolean} [disableScrollIntoView] — When true, skip horizontal scroll-to-active-tab after selection (useful on native if scroll fights layout).
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
    headerClassName,
    tabBarClassName,
    listWrapperClassName,
    listClassName,
    triggerClassName,
    onTabChange,
    disableScrollIntoView = false,
}) {
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
    const tabsRef = useRef(tabs);
    tabsRef.current = tabs;

    const onTabChangeRef = useRef(onTabChange);
    onTabChangeRef.current = onTabChange;

    const renderDiagRef = useRef(0);
    if (__DEV__ && globalThis.__NEO_TABS_DEBUG__) {
        renderDiagRef.current += 1;
        tabsDebug('render', {
            n: renderDiagRef.current,
            currentTab,
            overflow,
            disableScrollIntoView,
            nativeScrollSkipIndicator,
        });
    }

    /** Layout of `TabsPrimitive.List` relative to the header row (same coords as the selection layer). */
    const listLayoutRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
    /** Per-tab `Pressable` layout relative to the list — avoids `measureLayout`, which can hang on Fabric. */
    const triggerLayoutsRef = useRef({});
    /** "More" row view — `onLayout` is not relative to the tab list (Dropdown wraps the trigger). */
    const moreViewRef = useRef(null);
    const currentTabRef = useRef(currentTab);
    currentTabRef.current = currentTab;

    const headerRowLayoutRef = useRef(null);
    const scrollViewRef = useRef(null);
    const scrollXRef = useRef(0);
    const scrollViewWidthRef = useRef(0);
    const skipFirstScrollIntoViewRef = useRef(true);

    const [indicatorLayout, setIndicatorLayout] = useState({
        left: 0,
        top: 0,
        width: 0,
        height: 0,
    });
    const currentSizeKey = size || tabsSizes?.default_size || 'md';
    const sizeCfg = tabsSizes?.[currentSizeKey] || tabsSizes?.md || {};
    const variantCfg =
        tabsVariants[variant] || tabsVariants.default || tabsVariants.secondary;
    const variantCfgRef = useRef(variantCfg);
    variantCfgRef.current = variantCfg;

    /** Secondary uses a bottom line, not a pill — rounding on outer track/row clips the indicator. */
    const radiusTrack =
        variant === 'secondary'
            ? ''
            : rounded
              ? 'rounded-full'
              : sizeCfg.track || 'rounded-xl';
    const radiusRow =
        variant === 'secondary'
            ? ''
            : rounded
              ? 'rounded-full'
              : sizeCfg.row || 'rounded-xl';
    const radiusPill = rounded
        ? 'rounded-full overflow-hidden'
        : sizeCfg.pill || 'rounded-lg overflow-hidden';

    const gapPx = sizeCfg.gap_px ?? 4;
    const listHorizontalPad =
        2 * (sizeCfg.scroll_inset ?? TABS_SCROLL_INTO_VIEW_PADDING_PX);
    const collapseLayout = useTabsCollapseLayout({
        overflow,
        tabs,
        gapPx,
        contentPaddingHorizontal:
            overflow === 'collapse' ? listHorizontalPad : 0,
        equalWidth: useEqualWidth && !hug,
    });
    /** After picking a tab from the "More" menu, skip auto-reopen (effect would see overflow active and open again). */
    const moreMenuDismissAfterMenuSelectRef = useRef(false);

    const [moreMenuOpen, setMoreMenuOpen] = useState(false);
    useEffect(() => {
        if (overflow !== 'collapse') return;
        if (!collapseLayout.overflowTabs?.length) {
            setMoreMenuOpen(false);
            return;
        }
        if (moreMenuDismissAfterMenuSelectRef.current) {
            moreMenuDismissAfterMenuSelectRef.current = false;
            setMoreMenuOpen(false);
            return;
        }
        if (collapseLayout.isActiveInOverflow(currentTab)) {
            /**
             * Native `DropdownMenu` uses a full-screen `Modal` + backdrop. Auto-opening it here made the
             * whole screen non-interactive (and could fight layout) whenever the active tab lived in overflow.
             * Web keeps open-on-overflow for keyboard/focus parity.
             */
            if (Platform.OS === 'web') {
                setMoreMenuOpen(true);
            } else {
                setMoreMenuOpen(false);
            }
        } else {
            setMoreMenuOpen(false);
        }
    }, [
        overflow,
        currentTab,
        collapseLayout.visibleCount,
        collapseLayout.overflowTabs.length,
    ]);

    useEffect(() => {
        if (activeTab !== undefined) setCurrentTab(activeTab);
    }, [activeTab]);

    const syncIndicatorLayout = useCallback(() => {
        if (nativeScrollSkipIndicator) return;
        if (!variantCfgRef.current) return;
        const tabKey = currentTabRef.current;
        const list = listLayoutRef.current;

        const applyFromRect = (leftInHeader, topInHeader, width, height) => {
            const l = Math.round(leftInHeader);
            const t0 = Math.round(topInHeader);
            const w = Math.round(width);
            const rawH = Math.round(height);
            let top;
            let h;
            if (variant === 'secondary') {
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

        const triggerL = triggerLayoutsRef.current[tabKey];
        if (!triggerL) return;

        applyFromRect(
            list.x + triggerL.x,
            list.y + triggerL.y,
            triggerL.width,
            triggerL.height
        );
    }, [
        variant,
        overflow,
        collapseLayout.visibleCount,
        nativeScrollSkipIndicator,
    ]);

    const syncIndicatorLayoutRef = useRef(syncIndicatorLayout);
    syncIndicatorLayoutRef.current = syncIndicatorLayout;

    /** Coalesce native indicator sync to one rAF — avoids layout↔setState reentrancy on Fabric when many triggers fire onLayout after a selection change. */
    const indicatorRafRef = useRef(null);
    const indicatorSyncPendingRef = useRef(false);

    const scheduleIndicatorSync = useCallback((source) => {
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
        (e) => {
            const layout = normalizeRnLayout(e.nativeEvent.layout);
            if (isRnLayoutUnchanged(listLayoutRef.current, layout)) return;
            listLayoutRef.current = layout;
            if (!nativeScrollSkipIndicator) scheduleIndicatorSync('list');
        },
        [scheduleIndicatorSync, nativeScrollSkipIndicator]
    );

    const onTriggerLayout = useCallback(
        (tabKey) => (e) => {
            const layout = normalizeRnLayout(e.nativeEvent.layout);
            const prev = triggerLayoutsRef.current[tabKey];
            if (isRnLayoutUnchanged(prev, layout)) return;
            triggerLayoutsRef.current[tabKey] = layout;
            if (!nativeScrollSkipIndicator)
                scheduleIndicatorSync(`trigger:${tabKey}`);
        },
        [scheduleIndicatorSync, nativeScrollSkipIndicator]
    );

    const onMoreLayoutForTabs = useCallback(
        (e) => {
            collapseLayout.onMoreLayout(e);
            if (!nativeScrollSkipIndicator) scheduleIndicatorSync('more');
        },
        [
            collapseLayout.onMoreLayout,
            scheduleIndicatorSync,
            nativeScrollSkipIndicator,
        ]
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
        const triggerL = triggerLayoutsRef.current[currentTab];
        const list = listLayoutRef.current;
        const scrollView = scrollViewRef.current;
        if (!triggerL || !list || !scrollView) return;

        const padding =
            sizeCfg.scroll_inset ?? TABS_SCROLL_INTO_VIEW_PADDING_PX;
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
    }, [currentTab, sizeCfg.scroll_inset, overflow]);

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
            position: 'absolute',
            left: indicatorLayout.left,
            top: indicatorLayout.top,
            width: indicatorLayout.width,
            height: indicatorLayout.height,
            zIndex: 1,
        }),
        [indicatorLayout]
    );

    /** Stable identity for `TabsPrimitive.Root` — unstable parent `onTabChange` must not recreate context every render. */
    const handleTabChange = useCallback((value) => {
        tabsDebug('press', { from: currentTabRef.current, to: value });
        setCurrentTab(value);
        /** Defer sound/haptics so they do not run in the same sync stack as the press → commit (reduces native stalls). */
        const cb = onTabChangeRef.current;
        if (cb) queueMicrotask(() => cb(value));
    }, []);

    const handleOverflowMenuSelect = useCallback(
        (item) => {
            moreMenuDismissAfterMenuSelectRef.current = true;
            handleTabChange(item.id);
        },
        [handleTabChange]
    );

    const overflowMenuItems = useMemo(
        () =>
            collapseLayout.overflowTabs.map((tab) => ({
                id: tab.key,
                title: tab.title,
            })),
        [collapseLayout.overflowTabs]
    );

    if (!tabs || tabs.length === 0) {
        return null;
    }

    const moreIconSize =
        currentSizeKey === 'lg' ? 20 : currentSizeKey === 'sm' ? 16 : 18;
    const moreIsActive = collapseLayout.isActiveInOverflow(currentTab);
    const tabStretch =
        useEqualWidth && !hug
            ? /* min-w-min: never shrink below label + horizontal padding (min-w-0 was eating padding on long titles) */
              'flex-1 min-w-min basis-0 justify-center'
            : cn('shrink-0 flex-none');
    const moreTriggerEndAlign =
        collapseLayout.overflowTabs.length > 0 &&
        !(useEqualWidth && !hug);

    /** Full-width row for collapse measurement; track + pills sit in a `w-max` strip when hug so the track hugs tab width. */
    const collapseHugStrip = overflow === 'collapse' && hug;
    const tabBarWidthClass =
        overflow === 'collapse'
            ? 'w-full min-w-0'
            : hug
              ? 'w-max max-w-full self-start'
              : 'w-full';

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
            {variant === 'default' ? (
                <View
                    className={cn(
                        'absolute inset-0',
                        radiusPill,
                        variantCfg.pill
                    )}
                />
            ) : (
                <View
                    className={cn(
                        'absolute inset-0',
                        sizeCfg.indicator_inner,
                        variantCfg.line
                    )}
                />
            )}
        </View>
    );

    const collapseListInner = (
        <>
            <View
                className={cn(
                    tabsTheme['u-controls-tabs-header-row'],
                    variantCfg.row,
                    radiusRow,
                    sizeCfg.header,
                    'flex flex-row flex-nowrap !flex-none shrink-0 min-w-0',
                    useEqualWidth && !hug && 'w-full'
                )}
                style={{
                    position: 'absolute',
                    left: -10000,
                    top: 0,
                    opacity: 0,
                    zIndex: -1,
                }}
                pointerEvents="none"
            >
                {tabs.map((tab, i) => (
                    <View
                        key={`tab-measure-${tab.key}`}
                        onLayout={collapseLayout.onTabLayout(i)}
                        className={cn(
                            tabsTheme['u-controls-tabs-header-item'],
                            sizeCfg.item,
                            radiusPill,
                            tabStretch,
                            'flex-row'
                        )}
                    >
                        <Text className={cn(sizeCfg.text)}>{tab.title}</Text>
                    </View>
                ))}
            </View>

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
                    'relative z-[2]',
                    listClassName
                )}
            >
                {collapseLayout.visibleTabs.map((tab) => (
                    <TabsPrimitive.Trigger
                        key={tab.key}
                        value={tab.key}
                        onLayout={onTriggerLayout(tab.key)}
                        className={cn(
                            tabsTheme['u-controls-tabs-header-item'],
                            sizeCfg.item,
                            radiusPill,
                            tabStretch,
                            'relative z-[3]',
                            tab.key === currentTab
                                ? variantCfg.trigger_active
                                : variantCfg.trigger_inactive,
                            triggerClassName
                        )}
                    >
                        {({ isSelected }) => (
                            <Text
                                className={cn(
                                    isSelected
                                        ? cn(
                                              tabsTheme[
                                                  'u-controls-tabs-header-item-text-active'
                                              ],
                                              sizeCfg.text_active
                                          )
                                        : cn(
                                              tabsTheme[
                                                  'u-controls-tabs-header-item-text'
                                              ],
                                              sizeCfg.text
                                          )
                                )}
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
                                'relative z-[3]',
                                moreTriggerEndAlign && 'ml-auto',
                                moreIsActive
                                    ? variantCfg.trigger_active
                                    : variantCfg.trigger_inactive,
                                triggerClassName
                            )}
                        >
                            {resolvedMoreMenuTitle ? (
                                <Text
                                    className={cn(
                                        moreIsActive
                                            ? cn(
                                                  tabsTheme[
                                                      'u-controls-tabs-header-item-text-active'
                                                  ],
                                                  sizeCfg.text_active
                                              )
                                            : cn(
                                                  tabsTheme[
                                                      'u-controls-tabs-header-item-text'
                                                  ],
                                                  sizeCfg.text
                                              )
                                    )}
                                >
                                    {resolvedMoreMenuTitle}
                                </Text>
                            ) : null}
                            <Icon
                                icon={moreMenuIcon}
                                size={moreIconSize}
                                className={cn(
                                    moreIsActive
                                        ? cn(
                                              tabsTheme[
                                                  'u-controls-tabs-header-item-text-active'
                                              ],
                                              sizeCfg.text_active
                                          )
                                        : cn(
                                              tabsTheme[
                                                  'u-controls-tabs-header-item-text'
                                              ],
                                              sizeCfg.text
                                          )
                                )}
                            />
                        </View>
                    </DropdownMenu>
                )}
                {collapseLayout.overflowTabs.map((tab) => (
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
                                className={cn(
                                    isSelected
                                        ? cn(
                                              tabsTheme[
                                                  'u-controls-tabs-header-item-text-active'
                                              ],
                                              sizeCfg.text_active
                                          )
                                        : cn(
                                              tabsTheme[
                                                  'u-controls-tabs-header-item-text'
                                              ],
                                              sizeCfg.text
                                          )
                                )}
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
                    'relative min-w-0 overflow-hidden',
                    tabBarWidthClass,
                    overflow !== 'collapse' && tabBarClassName,
                    !collapseHugStrip && radiusTrack
                )}
            >
                {/* Track fills tab bar; in collapse+hug it lives inside the w-max strip */}
                {!collapseHugStrip && trackView}
                {overflow === 'collapse' ? (
                    <View
                        ref={(node) => {
                            collapseLayout.setContainerRef(node);
                        }}
                        onLayout={collapseLayout.onContainerLayout}
                        className={cn(
                            'relative z-[1] w-full min-w-0',
                            tabBarClassName
                        )}
                    >
                        {collapseHugStrip ? (
                            <View
                                className={cn(
                                    'relative min-w-0 overflow-hidden',
                                    'w-max max-w-full self-start',
                                    radiusTrack
                                )}
                            >
                                {trackView}
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
                        className="relative z-[1] w-full max-w-full"
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
                                    'relative z-[2]',
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
                                            'relative z-[3]',
                                            tab.key === currentTab
                                                ? variantCfg.trigger_active
                                                : variantCfg.trigger_inactive,
                                            triggerClassName
                                        )}
                                    >
                                        {({ isSelected }) => (
                                            <Text
                                                className={cn(
                                                    isSelected
                                                        ? cn(
                                                              tabsTheme[
                                                                  'u-controls-tabs-header-item-text-active'
                                                              ],
                                                              sizeCfg.text_active
                                                          )
                                                        : cn(
                                                              tabsTheme[
                                                                  'u-controls-tabs-header-item-text'
                                                              ],
                                                              sizeCfg.text
                                                          )
                                                )}
                                            >
                                                {tab.title}
                                            </Text>
                                        )}
                                    </TabsPrimitive.Trigger>
                                ))}
                            </TabsPrimitive.List>
                        </View>
                    </ScrollView>
                )}
            </View>

            {tabs.map((tab) => (
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