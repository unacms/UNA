'use client';
import { useEffect, useRef, type ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { NeoButton, NeoButtonLink } from 'app/design/controls';
import { Icon } from 'app/ui/atoms/icon';
import Image from 'app/ui/atoms/image';
import Link from 'app/ui/atoms/link';
import { UNA_URL } from 'app/config';
import { appSetting, getHeaderToolbarNeoButtonDefaults } from 'app/lib/util';
import { appStatic } from 'app/lib/app-static';
import { components } from 'app/components/registry';
import { useMenuData } from 'app/context/menu-data';
import { useCurrentUser } from 'app/context/user';
import { usePref, setPref } from 'app/context/prefs';
import { useAppSidebarOpen, setAppSidebarOpen } from 'app/context/app-sidebar';
import Search from 'app/ui/molecules/sections/search';
import MenuAdd, { useMenuAddItems } from 'app/components/nav/menu-add';
import MenuAccount from 'app/components/nav/menu-account';
import type { AppSidebarProps } from './app-sidebar.types';
import { comparable, panelSubmenus, rowHref, type SidebarMenuItem } from './app-sidebar-entries';

/**
 * UNA's Application layout on the web, as UNA's own (Artificer's pt_application.html, css/common.css "Application"):
 *   - wide screens (`xl`, 1280px and up): the header and the footer are bare 16px strips in the page's colour, the
 *     sidebar is the left column between them, outside the content, and the content is one block (the blocks' surface,
 *     `neo-app-frame`) beside it, 16px from the window's right edge. The window still scrolls the page, as everywhere
 *     in NEO: the block's surface is fixed behind the content and its edge over it, covering what scrolls past it. The
 *     sidebar is expanded (16rem, or the width the member dragged its edge to, 240px to 400px) or narrow (4rem, icons
 *     only), kept per device (`sidebarNarrow`, `sidebarWidth`) and applied before the first paint;
 *   - below that: the page as in the Standard layout, with the header's AppSidebarOpenButton opening the sidebar as a
 *     drawer over it. Escape, a press outside and its close button close it; the page behind is inert meanwhile.
 * The sidebar: the logo with Search and Add on its first row, the context selector where the page has one, UNA's
 * `sys_site_panel` menus (a followings group under a title that opens and closes it), and the member's account at the
 * foot. Its edge is a handle: dragged, it sizes the sidebar (snapping to the icons under 160px); pressed, it narrows or
 * widens it. design/styles/global.web.css, "Application sidebar".
 */

type MenuItem = SidebarMenuItem;


const WIDE = '(min-width: 80rem)';
const WIDTH_MIN = 240;
const WIDTH_MAX = 400;
const WIDTH_SNAP = 160;
const WIDTH_STEP = 16;

/** Where a row goes; UNA names its own pages in full (a followed profile's), and they open as the app's pages. */
function appHref(item: MenuItem): string | undefined {
    const href = rowHref([item?.link, item?.url].find((value) => typeof value === 'string' && value) ?? '');
    return href && UNA_URL && href.startsWith(`${UNA_URL}/`) ? href.slice(UNA_URL.length) : href;
}

function isCurrent(item: MenuItem, url: string): boolean {
    return !!url && comparable(appHref(item)) === url;
}

function SidebarRow({ item, url, icon }: Readonly<{ item: MenuItem; url: string; icon?: string }>) {
    const href = appHref(item);
    const current = isCurrent(item, url);
    const title = item?.title || item?.name;
    const count = item?.addon && typeof item.addon !== 'object' ? String(item.addon) : '';
    // A followed profile's picture (sent as `image`, or an icon that is an address) in place of the icon.
    const picture = [item?.image, item?.icon].find((value) => typeof value === 'string' && /^(https?:)?\/\//.test(value));
    const iconName = typeof item?.icon === 'string' && item.icon && !picture && !item.icon.startsWith('<') ? item.icon : (icon || 'Circle');

    const content = (
        <View className="w-full flex-row items-center">
            <View className={`h-8 w-8 flex-none items-center justify-center overflow-hidden rounded-full ${current ? 'bg-accent' : 'bg-muted/50 group-hover:bg-muted'}`}>
                {picture
                    ? <Image src={picture as string} alt="" width={32} height={32} className="h-8 w-8 rounded-full" />
                    : <Icon icon={iconName} size="20" className={current ? 'text-accent-foreground' : 'text-secondary-foreground group-hover:text-foreground'} />}
            </View>
            <Text numberOfLines={1} className={`neo-app-sidebar-label min-w-0 flex-1 px-3 text-sm leading-5 font-medium ${current ? 'text-accent-foreground' : 'text-secondary-foreground group-hover:text-foreground'}`}>{title}</Text>
            {!!count && count !== '0' && <Text className="neo-app-sidebar-label flex-none px-2 text-xs leading-4 font-medium text-muted-foreground">{count}</Text>}
        </View>
    );

    const common = {
        alt: title,
        style: 'borderless',
        controlSize: 'regular',
        width: 'fill',
        align: 'start',
        contentInsets: { x: 8 },
        selected: current,
        selectedState: 'pressed',
        className: 'group',
    } as const;

    return href
        ? <NeoButtonLink href={href} {...common}>{content}</NeoButtonLink>
        : <NeoButton {...common} interactive>{content}</NeoButton>;
}

/**
 * A group of a menu (a followings module's: Persons, Groups...): its title, which opens and closes it as on UNA's site
 * (kept per device, `sidebarCollapsed`), over its rows. The narrow sidebar shows the rows alone.
 */
function SidebarGroup({ groupKey, item, url }: Readonly<{ groupKey: string; item: MenuItem; url: string }>) {
    const collapsed = usePref('sidebarCollapsed') || [];
    const isCollapsed = collapsed.includes(groupKey);
    const title = item?.title || item?.name;
    const children: MenuItem[] = Array.isArray(item?.subitems) ? item.subitems : [];
    const toggle = () => setPref('sidebarCollapsed', isCollapsed ? collapsed.filter((key) => key !== groupKey) : [...collapsed, groupKey]);

    return (
        <View className="w-full gap-0.5">
            <View className="neo-app-sidebar-label w-full">
                <NeoButton style="borderless" controlSize="small" width="fill" align="start" contentInsets={{ x: 8 }} accessibilityLabel={title} aria-expanded={!isCollapsed} sound={false} onPress={toggle} interactive className="group">
                    <View className="w-full flex-row items-center justify-between">
                        <Text numberOfLines={1} className="min-w-0 flex-1 text-xs leading-4 font-medium text-muted-foreground group-hover:text-foreground">{title}</Text>
                        <Icon icon={isCollapsed ? 'ChevronDown' : 'ChevronUp'} size="16" className="text-muted-foreground group-hover:text-foreground" />
                    </View>
                </NeoButton>
            </View>
            {!isCollapsed && children.map((child, index) => (
                <SidebarRow key={`${groupKey}-${child?.name ?? index}`} item={child} url={url} icon={typeof item?.icon === 'string' ? item.icon : undefined} />
            ))}
        </View>
    );
}

/** One of the panel's menus: its rows, and its groups (an item without a link that has items of its own). */
function SidebarMenu({ object, url }: Readonly<{ object: string; url: string }>) {
    const { menuData } = useMenuData(object);
    const items: MenuItem[] = Array.isArray(menuData?.items) ? menuData.items : [];
    if (!items.length) return null;

    return (
        <View className="neo-app-sidebar-menu w-full gap-0.5 py-2">
            {items.map((item, index) => {
                const key = `${object}-${item?.name ?? index}`;
                const subitems: MenuItem[] = Array.isArray(item?.subitems) ? item.subitems : [];
                if (subitems.length && !appHref(item))
                    return <SidebarGroup key={key} groupKey={key} item={item} url={url} />;

                return (
                    <View key={key} className="w-full gap-0.5">
                        <SidebarRow item={item} url={url} />
                        {subitems.map((child, i) => <SidebarRow key={`${key}-${child?.name ?? i}`} item={child} url={url} />)}
                    </View>
                );
            })}
        </View>
    );
}

/** The first row: the logo (its mark in the narrow sidebar), Search and Add, 44px and 12px apart; in the drawer, its close button. */
function SidebarHead() {
    const { t } = useTranslation();
    const { currentUser } = useCurrentUser();
    const addMenu = useMenuAddItems(true);
    const toolbar = currentUser ? currentUser.toolbar : undefined;
    const hasSearch = appSetting('layout', 'search') == true && (!Array.isArray(toolbar) || toolbar.includes('search'));
    // One look for the row's buttons, the drawer's too: the desktop header toolbar's (bordered, 44px).
    const buttonProps = getHeaderToolbarNeoButtonDefaults(true);

    return (
        <View className="neo-app-sidebar-head flex-none flex-row items-center gap-3">
            <Link href="/home" alt={t('Home')} className="neo-app-sidebar-logo flex min-h-11 min-w-11 shrink items-center">
                <View className="neo-app-sidebar-logo-full">{appStatic('logo', { mode: 'full', height: 36 })}</View>
                <View className="neo-app-sidebar-logo-mark">{appStatic('logo', { mode: 'mark', height: 36 })}</View>
            </Link>
            <View className="neo-app-sidebar-tools flex-row items-center gap-3">
                {hasSearch && <Search params={{ trigger: buttonProps }} />}
                {!addMenu.empty && <MenuAdd buttonProps={buttonProps} />}
            </View>
            <View className="neo-app-sidebar-close flex-none">
                <NeoButton {...buttonProps} borderShape="circle" image="PanelLeftClose" accessibilityLabel={t('Close')} sound={false} onPress={() => setAppSidebarOpen(false)} />
            </View>
        </View>
    );
}

/** The foot: the member's picture and name, opening the account menu (with the profile switcher), upwards. */
function SidebarAccount() {
    const { currentUser } = useCurrentUser();
    if (!currentUser) return null;
    const name = currentUser.display_name || '';

    return (
        <View className="neo-app-sidebar-foot flex-none p-2">
            <MenuAccount buttonProps={undefined}>
                <Row className="neo-app-sidebar-account w-full items-center rounded-xl p-2 web:cursor-pointer">
                    <View className="h-8 w-8 flex-none overflow-hidden rounded-full bg-muted">
                        {!!currentUser.avatar && <Image src={currentUser.avatar} alt="" width={32} height={32} className="h-8 w-8 rounded-full" />}
                    </View>
                    <Text numberOfLines={1} className="neo-app-sidebar-label min-w-0 flex-1 px-3 text-sm leading-5 font-medium text-foreground">{name}</Text>
                    <View className="neo-app-sidebar-label flex-none">
                        <Icon icon="ChevronsUpDown" size="16" className="text-muted-foreground" />
                    </View>
                </Row>
            </MenuAccount>
        </View>
    );
}

/** A width for the expanded sidebar, or narrow under the snap: <html>'s attribute and variable, which the styles read. */
function applyWidth(width: number) {
    const root = document.documentElement;
    const narrow = width < WIDTH_SNAP;
    if (!narrow) root.style.setProperty('--neo-sidebar-width-expanded', `${Math.min(WIDTH_MAX, Math.max(WIDTH_MIN, Math.round(width)))}px`);
    root.dataset.neoSidebar = narrow ? 'narrow' : 'expanded';
}

/** The sidebar's edge (wide screens): dragged, it sizes the sidebar; pressed, or Enter or Space, it narrows or widens it. */
function SidebarResizer({ sidebarRef }: Readonly<{ sidebarRef: { current: HTMLElement | null } }>) {
    const { t } = useTranslation();
    const narrow = usePref('sidebarNarrow');
    const drag = useRef<{ x: number; width: number; moved: boolean; id: number } | null>(null);
    const isRtl = () => document.documentElement.dir === 'rtl';
    const currentWidth = () => sidebarRef.current?.getBoundingClientRect().width ?? 0;
    const save = () => {
        const isNarrow = document.documentElement.dataset.neoSidebar === 'narrow';
        setPref('sidebarNarrow', isNarrow);
        if (!isNarrow) setPref('sidebarWidth', Math.round(currentWidth()));
    };
    const endDrag = () => {
        drag.current = null;
        delete document.documentElement.dataset.neoSidebarDragging;
    };

    return (
        <div
            className="neo-app-sidebar-resizer"
            role="separator"
            aria-orientation="vertical"
            aria-valuemin={WIDTH_MIN}
            aria-valuemax={WIDTH_MAX}
            aria-label={t('Resize the sidebar')}
            title={t('Resize the sidebar')}
            tabIndex={0}
            onPointerDown={(event) => {
                if (event.button !== 0 || !window.matchMedia(WIDE).matches) return;
                drag.current = { x: event.clientX, width: currentWidth(), moved: false, id: event.pointerId };
                event.currentTarget.setPointerCapture(event.pointerId);
                document.documentElement.dataset.neoSidebarDragging = 'true';
                event.preventDefault();
            }}
            onPointerMove={(event) => {
                const d = drag.current;
                if (!d || event.pointerId !== d.id) return;
                const delta = (event.clientX - d.x) * (isRtl() ? -1 : 1);
                if (!d.moved && Math.abs(delta) < 4) return;
                d.moved = true;
                applyWidth(d.width + delta);
            }}
            onPointerUp={(event) => {
                const d = drag.current;
                if (!d || event.pointerId !== d.id) return;
                endDrag();
                if (d.moved) save();
                else setPref('sidebarNarrow', !narrow);
            }}
            onPointerCancel={endDrag}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setPref('sidebarNarrow', !narrow);
                    return;
                }
                const arrow = { ArrowLeft: -1, ArrowRight: 1 }[event.key as 'ArrowLeft' | 'ArrowRight'];
                if (!arrow) return;
                event.preventDefault();
                const step = arrow * (isRtl() ? -1 : 1);
                if (narrow) {
                    if (step < 0) return;
                    applyWidth(WIDTH_MIN);
                } else {
                    applyWidth(currentWidth() + step * WIDTH_STEP);
                }
                save();
            }}
        />
    );
}

