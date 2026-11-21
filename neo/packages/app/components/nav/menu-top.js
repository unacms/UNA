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
import { navbarRowStart, navbarRowWidth, navbarTabBox, navbarTabsThatFit } from 'app/lib/navbar-fit';

// The bar's spacing (the Row's `gap-2`) and More's width (a 44px circle): the fit counts with them.
const TAB_GAP = 8;
const MORE_WIDTH = 44;
// The last fit, so a page that mounts the bar again (client navigation) shows the same row at once.
let __menuTopFit = { signature: '', available: 0, count: -1 };
// Where the last centred row started in its bar, so a page that mounts the bar again starts it there before it measures.
let __menuTopRowStart = null;

// Persist indicator state across remounts (web/native)
let __menuTopIndicatorPersist = { initialized: false, translateX: 0, width: 0 };
// The indicator moves without a transition until it has shown and the bar has settled, then
// animates. The first time it shows it has no earlier position to move from: with the transitions
// it would grow from the nav's left edge and slide to its tab on every fresh load. And while the
// page hydrates the tabs can still shift (their content is swapped in a frame later), which it
// should follow at once, not slide after.
const INDICATOR_SETTLE_MS = 500;
let __menuTopIndicatorSettling = false;

// The first time the indicator shows, it waits until its place has held for this long: when the site menu arrives the
// tabs replace the placeholders and the bar is measured at the placeholders' width for a frame, so the place first
// worked out is off and the indicator would jump to its tab. It then fades in and the line slides up into place.
const INDICATOR_REVEAL_MS = 200;
let __menuTopIndicatorRevealed = false;
const INDICATOR_REVEAL = 'opacity 0.25s ease-out, translate 0.25s ease-out';

// The transitions of the indicator's two layers: its background and the line.
const INDICATOR_TRANSITIONS = {
    bg: `transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1), ${INDICATOR_REVEAL}`,
    line: `transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), width 1s cubic-bezier(0.4, 0, 0.2, 1), ${INDICATOR_REVEAL}`,
};
// The ones in use: until the settle window has passed only the reveal (fade, slide up) animates; the place follows
// the tabs at once.
let __menuTopIndicatorTransitions = { bg: INDICATOR_REVEAL, line: INDICATOR_REVEAL };

/** Starts the settle window once, when the indicator first shows; transitions apply after it. */
function startIndicatorSettle() {
    if (__menuTopIndicatorSettling) return;
    __menuTopIndicatorSettling = true;
    setTimeout(() => { __menuTopIndicatorTransitions = INDICATOR_TRANSITIONS; }, INDICATOR_SETTLE_MS);
}

/**
 * @param align where the tabs sit in the bar: `start`, `center` or `end` (UNA's Designer, lib/header-layout.ts)
 * @param headerBox the header row's place in the window ({x, width}): centred tabs are centred on it
 */
