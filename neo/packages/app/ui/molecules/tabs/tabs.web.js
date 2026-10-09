import { Text } from 'app/design/typography';
import { useState, useRef, useEffect, useCallback } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { View } from 'app/design/view';
import { cn } from 'app/lib/util';
import { useTranslation } from 'react-i18next';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
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
import {
    TABS_SELECTION_DURATION_MS,
    TABS_UNDERLINE_HEIGHT_PX,
    TABS_SELECTION_WEB_EASING,
} from 'app/ui/molecules/tabs/tabs-selection-constants';

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

/**
 * Radix focuses the trigger from its own mousedown handler (`event.currentTarget.focus()`).
 * Right after a page load Chrome treats that script focus as keyboard focus, so the first
 * click showed the focus ring. Ours runs first and focuses with `focusVisible: false`;
 * Radix's call then hits an already focused element and changes nothing. Browsers without
 * the option ignore it.
 */
function focusTriggerOnMouseDown(event) {
    if (event.button !== 0 || event.ctrlKey) return;
    event.currentTarget.focus({ focusVisible: false });
}

/** Spread on a trigger whose tab has no panel, so `aria-controls` doesn't name a missing id. */
const NO_PANEL_PROPS = Object.freeze({ 'aria-controls': undefined });

/**
 * Segmented tab bar. Styles come from `theme.tabs_variants` (settings/theme/tabs.js):
 * - `variant="default"`: flat segmented control in NeoButton `bordered` colours, sliding pill.
 * - `variant="glass"`: NeoButton `glass` track with a lighter glass pill.
 * - `variant="secondary"`: underline.
 * A theme can add more; each entry's `indicator` (`'pill'` | `'line'`) picks the selection shape.
 *
 * @param {string} [variant] — key of `theme.tabs_variants` (`default`, `glass`, `secondary`, or a theme's own)
 * @param {string} [trackClassName] — the surface behind the row (e.g. `bg-muted`)
 * @param {string} [pillClassName] — the selection indicator (pill, or the underline for `indicator: 'line'`), e.g. a lighter pill on a tinted track
 * @param {string} [headerClassName]
 * @param {boolean} [rounded]
 * @param {boolean} [equalWidth] — When true (and `hug` is false), tabs share extra space equally; each tab keeps at least `min-content` width (label + padding).
 * @param {boolean} [fullWidth] — Deprecated: use `equalWidth` instead.
 * @param {boolean} [hug] — label-width triggers; use with `equalWidth={false}` for a compact strip
 * @param {'scroll'|'collapse'} [overflow] — `scroll` (default) or `collapse` into a "More" menu
 * @param {string} [moreMenuTitle] — label for the overflow trigger (default: translated "More"). Pass `""` for icon-only.
 * @param {string} [moreLabel] — alias for `moreMenuTitle` (deprecated)
 * @param {string} [moreMenuIcon] — Lucide icon name for the overflow trigger (default: `ChevronDown`)
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
}) {
    /** `fullWidth` is deprecated — same as `equalWidth` (first wins if both are set). */
    const useEqualWidth = equalWidth ?? fullWidth ?? false;
    const { t } = useTranslation();
    const resolvedMoreMenuTitle = moreMenuTitle ?? moreLabel ?? t('More');

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


    /** "More" menu opens when an overflow tab is active (keyboard arrows) and closes when back on-strip. */
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

    const onTabChangeRef = useRef(onTabChange);
    onTabChangeRef.current = onTabChange;

    const handleTabChange = useCallback((value) => {
        setCurrentTab(value);
        onTabChangeRef.current?.(value);
    }, []);

    const handleOverflowMenuSelect = useCallback(
        (item) => {
            markMenuSelect();
            handleTabChange(item.id);
        },
        [handleTabChange, markMenuSelect]
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
                if (indicator === 'line') {
                    top = topRel + heightRel - TABS_UNDERLINE_HEIGHT_PX;
                    height = TABS_UNDERLINE_HEIGHT_PX;
                } else {
                    top = topRel;
                    height = heightRel;
                }
                setRect((prev) =>
                    prev.left === left &&
                    prev.top === top &&
                    prev.width === width &&
                    prev.height === height
                        ? prev
                        : { left, top, width, height }
                );
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
    }, [currentTab, indicator, overflow, tabs, collapseLayout.visibleCount]);

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

    /**
     * The row wrapper's `onLayout` (ResizeObserver in `design/view.web.tsx`) re-measures
     * the pill whenever the row changes size. The first measurement can run before the
     * layout settles (web font swap, a parent that changes width), which left the pill
     * off its tab; window resize alone doesn't catch that.
     */
    const onHeaderLayout = useCallback(() => updateIndicator(), [updateIndicator]);

    const transitionStyle =
        ready
            ? {
                  transition: `left ${TABS_SELECTION_DURATION_MS}ms ${TABS_SELECTION_WEB_EASING}, top ${TABS_SELECTION_DURATION_MS}ms ${TABS_SELECTION_WEB_EASING}, width ${TABS_SELECTION_DURATION_MS}ms ${TABS_SELECTION_WEB_EASING}, height ${TABS_SELECTION_DURATION_MS}ms ${TABS_SELECTION_WEB_EASING}`,
              }
            : {};

    if (!tabs || tabs.length === 0) {
        return null;
    }

    const tabStretch =
        useEqualWidth && !hug
            ? /* min-w-min: never shrink below label + horizontal padding (min-w-0 squeezed long titles) */
              'flex-1 min-w-min basis-0 justify-center'
            : cn('shrink-0', hug && 'flex-none');
    const { moreIsActive, moreTriggerEndAlign, collapseHugStrip, tabBarWidthClass } =
        getTabsBarLayout({ overflow, hug, equalWidth: useEqualWidth, collapseLayout, currentTab });

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

    const scrollRow = (
        <View
            ref={listRef}
            className="relative z-[1] w-full min-w-0 overflow-x-auto overflow-y-hidden"
        >
            <View
                className={cn(
                    'relative',
                    hug ? 'w-max self-start' : 'min-w-full w-max',
                    listWrapperClassName
                )}
                ref={headerWrapperRef}
                onLayout={onHeaderLayout}
            >
                {selectionLayer}
                <TabsPrimitive.List
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
                            ref={(node) => {
                                if (node) triggerRefs.current[tab.key] = node;
                            }}
                            key={tab.key}
                            value={tab.key}
                            onMouseDown={focusTriggerOnMouseDown}
                            {...(hasTabContent(tab) ? null : NO_PANEL_PROPS)}
                            style={{
                                scrollMarginInline: scrollInset,
                            }}
                            className={cn(
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
                                className={getTabTextClass(tab.key === currentTab, sizeCfg, variantCfg)}
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
            <TabsMeasureRow
                key={collapseLayout.measureKey}
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

            {selectionLayer}

            <TabsPrimitive.List
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
                            ref={(node) => {
                                if (node) triggerRefs.current[tab.key] = node;
                            }}
                            key={tab.key}
                            value={tab.key}
                            onMouseDown={focusTriggerOnMouseDown}
                            {...(hasTabContent(tab) ? null : NO_PANEL_PROPS)}
                            className={cn(
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
                                className={getTabTextClass(tab.key === currentTab, sizeCfg, variantCfg)}
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
                                className={cn(
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
                    {collapseLayout.overflowTabs.map((tab) => (
                        <TabsPrimitive.Trigger
                            key={tab.key}
                            value={tab.key}
                            ref={(node) => {
                                if (node) triggerRefs.current[tab.key] = node;
                            }}
                            {...(hasTabContent(tab) ? null : NO_PANEL_PROPS)}
                            className="sr-only absolute h-px w-px overflow-hidden opacity-0 pointer-events-none"
                            tabIndex={-1}
                        >
                            <Text
                                className={getTabTextClass(tab.key === currentTab, sizeCfg, variantCfg)}
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
            className={cn(
                'relative z-[1] w-full min-w-0',
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
                            className={cn(
                                'relative min-w-0 w-full',
                                listWrapperClassName
                            )}
                            ref={headerWrapperRef}
                            onLayout={onHeaderLayout}
                        >
                            {collapseRowInner}
                        </View>
                    </View>
                </View>
            ) : (
                <View
                    className={cn(
                        'relative min-w-0 w-full',
                        listWrapperClassName
                    )}
                    ref={headerWrapperRef}
                    onLayout={onHeaderLayout}
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
            className={cn(
                tabsTheme['u-controls-tabs-container'],
                headerClassName
            )}
        >
            {/* Track outside the clipping box so its outer shadow (glass ring + drop) is not cut off. */}
            <View
                className={cn(
                    'relative min-w-0',
                    tabBarWidthClass,
                    overflow !== 'collapse' && tabBarClassName
                )}
            >
                {!collapseHugStrip && trackView}
                <View
                    className={cn(
                        // Clips the row to the track's corners. In collapse + hug the track and its own
                        // clip live in the w-max strip below; clipping here would cut the track's shadow.
                        'relative min-w-0 w-full',
                        !collapseHugStrip && cn('overflow-hidden', radiusTrack)
                    )}
                >
                    {overflow === 'collapse' ? collapseRow : scrollRow}
                </View>
            </View>

            {tabs.filter(hasTabContent).map((tab) => (
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
