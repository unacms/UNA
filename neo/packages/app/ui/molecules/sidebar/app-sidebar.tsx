import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { View, Pressable } from 'app/design/view';
import { NeoButton } from 'app/design/controls';
import { appSetting, isExternalUrl, isIos, isNativeTabsEnabled, openExternalLink, sanitazeUrl } from 'app/lib/util';
import { appStatic } from 'app/lib/app-static';
import { useCurrentUser } from 'app/context/user';
import { useMenuData } from 'app/context/menu-data';
import { usePref, setPref } from 'app/context/prefs';
import { useAppSidebarOpen, setAppSidebarOpen, useAppSidebarLayout, useAppSidebarUrl } from 'app/context/app-sidebar';
import { useRouter, getWindowSafeAreaInsets } from 'app/lib/hooks/router';
import { nativeTabPageHref } from 'app/lib/navigation/tab-history';
import { getSelectedTabKey } from 'app/lib/navigation/tab-path';
import { findTabPathForUrl } from 'app/components/nav/tabs/tab-menu';
import { useTabList } from 'app/lib/navigation/tab-bar-menu';
import AppSidebarDrawer from './app-sidebar-drawer';
import AppSidebarList from './app-sidebar-list';
import { comparable, panelSubmenus } from './app-sidebar-entries';
import type { AppSidebarProps } from './app-sidebar.types';

/**
 * UNA's Application layout in the native apps: the same sidebar as on the web (app-sidebar.web.tsx), the same menu
 * (`sys_site_panel`) and the same three states.
 *   - a phone: a drawer over the page, its header and the tab bar, opened by AppSidebarOpenButton in the header and
 *     closed by a press outside, a swipe or a row;
 *   - a tablet (768pt and wider): the window's left column from top to bottom, expanded (16rem) or narrow (4rem, icons
 *     only); the choice is the web's `sidebarNarrow` (app/context/prefs).
 * The shell is the app's own (app-sidebar-drawer): Expo UI has no drawer on either platform, and a native split view
 * cannot hold the tabs (SwiftUI's NavigationSplitView hosts React views, not view controllers, and turns into a
 * push stack on a phone; expo-router's SplitView is iOS only and cannot change its columns after it mounts; the tab
 * bar's own sidebar lists only the tabs). What is inside is native where it can be: on iOS the menus are one SwiftUI
 * List (app-sidebar-list.ios.tsx).
 *
 * The sidebar stands outside the tabs, so it does not know the page: the focused page reports its layout and URL
 * (components/layout.js → app/context/app-sidebar). Members only, as on the web.
 */
const WIDTH_EXPANDED = 256;
const WIDTH_NARROW = 64;
const WIDTH_DRAWER_MAX = 304;
const TABLET_MIN_WIDTH = 768;

const closeSidebar = () => setAppSidebarOpen(false);

function useSidebarState() {
    const { currentUser } = useCurrentUser();
    const layout = useAppSidebarLayout();
    const { width } = useWindowDimensions();
    return { enabled: !!currentUser && layout === 'application', permanent: width >= TABLET_MIN_WIDTH, width };
}

/** Opens a row's page the way a link in a page does: in the tab that owns it, or pushed onto the current one. */
function useSidebarNavigate() {
    const router = useRouter();
    const { currentUser } = useCurrentUser();
    const { tabList } = useTabList(currentUser);

    return useCallback((href: string) => {
        setAppSidebarOpen(false);
        const url = sanitazeUrl(href);
        if (!url) return;
        if (isExternalUrl(url)) {
            void openExternalLink(url);
            return;
        }
        const current = getSelectedTabKey() || '/tab0';
        const target = nativeTabPageHref(url, findTabPathForUrl(url, tabList) || current, currentUser);
        if ('params' in target) router.push(target as never);
        else if (target.pathname === current) router.dismissTo(target as never);
        else router.navigate(target as never);
    }, [router, currentUser, tabList]);
}

