import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { appSetting, cn } from 'app/lib/util';
import { useTabsCollapseLayout } from 'app/ui/molecules/tabs/use-tabs-collapse-layout';
import { TABS_SCROLL_INTO_VIEW_PADDING_PX } from 'app/ui/molecules/tabs/tabs-selection-constants';

/**
 * Platform-neutral part of `Tabs` (tabs.js = native, tabs.web.js = web).
 * Only what both platforms compute the same way lives here: theme config,
 * sizing/radii, the "More" (collapse) menu state and the hidden measure row.
 * Indicator measurement, scrolling and the trigger markup stay per platform.
 */

export const tabsTheme = appSetting('theme', 'tabs');
export const tabsSizes = appSetting('theme', 'tabs_sizes');
const rawTabsVariants = appSetting('theme', 'tabs_variants');
export const tabsVariants =
    rawTabsVariants && typeof rawTabsVariants === 'object'
        ? rawTabsVariants
        : {};

/** Stable fallback so size config is never a fresh (mutable) object per render. */
const EMPTY_SIZE_CFG = Object.freeze({});

/** Size / variant config and the radii derived from it. Pure. */
export function getTabsSizing({ size, variant, rounded }) {
    const currentSizeKey = size || tabsSizes?.default_size || 'md';
    const sizeCfg = tabsSizes?.[currentSizeKey] || tabsSizes?.md || EMPTY_SIZE_CFG;
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

    return {
        currentSizeKey,
        sizeCfg,
        variantCfg,
        radiusTrack,
        radiusRow,
        radiusPill,
        gapPx: sizeCfg.gap_px ?? 4,
        /** Primitive on purpose: React Compiler treats fields read off a returned object as mutable. */
        scrollInset: sizeCfg.scroll_inset ?? TABS_SCROLL_INTO_VIEW_PADDING_PX,
        listHorizontalPad: 2 * (sizeCfg.scroll_inset ?? TABS_SCROLL_INTO_VIEW_PADDING_PX),
        moreIconSize: currentSizeKey === 'lg' ? 20 : currentSizeKey === 'sm' ? 16 : 18,
    };
}

/**
 * `overflow="collapse"`: which tabs fit, and the "More" menu for the rest.
 * Call `markMenuSelect()` before switching tabs from the menu so the effect
 * below doesn't reopen it.
 */
export function useTabsMoreMenu({ overflow, tabs, gapPx, listHorizontalPad, equalWidth, currentTab }) {
    const collapseLayout = useTabsCollapseLayout({
        overflow,
        tabs,
        gapPx,
        contentPaddingHorizontal:
            overflow === 'collapse' ? listHorizontalPad : 0,
        equalWidth,
    });
    /** After picking a tab from the "More" menu, skip auto-reopen (effect would see overflow active and open again). */
    const dismissAfterMenuSelectRef = useRef(false);

    const [moreMenuOpen, setMoreMenuOpen] = useState(false);
    useEffect(() => {
        if (overflow !== 'collapse') return;
        if (!collapseLayout.overflowTabs?.length) {
            setMoreMenuOpen(false);
            return;
        }
        if (dismissAfterMenuSelectRef.current) {
            dismissAfterMenuSelectRef.current = false;
            setMoreMenuOpen(false);
            return;
        }
        if (collapseLayout.isActiveInOverflow(currentTab)) {
            /**
             * Native `DropdownMenu` uses a full-screen `Modal` + backdrop. Auto-opening it here made the
             * whole screen non-interactive (and could fight layout) whenever the active tab lived in overflow.
             * Web keeps open-on-overflow for keyboard/focus parity.
             */
            setMoreMenuOpen(Platform.OS === 'web');
        } else {
            setMoreMenuOpen(false);
        }
    }, [
        overflow,
        currentTab,
        collapseLayout.visibleCount,
        collapseLayout.overflowTabs.length,
    ]);

    const overflowMenuItems = useMemo(
        () =>
            collapseLayout.overflowTabs.map((tab) => ({
                id: tab.key,
                title: tab.title,
            })),
        [collapseLayout.overflowTabs]
    );

    const markMenuSelect = useCallback(() => {
        dismissAfterMenuSelectRef.current = true;
    }, []);

    return { collapseLayout, moreMenuOpen, setMoreMenuOpen, overflowMenuItems, markMenuSelect };
}

/** Bar width / "More" alignment classes. Pure. */
export function getTabsBarLayout({ overflow, hug, equalWidth, collapseLayout, currentTab }) {
    return {
        moreIsActive: collapseLayout.isActiveInOverflow(currentTab),
        moreTriggerEndAlign:
            collapseLayout.overflowTabs.length > 0 && !(equalWidth && !hug),
        /** Full-width row for collapse measurement; track + pills sit in a `w-max` strip when hug so the track hugs tab width. */
        collapseHugStrip: overflow === 'collapse' && hug,
        tabBarWidthClass:
            overflow === 'collapse'
                ? 'w-full min-w-0'
                : hug
                  ? 'w-max max-w-full self-start'
                  : 'w-full',
    };
}

/**
 * Off-screen copy of the tab row: `useTabsCollapseLayout` measures each tab's natural width from it.
 * `ViewComponent`: native passes RN `View` (as before — no design wrapper in the measured tree).
 */
export function TabsMeasureRow({ ViewComponent = View, tabs, collapseLayout, variantCfg, radiusRow, radiusPill, sizeCfg, tabStretch, equalWidth, hug }) {
    return (
        <ViewComponent
            className={cn(
                tabsTheme['u-controls-tabs-header-row'],
                variantCfg.row,
                radiusRow,
                sizeCfg.header,
                'flex flex-row flex-nowrap !flex-none shrink-0 min-w-0',
                equalWidth && !hug && 'w-full'
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
                <ViewComponent
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
                </ViewComponent>
            ))}
        </ViewComponent>
    );
}
