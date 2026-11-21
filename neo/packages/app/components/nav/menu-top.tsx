import type { ComponentType } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next'
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography';
import { useCurrentUser } from 'app/context/user'
import { useMenuData } from 'app/context/menu-data';
import { components } from 'app/components/registry';
import type { MenuTopItemProps } from 'app/components/menu-items/topmenu';
import { menuItemsByName, menuItemsByNameNew, appSetting, flattenMenuItemsForDropdown, mergeNavbarMoreWithLauncher, navbarItemsFromSiteMenu, navbarMoreItem, launcherItemsWithoutTabs } from 'app/lib/util'
import type { MenuItem } from 'app/lib/util/menu';
import type { HeaderAlign } from 'app/lib/header-layout';
import { MENU_HIGHLIGHT_BAR_CLASS, useMenuHighlight } from 'app/ui/atoms/menu-highlight';
import { navbarBoxWidth, navbarRowStart, navbarRowWidth, navbarTabBox, navbarTabsThatFit, navbarUnfittedTabSide } from 'app/lib/navbar-fit';
import { menuViewerKey } from 'app/lib/menu-remember';

type Translate = ReturnType<typeof useTranslation>['t'];
/** The bar's measured place: `measured` false until its first layout. */
type BarLayout = { x: number; width: number; measured: boolean };
/** A tab's place in the bar. */
type TabBox = { x: number; width: number };
/** Each tab's natural width by its key (`tabKey`), More's under `more`. */
type TabWidths = Record<string, number>;
type LayoutBox = { x?: number; width?: number } | null | undefined;

export type MenuTopProps = {
    /** The page's url and uri: its tab is the current one. Null on a 404, where no tab is. */
    url?: string | null;
    uri?: string | null;
    /** Where the tabs sit in the bar (UNA's Designer, lib/header-layout.ts). */
    align?: HeaderAlign;
};

// The bar's spacing (the Row's `gap-2`) and More's width (a 44px circle): the fit counts with them.
const TAB_GAP = 8;
const MORE_WIDTH = 44;
// The last fit and the bar's own width (`box`), so a page that mounts the bar again (client navigation) shows the same
// row in the same bar at once.
let __menuTopFit: { signature: string; available: number; count: number; box: number } = { signature: '', available: 0, count: -1, box: 0 };

// Before the fit is measured (the server's HTML, the placeholders) every tab is in the row, which wraps and shows its
// first line only. Each tab keeps More's room after it (TAB_GAP + MORE_WIDTH: 52px, `me-13`) and the next takes it
// back (`-ms-13`), so the line breaks where the fit puts More (`navbarUnfittedTabSide`, lib/navbar-fit.ts, with the
// test that the two agree): the same tabs in the same place, and only More is missing until the bar is measured.
const UNFITTED_BAR = 'flex-wrap web:overflow-y-clip';
const UNFITTED_TAB = { none: '', reserve: 'me-13', takeBack: '-ms-13', both: '-ms-13 me-13' };
function unfittedTabClass(index: number, count: number, moreAlways: boolean): string {
    const { takeBack, reserve } = navbarUnfittedTabSide(index, count, moreAlways);
    if (takeBack) return reserve ? UNFITTED_TAB.both : UNFITTED_TAB.takeBack;
    return reserve ? UNFITTED_TAB.reserve : UNFITTED_TAB.none;
}
// Placeholders while a member's menu loads for the first time on this device: more than any bar holds, the row
// shows the ones that fit.
const SKELETON_TABS = 12;

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
 * The header's menu items: the tabs and More. From UNA's site menu, or the `menu_navbar` setting when it pins them;
 * the launcher's apps join More when `layout.apps` and `layout.apps_in_more` are on. `isLoading`: the site menu has
 * not arrived and nothing is kept from an earlier visit, so the bar draws placeholders.
 */
