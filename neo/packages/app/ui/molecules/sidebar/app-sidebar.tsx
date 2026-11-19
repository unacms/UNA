import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { View, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import { NeoButton } from 'app/design/controls';
import { appSetting, decodeTextNode, isExternalUrl, isIos, isNativeTabsEnabled, openExternalLink, sanitazeUrl } from 'app/lib/util';
import { appStatic } from 'app/lib/app-static';
import { useCurrentUser } from 'app/context/user';
import { useMenuData } from 'app/context/menu-data';
import { hasAppDrawer, useAppSidebarOpen, setAppSidebarOpen, useAppSidebarUrl } from 'app/context/app-sidebar';
import { useRouter, getWindowSafeAreaInsets } from 'app/lib/hooks/router';
import { nativeTabPageHref } from 'app/lib/navigation/tab-history';
import { getSelectedTabKey } from 'app/lib/navigation/tab-path';
import { findTabPathForUrl } from 'app/components/nav/tabs/tab-menu';
import { useTabList } from 'app/lib/navigation/tab-bar-menu';
import { AUTH_BUTTONS, useMenuNavigationEntries } from 'app/components/nav/menu-header-navigation-entries';
import Profile from 'app/ui/molecules/profile/profile';
import ProfileSwitcher from 'app/components/elements/profile-switcher';
import AppSidebarDrawer from './app-sidebar-drawer';
import AppSidebarList from './app-sidebar-list';
import { comparable, panelSections } from './app-sidebar-entries';
import { useDrawerPrefs } from './app-sidebar-prefs';
import type { AppSidebarProps } from './app-sidebar.types';

/**
 * The native apps' drawer: what is the viewer's own, apart from the pages the tab bar leads to. It opens from the
 * Menu button at the start of the header of a tab's first page (a page pushed over it has Back there), over the
 * page, its header and the tab bar, on a phone and on a tablet alike, and closes on a press outside, a swipe or a
 * choice. `native.drawer` turns it off for members or for guests.
 *   - a member: their profile and the profile switcher, then UNA's site panel menu (`sys_site_panel`), each item of
 *     which is another menu: the profile's own pages, what they follow, the modules, the account's menu (Settings,
 *     Log out), the footer's links;
 *   - a guest: Log In and Sign Up, then the same menu as guests get it (the modules, the footer's links);
 *   - then the Preferences: language, theme, sounds.
 * Studio's Navigation decides the menus: an item "Active (for App)" there is a section here.
 *
 * The web has the same panel as the Application layout's sidebar (app-sidebar.web.tsx), without the items marked for
 * the drawer: its header and footer have them.
 *
 * The shell is the app's own (app-sidebar-drawer): Expo UI has no drawer on either platform, and a native split view
 * cannot hold the tabs. What is inside is native where it can be: on iOS the menus are one SwiftUI List
 * (app-sidebar-list.ios.tsx).
 *
 * The drawer stands outside the tabs, so it does not know the page: the focused page reports its URL
 * (components/layout.js → app/context/app-sidebar).
 */
const WIDTH_MAX = 320;
/** After the app knows the viewer, how long the first page has to itself before the drawer loads behind it. */
const WARM_UP_MS = 2000;
/** What stays of the page beside the open drawer: room to press outside it. */
const PAGE_EDGE = 56;

const closeSidebar = () => setAppSidebarOpen(false);

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

/** A member's head: the avatar and the name open the profile; the button beside them lists the account's profiles. */
function MemberHead({ onNavigate }: Readonly<{ onNavigate: (href: string) => void }>) {
    const { t } = useTranslation();
    const { currentUser } = useCurrentUser();
    if (!currentUser) return null;
    const name = String(decodeTextNode(currentUser.display_name) || '');

    // In line with the list under it: the rows' icons start 32pt in, their counters end 24pt from the edge.
    return (
        <View className="flex-none flex-row items-center gap-2 ps-8 pe-6 pt-3 pb-2">
            <Pressable
                onPress={() => currentUser.url && onNavigate(String(currentUser.url))}
                accessibilityRole="link"
                accessibilityLabel={`${name}. ${t('View profile')}`}
                className="min-h-11 min-w-0 flex-1 flex-row items-center gap-3 rounded-xl active:opacity-70"
            >
                <View pointerEvents="none">
                    <Profile {...currentUser} url_avatar={currentUser.avatar} url="" showLinks={false} displayType="unit_wo_info" displaySize="md" />
                </View>
                <View className="min-w-0 flex-1">
                    <Text numberOfLines={1} className="text-base leading-5 font-semibold text-foreground">{name}</Text>
                    <Text numberOfLines={1} className="text-sm leading-5 text-muted-foreground">{t('View profile')}</Text>
                </View>
            </Pressable>
            {/* Nothing where the account has one profile and can add none (ProfileSwitcher). */}
            <ProfileSwitcher hideTitle accessibilityLabel={t('Switch profile')} className="u-neo-btn-link">
                <NeoButton borderShape="circle" image="ArrowLeftRight" style="bordered" controlSize="regular" interactive />
            </ProfileSwitcher>
        </View>
    );
}

/** A guest's head: the logo, then Log In and Sign Up, the site menu's buttons (or the app's own two without them). */
function GuestHead({ onNavigate }: Readonly<{ onNavigate: (href: string) => void }>) {
    const { t } = useTranslation();
    const { buttons } = useMenuNavigationEntries();
    const shown = buttons.length ? buttons : AUTH_BUTTONS;

    return (
        <View className="flex-none gap-3 ps-8 pe-6 pt-3 pb-2">
            <Pressable
                onPress={() => onNavigate('/home')}
                accessibilityRole="link"
                accessibilityLabel={t('Home')}
                className="min-h-11 min-w-11 items-start justify-center self-start"
            >
                {appStatic('logo', undefined)}
            </Pressable>
            {/* As tall as its buttons: a native button reports its height a commit late, and the list would start under them. */}
            <View className="h-11 flex-row gap-2">
                {shown.map(({ key, item, primary }) => (
                    <View key={key} className="min-w-0 flex-1">
                        <NeoButton
                            label={t(String(item.title ?? ''))}
                            accessibilityLabel={t(String(item.title ?? ''))}
                            style={primary ? 'borderedProminent' : 'bordered'}
                            controlSize="regular"
                            width="fill"
                            onPress={() => onNavigate(String(item.link ?? ''))}
                        />
                    </View>
                ))}
            </View>
        </View>
    );
}

function SidebarContent() {
    const { currentUser } = useCurrentUser();
    const url = useAppSidebarUrl();
    const { menuData } = useMenuData(appSetting('menus', 'objects', 'panel') || 'sys_site_panel');
    const panels = useMemo(() => panelSections(menuData, true), [menuData]);
    const prefs = useDrawerPrefs();
    const navigate = useSidebarNavigate();
    // The shell is as tall as the window, except under iOS's JS tab bar, where the app's root keeps the safe area.
    const insets = isIos && !isNativeTabsEnabled() ? { top: 0, bottom: 0 } : getWindowSafeAreaInsets();

    return (
        <View className="flex-1 bg-card" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
            {currentUser ? <MemberHead onNavigate={navigate} /> : <GuestHead onNavigate={navigate} />}
            <AppSidebarList panels={panels} prefs={prefs} url={comparable(url)} onNavigate={navigate} />
        </View>
    );
}

/**
 * Around the tabs (apps/expo/app/(tabs)/_layout.js): the tabs, and the drawer over them. `style` is the tabs' host
 * style, which makes the shell as tall as the window.
 */
export function AppSidebarShell({ children, style }: Readonly<{ children: ReactNode; style?: StyleProp<ViewStyle> }>) {
    const { t } = useTranslation();
    const { currentUser } = useCurrentUser();
    const { width } = useWindowDimensions();
    const enabled = hasAppDrawer(currentUser);
    const open = useAppSidebarOpen();
    const url = useAppSidebarUrl();
    const viewer = currentUser ? currentUser.id : null;

    // Going to another page closes the drawer; so does signing in or out and switching the profile.
    useEffect(() => {
        setAppSidebarOpen(false);
    }, [url, viewer, enabled]);

    // The drawer's content mounts off screen a moment after the app starts: its menus load and its list is laid out
    // before the first opening, so it slides in complete.
    const [warm, setWarm] = useState(false);
    useEffect(() => {
        if (!enabled) return undefined;
        const timer = setTimeout(() => setWarm(true), WARM_UP_MS);
        return () => clearTimeout(timer);
    }, [enabled]);

    return (
        <AppSidebarDrawer
            enabled={enabled}
            open={open}
            warm={warm}
            width={Math.min(WIDTH_MAX, width - PAGE_EDGE)}
            onClose={closeSidebar}
            closeLabel={t('Close')}
            renderSidebar={() => <SidebarContent />}
            style={style}
        >
            {children}
        </AppSidebarDrawer>
    );
}

/** In the header: opens the drawer. Nothing where the viewer has none. */
export function AppSidebarOpenButton() {
    const { t } = useTranslation();
    const { currentUser } = useCurrentUser();
    if (!hasAppDrawer(currentUser)) return null;

    return (
        <NeoButton
            borderShape="circle"
            image="Menu"
            style="glass"
            controlSize="regular"
            accessibilityLabel={t('Main menu')}
            sound={false}
            onPress={() => setAppSidebarOpen(true)}
        />
    );
}

/** The web's place for the sidebar, inside the page (components/layout.web.js). Native has AppSidebarShell. */
export default function AppSidebar(_props: AppSidebarProps) {
    return null;
}
