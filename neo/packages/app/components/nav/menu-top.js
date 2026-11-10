import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { useCurrentUser } from 'app/context/user'
import { menuItemsByName, menuItemsByNameNew, appSetting, flattenMenuItemsForDropdown, mergeNavbarMoreWithLauncher, navbarItemsFromSiteMenu, navbarMoreItem, launcherItemsWithoutTabs } from 'app/lib/util'
import { useTranslation } from 'react-i18next'
import { components } from 'app/components/registry';
import { useMenuData } from 'app/context/menu-data';
import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

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
    const siteTabs = appSetting('menu_items', 'menu_navbar_site_tabs') ?? 5;
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

    // Compute active index based on current route
    const activeIndex = useMemo(() => {
        return menu_navbar_items.findIndex((item) => (item.link === '/' + url) || (item.link === '/' && uri === 'home'));
    }, [menu_navbar_items, url, uri]);

    // Track measured layouts for each tab item
    const [itemLayouts, setItemLayouts] = useState({});
    const [containerLayout, setContainerLayout] = useState({ x: 0, width: 0, measured: false });
    const handleContainerLayout = (layout) => setContainerLayout((prev) => nextContainerLayout(prev, layout));
    // The width every item needs with its label beside its icon, measured on a hidden copy of the
    // row. When the bar is narrower, every item puts its label under its icon in small type.
    const [inlineWidth, setInlineWidth] = useState(0);
    const stacked = isStacked(containerLayout.width, inlineWidth);

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
                {Array.from({ length: siteTabs + 2 }, (_, index) => (
                    <View key={`menu-top-skeleton-${index}`} className="flex-auto relative z-10">
                        <Row className="items-center justify-center px-2 h-12 min-w-16">
                            <View className="h-6 w-6 rounded-full bg-muted animate-pulse" />
                        </Row>
                    </View>
                ))}
            </Row>
        );
    }

    return (
        <Row
            className={`${appSetting('layout', 'header', 'content_center')} relative`}
            role="navigation"
            aria-label="Primary"
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
            <MenuTopProbe items={menu_navbar_items} t={t} onWidth={setInlineWidth} />
            {menu_navbar_items.map((item, index) => {
                const isActive = index === activeIndex;
                return (
                    <View key={`wrap-${index}`} onLayout={(e) => handleItemLayout(index, e?.nativeEvent?.layout)} className="flex-auto relative z-10">
                        <MenuTopItem
                            index={index}
                            link={item.link}
                            icon={item.icon}
                            isTitle={showsLabel(item, stacked)}
                            title={t(item.title)}
                            isActive={isActive}
                            stacked={stacked}
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

/** Labels go under the icons once the bar (measured) is narrower than every label beside its icon needs. */
function isStacked(barWidth, inlineWidth) {
    return barWidth > 0 && inlineWidth > barWidth
}

/** More is the menu icon alone beside labelled tabs; stacked, it gets its label under the icon with theirs. */
function showsLabel(item, stacked) {
    return !!item.showTitle || (stacked && item.name === 'more')
}

/**
 * A hidden copy of the bar with every label beside its icon, so MenuTop knows the width that
 * needs. It sits in a clipped box the nav's size (a copy wider than the bar would otherwise widen
 * the page and add a horizontal scrollbar), aria-hidden and invisible, with no links in it.
 */
function MenuTopProbe({ items, t, onWidth }) {
    return (
        <View aria-hidden className="absolute inset-0 overflow-hidden invisible pointer-events-none">
            <Row
                className="absolute left-0 top-0 w-max gap-2"
                onLayout={(e) => {
                    const width = Math.ceil(e?.nativeEvent?.layout?.width || 0);
                    onWidth((prev) => (prev === width ? prev : width));
                }}
            >
                {items.map((item) => (
                    <Row key={item.name || item.link || item.title} className={`items-center justify-center h-12 min-w-16 shrink-0 ${item.icon && item.showTitle ? 'ps-3 pe-2' : 'px-2'}`}>
                        {item.icon ? <View className="h-6 w-6 shrink-0" /> : null}
                        {item.showTitle ? (
                            <Text className="whitespace-nowrap tracking-tight font-medium text-sm px-2 leading-5">{t(item.title)}</Text>
                        ) : null}
                        {item.chevron ? <View className="h-4 w-4 shrink-0" /> : null}
                    </Row>
                ))}
            </Row>
        </View>
    )
}
