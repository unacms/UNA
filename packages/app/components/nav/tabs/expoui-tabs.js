/**
 * System tab bar via expo-router NativeTabs (iOS UITabBar / Android Material 3).
 * Gated by `native.expo_ui_buttons` + `native.expo_native_tabs`.
 *
 * Expo UI TabView / NavigationBar are in-screen chrome, not a router. NEO's
 * tab0–tab4 slots are full-screen routes, so NativeTabs is the fit.
 */
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PixelRatio, Platform } from 'react-native';
import { Image } from 'expo-image';
import { View } from 'app/design/view';
import { appSetting, findIconFromRemote, isAndroid, isIos, isTabBarLabelsEnabled, FeedbackHaptics, clearNotif } from 'app/lib/util';
import { useTranslation } from 'react-i18next';
import { TabSlideHost } from 'app/components/nav/tab-slide';
import { playTabFeedback } from 'app/components/nav/tab-feedback';
import { joinUnaUrl } from 'app/config';
import { ImageManipulator, SaveFormat } from 'app/lib/image/manipulator';
import { pngBase64WithCircleMask } from 'app/lib/image/circle-png';
import { getNativeOptimizedImageUrl } from 'app/lib/image-helpers';
import { getBadgeLabel } from './badges';
import {
    MORE_TAB_ICON,
    buildTabBarMoreMenuItems,
    isDashboardTab,
    isExternalTabUrl,
    resolveTabUrl,
    splitTabBarItems,
} from './tab-menu';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { useRouter, usePathname, useSafeAreaInsets } from 'app/lib/hooks/router';
import { nativeTabHref, rememberSelectedTab } from 'app/lib/navigation/tab-history';
import emitter from 'app/context/emitter';
import * as WebBrowser from 'expo-web-browser';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { useCurrentUser } from 'app/context/user';

const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 52 : 56;

function isMoreTabPath(pathname, moreTabIndex) {
    return !!pathname?.startsWith(`/tab${moreTabIndex}`);
}

/** NativeTabs (esp. Android) may switch tabs before JS tabPress — snap back to prior tab. */
function scheduleStayOnTab(router, stayOn) {
    if (!stayOn) return;
    requestAnimationFrame(() => {
        router.navigate(stayOn);
    });
}

function resolveTabIcons(icon) {
    const lucide = findIconFromRemote(icon) || icon;
    const tabIcons = appSetting('theme', 'expo_ui', 'tabs')?.icons;
    if (tabIcons?.[lucide]) return tabIcons[lucide];
    const sfName = appSetting('theme', 'expo_ui', 'button')?.iosSymbols?.[lucide];
    if (typeof sfName === 'string' && sfName) {
        return { sf: { default: sfName, selected: `${sfName}.fill` }, md: 'circle' };
    }
    return { sf: 'circle', md: 'circle' };
}

function getOverflowBadgeLabel(currentUser, overflow = []) {
    let total = 0;
    for (const tab of overflow) {
        if (tab?.hide === true) continue;
        const label = getBadgeLabel(currentUser, tab);
        if (!label) continue;
        const n = parseInt(label, 10);
        if (n > 0) total += n;
    }
    if (total <= 0) return null;
    return total > 99 ? '99+' : String(total);
}

/** UITabBar draws `src` icons square at intrinsic size — resize + circle-mask once. */
const TAB_AVATAR_PT = 28;
const avatarIconCache = new Map();

async function loadCircledTabAvatar(avatar) {
    const raw = String(avatar);
    const uri = raw.startsWith('data:') ? raw : joinUnaUrl(raw) || raw;
    const scale = PixelRatio.get();
    const px = Math.round(TAB_AVATAR_PT * scale);
    const remote = getNativeOptimizedImageUrl(uri, TAB_AVATAR_PT) || uri;
    await Image.prefetch(remote);
    const cached = await Image.getCachePathAsync(remote);
    const context = ImageManipulator.manipulate(cached ? `file://${cached}` : remote);
    context.resize({ width: px, height: px });
    const rendered = await context.renderAsync();
    const { base64 } = await rendered.saveAsync({ format: SaveFormat.PNG, compress: 1, base64: true });
    return {
        uri: `data:image/png;base64,${pngBase64WithCircleMask(base64)}`,
        width: TAB_AVATAR_PT,
        height: TAB_AVATAR_PT,
        scale,
    };
}

