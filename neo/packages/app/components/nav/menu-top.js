import { View, Row } from 'app/design/view'
import { useCurrentUser } from 'app/context/user'
import { menuItemsByName, menuItemsByNameNew, appSetting, flattenMenuItemsForDropdown, mergeNavbarMoreWithLauncher, navbarItemsFromSiteMenu, navbarMoreItem, launcherItemsWithoutTabs } from 'app/lib/util'
import { useTranslation } from 'react-i18next'
import { components } from 'app/components/registry';
import { useMenuData } from 'app/context/menu-data';
import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { MENU_HIGHLIGHT_BAR_CLASS, useMenuHighlight } from 'app/ui/atoms/menu-highlight';
import { Text } from 'app/design/typography';
import { navbarTabsThatFit } from 'app/lib/navbar-fit';

// The bar's spacing (the Row's `gap-2`) and More's width (a 44px circle): the fit counts with them.
const TAB_GAP = 8;
const MORE_WIDTH = 44;
// The last fit, so a page that mounts the bar again (client navigation) shows the same row at once.
let __menuTopFit = { signature: '', available: 0, count: -1 };

// Persist indicator state across remounts (web/native)
let __menuTopIndicatorPersist = { initialized: false, translateX: 0, width: 0 };
// The indicator moves without a transition until it has shown and the bar has settled, then
// animates. The first time it shows it has no earlier position to move from: with the transitions
// it would grow from the nav's left edge and slide to its tab on every fresh load. And while the
// page hydrates the tabs can still shift (their content is swapped in a frame later), which it
// should follow at once, not slide after.
const INDICATOR_SETTLE_MS = 500;
let __menuTopIndicatorSettling = false;

// The transitions of the indicator's two layers: its background and the line.
const INDICATOR_TRANSITIONS = {
    bg: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease-out',
    line: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), width 1s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease-out',
};
// The ones in use: none until the settle window has passed.
let __menuTopIndicatorTransitions = { bg: 'none', line: 'none' };

/** Starts the settle window once, when the indicator first shows; transitions apply after it. */
function startIndicatorSettle() {
    if (__menuTopIndicatorSettling) return;
    __menuTopIndicatorSettling = true;
    setTimeout(() => { __menuTopIndicatorTransitions = INDICATOR_TRANSITIONS; }, INDICATOR_SETTLE_MS);
}

