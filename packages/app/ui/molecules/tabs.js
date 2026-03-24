import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { View, ScrollView, Platform } from 'react-native';
import { Text } from 'app/design/typography';
import * as TabsPrimitive from 'app/ui/primitives/tabs';
import { appSetting } from 'app/lib/util';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { Icon } from 'app/ui/atoms/icon';
import { useTabsCollapseLayout } from 'app/ui/molecules/use-tabs-collapse-layout';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import {
    TABS_SELECTION_DURATION_MS,
    TABS_SCROLL_INTO_VIEW_PADDING_PX,
    TABS_UNDERLINE_HEIGHT_PX,
} from 'app/ui/molecules/tabs-selection-constants';

const tabsTheme = appSetting('theme', 'tabs');
const tabsSizes = appSetting('theme', 'tabs_sizes');
const rawTabsVariants = appSetting('theme', 'tabs_variants');
const tabsVariants =
    rawTabsVariants && typeof rawTabsVariants === 'object'
        ? rawTabsVariants
        : {};

/**
 * @param {Array} tabs - { key, title, content }
 * @param {string} [activeTab]
 * @param {boolean} [equalWidth] — When true (and `hug` is false), tabs share extra space equally; each tab keeps at least `min-content` width (label + padding), never shrinking below that.
 * @param {boolean} [fullWidth] — @deprecated Use `equalWidth` instead (same behavior).
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
 * @param {string} [moreLabel] — label for the overflow trigger (default: translated "More").
 * @param {(key: string) => void} [onTabChange] — fired after the user selects a tab (new tab key).
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
    moreLabel,
    size,
    contentClassName = '',
    trackClassName,
    headerClassName,
    tabBarClassName,
    listWrapperClassName,
    listClassName,
    triggerClassName,
    onTabChange,
}) {
    /** `fullWidth` is deprecated — same as `equalWidth` (first wins if both are set). */
    const useEqualWidth = equalWidth ?? fullWidth ?? false;
    const { t } = useTranslation();
    const resolvedMoreLabel = moreLabel ?? t('More');
    const [currentTab, setCurrentTab] = useState(
        () => activeTab ?? tabs?.[0]?.key
    );
    const triggerRefs = useRef({});
    const headerRowLayoutRef = useRef(null);
    const scrollViewRef = useRef(null);
    const scrollXRef = useRef(0);
    const scrollViewWidthRef = useRef(0);
    const skipFirstScrollIntoViewRef = useRef(true);

    const selLeft = useSharedValue(0);
    const selTop = useSharedValue(0);
    const selWidth = useSharedValue(0);
    const selHeight = useSharedValue(0);
    const [ready, setReady] = useState(false);

    const currentSizeKey = size || tabsSizes?.default_size || 'md';
    const sizeCfg = tabsSizes?.[currentSizeKey] || tabsSizes?.md || {};
    const variantCfg =
        tabsVariants[variant] || tabsVariants.default || tabsVariants.secondary;

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
    });
    const moreRef = useRef(null);
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
            setMoreMenuOpen(true);
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

    const updateIndicator = useCallback(
        (tabKey) => {
            const layoutNode = headerRowLayoutRef.current;
            if (!layoutNode || !variantCfg) return;

            const dur = ready ? TABS_SELECTION_DURATION_MS : 0;
            const easing = Easing.out(Easing.ease);
            const applyMeasure = (x, y, width, height) => {
                let top;
                let h;
                if (variant === 'secondary') {
                    top = y + height - TABS_UNDERLINE_HEIGHT_PX;
                    h = TABS_UNDERLINE_HEIGHT_PX;
                } else {
                    top = y;
                    h = height;
                }
                selLeft.value = withTiming(x, { duration: dur, easing });
                selTop.value = withTiming(top, { duration: dur, easing });
                selWidth.value = withTiming(width, {
                    duration: dur,
                    easing,
                });
                selHeight.value = withTiming(h, { duration: dur, easing });
                if (!ready) setReady(true);
            };

            if (overflow === 'collapse' && tabKey) {
                const idx = (tabs ?? []).findIndex((t) => t.key === tabKey);
                const inOverflow =
                    idx >= 0 && idx >= collapseLayout.visibleCount;
                if (inOverflow) {
                    const moreNode = moreRef.current;
                    if (moreNode) {
                        moreNode.measureLayout(
                            layoutNode,
                            applyMeasure,
                            () => {}
                        );
                        return;
                    }
                }
            }

            const triggerRef = triggerRefs.current[tabKey];
            if (triggerRef) {
                triggerRef.measureLayout(
                    layoutNode,
                    applyMeasure,
                    () => {}
                );
            }
        },
        [ready, variant, variantCfg, overflow, tabs, collapseLayout.visibleCount]
    );

    useEffect(() => {
        const timer = setTimeout(() => updateIndicator(currentTab), 50);
        return () => clearTimeout(timer);
    }, [
        currentTab,
        updateIndicator,
        variant,
        size,
        useEqualWidth,
        rounded,
        hug,
        overflow,
        collapseLayout.visibleCount,
        tabs?.length,
    ]);

    const scrollActiveTabIntoView = useCallback(() => {
        if (overflow === 'collapse') return;
        const trigger = triggerRefs.current[currentTab];
        const layoutNode = headerRowLayoutRef.current;
        const scrollView = scrollViewRef.current;
        if (!trigger || !layoutNode || !scrollView) return;

        const padding =
            sizeCfg.scroll_inset ?? TABS_SCROLL_INTO_VIEW_PADDING_PX;
        trigger.measureLayout(
            layoutNode,
            (x, _y, width, _h) => {
                const vw = scrollViewWidthRef.current;
                if (!vw) return;
                const scrollX = scrollXRef.current;
                const right = x + width;
                const viewportRight = scrollX + vw;

                let targetX = scrollX;
                if (x < scrollX + padding) {
                    targetX = Math.max(0, x - padding);
                } else if (right > viewportRight - padding) {
                    targetX = Math.max(0, right - vw + padding);
                }
                if (Math.abs(targetX - scrollX) > 0.5) {
                    scrollView.scrollTo({ x: targetX, animated: true });
                }
            },
            () => {}
        );
    }, [currentTab, sizeCfg.scroll_inset, overflow]);

    useEffect(() => {
        if (overflow === 'collapse') return;
        if (skipFirstScrollIntoViewRef.current) {
            skipFirstScrollIntoViewRef.current = false;
            return;
        }
        const timer = setTimeout(() => scrollActiveTabIntoView(), 50);
        return () => clearTimeout(timer);
    }, [currentTab, scrollActiveTabIntoView, overflow]);

    const selectionStyle = useAnimatedStyle(
        () => ({
            position: 'absolute',
            left: selLeft.value,
            top: selTop.value,
            width: selWidth.value,
            height: selHeight.value,
        }),
        []
    );

    const handleTabChange = useCallback(
        (value) => {
            setCurrentTab(value);
            onTabChange?.(value);
        },
        [onTabChange]
    );

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
            : clsx('shrink-0 flex-none');
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
            className={clsx(
                variantCfg.track,
                radiusTrack,
                trackClassName
            )}
        />
    );

    const collapseListInner = (
        <>
            <View
                className={clsx(
                    tabsTheme['u-controls-tabs-header-row'],
                    variantCfg.row,
                    radiusRow,
                    sizeCfg.header,
                    'flex flex-row flex-nowrap !flex-none shrink-0 min-w-0'
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
                        className={clsx(
                            tabsTheme['u-controls-tabs-header-item'],
                            sizeCfg.item,
                            radiusPill,
                            'shrink-0 flex-none flex-row'
                        )}
                    >
                        <Text className={clsx(sizeCfg.text)}>{tab.title}</Text>
                    </View>
                ))}
            </View>

            <Animated.View
                style={[selectionStyle, { zIndex: 1 }]}
                className={tabsTheme['u-controls-tabs-selection-layer']}
            >
                {variant === 'default' ? (
                    <View
                        className={clsx(
                            'absolute inset-0',
                            radiusPill,
                            variantCfg.pill
                        )}
                    />
                ) : (
                    <View
                        className={clsx(
                            'absolute inset-0',
                            sizeCfg.indicator_inner,
                            variantCfg.line
                        )}
                    />
                )}
            </Animated.View>

            <TabsPrimitive.List
                className={clsx(
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
                        ref={(node) => {
                            if (node)
                                triggerRefs.current[tab.key] = node;
                        }}
                        className={clsx(
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
                                className={clsx(
                                    isSelected
                                        ? clsx(
                                              tabsTheme[
                                                  'u-controls-tabs-header-item-text-active'
                                              ],
                                              sizeCfg.text_active
                                          )
                                        : clsx(
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
                        open={moreMenuOpen}
                        onOpenChange={setMoreMenuOpen}
                        items={overflowMenuItems}
                        onSelect={handleOverflowMenuSelect}
                    >
                        <View
                            ref={moreRef}
                            onLayout={collapseLayout.onMoreLayout}
                            collapsable={
                                Platform.OS === 'android'
                                    ? false
                                    : undefined
                            }
                            className={clsx(
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
                            <Text
                                className={clsx(
                                    moreIsActive
                                        ? clsx(
                                              tabsTheme[
                                                  'u-controls-tabs-header-item-text-active'
                                              ],
                                              sizeCfg.text_active
                                          )
                                        : clsx(
                                              tabsTheme[
                                                  'u-controls-tabs-header-item-text'
                                              ],
                                              sizeCfg.text
                                          )
                                )}
                            >
                                {resolvedMoreLabel}
                            </Text>
                            <Icon
                                icon="ChevronDown"
                                size={moreIconSize}
                                className={clsx(
                                    moreIsActive
                                        ? clsx(
                                              tabsTheme[
                                                  'u-controls-tabs-header-item-text-active'
                                              ],
                                              sizeCfg.text_active
                                          )
                                        : clsx(
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
                        ref={(node) => {
                            if (node)
                                triggerRefs.current[tab.key] = node;
                        }}
                        className="sr-only absolute h-px w-px overflow-hidden opacity-0 pointer-events-none"
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                    >
                        {({ isSelected }) => (
                            <Text
                                className={clsx(
                                    isSelected
                                        ? clsx(
                                              tabsTheme[
                                                  'u-controls-tabs-header-item-text-active'
                                              ],
                                              sizeCfg.text_active
                                          )
                                        : clsx(
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
            className={clsx(tabsTheme['u-controls-tabs-container'], headerClassName)}
        >
            <View
                className={clsx(
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
                        className={clsx(
                            'relative z-[1] w-full min-w-0',
                            tabBarClassName
                        )}
                    >
                        {collapseHugStrip ? (
                            <View
                                className={clsx(
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
                                    className={clsx(
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
                                className={clsx(
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
                            className={clsx(
                                'relative web:isolate',
                                hug
                                    ? 'w-max self-start'
                                    : 'min-w-full w-max',
                                listWrapperClassName
                            )}
                        >
                            <Animated.View
                                style={[selectionStyle, { zIndex: 1 }]}
                                className={
                                    tabsTheme['u-controls-tabs-selection-layer']
                                }
                            >
                                {variant === 'default' ? (
                                    <View
                                        className={clsx(
                                            'absolute inset-0',
                                            radiusPill,
                                            variantCfg.pill
                                        )}
                                    />
                                ) : (
                                    <View
                                        className={clsx(
                                            'absolute inset-0',
                                            sizeCfg.indicator_inner,
                                            variantCfg.line
                                        )}
                                    />
                                )}
                            </Animated.View>

                            <TabsPrimitive.List
                                className={clsx(
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
                                        ref={(node) => {
                                            if (node)
                                                triggerRefs.current[tab.key] =
                                                    node;
                                        }}
                                        className={clsx(
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
                                                className={clsx(
                                                    isSelected
                                                        ? clsx(
                                                              tabsTheme[
                                                                  'u-controls-tabs-header-item-text-active'
                                                              ],
                                                              sizeCfg.text_active
                                                          )
                                                        : clsx(
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
                    className={clsx(
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
