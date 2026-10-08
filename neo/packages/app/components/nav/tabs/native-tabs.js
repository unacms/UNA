import { Tabs as RouterTabs, useRouter, usePathname } from 'app/lib/hooks/router';
import { View } from 'app/design/view';
import { Icon } from 'app/ui/atoms/icon';
import { useCurrentUser } from 'app/context/user';
import { appSetting, isTabBarLabelsEnabled, FeedbackHaptics, clearNotif } from 'app/lib/util';
import { Platform } from 'react-native';
import Profile from 'app/ui/molecules/profile/profile';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as WebBrowser from 'expo-web-browser';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { nativeTabHref, rememberSelectedTab } from 'app/lib/navigation/tab-history';
import { playTabFeedback } from 'app/components/nav/tab-feedback';
import { Text } from 'app/design/typography';
import { getBadgeForTab, getBadgeLabel } from './badges';
import { isDashboardTab, isExternalTabUrl, resolveTabUrl, splitTabBarItems, buildTabBarMoreMenuItems, MORE_TAB_ICON } from './tab-menu';
import { handleTabPress } from './tab-press';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { useNativeTokenColor } from 'app/design/controls/neo-button/native-style-colors';

const TAB_ICON_SIZE = 24;
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 52 : 56;
const DETACH_INACTIVE_SCREENS = Platform.OS !== 'ios';
const TAB_BAR_ITEM_STYLE = appSetting('theme', 'native_tabs', 'tabBarItemStyle');
const TAB_BAR_BADGE_BACKGROUND = appSetting('theme', 'native_tabs', 'badgeBackground') || 'bg-destructive';
const TAB_BAR_SELECTED = appSetting('theme', 'native_tabs', 'selected');

function getOverflowBadgeCount(currentUser, overflow = []) {
    let total = 0;
    for (const tab of overflow) {
        if (tab?.hide === true) continue;
        const label = getBadgeLabel(currentUser, tab);
        if (!label) continue;
        const n = parseInt(label, 10);
        if (n > 0) total += n;
    }
    return total;
}

function getBadgeForOverflow(currentUser, overflow = []) {
    const count = getOverflowBadgeCount(currentUser, overflow);
    if (count <= 0) return null;
    const badgeTextSize = appSetting('theme', 'native_tabs', 'badgeTextSize') || 'text-xs';
    return (
        <Text className={`${badgeTextSize} text-white font-medium`}>
            {count > 99 ? 99 : count}
        </Text>
    );
}

function TabBarIcon({ tab, tabUrl, currentUser, color, focused }) {    if (isDashboardTab(tab, currentUser)) {
        return (
            <View className="h-full">
                <View className="rounded-full">
                    <Profile
                        {...currentUser}
                        url_avatar={currentUser?.avatar}
                        url={tabUrl}
                        showLinks={false}
                        displayType="unit_wo_info"
                        displaySize="xs"
                    />
                </View>
            </View>
        );
    }

    const animated = tab.animated === true;
    return (
        <View className="h-full">
            <Icon
                icon={tab.icon}
                width={TAB_ICON_SIZE}
                height={TAB_ICON_SIZE}
                color={color}
                animated={animated}
                active={animated ? focused : undefined}
                className={tab.addClassName}
            />
        </View>
    );
}

function MoreTabBarButton({ children, style, overflowItems, onSelectOverflow, accessibilityLabel }) {
    return (
        <DropdownMenu
            mode="popup"
            showOnTop
            items={overflowItems}
            onSelect={onSelectOverflow}
            triggerAccessibilityLabel={accessibilityLabel}
            triggerStyle={style}
            openOnFocus={false}
        >
            {children}
        </DropdownMenu>
    );
}

/** `tokens`: theme colors resolved from `native_tabs` (badge fill, selected tab ink / fill). */
function getScreenOptions(colors, isShowTabs, tokens) {
    return {
        tabBarStyle: {
            backgroundColor: colors.barsBackground,
            height: isShowTabs ? TAB_BAR_HEIGHT : 0,
            display: isShowTabs ? 'flex' : 'none',
            elevation: 0,
            boxShadow: 'none',
            marginRight: 0,
            marginLeft: 0,
            paddingRight: 6,
            paddingBottom: isShowTabs ? 10 : 0,
            paddingLeft: 6,
        },
        tabBarItemStyle: TAB_BAR_ITEM_STYLE,
        tabBarBadgeStyle: {
            backgroundColor: tokens.badgeBackground,
            position: 'absolute',
            top: -4,
            end: -6,
            minWidth: 22,
            height: isShowTabs ? 20 : 0,
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 4,
            borderWidth: 2,
            borderColor: colors.barsBackground,
        },
        tabBarAllowFontScaling: false,
        tabBarInactiveTintColor: colors.barsColor,
        tabBarActiveTintColor: tokens.selectedInk || colors.primary,
        tabBarActiveBackgroundColor: tokens.selectedIndicator || colors.primaryBg,
        unmountOnBlur: false,
        lazy: true,
        sceneStyle: {
            backgroundColor: colors.background || colors.safeAreaBackground || colors.barsBackground,
        },
    };
}