export default function MenuTop({ url, uri }) {
    const { currentUser } = useCurrentUser();
    const { t } = useTranslation()
    // Web: one hover highlight slides from tab to tab, as in the dropdown menus.
    const highlightRef = useMenuHighlight();
    // The launcher's apps join More when `layout.apps` is on: the `menu_launcher`
    // setting if set, else UNA's launcher menu.
    const showApps = !!appSetting('layout', 'apps');
    const staticLauncher = appSetting('menu_items', 'menu_launcher');
    const useStaticLauncher = Array.isArray(staticLauncher) && staticLauncher.length > 0;
    const { menuData: launcherMenuData } = useMenuData(
        showApps && !useStaticLauncher ? appSetting('menu_items', 'objects', 'launcher') : null
    );
    const launcherItems = useMemo(
        () => (!showApps
            ? []
            : useStaticLauncher
                ? menuItemsByName('', staticLauncher, currentUser)
                : menuItemsByNameNew('menu_post', launcherMenuData, currentUser)),
        [showApps, useStaticLauncher, staticLauncher, launcherMenuData, currentUser]
    );
    // No `menu_navbar` setting: the navbar comes from UNA's site menu.
    const staticNavbar = appSetting('menu_items', 'menu_navbar');
    const useSiteMenu = !Array.isArray(staticNavbar) || !staticNavbar.length;
    const { menuData: siteMenuData, isFetched: siteMenuFetched } = useMenuData(
        useSiteMenu ? appSetting('menu_items', 'objects', 'site') : null
    );
    // Optional upper limit on tabs after Home; 0 or unset: as many as fit, the rest go under More.
    const siteTabs = appSetting('menu_items', 'menu_navbar_site_tabs') ?? 0;
    // The menu's "Persistent items" (Studio > Navigation > Site menu): the first this many never go under More, as on the site.
    const persistent = useSiteMenu ? Number(siteMenuData?.persistent) || 0 : 0;
    const menu_navbar_items = useMemo(() => {
        const items = menuItemsByName(
            'main_menu',
            useSiteMenu
                ? navbarItemsFromSiteMenu(siteMenuData?.items, siteTabs)
                : staticNavbar,
            currentUser
        );
        // The launcher's apps belong in More, apart from those already shown as tabs; other
        // dropdowns keep their own items.
        const moreLauncherItems = launcherItemsWithoutTabs(launcherItems, items.filter((item) => item?.name !== 'more'));
        const merged = items.map((item) => {
            if (item?.name !== 'more' || (!item?.items?.length && !moreLauncherItems.length)) return item;
            return {
                ...item,
                items: mergeNavbarMoreWithLauncher(item.items || [], moreLauncherItems),
            };
        });
        // No More of its own (the site menu fits in the tabs): the apps still get one.
        if (moreLauncherItems.length && !merged.some((item) => item?.name === 'more')) {
            merged.push(navbarMoreItem(mergeNavbarMoreWithLauncher([], moreLauncherItems)));
        }
        return merged;
    }, [currentUser, launcherItems, useSiteMenu, siteMenuData, staticNavbar, siteTabs]);

    // Track measured layouts for each tab item
    const [itemLayouts, setItemLayouts] = useState({});
    const [containerLayout, setContainerLayout] = useState({ x: 0, width: 0, measured: false });
    const handleContainerLayout = (layout) => setContainerLayout((prev) => nextContainerLayout(prev, layout));

    // As UNA's main menu does it (BxDolMenuMoreAuto): the tabs that fit stay in the bar, in order, with their labels;
    // from the first that doesn't, the rest go to the top of More. Each tab's natural width comes from a hidden copy.
    const [tabWidths, setTabWidths] = useState({});
    const handleTabWidth = (key, width) => setTabWidths((prev) => (prev[key] === width ? prev : { ...prev, [key]: width }));
    const tabs = useMemo(() => menu_navbar_items.filter((item) => item?.name !== 'more'), [menu_navbar_items]);
    const moreItem = menu_navbar_items.find((item) => item?.name === 'more');
    const signature = tabs.map(tabKey).join('|');
    const widthsKnown = tabs.length > 0 && tabs.every((item) => tabWidths[tabKey(item)] > 0);
    const measured = containerLayout.measured && widthsKnown;
    const remembered = __menuTopFit.signature === signature ? __menuTopFit : null;
    let fitCount = tabs.length;
    if (measured) {
        fitCount = navbarTabsThatFit({
            widths: tabs.map((item) => tabWidths[tabKey(item)]),
            available: containerLayout.width,
            gap: TAB_GAP,
            more: MORE_WIDTH,
            persistent,
            moreAlways: !!moreItem?.items?.length,
        });
    } else if (remembered) {
        fitCount = remembered.count;
    }
    // Until the bar knows what fits (a fresh load), it stays invisible rather than show tabs that move.
    const ready = measured || !!remembered || Platform.OS !== 'web';
    useEffect(() => {
        if (measured) __menuTopFit = { signature, available: containerLayout.width, count: fitCount };
    }, [measured, signature, containerLayout.width, fitCount]);

    const shownItems = useMemo(() => {
        const overflow = tabs.slice(fitCount);
        const out = tabs.slice(0, fitCount);
        const moreItems = [...overflow, ...(moreItem?.items || [])];
        if (moreItems.length) out.push({ ...(moreItem || navbarMoreItem([])), items: moreItems });
        return out;
    }, [tabs, fitCount, moreItem]);

    // The current page's tab, or More when that tab is under it.
    const activeIndex = useMemo(() => {
        const isCurrent = (item) => (item?.link === '/' + url) || (item?.link === '/' && uri === 'home');
        const index = shownItems.findIndex(isCurrent);
        if (index >= 0) return index;
        const more = shownItems.findIndex((item) => item?.name === 'more');
        return more >= 0 && shownItems[more].items.slice(0, tabs.length - fitCount).some(isCurrent) ? more : -1;
    }, [shownItems, url, uri, tabs.length, fitCount]);

    const handleItemLayout = (index, layout) => {
        setItemLayouts((prev) => {
            const width = layout?.width || 0;
            const x = layout?.x || 0;
            if (prev[index] && prev[index].width === width && prev[index].x === x) return prev;
            return { ...prev, [index]: { width, x } };
        });
    };

    // The indicator is a pure function of the measured layouts. Deriving it in
    // render (instead of mirroring it into state from an effect) avoids a
    // setState-in-effect cascade: while this fiber still holds a low-priority
    // update (e.g. the onLayout updates queued during idle hydration of the page
    // Suspense boundary) React cannot bail out of a no-op dispatch eagerly, and a
    // sync render that replays those queued updaters gives itemLayouts a new
    // identity every time — an effect keyed on it would loop forever.
    const target = activeIndex >= 0 ? itemLayouts[activeIndex] : null;
    const isMeasured = !!target
        && typeof target.x === 'number' && typeof target.width === 'number'
        && (Platform.OS !== 'web' || containerLayout.measured);
    let indicatorStyle;
    if (activeIndex === -1) {
        indicatorStyle = { translateX: 0, width: 0, visible: false };
    } else if (!isMeasured) {
        // Keep the last known dimensions but hide the indicator until the active tab is measured.
        indicatorStyle = {
            translateX: __menuTopIndicatorPersist.translateX,
            width: __menuTopIndicatorPersist.width,
            visible: false,
        };
    } else {
        indicatorStyle = {
            translateX: Platform.OS === 'web' ? target.x - containerLayout.x : target.x,
            width: target.width,
            visible: true,
        };
    }

    const indicatorTransitions = __menuTopIndicatorTransitions;

    // Persist for future remounts
    useEffect(() => {
        if (!indicatorStyle.visible) return;
        __menuTopIndicatorPersist = {
            initialized: true,
            translateX: indicatorStyle.translateX,
            width: indicatorStyle.width,
        };
        startIndicatorSettle();
    }, [indicatorStyle.visible, indicatorStyle.translateX, indicatorStyle.width]);

    const MenuTopItem = components['menu-item']['topmenu'];

    // Like the footer: placeholders until the site menu arrives, so the bar
    // doesn't grow from Home alone to every tab. Home, the tabs and More.
    if (useSiteMenu && !siteMenuFetched) {
        return (
            <Row className={`${appSetting('layout', 'header', 'content_center')} relative`} role="navigation" aria-label="Primary" aria-busy>
                {Array.from({ length: (siteTabs || 5) + 2 }, (_, index) => (
                    <View key={`menu-top-skeleton-${index}`} className="flex-none relative z-10">
                        <Row className="items-center justify-center gap-2 ps-3 pe-4 h-11 min-w-11">
                            <View className="h-6 w-6 rounded-full bg-muted animate-pulse" />
                            <View className="h-4 w-12 rounded-full bg-muted animate-pulse" />
                        </Row>
                    </View>
                ))}
            </Row>
        );
    }

    return (
        <Row
            ref={highlightRef}
            className={`${appSetting('layout', 'header', 'content_center')} relative ${MENU_HIGHLIGHT_BAR_CLASS}`}
            role="navigation"
            aria-label="Primary"
            style={ready ? undefined : { opacity: 0 }}
            onLayout={(e) => handleContainerLayout(e?.nativeEvent?.layout)}
        >
            <View
                className={`${appSetting('layout', 'header', 'active_item_indicator_bg')}`}
                style={{
                    width: indicatorStyle.width,
                    transform: `translateX(${indicatorStyle.translateX}px)`,
                    opacity: indicatorStyle.visible ? 1 : 0,
                    pointerEvents: 'none',
                    zIndex: 0,
                    transition: indicatorTransitions.bg
                }}
            />

            <View
                className={`${appSetting('layout', 'header', 'active_item_indicator')}`}
                style={{
                    width: indicatorStyle.width,
                    transform: `translateX(${indicatorStyle.translateX}px)`,
                    opacity: indicatorStyle.visible ? 1 : 0,
                    pointerEvents: 'none',
                    zIndex: 0,
                    transition: indicatorTransitions.line
                }}
            />
            <MenuTopProbe items={tabs} t={t} onWidth={handleTabWidth} />
            {shownItems.map((item, index) => {
                const isActive = index === activeIndex;
                return (
                    <View key={`wrap-${tabKey(item)}`} onLayout={(e) => handleItemLayout(index, e?.nativeEvent?.layout)} className="flex-none relative z-10">
                        <MenuTopItem
                            index={index}
                            link={item.link}
                            icon={item.icon}
                            isTitle={!!item.showTitle}
                            title={t(item.title)}
                            isActive={isActive}
                            items={flattenMenuItemsForDropdown(item.items)}
                            chevron={item.chevron}
                            animated={item.animated}
                            addClassName={item.addClassName}
                            columns={item.columns ?? appSetting('menu_items', 'menu_navbar_more_columns')}
                        />
                    </View>
                );
            })}
        </Row>

    )
}