function SidebarContent({ permanent }: Readonly<{ permanent: boolean }>) {
    const { t } = useTranslation();
    const narrow = usePref('sidebarNarrow') && permanent;
    const url = useAppSidebarUrl();
    const { menuData } = useMenuData(appSetting('menus', 'objects', 'panel') || 'sys_site_panel');
    const panels = useMemo(() => panelSubmenus(menuData), [menuData]);
    const navigate = useSidebarNavigate();
    // The shell is as tall as the window, except under iOS's JS tab bar, where the app's root keeps the safe area.
    const insets = isIos && !isNativeTabsEnabled() ? { top: 0, bottom: 0 } : getWindowSafeAreaInsets();

    const onToggle = () => {
        if (permanent) setPref('sidebarNarrow', !narrow);
        else setAppSidebarOpen(false);
    };

    return (
        <View
            className={`flex-1 bg-card ${permanent ? 'border-e border-border' : ''}`}
            style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
            <View className={`h-16 flex-none flex-row items-center gap-2 ${narrow ? 'justify-center' : 'justify-between ps-4 pe-3'}`}>
                {!narrow && (
                    <Pressable
                        onPress={() => navigate('/home')}
                        accessibilityRole="link"
                        accessibilityLabel={t('Home')}
                        className="min-h-11 min-w-11 shrink items-start justify-center"
                    >
                        {appStatic('logo', undefined)}
                    </Pressable>
                )}
                {/* What a press does: panel-left-close while the sidebar is open, panel-left-open while it is narrow. */}
                <NeoButton
                    borderShape="circle"
                    image={narrow ? 'PanelLeftOpen' : 'PanelLeftClose'}
                    style="bordered"
                    controlSize="regular"
                    accessibilityLabel={t('Main menu')}
                    sound={false}
                    onPress={onToggle}
                />
            </View>
            <AppSidebarList panels={panels} url={comparable(url)} narrow={narrow} onNavigate={navigate} />
        </View>
    );
}

/**
 * Around the tabs (apps/expo/app/(tabs)/_layout.js): the drawer or the column, and the tabs beside or under it.
 * `style` is the tabs' host style, which makes the shell as tall as the window.
 */
export function AppSidebarShell({ children, style }: Readonly<{ children: ReactNode; style?: StyleProp<ViewStyle> }>) {
    const { t } = useTranslation();
    const { enabled, permanent, width } = useSidebarState();
    const open = useAppSidebarOpen();
    const narrow = usePref('sidebarNarrow');
    const url = useAppSidebarUrl();
    const column = enabled && permanent;
    const drawer = enabled && !permanent;

    // Going to another page closes the drawer; so does losing the sidebar or getting the column.
    useEffect(() => {
        setAppSidebarOpen(false);
    }, [url, drawer]);

    let sidebarWidth = Math.min(WIDTH_DRAWER_MAX, width - 56);
    if (column) sidebarWidth = narrow ? WIDTH_NARROW : WIDTH_EXPANDED;
    let mode: 'none' | 'column' | 'drawer' = 'none';
    if (column) mode = 'column';
    else if (drawer) mode = 'drawer';

    return (
        <AppSidebarDrawer
            mode={mode}
            open={open}
            width={sidebarWidth}
            onClose={closeSidebar}
            closeLabel={t('Close')}
            renderSidebar={() => <SidebarContent permanent={permanent} />}
            style={style}
        >
            {children}
        </AppSidebarDrawer>
    );
}

/** In the header of a phone: opens the sidebar as a drawer. Nothing where there is no sidebar or it is a column. */
export function AppSidebarOpenButton() {
    const { t } = useTranslation();
    const { enabled, permanent } = useSidebarState();
    if (!enabled || permanent) return null;

    return (
        <NeoButton
            borderShape="circle"
            image="PanelLeftOpen"
            style="glass"
            controlSize="regular"
            accessibilityLabel={t('Main menu')}
            sound={false}
            onPress={() => setAppSidebarOpen(true)}
        />
    );
}

/**
 * The sidebar shows the logo, so the header does not: the drawer of a phone and the expanded column, as on the web;
 * the narrow column has none, so the header keeps its own.
 */
export function useAppSidebarHasLogo() {
    const { enabled, permanent } = useSidebarState();
    const narrow = usePref('sidebarNarrow');
    return enabled && !(permanent && narrow);
}

/** The web's place for the sidebar, inside the page (components/layout.web.js). Native has AppSidebarShell. */
export default function AppSidebar(_props: AppSidebarProps) {
    return null;
}