function tabScreenOptions({ tab, tabUrl, currentUser, t, extra = {} }) {
    const options = {
        tabBarBadge: extra.tabBarBadge ?? getBadgeForTab(currentUser, tab),
        tabBarBadgeAllowFontScaling: false,
        title: extra.title ?? t(tab.title),
        headerShown: false,
        tabBarIcon: extra.tabBarIcon ?? (({ color, focused }) => (
            <TabBarIcon
                tab={tab}
                tabUrl={tabUrl}
                currentUser={currentUser}
                color={color}
                focused={focused}
            />
        )),
        ...extra.screenOptions,
    };

    if ((extra.title ?? tab.title) === '' || !isTabBarLabelsEnabled()) {
        options.tabBarLabel = () => null;
        options.tabBarLabelPosition = 'beside-icon';
    }

    if (tab.hide === true) {
        options.href = null;
    }

    return options;
}

export default function NativeTabNavigator({
    TabList,
    currentUser,
    colors,
    isShowTabs,
    tabsSessionKey,
}) {
    const { setCurrentUser } = useCurrentUser();
    const { setBottomSheetData } = useBottomSheetData();
    const pathname = usePathname();
    const router = useRouter();
    const { t } = useTranslation();

    // Selected tab: the toggled look of selected glass buttons (`native_tabs.selected`).
    const badgeBackground = useNativeTokenColor(TAB_BAR_BADGE_BACKGROUND);
    const selectedInk = useNativeTokenColor(TAB_BAR_SELECTED?.foreground);
    const selectedIndicator = useNativeTokenColor(TAB_BAR_SELECTED?.indicator);

    const screenOptions = useMemo(
        () => getScreenOptions(colors, isShowTabs, { badgeBackground, selectedInk, selectedIndicator }),
        [colors, isShowTabs, badgeBackground, selectedInk, selectedIndicator]
    );

    const { visible, overflow, moreTabIndex } = useMemo(
        () => splitTabBarItems(TabList),
        [TabList]
    );

    const [activeOverflowUrl, setActiveOverflowUrl] = useState(null);

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
        [visible, overflow, t, currentUser, activeOverflowUrl, pathname, moreTabIndex]
    );

    const handleOverflowSelect = useCallback(async (item) => {
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
        setActiveOverflowUrl(item.isOverflow ? tabUrl : null);
        rememberSelectedTab(`/tab${routeIndex}`);
        // The tab's root shows the picked page; `navigate` updates the existing
        // root (popping pages above it) where `push` would stack a second one.
        router.navigate(nativeTabHref(tabUrl, `/tab${routeIndex}`));
    }, [currentUser, moreTabIndex, router, setBottomSheetData, setCurrentUser]);

    const moreTab = overflow[0];

    return (
        <RouterTabs
            key={tabsSessionKey}
            backBehavior="none"
            detachInactiveScreens={DETACH_INACTIVE_SCREENS}
            screenOptions={screenOptions}
        >
            {visible.map((tab, index) => {
                const tabRouteName = `tab${index}`;
                const tabUrl = resolveTabUrl(tab, currentUser);
                return (
                    <RouterTabs.Screen
                        key={`tab${index}`}
                        name={tabRouteName}
                        initialParams={{ url: tabUrl, name: `tab${index}` }}
                        listeners={{
                            tabPress: (e) => handleTabPress({
                                e,
                                tab,
                                tabIndex: index,
                                currentUser,
                                setCurrentUser,
                                setBottomSheetData,
                                pathname,
                                router,
                                variant: 'js',
                            }),
                        }}
                        options={tabScreenOptions({ tab, tabUrl, currentUser, t })}
                    />
                );
            })}
            {/* `[]`, not `null`: expo-router warns on any non-Screen child. */}
            {moreTab ? (
                <RouterTabs.Screen
                    key={`tab${moreTabIndex}`}
                    name={`tab${moreTabIndex}`}
                    initialParams={{
                        url: resolveTabUrl(moreTab, currentUser),
                        name: `tab${moreTabIndex}`,
                    }}
                    listeners={{
                        tabPress: (e) => {
                            e.preventDefault?.();
                            e.stopPropagation?.();
                        },
                    }}
                    options={tabScreenOptions({
                        tab: { ...moreTab, icon: MORE_TAB_ICON, title: t('More') },
                        tabUrl: resolveTabUrl(moreTab, currentUser),
                        currentUser,
                        t,
                        extra: {
                            title: t('More'),
                            tabBarBadge: getBadgeForOverflow(currentUser, overflow),
                            tabBarIcon: ({ color }) => (
                                <View className="h-full">
                                    <Icon
                                        icon={MORE_TAB_ICON}
                                        width={TAB_ICON_SIZE}
                                        height={TAB_ICON_SIZE}
                                        color={color}
                                    />
                                </View>
                            ),
                            screenOptions: {
                                tabBarButton: (props) => (
                                    <MoreTabBarButton
                                        style={props.style}
                                        overflowItems={overflowMenuItems}
                                        onSelectOverflow={handleOverflowSelect}
                                        accessibilityLabel={t('More')}
                                    >
                                        {props.children}
                                    </MoreTabBarButton>
                                ),
                            },
                        },
                    })}
                />
            ) : []}
        </RouterTabs>
    );
}
