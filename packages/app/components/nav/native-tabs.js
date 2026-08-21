/**
 * System tab bar via expo-router NativeTabs (iOS UITabBar / Android Material 3).
 * Gated by `neo_button.native.enabled` (and optional `native.tabs`).
 *
 * Expo UI TabView / NavigationBar are in-screen chrome, not a router. NEO's
 * tab0–tab4 slots are full-screen routes, so NativeTabs is the fit.
 */
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useNavigation, usePathname, useRouter, getWindowSafeAreaInsets } from 'app/lib/hooks/router';
import { useEffect, useState } from 'react';
import { PixelRatio, Platform, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { isNativeTabsEnabled, areTabBarLabelsEnabled } from 'app/design/controls';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from 'app/context/user';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { TabSlideHost } from 'app/components/nav/tab-slide';
import { playTabFeedback } from 'app/components/nav/tab-feedback';
import { joinUnaUrl } from 'app/config';
import { ImageManipulator, SaveFormat } from 'app/lib/image/manipulator';
import { pngBase64WithCircleMask } from 'app/lib/image/circle-png';
import { getNativeOptimizedImageUrl } from 'app/ui/atoms/image';
import {
    appSetting,
    clearNotif,
    FeedbackHaptics,
    findIconFromRemote,
} from 'app/lib/util';
import {
    canGoBackInTab,
    navigateBackInTab,
} from 'app/lib/tab-history';
import emitter from 'app/context/emitter';
import * as WebBrowser from 'expo-web-browser';

const TAB_ICONS = {
    House: { sf: { default: 'house', selected: 'house.fill' }, md: 'home' },
    UsersRound: { sf: { default: 'person.2', selected: 'person.2.fill' }, md: 'group' },
    MessageCircleMore: { sf: { default: 'message', selected: 'message.fill' }, md: 'chat' },
    Bell: { sf: { default: 'bell', selected: 'bell.fill' }, md: 'notifications' },
    Award: { sf: { default: 'rosette', selected: 'rosette.fill' }, md: 'military_tech' },
    Compass: { sf: { default: 'safari', selected: 'safari.fill' }, md: 'explore' },
    Info: { sf: { default: 'info.circle', selected: 'info.circle.fill' }, md: 'info' },
    Contact: { sf: { default: 'person.crop.circle', selected: 'person.crop.circle.fill' }, md: 'contacts' },
    LayoutDashboard: { sf: { default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' }, md: 'dashboard' },
};

function formatBadgeCount(count) {
    const n = Number(count) || 0;
    if (n <= 0) return null;
    return n > 99 ? '99+' : String(n);
}

function getBadgeLabel(currentUser, tab) {
    if (
        (tab.url == appSetting('notifications', 'url') || tab.badge == 'notifications') &&
        currentUser?.notifications
    ) {
        return formatBadgeCount(currentUser.notifications);
    }
    if (tab.badge == 'notifications, messenger') {
        return formatBadgeCount(
            (currentUser?.counters?.bx_messenger_new_messages || 0) +
                (currentUser?.notifications || 0)
        );
    }
    if (tab.url == appSetting('messenger', 'url') && currentUser?.counters?.bx_messenger_new_messages) {
        return formatBadgeCount(currentUser.counters.bx_messenger_new_messages);
    }
    return null;
}

function resolveTabIcons(icon) {
    const lucide = findIconFromRemote(icon) || icon;
    if (TAB_ICONS[lucide]) return TAB_ICONS[lucide];
    const native = appSetting('theme', 'neo_button')?.native;
    const sfName = native?.iosSymbols?.[lucide];
    if (typeof sfName === 'string' && sfName) {
        return { sf: { default: sfName, selected: `${sfName}.fill` }, md: 'circle' };
    }
    return { sf: 'circle', md: 'circle' };
}

function isDashboardTab(tab, currentUser) {
    const tabUrl = tab.url === '{profile}' ? currentUser?.url : tab.url;
    return tabUrl == appSetting('dashboard', 'url') || tab.icon == 'dashboard';
}

function resolveAvatarUri(src) {
    if (!src) return null;
    const value = String(src);
    if (value.startsWith('data:image') || value.startsWith('blob:')) return value;
    return joinUnaUrl(value) || null;
}

/** UITabBar draws icon images at intrinsic size — a full avatar floods the bar. */
const TAB_AVATAR_PT = 28;
const tabAvatarSourceCache = new Map();

function asFileUri(path) {
    if (!path) return null;
    if (path.startsWith('file:') || path.startsWith('data:') || path.startsWith('blob:')) return path;
    return path.startsWith('/') ? `file://${path}` : path;
}

async function resolveLocalImageUri(uri) {
    if (!uri) return null;
    if (uri.startsWith('file:') || uri.startsWith('data:') || uri.startsWith('blob:')) return uri;
    try {
        await Image.prefetch(uri);
        const cached = await Image.getCachePathAsync(uri);
        return asFileUri(cached) || uri;
    } catch {
        return uri;
    }
}

async function processTabAvatarUri(uri) {
    const scale = PixelRatio.get();
    const px = Math.max(48, Math.round(TAB_AVATAR_PT * scale));
    const localUri = await resolveLocalImageUri(uri);
    const context = ImageManipulator.manipulate(localUri);
    context.resize({ width: px, height: px });
    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({ format: SaveFormat.PNG, compress: 1, base64: true });
    let outUri = saved.uri;
    if (saved.base64) {
        try {
            const circled = pngBase64WithCircleMask(saved.base64);
            const circledContext = ImageManipulator.manipulate(`data:image/png;base64,${circled}`);
            const circledRendered = await circledContext.renderAsync();
            const circledSaved = await circledRendered.saveAsync({ format: SaveFormat.PNG, compress: 1 });
            outUri = circledSaved.uri;
        } catch {
            // Keep the square icon if the mask cannot be applied.
        }
    }
    return {
        uri: outUri,
        width: TAB_AVATAR_PT,
        height: TAB_AVATAR_PT,
        scale,
    };
}

async function makeTabAvatarSource(uri) {
    const hit = tabAvatarSourceCache.get(uri);
    if (hit) return hit;
    // Same Next `w=` Profile uses for displaySize="xs" (JS tab avatar).
    const profileWidth = appSetting('theme', 'profile_sizes', 'xs')?.width || 24;
    const optimized = getNativeOptimizedImageUrl(uri, profileWidth);
    const candidates = optimized && optimized !== uri ? [optimized, uri] : [uri];
    let lastError;
    for (const candidate of candidates) {
        try {
            const source = await processTabAvatarUri(candidate);
            tabAvatarSourceCache.set(uri, source);
            return source;
        } catch (error) {
            lastError = error;
        }
    }
    throw lastError;
}

function useTabAvatarSource(uri) {
    const [source, setSource] = useState(() => (uri ? tabAvatarSourceCache.get(uri) ?? null : null));
    useEffect(() => {
        if (!uri) {
            setSource(null);
            return undefined;
        }
        const cached = tabAvatarSourceCache.get(uri);
        if (cached) {
            setSource(cached);
            return undefined;
        }
        let cancelled = false;
        makeTabAvatarSource(uri)
            .then((next) => {
                if (!cancelled) setSource(next);
            })
            .catch(() => {
                if (!cancelled) setSource(null);
            });
        return () => {
            cancelled = true;
        };
    }, [uri]);
    return source;
}

function scheduleTabFeedback() {
    playTabFeedback();
}

/**
 * NativeTabs has no Screen `listeners`. Re-tap / external / notif-clear live
 * here so JS tabs keep their existing tabPress handlers.
 */
export function NativeTabPressSync({ tabKey }) {
    const navigation = useNavigation();
    const pathname = usePathname();
    const router = useRouter();
    const { currentUser, setCurrentUser } = useCurrentUser();
    const { setBottomSheetData } = useBottomSheetData();
    const notificationUrl = appSetting('notifications', 'url');

    useEffect(() => {
        if (!navigation?.addListener) return undefined;

        const onTabPress = async (e) => {
            const tabListKey = currentUser?.id ? 'menu_tabbar_logged' : 'menu_tabbar_non_logged';
            const TabList = appSetting('menu_items', tabListKey) || [];
            const match = String(tabKey || '').match(/^\/tab(\d+)$/);
            const tabIndex = match ? Number(match[1]) : 0;
            const tab = TabList[tabIndex];
            if (!tab) return;

            const tabUrl = tab.url === '{profile}' ? currentUser?.url : tab.url;
            const isExternalLink = tabUrl && (tabUrl.startsWith('http://') || tabUrl.startsWith('https://'));
            setBottomSheetData(null);

            if (isExternalLink) {
                e.preventDefault?.();
                await WebBrowser.openBrowserAsync(tabUrl);
                FeedbackHaptics('Medium');
                return;
            }

            if (tabUrl == notificationUrl) {
                clearNotif();
                setCurrentUser({
                    notifications: 0,
                    notificationsTs: Date.now(),
                    counters: {
                        ...(currentUser?.counters || {}),
                        bx_notifications: 0,
                    },
                });
            }

            const thisTab = `/tab${tabIndex}`;
            if (pathname?.startsWith(thisTab)) {
                e.preventDefault?.();
                if (canGoBackInTab(thisTab)) {
                    navigateBackInTab(router, thisTab, currentUser);
                } else {
                    emitter.emit('conductor', { action: 'reset_to_first' });
                }
                scheduleTabFeedback();
                return;
            }

            scheduleTabFeedback();
        };

        const unsub = navigation.addListener('tabPress', onTabPress);
        return unsub;
    }, [
        navigation,
        pathname,
        router,
        tabKey,
        currentUser,
        setCurrentUser,
        setBottomSheetData,
        notificationUrl,
    ]);

    return null;
}

/**
 * iOS 26 nested UITabBarController reserves the status-bar and home-indicator
 * slots on its own view. Negative window margins cancel both so tab screens
 * are truly edge-to-edge (content can scroll behind the header and tab bar).
 */
let iosNativeTabsHostStyle = null;
export function useNativeTabsHostStyle() {
    if (Platform.OS !== 'ios' || !isNativeTabsEnabled()) {
        return styles.host;
    }
    if (!iosNativeTabsHostStyle) {
        const win = getWindowSafeAreaInsets();
        // Window chrome only. Live insets.bottom can jump to the keyboard
        // height and yank the whole shell (and modals) upward.
        iosNativeTabsHostStyle = [styles.host, {
            marginTop: -(win.top || 0),
            marginBottom: -(win.bottom || 0),
        }];
    }
    return iosNativeTabsHostStyle;
}

export default function NativeTabNavigator({
    TabList,
    currentUser,
    colors,
    isShowTabs,
    tabsSessionKey,
}) {
    const { t } = useTranslation();
    const hideLabels = !areTabBarLabelsEnabled() || TabList.every((tab) => tab.title == '');
    const dashboardAvatarUri = TabList.some((tab) => isDashboardTab(tab, currentUser))
        ? resolveAvatarUri(currentUser?.avatar)
        : null;
    const dashboardAvatarSource = useTabAvatarSource(dashboardAvatarUri);

    return (
        <View style={styles.host}>
            <NativeTabs
                key={tabsSessionKey}
                hidden={!isShowTabs}
                tintColor={colors.primary}
                iconColor={colors.barsColor}
                labelStyle={{
                    color: colors.barsColor,
                }}
                tabBarRespectsIMEInsets={Platform.OS === 'android'}
                screenListeners={{
                    tabPress: () => {
                        playTabFeedback();
                    },
                }}
                unstable_nativeProps={{
                    nativeContainerStyle: { backgroundColor: 'transparent' },
                }}
            >
                {TabList.map((tab, index) => {
                    const icons = resolveTabIcons(tab.icon);
                    const badge = getBadgeLabel(currentUser, tab);
                    const avatarSource = isDashboardTab(tab, currentUser)
                        ? dashboardAvatarSource
                        : null;

                    return (
                        <NativeTabs.Trigger
                            key={`tab${index}`}
                            name={`tab${index}`}
                            hidden={tab.hide == true}
                            disablePopToTop
                            disableScrollToTop
                            disableAutomaticContentInsets
                        >
                            {avatarSource ? (
                                <NativeTabs.Trigger.Icon
                                    src={avatarSource}
                                    renderingMode="original"
                                />
                            ) : (
                                <NativeTabs.Trigger.Icon sf={icons.sf} md={icons.md} />
                            )}
                            {hideLabels || tab.title == '' ? (
                                <NativeTabs.Trigger.Label hidden>
                                    {tab.title ? t(tab.title) : undefined}
                                </NativeTabs.Trigger.Label>
                            ) : (
                                <NativeTabs.Trigger.Label>{t(tab.title)}</NativeTabs.Trigger.Label>
                            )}
                            {badge ? <NativeTabs.Trigger.Badge>{badge}</NativeTabs.Trigger.Badge> : null}
                        </NativeTabs.Trigger>
                    );
                })}
            </NativeTabs>
            <TabSlideHost
                sessionKey={tabsSessionKey}
                backgroundColor={colors.background}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    host: {
        flex: 1,
    },
});
