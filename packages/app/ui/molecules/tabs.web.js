import { Text } from 'app/design/typography';
import { useState, useRef, useEffect, useCallback } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { appSetting } from 'app/lib/util';
import { View } from 'app/design/view';
import { clsx } from 'clsx';
import {
    TABS_SELECTION_DURATION_MS,
    TABS_SCROLL_INTO_VIEW_PADDING_PX,
    TABS_UNDERLINE_HEIGHT_PX,
    TABS_SELECTION_WEB_EASING,
} from 'app/ui/molecules/tabs-selection-constants';

/** Skip scrolling the active tab into view on the first paint only (tab changes after that scroll). */
function useScrollActiveTabIntoView(currentTab, triggerRefs) {
    const skipFirstScrollRef = useRef(true);

    useEffect(() => {
        if (skipFirstScrollRef.current) {
            skipFirstScrollRef.current = false;
            return;
        }
        const el = triggerRefs.current?.[currentTab];
        if (!el) return;
        requestAnimationFrame(() => {
            el.scrollIntoView({
                behavior: 'smooth',
                inline: 'nearest',
                block: 'nearest',
            });
        });
    }, [currentTab]);
}

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
 * @param {'default'|'secondary'} [variant]
 * @param {string} [trackClassName]
 * @param {string} [headerClassName]
 * @param {boolean} [rounded]
 * @param {boolean} [hug] — label-width triggers; use with `fullWidth={false}` for a compact strip
 * @param {string} [tabBarClassName] — outer wrapper around the tab bar (center, margins)
 * @param {string} [listWrapperClassName] — box around track + list + indicator
 * @param {string} [listClassName] — tab row only
 * @param {string} [triggerClassName] — each trigger only; not `TabsContent`
 * @param {(key: string) => void} [onTabChange] — user selection; not `activeTab` prop sync
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
    const headerWrapperRef = useRef(null);
    const listRef = useRef(null);
    const triggerRefs = useRef({});
    const [rect, setRect] = useState({
        left: 0,
        top: 0,
        width: 0,
        height: 0,
    });
    const [ready, setReady] = useState(false);
    const readyRef = useRef(false);

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

    const scrollInsetPx =
        sizeCfg.scroll_inset ?? TABS_SCROLL_INTO_VIEW_PADDING_PX;

    useEffect(() => {
        if (activeTab !== undefined) setCurrentTab(activeTab);
    }, [activeTab]);

    const handleTabChange = useCallback(
        (value) => {
            setCurrentTab(value);
            onTabChange?.(value);
        },
        [onTabChange]
    );

    useScrollActiveTabIntoView(currentTab, triggerRefs);

    const updateIndicator = useCallback(() => {
        try {
            const wrapper = headerWrapperRef.current;
            const currentEl = triggerRefs.current?.[currentTab];
            if (!wrapper || !currentEl) return;
            const wrapperRect = wrapper.getBoundingClientRect();
            const elRect = currentEl.getBoundingClientRect();
            const left = elRect.left - wrapperRect.left;
            const topRel = elRect.top - wrapperRect.top;
            const width = elRect.width;
            const heightRel = elRect.height;
            let top;
            let height;
            if (variant === 'secondary') {
                top = topRel + heightRel - TABS_UNDERLINE_HEIGHT_PX;
                height = TABS_UNDERLINE_HEIGHT_PX;
            } else {
                top = topRel;
                height = heightRel;
            }
            setRect({ left, top, width, height });
            if (!readyRef.current) {
                readyRef.current = true;
                setReady(true);
            }
        } catch (e) {}
    }, [currentTab, variant]);

    useEffect(() => {
        updateIndicator();
        const onResize = () => updateIndicator();
        window.addEventListener('resize', onResize);
        const list = listRef.current;
        if (list) list.addEventListener('scroll', onResize, { passive: true });
        return () => {
            window.removeEventListener('resize', onResize);
            if (list) list.removeEventListener('scroll', onResize);
        };
    }, [updateIndicator, rounded, hug]);

    const transitionStyle =
        ready
            ? {
                  transition: `left ${TABS_SELECTION_DURATION_MS}ms ${TABS_SELECTION_WEB_EASING}, top ${TABS_SELECTION_DURATION_MS}ms ${TABS_SELECTION_WEB_EASING}, width ${TABS_SELECTION_DURATION_MS}ms ${TABS_SELECTION_WEB_EASING}, height ${TABS_SELECTION_DURATION_MS}ms ${TABS_SELECTION_WEB_EASING}`,
              }
            : {};

    if (!tabs || tabs.length === 0) {
        return null;
    }

    return (
        <TabsPrimitive.Root
            value={currentTab}
            onValueChange={handleTabChange}
            className={cn(
                tabsTheme['u-controls-tabs-container'],
                headerClassName
            )}
        >
            <View
                className={cn(
                    'relative min-w-0 overflow-hidden',
                    hug ? 'w-max max-w-full self-start' : 'w-full',
                    tabBarClassName,
                    radiusTrack
                )}
            >
                {/* Track fills tab bar viewport only — scroll row is below */}
                <View
                    className={cn(
                        variantCfg.track,
                        radiusTrack,
                        trackClassName
                    )}
                />
                <View
                    ref={listRef}
                    className="relative z-[1] w-full min-w-0 overflow-x-auto overflow-y-hidden"
                >
                    <View
                        className={cn(
                            'relative',
                            hug
                                ? 'w-max self-start'
                                : 'min-w-full w-max',
                            listWrapperClassName
                        )}
                        ref={headerWrapperRef}
                    >
                <View
                    className={cn(
                        tabsTheme['u-controls-tabs-selection-layer'],
                        'z-[1]'
                    )}
                    style={{
                        left: `${rect.left}px`,
                        top: `${rect.top}px`,
                        width: `${rect.width}px`,
                        height: `${rect.height}px`,
                        position: 'absolute',
                        ...transitionStyle,
                    }}
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
                            ref={(node) => {
                                if (node) triggerRefs.current[tab.key] = node;
                            }}
                            key={tab.key}
                            value={tab.key}
                            style={{
                                scrollMarginInline: scrollInsetPx,
                            }}
                            className={cn(
                                'relative z-[3]',
                                tabsTheme['u-controls-tabs-header-item'],
                                sizeCfg.item,
                                radiusPill,
                                'shrink-0',
                                hug && 'flex-none',
                                tab.key === currentTab
                                    ? variantCfg.trigger_active
                                    : variantCfg.trigger_inactive,
                                triggerClassName
                            )}
                        >
                            <Text
                                className={cn(
                                    tab.key === currentTab
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
                        </TabsPrimitive.Trigger>
                    ))}
                </TabsPrimitive.List>
                    </View>
                </View>
            </View>

            {tabs.map((tab) => (
                <TabsPrimitive.Content
                    className={cn(
                        tabsTheme['u-controls-tabs-tab-content'],
                        tabsTheme['u-controls-tabs-tab-content-animated'],
                        contentClassName
                    )}
                    key={tab.key}
                    value={tab.key}
                >
                    {tab.content}
                </TabsPrimitive.Content>
            ))}
        </TabsPrimitive.Root>
    );
}
