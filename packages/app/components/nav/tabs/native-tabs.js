import { Tabs as RouterTabs, useRouter, usePathname } from 'app/lib/hooks/router';
import { View } from 'app/design/view';
import { Icon } from 'app/ui/atoms/icon';
import { useCurrentUser } from 'app/context/user';
import { appSetting, isTabBarLabelsEnabled } from 'app/lib/util';
import { Platform } from 'react-native';
import Profile from 'app/ui/molecules/profile/profile';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getBadgeForTab } from './badges';
import { isDashboardTab, resolveTabUrl } from './tab-menu';
import { handleTabPress } from './tab-press';
import { useBottomSheetData } from 'app/context/bottomsheet';

const TAB_ICON_SIZE = 24;
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 52 : 56;
const DETACH_INACTIVE_SCREENS = Platform.OS !== 'ios';
const TAB_BAR_ITEM_STYLE = appSetting('theme', 'native_tabs', 'tabBarItemStyle');
const TAB_BAR_BADGE_BACKGROUND = appSetting('theme', 'native_tabs', 'badgeBackground');

function TabBarIcon({ tab, tabUrl, currentUser, color, focused }) {
    if (isDashboardTab(tab, currentUser)) {
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

function getScreenOptions(colors, isShowTabs) {
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
            backgroundColor: TAB_BAR_BADGE_BACKGROUND || colors.primary,
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
        tabBarActiveTintColor: colors.primary,
        tabBarActiveBackgroundColor: colors.primaryBg,
        unmountOnBlur: false,
        lazy: true,
        sceneStyle: {
            backgroundColor: colors.background || colors.safeAreaBackground || colors.barsBackground,
        },
    };
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
    
    const screenOptions = useMemo(
        () => getScreenOptions(colors, isShowTabs),
        [colors, isShowTabs]
    );

    return (
        <RouterTabs
            key={tabsSessionKey}
            backBehavior="none"
            detachInactiveScreens={DETACH_INACTIVE_SCREENS}
            screenOptions={screenOptions}
        >
            {TabList.map((tab, index) => {
                const tabRouteName = `tab${index}/index`;
                const tabUrl = resolveTabUrl(tab, currentUser);
                const options = {
                    tabBarBadge: getBadgeForTab(currentUser, tab),
                    tabBarBadgeAllowFontScaling: false,
                    title: t(tab.title),
                    headerShown: false,
                    tabBarIcon: ({ color, focused }) => (
                        <TabBarIcon
                            tab={tab}
                            tabUrl={tabUrl}
                            currentUser={currentUser}
                            color={color}
                            focused={focused}
                        />
                    ),
                };

                if (tab.title === '' || !isTabBarLabelsEnabled()) {
                    options.tabBarLabel = () => null;
                    options.tabBarLabelPosition = 'beside-icon';
                }

                if (tab.hide === true)
                    options.href = null;

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
                        options={options}
                    />
                );
            })}
        </RouterTabs>
    );
}