export default function AppSidebar({ pageData }: Readonly<AppSidebarProps>) {
    const { t } = useTranslation();
    const narrow = usePref('sidebarNarrow');
    const savedWidth = usePref('sidebarWidth');
    const open = useAppSidebarOpen();
    const sidebarRef = useRef<HTMLElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);
    const { menuData } = useMenuData(appSetting('menus', 'objects', 'panel') || 'sys_site_panel');
    // Without the items marked for the native apps' drawer: the header and the footer have what they list.
    const panels = panelSubmenus(menuData);
    const url = comparable(pageData?.url);
    const ContextSelector = (components['molecule'] as Record<string, ComponentType<any>> | undefined)?.['context_selector'];
    // The context selector, where the header would show it: the page has contexts, and one is chosen or the site
    // shows the selector always (page-header-parts).
    const context = (pageData as { context?: { current?: { id?: unknown } } } | null | undefined)?.context;
    const hasContextSelector = !!context && (!!appSetting('context_selector', 'show_always') || !!context.current?.id);

    // The stored choice, once the prefs are read: SIDEBAR_PREPAINT (the root layout's <head>) set the same before the first paint.
    useEffect(() => {
        document.documentElement.dataset.neoSidebar = narrow ? 'narrow' : 'expanded';
    }, [narrow]);
    useEffect(() => {
        if (savedWidth && savedWidth > 0) document.documentElement.style.setProperty('--neo-sidebar-width-expanded', `${savedWidth}px`);
    }, [savedWidth]);
    useEffect(() => () => {
        const root = document.documentElement;
        delete root.dataset.neoSidebar;
        root.style.removeProperty('--neo-sidebar-width-expanded');
        setAppSidebarOpen(false);
    }, []);

    // A press outside the drawer closes it. Pointer only: the keyboard has Escape, and the scrim is not a control.
    useEffect(() => {
        const backdrop = backdropRef.current;
        if (!backdrop) return;
        const close = () => setAppSidebarOpen(false);
        backdrop.addEventListener('click', close);
        return () => backdrop.removeEventListener('click', close);
    }, []);

    // The drawer is a modal: the page behind takes no focus or presses, Escape closes it, focus goes in and comes back.
    useEffect(() => {
        if (!open) return;

        const behind = Array.from(document.querySelectorAll<HTMLElement>('.neo-app-shell > :not(.neo-app-sidebar):not(.neo-app-sidebar-backdrop)'));
        behind.forEach((element) => { element.inert = true; });
        sidebarRef.current?.querySelector<HTMLElement>('.neo-app-sidebar-close button, .neo-app-sidebar-close [role="button"]')?.focus();

        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setAppSidebarOpen(false);
        };
        const wide = window.matchMedia(WIDE);
        const onWide = () => {
            if (wide.matches) setAppSidebarOpen(false);
        };
        document.addEventListener('keydown', onKey);
        wide.addEventListener('change', onWide);

        return () => {
            behind.forEach((element) => { element.inert = false; });
            document.removeEventListener('keydown', onKey);
            wide.removeEventListener('change', onWide);
            // back to the header's button, which opened it (the element that had focus may be gone after a navigation);
            // the visible one: the header has a hidden copy while its fixed layer shows
            Array.from(document.querySelectorAll<HTMLElement>('.neo-app-sidebar-open button, .neo-app-sidebar-open [role="button"]'))
                .find((button) => button.checkVisibility?.({ visibilityProperty: true }) ?? true)?.focus();
        };
    }, [open]);

    // Going to another page closes the drawer.
    useEffect(() => {
        setAppSidebarOpen(false);
    }, [pageData?.url]);

    return (
        <>
            {/* Wide screens: the content's block. Its surface is behind the page; its edge is over it, with the page's colour
                spread around it, so what scrolls past the block is hidden there (the strips above and below, the corners). */}
            <div className="neo-app-frame rounded-block bg-card/60" aria-hidden="true" />
            <div className="neo-app-frame-edge rounded-block" aria-hidden="true" />
            <aside ref={sidebarRef} className="neo-app-sidebar" aria-label={t('Main menu')} data-open={open ? 'true' : undefined}>
                <SidebarHead />
                {hasContextSelector && !!ContextSelector && (
                    <View className="neo-app-sidebar-context neo-app-sidebar-label flex-none px-2 pb-2">
                        <ContextSelector url={pageData?.url} uri={pageData?.uri} data={context} />
                    </View>
                )}
                <View className="neo-app-sidebar-body min-h-0 flex-1 px-2 pb-2">
                    {panels.map((object) => <SidebarMenu key={object} object={object} url={url} />)}
                </View>
                <SidebarAccount />
                <SidebarResizer sidebarRef={sidebarRef} />
            </aside>
            <div ref={backdropRef} className="neo-app-sidebar-backdrop" aria-hidden="true" data-open={open ? 'true' : undefined} />
        </>
    );
}

/** In the header, below the `xl` breakpoint: opens the sidebar as a drawer. Hidden wherever there is no sidebar. */
export function AppSidebarOpenButton() {
    const { t } = useTranslation();
    const open = useAppSidebarOpen();

    return (
        <View className="neo-app-sidebar-open">
            <NeoButton borderShape="circle" image="PanelLeftOpen" style="glass" controlSize="regular" accessibilityLabel={t('Main menu')} sound={false} onPress={() => setAppSidebarOpen(!open)} />
        </View>
    );
}