export default function MenuTop({ url, uri, align = 'center', headerBox = null }) {
    const { currentUser } = useCurrentUser();
    const { t } = useTranslation()
    // Web: one hover highlight slides from tab to tab, as in the dropdown menus.
    const highlightRef = useMenuHighlight();
    // The launcher's apps join More when `layout.apps` and `layout.apps_in_more` are on: the `menu_launcher`
    // setting if set, else UNA's launcher menu. Off by default, so More holds what UNA's site has there.
    const showApps = !!appSetting('layout', 'apps') && !!appSetting('layout', 'apps_in_more');
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

    const [containerLayout, setContainerLayout] = useState({ x: 0, width: 0, measured: false });
    const handleContainerLayout = (layout) => setContainerLayout((prev) => nextContainerLayout(prev, layout));

    // As UNA's main menu does it (BxDolMenuMoreAuto): the tabs that fit stay in the bar, in order, with their labels;
    // from the first that doesn't, the rest go to the top of More.
    const tabs = useMemo(() => menu_navbar_items.filter((item) => item?.name !== 'more'), [menu_navbar_items]);
    const moreItem = menu_navbar_items.find((item) => item?.name === 'more');
    const { fitCount, ready, tabWidths, handleTabWidth } = useNavbarFit(tabs, moreItem, containerLayout, persistent);
    const shownItems = useMemo(() => navbarShownItems(tabs, fitCount, moreItem), [tabs, fitCount, moreItem]);
    const activeIndex = useMemo(() => navbarActiveIndex(shownItems, tabs.length - fitCount, url, uri), [shownItems, tabs.length, fitCount, url, uri]);

    // The indicator is a pure function of the measured widths: the tabs sit in a centred row, so the active tab's place
    // follows from the widths before it (navbarTabBox). Deriving it in render (instead of mirroring it into state from
    // an effect) avoids a setState-in-effect cascade during idle hydration of the page Suspense boundary.
    const shownWidths = shownItems.map((item) => tabWidths[tabKey(item)] || (item?.name === 'more' ? MORE_WIDTH : 0));
    // Where the row starts in the bar. In the middle it is centred on the header, not in the bar between the logo and
    // the actions, which are not as wide: the bar's padding moves it there, as far as the bar leaves room (its width
    // stays, so the fit doesn't change). Until both are measured a remounted bar starts it where it last did.
    const rowWidth = navbarRowWidth(shownWidths, TAB_GAP);
    const headerCentre = headerBox && headerBox.width > 0 ? headerBox.x + headerBox.width / 2 - containerLayout.x : null;
    const isCentred = align === 'center';
    const rowStart = containerLayout.measured ? navbarRowStart(align, containerLayout.width, rowWidth, headerCentre) : null;
    const isRowPlaced = isCentred && rowStart !== null && headerCentre !== null && rowStart >= 0;
    const barPadding = isRowPlaced ? rowStart : (isCentred && !containerLayout.measured ? __menuTopRowStart : null);
    useEffect(() => {
        if (isRowPlaced) __menuTopRowStart = rowStart;
    }, [isRowPlaced, rowStart]);
    const target = ready && containerLayout.measured && activeIndex >= 0 && shownWidths[activeIndex] > 0
        ? navbarTabBox(shownWidths, activeIndex, containerLayout.width, TAB_GAP, rowStart ?? undefined)
        : null;
    const { indicatorStyle, isIndicatorShown, isIndicatorRevealed } = useNavbarIndicator(target, activeIndex);
    const indicatorTransitions = __menuTopIndicatorTransitions;

    const MenuTopItem = components['menu-item']['topmenu'];

    // Like the footer: placeholders until the site menu arrives, so the bar
    // doesn't grow from Home alone to every tab. Home, the tabs and More.
    if (useSiteMenu && !siteMenuFetched) {
        return (
            <Row className={`${appSetting('layout', 'header', 'content_center')} ${appSetting('layout', 'header', 'content_center_align')?.[align] ?? ''} relative`} role="navigation" aria-label="Primary" aria-busy>
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
            className={`${appSetting('layout', 'header', 'content_center')} ${typeof barPadding === 'number' ? 'justify-start' : (appSetting('layout', 'header', 'content_center_align')?.[align] ?? '')} relative ${MENU_HIGHLIGHT_BAR_CLASS}`}
            role="navigation"
            aria-label="Primary"
            style={{
                ...(ready ? null : { opacity: 0 }),
                ...(typeof barPadding === 'number' ? { paddingLeft: barPadding } : null),
            }}
            onLayout={(e) => handleContainerLayout(e?.nativeEvent?.layout)}
        >
            <View
                className={`${appSetting('layout', 'header', 'active_item_indicator_bg')}`}
                style={{
                    width: indicatorStyle.width,
                    transform: `translateX(${indicatorStyle.translateX}px)`,
                    opacity: isIndicatorShown ? 1 : 0,
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
                    // The line rises 4px into place as it first fades in; after that it keeps its height (a tab switch
                    // can hide it for a frame while the new tab is measured, and it must not dip then).
                    translate: isIndicatorRevealed ? '0 0' : '0 4px',
                    opacity: isIndicatorShown ? 1 : 0,
                    pointerEvents: 'none',
                    zIndex: 0,
                    transition: indicatorTransitions.line
                }}
            />
            <MenuTopProbe items={[...tabs, moreItem || navbarMoreItem([])]} t={t} onWidth={handleTabWidth} />
            {shownItems.map((item, index) => {
                const isActive = index === activeIndex;
                return (
                    <View key={`wrap-${tabKey(item)}`} className="flex-none relative z-10">
                        <MenuTopItem
                            index={index}
                            link={item.link}
                            icon={item.icon}
                            isTitle={!!item.showTitle}
                            title={t(item.title)}
                            isActive={isActive}
                            items={item.items ? markCurrentRows(flattenMenuItemsForDropdown(item.items), url, uri) : undefined}
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

/**
 * The active tab's indicator: where it goes (`target`, from the measured widths) and whether it shows. Until the active
 * tab is measured it keeps the last place, hidden; the first time it shows it waits until its place has held for
 * INDICATOR_REVEAL_MS, then fades in.
 */
function useNavbarIndicator(target, activeIndex) {
    const isMeasured = !!target;
    let indicatorStyle;
    if (activeIndex === -1) {
        indicatorStyle = { translateX: 0, width: 0, visible: false };
    } else if (!isMeasured) {
        // Until the active tab is measured the indicator stays where it last was: hidden before it has ever shown,
        // shown once it has (a tab switch mounts the bar again), so it slides from the old tab to the new one instead
        // of fading out and in.
        indicatorStyle = {
            translateX: __menuTopIndicatorPersist.translateX,
            width: __menuTopIndicatorPersist.width,
            visible: __menuTopIndicatorRevealed && __menuTopIndicatorPersist.initialized,
        };
    } else {
        indicatorStyle = {
            translateX: target.x,
            width: target.width,
            visible: true,
        };
    }


    // Revealed once its place has held for INDICATOR_REVEAL_MS (every change restarts the wait); for good after that,
    // so a tab switch or a later mount moves it at once.
    const [revealed, setRevealed] = useState(__menuTopIndicatorRevealed);
    const targetKey = target ? `${Math.round(target.x)}:${Math.round(target.width)}` : '';
    useEffect(() => {
        if (revealed || !targetKey) return undefined;
        const timer = setTimeout(() => {
            __menuTopIndicatorRevealed = true;
            setRevealed(true);
        }, INDICATOR_REVEAL_MS);
        return () => clearTimeout(timer);
    }, [revealed, targetKey]);
    const isIndicatorShown = indicatorStyle.visible && revealed;

    // Persist for future remounts
    useEffect(() => {
        if (!isIndicatorShown) return;
        __menuTopIndicatorPersist = {
            initialized: true,
            translateX: indicatorStyle.translateX,
            width: indicatorStyle.width,
        };
        startIndicatorSettle();
    }, [isIndicatorShown, indicatorStyle.translateX, indicatorStyle.width]);
    return { indicatorStyle, isIndicatorShown, isIndicatorRevealed: revealed };
}

/** The nav's measured position and width; the same object while neither changed (no re-render). */
function nextContainerLayout(prev, layout) {
    const x = layout?.x || 0
    const width = layout?.width || 0
    if (prev.measured && prev.x === x && prev.width === width) return prev
    return { x, width, measured: true }
}

/**
 * How many tabs stay in the bar: every tab's natural width from the hidden copy (MenuTopProbe), the bar's width and
 * the menu's persistent items, through navbarTabsThatFit. Until both are measured on a fresh load the bar is not
 * `ready` (it stays invisible rather than show tabs that move); a later mount reuses the last fit.
 */
function useNavbarFit(tabs, moreItem, containerLayout, persistent) {
    const [tabWidths, setTabWidths] = useState({});
    const handleTabWidth = (key, width) => setTabWidths((prev) => (prev[key] === width ? prev : { ...prev, [key]: width }));
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
            more: tabWidths.more || MORE_WIDTH,
            persistent,
            moreAlways: !!moreItem?.items?.length,
        });
    } else if (remembered) {
        fitCount = remembered.count;
    }
    useEffect(() => {
        if (measured) __menuTopFit = { signature, available: containerLayout.width, count: fitCount };
    }, [measured, signature, containerLayout.width, fitCount]);
    return { fitCount, ready: measured || !!remembered || Platform.OS !== 'web', tabWidths, handleTabWidth };
}

/** The bar's items: the tabs that fit, then More with the rest of the tabs first and its own items after them. */
function navbarShownItems(tabs, fitCount, moreItem) {
    const out = tabs.slice(0, fitCount);
    const moreItems = [...tabs.slice(fitCount), ...(moreItem?.items || [])];
    if (moreItems.length) out.push({ ...(moreItem || navbarMoreItem([])), items: moreItems });
    return out;
}

/** The current page's tab, or More when that tab is among the `overflow` tabs at the top of More; -1 for neither. */
/** The tab (or More row) of the page at `url` / `uri`. */
function isCurrentTab(item, url, uri) {
    // No url (a 404): no tab is the current page.
    return (url != null && item?.link === '/' + url) || (item?.link === '/' && uri === 'home');
}

/** More's rows, the current page's marked `current` (drawn as the current tab, topmenu.tsx). */
function markCurrentRows(items, url, uri) {
    return items.map((item) => (isCurrentTab(item, url, uri) ? { ...item, current: true } : item));
}

function navbarActiveIndex(shownItems, overflow, url, uri) {
    const isCurrent = (item) => isCurrentTab(item, url, uri);
    const index = shownItems.findIndex(isCurrent);
    if (index >= 0) return index;
    const more = shownItems.findIndex((item) => item?.name === 'more');
    return more >= 0 && shownItems[more].items.slice(0, overflow).some(isCurrent) ? more : -1;
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
                            <Text className="whitespace-nowrap font-medium text-sm leading-5">{t(item.title)}</Text>
                        ) : null}
                        {item.chevron ? <View className="h-4 w-4 shrink-0" /> : null}
                    </Row>
                ))}
            </Row>
        </View>
    )
}