/** The nav's measured position and width; the same object while neither changed (no re-render). */
function nextContainerLayout(prev, layout) {
    const x = layout?.x || 0
    const width = layout?.width || 0
    if (prev.measured && prev.x === x && prev.width === width) return prev
    return { x, width, measured: true }
}

/** A tab's stable key: its name, else its link, else its title. */
function tabKey(item) {
    return String(item?.name || item?.link || item?.title || '')
}

/**
 * A hidden copy of every tab with its label beside its icon, which reports each tab's natural width (the classes
 * are the tab's own, components/menu-items/topmenu.tsx: change them together). It sits in a clipped box the bar's
 * size (a copy wider than the bar would otherwise widen the page), aria-hidden and invisible, with no links in it.
 */
function MenuTopProbe({ items, t, onWidth }) {
    return (
        <View aria-hidden className="absolute inset-0 overflow-hidden invisible pointer-events-none">
            <Row className="absolute left-0 top-0 w-max gap-2">
                {items.map((item) => (
                    <Row
                        key={tabKey(item)}
                        className={`items-center justify-center gap-2 h-11 min-w-11 shrink-0 ${item.icon && item.showTitle ? 'ps-3 pe-4' : 'px-2.5'}`}
                        onLayout={(e) => onWidth(tabKey(item), Math.ceil(e?.nativeEvent?.layout?.width || 0))}
                    >
                        {item.icon ? <View className="h-6 w-6 shrink-0" /> : null}
                        {item.showTitle ? (
                            <Text className="whitespace-nowrap font-medium text-base leading-6">{t(item.title)}</Text>
                        ) : null}
                        {item.chevron ? <View className="h-4 w-4 shrink-0" /> : null}
                    </Row>
                ))}
            </Row>
        </View>
    )
}
