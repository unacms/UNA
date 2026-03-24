import { Text } from 'app/design/typography';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { appSetting } from 'app/lib/util';
import { View } from 'app/design/view';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { Icon } from 'app/ui/atoms/icon';
import { useTabsCollapseLayout } from 'app/ui/molecules/use-tabs-collapse-layout';
import {
    TABS_SELECTION_DURATION_MS,
    TABS_SCROLL_INTO_VIEW_PADDING_PX,
    TABS_UNDERLINE_HEIGHT_PX,
    TABS_SELECTION_WEB_EASING,
} from 'app/ui/molecules/tabs-selection-constants';

/** Skip scrolling the active tab into view on the first paint only (tab changes after that scroll). */
function useScrollActiveTabIntoView(currentTab, triggerRefs, enabled) {
    const skipFirstScrollRef = useRef(true);

    useEffect(() => {
        if (!enabled) return;
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
    }, [currentTab, enabled]);
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
 * @param {boolean} [equalWidth] — When true (and `hug` is false), tabs share extra space equally; each tab keeps at least `min-content` width (label + padding).
 * @param {boolean} [fullWidth] — Deprecated: use `equalWidth` instead.
 * @param {boolean} [hug] — label-width triggers; use with `equalWidth={false}` for a compact strip
 * @param {'scroll'|'collapse'} [overflow] — `scroll` (default) or `collapse` into a "More" menu
 * @param {string} [moreLabel]
 * @param {string} [tabBarClassName] — With `overflow="scroll"`, outer tab bar; with `overflow="collapse"`, the full-width measure row — use `flex flex-row justify-center` to center a `hug` strip in the parent.
 * @param {string} [listWrapperClassName] — box around track + list + indicator
 * @param {string} [listClassName] — tab row only
 * @param {string} [triggerClassName] — each trigger only; not `TabsContent`
 * @param {(key: string) => void} [onTabChange] — user selection; not `activeTab` prop sync
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
    const headerWrapperRef = useRef(null);
    const listRef = useRef(null);
    const moreRef = useRef(null);
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

    /** Secondary uses a bottom line — outer track/row rounding clips the underline. */
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

    const scrollInsetPx =
        sizeCfg.scroll_inset ?? TABS_SCROLL_INTO_VIEW_PADDING_PX;
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

    /** Sync "More" menu open state when an overflow tab is active (keyboard arrows) or close when back on-strip. */
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

    useScrollActiveTabIntoView(
        currentTab,
        triggerRefs,
        overflow !== 'collapse'
    );

    const updateIndicator = useCallback(() => {
        try {
            const wrapper = headerWrapperRef.current;
            if (!wrapper) return;

            const applyRect = (elRect) => {
                const wrapperRect = wrapper.getBoundingClientRect();
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
            };

            const idx = (tabs ?? []).findIndex((t) => t.key === currentTab);
            const inOverflow =
                overflow === 'collapse' &&
                idx >= 0 &&
                idx >= collapseLayout.visibleCount;

            if (inOverflow) {
                const moreEl = moreRef.current;
                if (moreEl && typeof moreEl.getBoundingClientRect === 'function') {
                    applyRect(moreEl.getBoundingClientRect());
                }
                return;
            }

            const currentEl = triggerRefs.current?.[currentTab];
            if (!currentEl || typeof currentEl.getBoundingClientRect !== 'function') {
                return;
            }
            applyRect(currentEl.getBoundingClientRect());
        } catch (e) {}
    }, [currentTab, variant, overflow, tabs, collapseLayout.visibleCount]);

    useEffect(() => {
        updateIndicator();
        const onResize = () => updateIndicator();
        window.addEventListener('resize', onResize);
        const list = listRef.current;
        if (overflow !== 'collapse' && list) {
            list.addEventListener('scroll', onResize, { passive: true });
        }
        return () => {
            window.removeEventListener('resize', onResize);
            if (overflow !== 'collapse' && list) {
                list.removeEventListener('scroll', onResize);
            }
        };
    }, [updateIndicator, rounded, hug, overflow, collapseLayout.visibleCount]);

    const transitionStyle =
        ready
            ? {
                  transition: `left ${TABS_SELECTION_DURATION_MS}ms ${TABS_SELECTION_WEB_EASING}, top ${TABS_SELECTION_DURATION_MS}ms ${TABS_SELECTION_WEB_EASING}, width ${TABS_SELECTION_DURATION_MS}ms ${TABS_SELECTION_WEB_EASING}, height ${TABS_SELECTION_DURATION_MS}ms ${TABS_SELECTION_WEB_EASING}`,
              }
            : {};

    if (!tabs || tabs.length === 0) {
        return null;
    }

    const moreIconSize =
        currentSizeKey === 'lg' ? 20 : currentSizeKey === 'sm' ? 16 : 18;
    const moreIsActive = collapseLayout.isActiveInOverflow(currentTab);
    const tabStretch =
        useEqualWidth && !hug
            ? /* min-w-min: never shrink below label + horizontal padding (min-w-0 squeezed long titles) */
              'flex-1 min-w-min basis-0 justify-center'
            : clsx('shrink-0', hug && 'flex-none');
    const moreTriggerEndAlign =
        collapseLayout.overflowTabs.length > 0 &&
        !(useEqualWidth && !hug);

    /** Full-width measure row for collapse; track + tabs sit in a `w-max` strip when hug. */
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

    const selectionLayer = (
        <View
            className={clsx(
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
        </View>
    );

    const scrollRow = (
        <View
            ref={listRef}
            className="relative z-[1] w-full min-w-0 overflow-x-auto overflow-y-hidden"
        >
            <View
                className={clsx(
                    'relative',
                    hug ? 'w-max self-start' : 'min-w-full w-max',
                    listWrapperClassName
                )}
                ref={headerWrapperRef}
            >
                {selectionLayer}
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
                            ref={(node) => {
                                if (node) triggerRefs.current[tab.key] = node;
                            }}
                            key={tab.key}
                            value={tab.key}
                            style={{
                                scrollMarginInline: scrollInsetPx,
                            }}
                            className={clsx(
                                'relative z-[3]',
                                tabsTheme['u-controls-tabs-header-item'],
                                sizeCfg.item,
                                radiusPill,
                                tabStretch,
                                tab.key === currentTab
                                    ? variantCfg.trigger_active
                                    : variantCfg.trigger_inactive,
                                triggerClassName
                            )}
                        >
                            <Text
                                className={clsx(
                                    tab.key === currentTab
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
                        </TabsPrimitive.Trigger>
                    ))}
                </TabsPrimitive.List>
            </View>
        </View>
    );

    const collapseRowInner = (
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

            {selectionLayer}

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
                            ref={(node) => {
                                if (node) triggerRefs.current[tab.key] = node;
                            }}
                            key={tab.key}
                            value={tab.key}
                            className={clsx(
                                'relative z-[3]',
                                tabsTheme['u-controls-tabs-header-item'],
                                sizeCfg.item,
                                radiusPill,
                                tabStretch,
                                tab.key === currentTab
                                    ? variantCfg.trigger_active
                                    : variantCfg.trigger_inactive,
                                triggerClassName
                            )}
                        >
                            <Text
                                className={clsx(
                                    tab.key === currentTab
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
                                className={clsx(
                                    'relative z-[3]',
                                    tabsTheme['u-controls-tabs-header-item'],
                                    sizeCfg.item,
                                    radiusPill,
                                    'shrink-0 flex-none flex-row items-center justify-center gap-1',
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
                                if (node) triggerRefs.current[tab.key] = node;
                            }}
                            className="sr-only absolute h-px w-px overflow-hidden opacity-0 pointer-events-none"
                            tabIndex={-1}
                        >
                            <Text
                                className={clsx(
                                    tab.key === currentTab
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
                        </TabsPrimitive.Trigger>
                    ))}
                </TabsPrimitive.List>
        </>
    );

    const collapseRow = (
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
                        className={clsx(
                            'relative min-w-0 w-full',
                            listWrapperClassName
                        )}
                        ref={headerWrapperRef}
                    >
                        {collapseRowInner}
                    </View>
                </View>
            ) : (
                <View
                    className={clsx(
                        'relative min-w-0 w-full',
                        listWrapperClassName
                    )}
                    ref={headerWrapperRef}
                >
                    {collapseRowInner}
                </View>
            )}
        </View>
    );

    return (
        <TabsPrimitive.Root
            value={currentTab}
            onValueChange={handleTabChange}
            className={clsx(
                tabsTheme['u-controls-tabs-container'],
                headerClassName
            )}
        >
            <View
                className={clsx(
                    'relative min-w-0 overflow-hidden',
                    tabBarWidthClass,
                    overflow !== 'collapse' && tabBarClassName,
                    !collapseHugStrip && radiusTrack
                )}
            >
                {!collapseHugStrip && trackView}
                {overflow === 'collapse' ? collapseRow : scrollRow}
            </View>

            {tabs.map((tab) => (
                <TabsPrimitive.Content
                    className={clsx(
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
