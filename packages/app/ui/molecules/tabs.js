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
    Easing 
} from 'react-native-reanimated';

function cn(...inputs) {
    return clsx(inputs);
}

const tabsTheme = appSetting('theme', 'tabs');
const tabsSizes = appSetting('theme', 'tabs_sizes');

/**
 * Tabs component - Simplified API for rendering tabbed content
 * 
 * @param {Array} tabs - Array of tab objects { key: string, title: string, content: ReactNode }
 * @param {string} activeTab - Initial active tab key
 * @param {boolean} fullWidth - Whether tabs should take full width
 * @param {string} size - Size variant ('sm', 'md', 'lg')
 * @param {string} contentClassName - Additional classes for content area
 */
export default function Tabs({ 
    tabs, 
    activeTab, 
    fullWidth = false, 
    size, 
    contentClassName = '' 
}) {
    const [currentTab, setCurrentTab] = useState(activeTab || tabs?.[0]?.key);
    const triggerRefs = useRef({});
    /** Wrapper around indicator + tab row — measureLayout uses this so the indicator shares the same stacking context as triggers */
    const headerRowLayoutRef = useRef(null);
    
    // Indicator animation
    const indicatorLeft = useSharedValue(0);
    const indicatorWidth = useSharedValue(0);
    const [ready, setReady] = useState(false);

    const currentSizeKey = size || tabsSizes?.default_size || 'md';
    const sizeCfg = tabsSizes?.[currentSizeKey] || tabsSizes?.md || {};

    // Measure and update indicator position
    const updateIndicator = useCallback((tabKey) => {
        const triggerRef = triggerRefs.current[tabKey];
        const layoutNode = headerRowLayoutRef.current;
        
        if (triggerRef && layoutNode) {
            triggerRef.measureLayout(
                layoutNode,
                (x, y, width, height) => {
                    indicatorLeft.value = withTiming(x, { 
                        duration: ready ? 200 : 0,
                        easing: Easing.out(Easing.ease)
                    });
                    indicatorWidth.value = withTiming(width, { 
                        duration: ready ? 200 : 0,
                        easing: Easing.out(Easing.ease)
                    });
                    if (!ready) setReady(true);
                },
                () => {} // error callback
            );
        }
    }, [ready]);

    // Update indicator when tab changes
    useEffect(() => {
        // Small delay to ensure layout is complete
        const timer = setTimeout(() => {
            updateIndicator(currentTab);
        }, 50);
        return () => clearTimeout(timer);
    }, [currentTab, updateIndicator]);

    const indicatorStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: indicatorLeft.value }],
        width: indicatorWidth.value,
    }), []);

    const handleTabChange = useCallback((value) => {
        setCurrentTab(value);
    }, []);

    if (!tabs || tabs.length === 0) {
        return null;
    }

    return (
        <TabsPrimitive.Root
            value={currentTab}
            onValueChange={handleTabChange}
            className={tabsTheme['u-controls-tabs-container']}
        >
            <View className="relative">
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: fullWidth ? 1 : 0 }}
                >
                    <View
                        ref={headerRowLayoutRef}
                        collapsable={Platform.OS === 'android' ? false : undefined}
                        className="relative web:isolate"
                    >
                        <View
                            className={cn(
                                fullWidth
                                    ? tabsTheme['u-controls-tabs-header-track-full-width']
                                    : tabsTheme['u-controls-tabs-header-track']
                            )}
                        />
                        {/* Above track (z-0), below tab row */}
                        <Animated.View 
                            style={[indicatorStyle, { zIndex: 1 }]}
                            className={cn(
                                tabsTheme['u-controls-tabs-header-item-active-indicator'],
                                sizeCfg.indicator,
                                'absolute'
                            )}
                        >
                            <View className={cn(
                                tabsTheme['u-controls-tabs-header-item-active-indicator-inner'],
                                sizeCfg.indicator_inner
                            )} />
                        </Animated.View>

                        <TabsPrimitive.List
                            className={cn(
                                fullWidth 
                                    ? tabsTheme['u-controls-tabs-header-row-full-width'] 
                                    : tabsTheme['u-controls-tabs-header-row'],
                                sizeCfg.header,
                                'relative z-[2]'
                            )}
                        >
                        {tabs.map((tab) => (
                            <TabsPrimitive.Trigger
                                key={tab.key}
                                value={tab.key}
                                ref={(node) => {
                                    if (node) triggerRefs.current[tab.key] = node;
                                }}
                                className={cn(
                                    tabsTheme['u-controls-tabs-header-item'],
                                    sizeCfg.item,
                                    'relative z-[3]',
                                    tab.key === currentTab 
                                        ? tabsTheme['u-controls-tabs-header-item-active']
                                        : tabsTheme['u-controls-tabs-header-item-inactive']
                                )}
                            >
                                {({ isSelected }) => (
                                    <Text 
                                        className={cn(
                                            isSelected
                                                ? cn(tabsTheme['u-controls-tabs-header-item-text-active'], sizeCfg.text_active)
                                                : cn(tabsTheme['u-controls-tabs-header-item-text'], sizeCfg.text)
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

            {/* Tab content */}
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

// Also export individual components for more flexible usage
export { Tabs as TabsSimple } from 'app/ui/atoms/tabs';
export { Tabs as TabsRoot, TabsList, TabsTrigger, TabsContent } from 'app/ui/atoms/tabs';