function useNavbarItems() {
    const { currentUser } = useCurrentUser();
    // The launcher's apps join More when `layout.apps` and `layout.apps_in_more` are on: the `menu_launcher`
    // setting if set, else UNA's launcher menu. Off by default, so More holds what UNA's site has there.
    const showApps = !!appSetting('layout', 'apps') && !!appSetting('layout', 'apps_in_more');
    const staticLauncher = appSetting('menu_items', 'menu_launcher');
    const useStaticLauncher = Array.isArray(staticLauncher) && staticLauncher.length > 0;
    const { menuData: launcherMenuData } = useMenuData(
        showApps && !useStaticLauncher ? appSetting('menu_items', 'objects', 'launcher') : null
    );
    const launcherItems = useMemo(() => {
        if (!showApps) return [];
        return useStaticLauncher
            ? menuItemsByName('', staticLauncher, currentUser)
            : menuItemsByNameNew('menu_post', launcherMenuData, currentUser);
    }, [showApps, useStaticLauncher, staticLauncher, launcherMenuData, currentUser]);
    // No `menu_navbar` setting: the navbar comes from UNA's site menu.
    const staticNavbar = appSetting('menu_items', 'menu_navbar');
    const useSiteMenu = !Array.isArray(staticNavbar) || !staticNavbar.length;
    // A member's menu is kept on the device (lib/menu-remember.ts): a page that loads again draws its tabs at once and
    // UNA's answer replaces them, so placeholders show only the first time.
    const { menuData: siteMenuData, isFetched: siteMenuFetched } = useMenuData(
        useSiteMenu ? appSetting('menu_items', 'objects', 'site') : null,
        { rememberFor: menuViewerKey(currentUser) }
    );
    // Optional upper limit on tabs after Home; 0 or unset: as many as fit, the rest go under More.
    const siteTabs: number = appSetting('menu_items', 'menu_navbar_site_tabs') ?? 0;
    // The menu's "Persistent items" (Studio > Navigation > Site menu): the first this many never go under More, as on the site.
    const persistent = useSiteMenu ? Number(siteMenuData?.persistent) || 0 : 0;
    const items = useMemo(() => {
        const own = menuItemsByName(
            'main_menu',
            useSiteMenu
                ? navbarItemsFromSiteMenu(siteMenuData?.items, siteTabs)
                : staticNavbar,
            currentUser
        );
        // The launcher's apps belong in More, apart from those already shown as tabs; other
        // dropdowns keep their own items.
        const moreLauncherItems = launcherItemsWithoutTabs(launcherItems, own.filter((item) => item?.name !== 'more'));
        const merged = own.map((item) => {
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

    return { items, isLoading: useSiteMenu && !siteMenuData && !siteMenuFetched, siteTabs, persistent };
}

/**
 * Placeholders until the menu arrives, in the bar the tabs will have: the same width limit, the same place in the
 * header and the same row, clipped to the bar (a menu's own width is not known yet, so the bar is as wide as the
 * limit allows). `count` pills are drawn, more than a bar holds: the row shows the ones that fit.
 */
function MenuTopSkeleton({ className, maxWidth, count }: Readonly<{ className: string; maxWidth?: number; count: number }>) {
    return (
        <Row className={`${className} ${UNFITTED_BAR}`} style={{ maxWidth, width: maxWidth ?? '100%' }} role="navigation" aria-label="Primary" aria-busy>
            {Array.from({ length: count }, (_, index) => (
                <View key={`menu-top-skeleton-${index}`} className={`flex-none relative z-10 ${unfittedTabClass(index, count, true)}`}>
                    <Row className="items-center justify-center gap-2 ps-3 pe-4 h-11 min-w-11">
                        <View className="h-6 w-6 rounded-full bg-muted animate-pulse" />
                        <View className="h-4 w-12 rounded-full bg-muted animate-pulse" />
                    </Row>
                </View>
            ))}
        </Row>
    );
}

/** The header's main menu, from `lg` (web). */
export default function MenuTop({ url, uri, align = 'center' }: Readonly<MenuTopProps>) {
    const { t } = useTranslation()
    // Web: one hover highlight slides from tab to tab, as in the dropdown menus.
    const highlightRef = useMenuHighlight();
    const { items: menu_navbar_items, isLoading, siteTabs, persistent } = useNavbarItems();

    const [containerLayout, setContainerLayout] = useState<BarLayout>({ x: 0, width: 0, measured: false });
    const handleContainerLayout = (layout: LayoutBox) => setContainerLayout((prev) => nextContainerLayout(prev, layout));

    // As UNA's main menu does it (BxDolMenuMoreAuto): the tabs that fit stay in the bar, in order, with their labels;
    // from the first that doesn't, the rest go to the top of More.
    const tabs = useMemo(() => menu_navbar_items.filter((item) => item?.name !== 'more'), [menu_navbar_items]);
    const moreItem = menu_navbar_items.find((item) => item?.name === 'more');
    const moreAlways = !!moreItem?.items?.length;
    const { fitCount, fitted, boxWidth, tabWidths, handleTabWidth } = useNavbarFit(tabs, moreAlways, containerLayout, persistent);
    const shownItems = useMemo(
        () => (fitted ? navbarShownItems(tabs, fitCount, moreItem) : tabs),
        [fitted, tabs, fitCount, moreItem]
    );
    const activeIndex = useMemo(() => navbarActiveIndex(shownItems, tabs.length - fitCount, url, uri), [shownItems, tabs.length, fitCount, url, uri]);

    // The indicator is a pure function of the measured widths: the tabs sit in a row the bar places (`justify-*`), so
    // the active tab's place follows from the widths before it (navbarTabBox). Deriving it in render (instead of
    // mirroring it into state from an effect) avoids a setState-in-effect cascade during idle hydration of the page
    // Suspense boundary.
    const shownWidths = shownItems.map((item) => tabWidths[tabKey(item)] || (item?.name === 'more' ? MORE_WIDTH : 0));
    const activeWidth = activeIndex >= 0 ? shownWidths[activeIndex] ?? 0 : 0;
    const target = fitted && containerLayout.measured && activeWidth > 0
        ? navbarTabBox(shownWidths, activeIndex, containerLayout.width, TAB_GAP, navbarRowStart(align, containerLayout.width, navbarRowWidth(shownWidths, TAB_GAP)))
        : null;
    const { indicatorStyle, isIndicatorShown, isIndicatorRevealed } = useNavbarIndicator(target, activeIndex);
    const indicatorTransitions = __menuTopIndicatorTransitions;
    const indicatorLineClass: string = appSetting('layout', 'header', 'active_item_indicator');

    const MenuTopItem = (components['menu-item'] as Record<string, ComponentType<MenuTopItemProps>> | undefined)?.['topmenu'];

    // The bar: as wide as all its tabs (`boxWidth`, so its width never depends on the fit), up to
    // `layout.header.menu_max_width` and to the room the header leaves; its row is placed by `justify-*`.
    const maxWidth: number | undefined = appSetting('layout', 'header', 'menu_max_width') || undefined;
    const barClassName = `${appSetting('layout', 'header', 'content_center')} ${appSetting('layout', 'header', 'content_center_align')?.[align] ?? ''} relative`;

    if (isLoading) {
        return <MenuTopSkeleton className={barClassName} maxWidth={maxWidth} count={siteTabs ? siteTabs + 1 : SKELETON_TABS} />;
    }

    // The bar and the hidden copy of its tabs report their first layout before the first paint
    // (`layoutBeforePaint`), so the row the server sent (or the one drawn from the kept menu) and the fitted one are
    // never both seen. After that `onLayout` follows every change (the window, a font that loads).
    return (
        <Row
            ref={highlightRef}
            className={`${barClassName} ${fitted ? '' : UNFITTED_BAR} ${MENU_HIGHLIGHT_BAR_CLASS}`}
            role="navigation"
            aria-label="Primary"
            style={{ maxWidth, ...(boxWidth > 0 ? { width: boxWidth } : null) }}
            layoutBeforePaint
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
                } as object}
            />

            {/* The line under the current tab, where the theme draws one (`active_item_indicator`; none by default:
                the fill above marks the tab, as on UNA's site). */}
            {indicatorLineClass ? (
                <View
                    className={indicatorLineClass}
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
                    } as object}
                />
            ) : null}
            <MenuTopProbe items={[...tabs, moreItem || navbarMoreItem([])]} t={t} onWidth={handleTabWidth} />
            {MenuTopItem ? shownItems.map((item, index) => (
                <View key={`wrap-${tabKey(item)}`} className={`flex-none relative z-10 ${fitted ? '' : unfittedTabClass(index, shownItems.length, moreAlways)}`}>
                    <MenuTopItem
                        index={index}
                        link={item.link}
                        icon={item.icon}
                        isTitle={!!item.showTitle}
                        title={t(item.title)}
                        isActive={index === activeIndex}
                        items={item.items ? markCurrentRows(flattenMenuItemsForDropdown(item.items), url, uri) : undefined}
                        chevron={item.chevron}
                        animated={item.animated}
                        addClassName={item.addClassName}
                        columns={item.columns ?? appSetting('menu_items', 'menu_navbar_more_columns')}
                    />
                </View>
            )) : null}
        </Row>
    )
}

