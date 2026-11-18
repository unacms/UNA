'use client';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { NeoButton, NeoButtonLink } from 'app/design/controls';
import { Icon } from 'app/ui/atoms/icon';
import Link from 'app/ui/atoms/link';
import { appSetting } from 'app/lib/util';
import { appStatic } from 'app/lib/app-static';
import { useMenuData } from 'app/context/menu-data';
import { usePref, setPref } from 'app/context/prefs';
import { useAppSidebarOpen, setAppSidebarOpen } from 'app/context/app-sidebar';
import type { AppSidebarProps } from './app-sidebar.types';
import { comparable, rowHref, type SidebarMenuItem } from './app-sidebar-entries';

/**
 * UNA's Application layout on the web: the sidebar is the page's left column from top to bottom, and the header and
 * the content start beside it. The same sidebar as UNA's own (Artificer's pt_application.html):
 *   - wide screens (`xl`, 1280px and up): expanded, 16rem, or narrow, 4rem with icons only; the choice is kept per
 *     device (`sidebarNarrow` in app/context/prefs) and applied before the first paint, so the page does not jump;
 *   - below that: a drawer over the page and its header, opened by AppSidebarOpenButton in the header. It is a modal:
 *     the page behind is inert, Escape and a press outside close it, and focus returns to the button that opened it.
 * The styles lay the page out from one attribute, `data-neo-sidebar` on <html> ("expanded" or "narrow"), and the
 * drawer's `data-open` (design/styles/global.web.css, "Application sidebar"). The menu is UNA's `sys_site_panel`:
 * each of its items is a submenu (`sys_profile_stats`, `sys_profile_followings`...), listed one under another.
 */

type MenuItem = SidebarMenuItem;

/** The script that sets the state before React is there; the effect below keeps it in step afterwards. */
const PREPAINT = `(function(){try{var p=JSON.parse(localStorage.getItem('neo:v1:prefs')||'{}');document.documentElement.setAttribute('data-neo-sidebar',p&&p.sidebarNarrow?'narrow':'expanded')}catch(e){document.documentElement.setAttribute('data-neo-sidebar','expanded')}})()`;

