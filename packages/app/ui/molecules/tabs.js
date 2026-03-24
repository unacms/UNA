import * as React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { View, ScrollView, Platform } from 'react-native';
import { Text } from 'app/design/typography';
import * as TabsPrimitive from 'app/ui/primitives/tabs';
import { appSetting } from 'app/lib/util';
import { clsx } from 'clsx';
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

function cn(...inputs) {
    return clsx(inputs);
}

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
 * @param {boolean} [fullWidth]
 * @param {'default'|'secondary'} [variant]
 * @param {string} [size] sm | md | lg
 * @param {string} [contentClassName]
 * @param {string} [trackClassName]
 * @param {string} [headerClassName] — classes on `Tabs` root (container)
 * @param {string} [tabBarClassName] — wrapper around the scroll/header area (e.g. `flex justify-center`, `mb-2`)
 * @param {string} [listWrapperClassName] — inner box that contains track + list (e.g. `mx-auto` with `hug`)
 * @param {string} [listClassName] — `TabsList` row only (e.g. `gap-1`, `justify-center`)
 * @param {string} [triggerClassName] — each tab trigger only (e.g. `mx-1`); does not affect tab panel content
 * @param {boolean} [rounded] — pill/track/row use `rounded-full`; when false, radii come from `tabs_sizes` (track, row, pill)
 * @param {boolean} [hug] — triggers only as wide as labels (no equal flex stretch). Combine with `fullWidth={false}` so the strip does not span the parent.
 * @param {(key: string) => void} [onTabChange] — fired after the user selects a tab (new tab key).
 */
export default function Tabs({
    tabs,
    activeTab,
    fullWidth = false,
    variant = 'default',
    rounded = false,
    hug = false,
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

    const radiusTrack = rounded
        ? 'rounded-full'
        : sizeCfg.track || 'rounded-xl';
    const radiusRow = rounded
        ? 'rounded-full'
        : sizeCfg.row || 'rounded-xl';
    const radiusPill = rounded
        ? 'rounded-full overflow-hidden'
        : sizeCfg.pill || 'rounded-lg overflow-hidden';

    useEffect(() => {
        if (activeTab !== undefined) setCurrentTab(activeTab);
    }, [activeTab]);

    const updateIndicator = useCallback(
        (tabKey) => {
            const triggerRef = triggerRefs.current[tabKey];
            const layoutNode = headerRowLayoutRef.current;

            if (triggerRef && layoutNode && variantCfg) {
                triggerRef.measureLayout(
                    layoutNode,
                    (x, y, width, height) => {
                        const dur = ready ? TABS_SELECTION_DURATION_MS : 0;
                        const easing = Easing.out(Easing.ease);
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
                    },
                    () => {}
                );
            }
        },
        [ready, variant]
    );

    useEffect(() => {
        const timer = setTimeout(() => updateIndicator(currentTab), 50);
        return () => clearTimeout(timer);
    }, [
        currentTab,
        updateIndicator,
        variant,
        size,
        fullWidth,
        rounded,
        hug,
        tabs?.length,
    ]);

    const scrollActiveTabIntoView = useCallback(() => {
        const trigger = triggerRefs.current[currentTab];
        const layoutNode = headerRowLayoutRef.current;
        const scrollView = scrollViewRef.current;
        if (!trigger || !layoutNode || !scrollView) return;

        const padding = TABS_SCROLL_INTO_VIEW_PADDING_PX;
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
    }, [currentTab]);

    useEffect(() => {
        if (skipFirstScrollIntoViewRef.current) {
            skipFirstScrollIntoViewRef.current = false;
            return;
        }
        const t = setTimeout(() => scrollActiveTabIntoView(), 50);
        return () => clearTimeout(t);
    }, [currentTab, scrollActiveTabIntoView]);

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

    if (!tabs || tabs.length === 0) {
        return null;
    }

    return (
        <TabsPrimitive.Root
            value={currentTab}
            onValueChange={handleTabChange}
            className={cn(tabsTheme['u-controls-tabs-container'], headerClassName)}
        >
            <View className={cn('relative w-full min-w-0', tabBarClassName)}>
                <ScrollView
                    ref={scrollViewRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    nestedScrollEnabled
                    scrollEventThrottle={16}
                    className="w-full max-w-full"
                    onLayout={(e) => {
                        scrollViewWidthRef.current = e.nativeEvent.layout.width;
                    }}
                    onScroll={(e) => {
                        scrollXRef.current = e.nativeEvent.contentOffset.x;
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
                        collapsable={Platform.OS === 'android' ? false : undefined}
                        className={cn(
                            'relative web:isolate',
                            hug
                                ? 'w-max self-start'
                                : 'min-w-full w-max',
                            listWrapperClassName
                        )}
                    >
                        <View
                            className={cn(
                                variantCfg.track,
                                radiusTrack,
                                trackClassName
                            )}
                        />

                        <Animated.View
                            style={[selectionStyle, { zIndex: 1 }]}
                            className={tabsTheme['u-controls-tabs-selection-layer']}
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
                        </Animated.View>

                        <TabsPrimitive.List
                            className={cn(
                                tabsTheme['u-controls-tabs-header-row'],
                                variantCfg.row,
                                radiusRow,
                                sizeCfg.header,
                                '!flex-none shrink-0 min-w-0',
                                hug
                                    ? 'w-max justify-start self-start'
                                    : fullWidth
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
                                            triggerRefs.current[tab.key] = node;
                                    }}
                                    className={cn(
                                        tabsTheme['u-controls-tabs-header-item'],
                                        sizeCfg.item,
                                        radiusPill,
                                        'shrink-0',
                                        hug && 'flex-none',
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

export { Tabs as TabsSimple } from 'app/ui/atoms/tabs';
export { Tabs as TabsRoot, TabsList, TabsTrigger, TabsContent } from 'app/ui/atoms/tabs';