/**
 * The active tab's indicator: where it goes (`target`, from the measured widths) and whether it shows. Until the active
 * tab is measured it keeps the last place, hidden; the first time it shows it waits until its place has held for
 * INDICATOR_REVEAL_MS, then fades in.
 */
function useNavbarIndicator(target: TabBox | null, activeIndex: number) {
    let indicatorStyle: { translateX: number; width: number; visible: boolean };
    if (activeIndex === -1) {
        indicatorStyle = { translateX: 0, width: 0, visible: false };
    } else if (!target) {
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
function nextContainerLayout(prev: BarLayout, layout: LayoutBox): BarLayout {
    const x = layout?.x || 0
    const width = layout?.width || 0
    if (prev.measured && prev.x === x && prev.width === width) return prev
    return { x, width, measured: true }
}

/**
 * How many tabs stay in the bar: every tab's natural width from the hidden copy (MenuTopProbe), the bar's width and
 * the menu's persistent items, through navbarTabsThatFit. Until both are measured the bar is not `fitted` and shows
 * every tab in a row that wraps (the first line is what the fit will keep); a later mount reuses the last fit.
 * `boxWidth` is the bar's own width, all its tabs: 0 until they are measured or remembered.
 */
function useNavbarFit(tabs: MenuItem[], moreAlways: boolean, containerLayout: BarLayout, persistent: number) {
    const [tabWidths, setTabWidths] = useState<TabWidths>({});
    const handleTabWidth = (key: string, width: number) => setTabWidths((prev) => (prev[key] === width ? prev : { ...prev, [key]: width }));
    const signature = tabs.map(tabKey).join('|');
    const widthsKnown = tabs.length > 0 && tabs.every((item) => (tabWidths[tabKey(item)] ?? 0) > 0);
    const measured = containerLayout.measured && widthsKnown;
    const remembered = __menuTopFit.signature === signature ? __menuTopFit : null;
    const widths = widthsKnown ? tabs.map((item) => tabWidths[tabKey(item)] ?? 0) : null;
    const more = tabWidths.more || MORE_WIDTH;
    let fitCount = tabs.length;
    if (measured && widths) {
        fitCount = navbarTabsThatFit({ widths, available: containerLayout.width, gap: TAB_GAP, more, persistent, moreAlways });
    } else if (remembered) {
        fitCount = remembered.count;
    }
    const boxWidth = widths ? navbarBoxWidth({ widths, gap: TAB_GAP, more, moreAlways }) : (remembered?.box || 0);
    useEffect(() => {
        if (measured) __menuTopFit = { signature, available: containerLayout.width, count: fitCount, box: boxWidth };
    }, [measured, signature, containerLayout.width, fitCount, boxWidth]);
    return { fitCount, fitted: measured || !!remembered || Platform.OS !== 'web', boxWidth, tabWidths, handleTabWidth };
}

/** The bar's items: the tabs that fit, then More with the rest of the tabs first and its own items after them. */
function navbarShownItems(tabs: MenuItem[], fitCount: number, moreItem: MenuItem | undefined): MenuItem[] {
    const out = tabs.slice(0, fitCount);
    const moreItems = [...tabs.slice(fitCount), ...(moreItem?.items || [])];
    if (moreItems.length) out.push({ ...(moreItem || navbarMoreItem([])), items: moreItems });
    return out;
}

/** The tab (or More row) of the page at `url` / `uri`. */
function isCurrentTab(item: MenuItem, url?: string | null, uri?: string | null): boolean {
    // No url (a 404): no tab is the current page.
    return (url != null && item?.link === '/' + url) || (item?.link === '/' && uri === 'home');
}

/** More's rows, the current page's marked `current` (drawn as the current tab, topmenu.tsx). */
function markCurrentRows(items: MenuItem[], url?: string | null, uri?: string | null): MenuItem[] {
    return items.map((item) => (isCurrentTab(item, url, uri) ? { ...item, current: true } : item));
}

/** The current page's tab, or More when that tab is among the `overflow` tabs at the top of More; -1 for neither. */
function navbarActiveIndex(shownItems: MenuItem[], overflow: number, url?: string | null, uri?: string | null): number {
    const isCurrent = (item: MenuItem) => isCurrentTab(item, url, uri);
    const index = shownItems.findIndex(isCurrent);
    if (index >= 0) return index;
    const more = shownItems.findIndex((item) => item?.name === 'more');
    const moreRows: MenuItem[] = shownItems[more]?.items ?? [];
    return more >= 0 && moreRows.slice(0, overflow).some(isCurrent) ? more : -1;
}

/** A tab's stable key: its name, else its link, else its title. */
function tabKey(item: MenuItem | undefined): string {
    return String(item?.name || item?.link || item?.title || '')
}

/**
 * A hidden copy of every tab with its label beside its icon, which reports each tab's natural width (the classes
 * are the tab's own, components/menu-items/topmenu.tsx: change them together). It sits in a clipped box the bar's
 * size (a copy wider than the bar would otherwise widen the page), aria-hidden and invisible, with no links in it.
 */
function MenuTopProbe({ items, t, onWidth }: Readonly<{ items: MenuItem[]; t: Translate; onWidth: (key: string, width: number) => void }>) {
    return (
        <View aria-hidden className="absolute inset-0 overflow-hidden invisible pointer-events-none">
            <Row className="absolute left-0 top-0 w-max gap-2">
                {items.map((item) => (
                    <Row
                        key={tabKey(item)}
                        className={`items-center justify-center gap-2 h-11 min-w-11 shrink-0 ${item.icon && item.showTitle ? 'ps-3 pe-4' : 'px-2.5'}`}
                        layoutBeforePaint
                        onLayout={(e) => onWidth(tabKey(item), e?.nativeEvent?.layout?.width || 0)}
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