function SidebarRow({ item, current }: Readonly<{ item: MenuItem; current: boolean }>) {
    const link = [item?.link, item?.url].find((value) => typeof value === 'string' && value) ?? '';
    const href = rowHref(link);
    const title = item?.title || item?.name;
    const count = item?.addon && typeof item.addon !== 'object' ? String(item.addon) : '';

    const content = (
        <View className="w-full flex-row items-center">
            <View className={`h-8 w-8 flex-none items-center justify-center rounded-full ${current ? 'bg-accent' : 'bg-muted/50 group-hover:bg-muted'}`}>
                <Icon icon={item?.icon || 'Circle'} size="20" className={current ? 'text-accent-foreground' : 'text-secondary-foreground group-hover:text-foreground'} />
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

/** One of the panel's submenus: its rows, and the rows under a row that has its own (a list of followed contexts). */
function SidebarMenu({ object, url }: Readonly<{ object: string; url: string }>) {
    const { menuData } = useMenuData(object);
    const items: MenuItem[] = Array.isArray(menuData?.items) ? menuData.items : [];
    if (!items.length) return null;

    return (
        <View className="neo-app-sidebar-menu w-full gap-0.5 py-2">
            {items.map((item, index) => (
                <View key={`${object}-${item?.name ?? index}`} className="w-full gap-0.5">
                    <SidebarRow item={item} current={!!comparable(item?.link) && comparable(item?.link) === url} />
                    {Array.isArray(item?.subitems) && item.subitems.map((child: MenuItem, i: number) => (
                        <SidebarRow key={`${object}-${item?.name ?? index}-${child?.name ?? i}`} item={child} current={!!comparable(child?.link) && comparable(child?.link) === url} />
                    ))}
                </View>
            ))}
        </View>
    );
}

export default function AppSidebar({ pageData }: Readonly<AppSidebarProps>) {
    const { t } = useTranslation();
    const narrow = usePref('sidebarNarrow');
    const open = useAppSidebarOpen();
    const toggleRef = useRef<HTMLDivElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);
    const { menuData } = useMenuData(appSetting('menus', 'objects', 'panel') || 'sys_site_panel');
    const panels: MenuItem[] = Array.isArray(menuData?.items) ? menuData.items : [];
    const url = comparable(pageData?.url);

    // The stored choice, once the prefs are read: the script set the same before the first paint.
    useEffect(() => {
        document.documentElement.dataset.neoSidebar = narrow ? 'narrow' : 'expanded';
    }, [narrow]);
    useEffect(() => () => {
        delete document.documentElement.dataset.neoSidebar;
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

    // The drawer is a modal: the page behind takes no focus or presses, Escape closes it, focus comes back.
    useEffect(() => {
        if (!open) return;

        const behind = Array.from(document.querySelectorAll<HTMLElement>('.neo-app-shell > :not(.neo-app-sidebar):not(.neo-app-sidebar-backdrop)'));
        behind.forEach((element) => { element.inert = true; });
        toggleRef.current?.querySelector<HTMLElement>('button, a, [tabindex]')?.focus();

        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setAppSidebarOpen(false);
        };
        const wide = window.matchMedia('(min-width: 80rem)');
        const onWide = () => {
            if (wide.matches) setAppSidebarOpen(false);
        };
        document.addEventListener('keydown', onKey);
        wide.addEventListener('change', onWide);

        return () => {
            behind.forEach((element) => { element.inert = false; });
            document.removeEventListener('keydown', onKey);
            wide.removeEventListener('change', onWide);
            // back to the header's button, which opened it (the element that had focus may be gone after a navigation)
            document.querySelector<HTMLElement>('.neo-app-sidebar-open button, .neo-app-sidebar-open [role="button"]')?.focus();
        };
    }, [open]);

    // Going to another page closes the drawer.
    useEffect(() => {
        setAppSidebarOpen(false);
    }, [pageData?.url]);

    const onToggle = () => {
        if (open) return setAppSidebarOpen(false);
        setPref('sidebarNarrow', !narrow);
    };

    return (
        <>
            <script dangerouslySetInnerHTML={{ __html: PREPAINT }} />
            <aside className="neo-app-sidebar bg-card/60 backdrop-blur-lg" aria-label={t('Main menu')} data-open={open ? 'true' : undefined}>
                <View className="neo-app-sidebar-head h-16 flex-none flex-row items-center justify-between gap-2">
                    <View className="neo-app-sidebar-logo min-w-0 shrink">
                        <Link href="/home" alt={t('Home')} className="flex min-h-11 min-w-11 items-center justify-center p-0.5">
                            {appStatic('logo', undefined)}
                        </Link>
                    </View>
                    <View ref={toggleRef as any} className="flex-none">
                        {/* What a press does: panel-left-close while the sidebar is open, panel-left-open while it is narrow. */}
                        <View className="neo-app-sidebar-icon-close">
                            <NeoButton borderShape="circle" image="PanelLeftClose" style="bordered" controlSize="regular" accessibilityLabel={t('Main menu')} sound={false} onPress={onToggle} />
                        </View>
                        <View className="neo-app-sidebar-icon-open">
                            <NeoButton borderShape="circle" image="PanelLeftOpen" style="bordered" controlSize="regular" accessibilityLabel={t('Main menu')} sound={false} onPress={onToggle} />
                        </View>
                    </View>
                </View>
                <View className="neo-app-sidebar-body min-h-0 flex-1 px-2 pb-2">
                    {panels.map((panel, index) => (typeof panel?.submenu === 'string' && panel.submenu
                        ? <SidebarMenu key={`${panel.submenu}-${index}`} object={panel.submenu} url={url} />
                        : null))}
                </View>
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

/** Native only (app-sidebar.tsx): the web hides the header's logo with styles (`neo-header-logo`). */
export function useAppSidebarHasLogo() {
    return false;
}