function useDashboardAvatarIcon(avatar) {
    const [source, setSource] = useState(() => (avatar ? avatarIconCache.get(avatar) ?? null : null));
    useEffect(() => {
        if (!avatar || avatarIconCache.has(avatar)) return undefined;
        let cancelled = false;
        loadCircledTabAvatar(avatar)
            .then((icon) => {
                avatarIconCache.set(avatar, icon);
                if (!cancelled) setSource(icon);
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [avatar]);
    return source;
}

function renderTabTrigger({
    tab,
    index,
    currentUser,
    dashboardAvatarSource,
    hideLabels,
    t,
}) {
    const icons = resolveTabIcons(tab.icon);
    const badge = getBadgeLabel(currentUser, tab);
    const avatarSource = isDashboardTab(tab, currentUser) ? dashboardAvatarSource : null;

    return (
        <NativeTabs.Trigger
            key={`tab${index}`}
            name={`tab${index}`}
            hidden={tab.hide === true}
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
            {hideLabels || tab.title === '' ? (
                <NativeTabs.Trigger.Label hidden>
                    {tab.title ? t(tab.title) : undefined}
                </NativeTabs.Trigger.Label>
            ) : (
                <NativeTabs.Trigger.Label>{t(tab.title)}</NativeTabs.Trigger.Label>
            )}
            {badge ? <NativeTabs.Trigger.Badge>{badge}</NativeTabs.Trigger.Badge> : null}
        </NativeTabs.Trigger>
    );
}

/** Transparent hit target over the native More tab — opens the same popup as JS tabs. */
function NativeTabsMoreOverlay({
    visible,
    isShowTabs,
    overflowMenuItems,
    onSelectOverflow,
    moreMenuOpen,
    onMoreMenuOpenChange,
    onMoreTriggerPress,
    tabBarHeight,
}) {
    const { t } = useTranslation();

    if (!isShowTabs || !overflowMenuItems?.length) return null;

    return (
        <View
            pointerEvents="box-none"
            collapsable={false}
            style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: tabBarHeight,
                zIndex: 9999,
                ...(isAndroid ? { elevation: 24 } : null),
            }}
        >
            <View pointerEvents="box-none" className="h-full flex-row">
                {visible.map((tab, index) => (
                    <View key={tab.key || `spacer-${index}`} className="flex-1" pointerEvents="none" />
                ))}
                <View className="flex-1" collapsable={false}>
                    <DropdownMenu
                        mode="popup"
                        showOnTop
                        openOnFocus={false}
                        open={moreMenuOpen}
                        onOpenChange={onMoreMenuOpenChange}
                        items={overflowMenuItems}
                        onSelect={onSelectOverflow}
                        triggerAccessibilityLabel={t('More')}
                        triggerClassName="flex-1 w-full h-full"
                    >
                        <View
                            className="flex-1 w-full h-full"
                            onTouchEnd={() => onMoreTriggerPress()}
                        />
                    </DropdownMenu>
                </View>
            </View>
        </View>
    );
}

export default function ExpoUITabNavigator({
    TabList,
    currentUser,
    colors,
    isShowTabs,
    tabsSessionKey,
}) {
    const { t } = useTranslation();
    const pathname = usePathname();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { setCurrentUser } = useCurrentUser();
    const { setBottomSheetData } = useBottomSheetData();
    const hideLabels = !isTabBarLabelsEnabled() || TabList.every((tab) => tab.title === '');
    const dashboardAvatarSource = useDashboardAvatarIcon(isIos ? currentUser?.avatar : null);
    const pathnameRef = useRef(pathname);
    const lastNonMoreTabRef = useRef('/tab0');
    const skipMoreBounceRef = useRef(false);

    const { visible, overflow, moreTabIndex } = useMemo(
        () => splitTabBarItems(TabList),
        [TabList]
    );

    const [activeOverflowUrl, setActiveOverflowUrl] = useState(null);
    const [moreMenuOpen, setMoreMenuOpen] = useState(false);

    const tabBarHeight = TAB_BAR_HEIGHT + (isAndroid ? insets.bottom : 0);

    useEffect(() => {
        pathnameRef.current = pathname;
        if (pathname && !isMoreTabPath(pathname, moreTabIndex)) {
            lastNonMoreTabRef.current = pathname;
        }
    }, [pathname, moreTabIndex]);

    // Handlers as plain functions — React Compiler memoizes them (manual
    // useCallback here could not be preserved by the compiler).
    const openMoreMenu = (stayOnPath) => {
        const stayOn = stayOnPath ?? (
            isMoreTabPath(pathnameRef.current, moreTabIndex)
                ? lastNonMoreTabRef.current
                : pathnameRef.current
        );
        setMoreMenuOpen(true);
        if (stayOn && !isMoreTabPath(stayOn, moreTabIndex)) {
            skipMoreBounceRef.current = true;
            scheduleStayOnTab(router, stayOn);
        }
    };

    useEffect(() => {
        const subscription = emitter.addListener('tabs-more', (data) => {
            if (data?.action === 'open') openMoreMenu(data?.stayOn);
            if (data?.action === 'close') setMoreMenuOpen(false);
        });
        return () => subscription.remove();
    }, [openMoreMenu]);

    /** Fallback when native tab bar switches to More before JS preventDefault runs. */
    useEffect(() => {
        if (!overflow.length) return;
        if (skipMoreBounceRef.current) {
            skipMoreBounceRef.current = false;
            return;
        }
        if (
            isMoreTabPath(pathname, moreTabIndex) &&
            !activeOverflowUrl &&
            !moreMenuOpen
        ) {
            const prev = lastNonMoreTabRef.current;
            if (prev && !isMoreTabPath(prev, moreTabIndex)) {
                skipMoreBounceRef.current = true;
                scheduleStayOnTab(router, prev);
            }
            setMoreMenuOpen(true);
        }
    }, [pathname, overflow.length, moreTabIndex, activeOverflowUrl, moreMenuOpen, router]);

    const handleMoreTabPress = useCallback((e) => {
        e?.preventDefault?.();
        openMoreMenu();
    }, [openMoreMenu]);

    const moreTabListeners = useMemo(
        () => ({
            tabPress: handleMoreTabPress,
        }),
        [handleMoreTabPress]
    );

    const screenListeners = useMemo(() => {
        if (!overflow.length) {
            return {
                tabPress: () => {
                    playTabFeedback();
                },
            };
        }
        return ({ route }) => ({
            tabPress: (e) => {
                if (route.name === `tab${moreTabIndex}`) {
                    handleMoreTabPress(e);
                    return;
                }
                playTabFeedback();
            },
        });
    }, [overflow.length, moreTabIndex, handleMoreTabPress]);

    const overflowMenuItems = useMemo(
        () => buildTabBarMoreMenuItems({
            visible,
            overflow,
            moreTabIndex,
            currentUser,
            t,
            pathname,
            activeOverflowUrl,
            mode: 'native',
        }),
        [visible, overflow, moreTabIndex, currentUser, t, pathname, activeOverflowUrl]
    );

    const handleOverflowSelect = async (item) => {
        if (item?.type === 'separator' || !item?.tab) return;

        const tab = item.tab;
        const tabUrl = resolveTabUrl(tab, currentUser);
        const routeIndex = item.isOverflow ? moreTabIndex : item.tabIndex;
        setBottomSheetData(null);

        if (isExternalTabUrl(tabUrl)) {
            await WebBrowser.openBrowserAsync(tabUrl);
            FeedbackHaptics('Medium');
            return;
        }

        const notificationUrl = appSetting('notifications', 'url');
        if (tabUrl === notificationUrl) {
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

        playTabFeedback();
        setMoreMenuOpen(false);
        setActiveOverflowUrl(item.isOverflow ? tabUrl : null);
        rememberSelectedTab(`/tab${routeIndex}`);
        router.push(nativeTabHref(tabUrl, `/tab${routeIndex}`));
    };

    const moreIcons = resolveTabIcons(MORE_TAB_ICON);
    const overflowBadge = getOverflowBadgeLabel(currentUser, overflow);
    const collapsed = overflow.length > 0;

    return (
        <View className="flex-1">
            <NativeTabs
                key={tabsSessionKey}
                hidden={!isShowTabs}
                tintColor={colors.primary}
                backgroundColor={isAndroid ? colors.barsBackground : undefined}
                indicatorColor={isAndroid ? colors.primaryBg : undefined}
                rippleColor={isAndroid ? colors.primary : undefined}
                badgeBackgroundColor={appSetting('theme', 'native_tabs', 'badgeBackground') || colors.primary}
                iconColor={{
                    default: colors.barsColor,
                    selected: colors.primary,
                }}
                labelStyle={{
                    default: { color: colors.barsColor },
                    selected: { color: colors.primary },
                }}
                labelVisibilityMode={hideLabels ? 'unlabeled' : 'labeled'}
                tabBarRespectsIMEInsets={isAndroid}
                screenListeners={screenListeners}
                unstable_nativeProps={{
                    nativeContainerStyle: {
                        backgroundColor: isIos ? 'transparent' : colors.barsBackground,
                    },
                }}
            >
                {collapsed
                    ? visible.map((tab, index) => renderTabTrigger({
                        tab,
                        index,
                        currentUser,
                        dashboardAvatarSource,
                        hideLabels,
                        t,
                    }))
                    : TabList.map((tab, index) => renderTabTrigger({
                        tab,
                        index,
                        currentUser,
                        dashboardAvatarSource,
                        hideLabels,
                        t,
                    }))}
                {collapsed ? (
                    <NativeTabs.Trigger
                        key={`tab${moreTabIndex}`}
                        name={`tab${moreTabIndex}`}
                        disablePopToTop
                        disableScrollToTop
                        disableAutomaticContentInsets
                        listeners={moreTabListeners}
                    >
                        <NativeTabs.Trigger.Icon sf={moreIcons.sf} md={moreIcons.md} />
                        {hideLabels ? (
                            <NativeTabs.Trigger.Label hidden>{t('More')}</NativeTabs.Trigger.Label>
                        ) : (
                            <NativeTabs.Trigger.Label>{t('More')}</NativeTabs.Trigger.Label>
                        )}
                        {overflowBadge ? (
                            <NativeTabs.Trigger.Badge>{overflowBadge}</NativeTabs.Trigger.Badge>
                        ) : null}
                    </NativeTabs.Trigger>
                ) : null}
            </NativeTabs>
            {collapsed ? (
                <NativeTabsMoreOverlay
                    visible={visible}
                    isShowTabs={isShowTabs}
                    overflowMenuItems={overflowMenuItems}
                    onSelectOverflow={handleOverflowSelect}
                    moreMenuOpen={moreMenuOpen}
                    onMoreMenuOpenChange={setMoreMenuOpen}
                    onMoreTriggerPress={openMoreMenu}
                    tabBarHeight={tabBarHeight}
                />
            ) : null}
            <TabSlideHost
                sessionKey={tabsSessionKey}
                backgroundColor={colors.background}
            />
        </View>
    );
}