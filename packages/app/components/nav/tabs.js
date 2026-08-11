import { Tabs as RouterTabs, useRouter, usePathname } from 'app/lib/hooks/router';
import { View } from 'app/design/view';
import { Icon } from 'app/ui/atoms/icon';
import { useCurrentUser } from 'app/context/user';
import { appSetting } from 'app/lib/util'
import { Appearance, BackHandler, Platform, useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import Profile from 'app/ui/molecules/profile/profile';
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next';
//import BottomSheetDataContext from 'app/context/bottomsheet';
import { FeedbackHaptics, getPageData } from 'app/lib/util';
import { scheduleOneSignalSubscription } from 'app/lib/one-signal';
import * as Linking from 'expo-linking';
import { parseUrl } from 'app/lib/util'
import { clearNotif } from 'app/lib/util'
import Suggestions from 'app/ui/molecules/misc/suggestions';
import AsyncWorker from 'app/ui/molecules/system/async_worker';
import Subscriber from 'app/ui/molecules/system/subscriber';
import { useFonts } from 'expo-font';
//import PushNotificationIOS from "@react-native-community/push-notification-ios";
import { enableScreens } from 'react-native-screens';
import fonts from 'app/customization/design/fonts/fonts';
import { Text } from 'app/design/typography'
import { staticComponents } from 'app/customization/static';
//import VersionCheck from 'react-native-version-check';
import { Alert } from 'react-native';
import { useLayoutData } from 'app/context/layout';
import { getAlert } from 'app/lib/util';
import { useLayoutSettings } from 'app/context/layout-settings';
import { registerAll } from 'app/components/registry-init';
import * as WebBrowser from 'expo-web-browser';
import { getDomainFromUrl } from 'app/lib/util';
import { useSound } from 'app/lib/hooks/useSound';
import * as SplashScreen from 'expo-splash-screen';
import {
    canGoBackInTab,
    dismissNavigationOverlays,
    getTabKeyFromPathname,
    navigateBackInTab,
    resetAllTabHistory,
} from 'app/lib/tab-history';
import { clearAllPageCache } from 'app/lib/tab-page-cache';
import emitter from 'app/context/emitter';
import { useBottomSheetData } from 'app/context/bottomsheet';
import BottomSheet from 'app/ui/molecules/dialogs/bottomsheet_content';

enableScreens(appSetting('native', 'enable_screens'));

/** Cold-start bootstrap: fail fast offline instead of 3×15s fetcher retries. */
const BOOTSTRAP_TIMEOUT_MS = 5000;
/** AbortController is unreliable on some Android RN builds — race a hard timer. */
const BOOTSTRAP_HARD_TIMEOUT_MS = 5500;

const themeSettings = appSetting('theme', 'native_tabs');

function formatBadgeCount(count) {
    const n = Number(count) || 0;
    return n > 99 ? 99 : n;
}

function getBadgeForTab(currentUser, tab) {
    const badgeTextSize = appSetting('theme', 'native_tabs', 'badgeTextSize') || 'text-xs';

    if (
        (tab.url == appSetting('notifications', 'url') || tab.badge == 'notifications') &&
        currentUser?.notifications
    ) {
        return (
            <Text className={`${badgeTextSize} text-white font-medium`}>
                {formatBadgeCount(currentUser?.notifications)}
            </Text>
        )
    }

    if (
        tab.badge == 'notifications, messenger' &&
        (currentUser?.counters?.bx_messenger_new_messages + currentUser?.notifications) > 0
    ) {
        return (
            <Text className={`${badgeTextSize} text-white font-medium`}>
                {formatBadgeCount(
                    (currentUser?.counters?.bx_messenger_new_messages || 0) +
                        (currentUser?.notifications || 0)
                )}
            </Text>
        )
    }
    if (
        tab.url == appSetting('messenger', 'url') &&
        currentUser?.counters?.bx_messenger_new_messages
    ) {
        return (
            <Text className={`${badgeTextSize} text-white font-medium`}>
                {formatBadgeCount(currentUser?.counters?.bx_messenger_new_messages)}
            </Text>
        )
    }
    return null
}

function scheduleTabFeedback(playTabSound) {
    if (!appSetting('layout', 'tab_sounds')) return;

    setTimeout(() => {
        playTabSound();
        FeedbackHaptics('Select');
    }, 0);
}

function processUrl(url, router, currentUser, TabList) {
    if (currentUser?.id) {
        const LinksForTabs = (() => {
            const baseLinks = TabList.map((item, index) => ({
                url: item.url,
                index
            }));

            const additionalLinks = appSetting('menu_items', 'transpile_urls');
            return [...baseLinks, ...additionalLinks];
        })();

        let a = parseUrl(url);
        let _path = '/' + a.path + (a.queryString ? '?' + a.queryString : '')
        if (_path == '/')
            _path = '/home';

        const index = LinksForTabs?.find((item) => _path.includes(item.url))?.index ?? -1;
        const isRoot = TabList.some((item) => item.url === _path); // to root of tab or not


        if (index != null && index > -1) {
            const route = {
                pathname: `/tab${index}`,
                ...(isRoot ? {} : { params: { url: _path } })
            };
            router.push(route);
        } else {
            router.push({
                pathname: '/tab0',
                params: { url: _path }
            });
        }
    }
}


export default function Tabs() {
    const { currentUser, setCurrentUser } = useCurrentUser();
    const [bootstrapError, setBootstrapError] = useState(false);
    const { setLayoutData } = useLayoutData()
    const { themeName } = useLayoutSettings();
    const [fontsLoaded] = useFonts(fonts);
    const router = useRouter();
    const pathname = usePathname();
    const { setBottomSheetData } = useBottomSheetData();
    registerAll();

    const playTabSound = useSound('tab');
    // useTranslation must run after all other hooks to avoid hook-order issues
    // if i18n is not initialized, useTranslation may call hooks conditionally
    const { t } = useTranslation();
    // Use useColorScheme directly to avoid calling useLayoutSettings again via useTheme()
    const defColorScheme = useColorScheme();
    // Compute theme via useMemo to avoid repeated work and keep hook order stable
    const { colors } = useMemo(() => {
        const actualThemeName = themeName != 'auto' ? themeName : defColorScheme;
        const lightTheme = appSetting('theme', 'light');
        const darkTheme = appSetting('theme', 'dark');
        const CustomLightTheme = {
            ...DefaultTheme,
            colors: {
                ...DefaultTheme.colors,
                ...lightTheme
            },
        };
        const CustomDarkTheme = {
            ...DarkTheme,
            colors: {
                ...DarkTheme.colors,
                ...darkTheme
            },
        };
        const theme = actualThemeName === 'dark' ? CustomDarkTheme : CustomLightTheme;
        return theme;
    }, [themeName, defColorScheme]);
    const iconWidth = 24;
    const iconHeight = 24;
    const shouldDetachInactiveScreens = Platform.OS !== 'ios';
    const isShowTabs = (currentUser && currentUser.confirmed) || appSetting('native', 'show_tabs_non_logged')
    const notificationUrl = appSetting('notifications', 'url');
    const TabList = useMemo(
        () => (currentUser?.id ? appSetting('menu_items', 'menu_tabbar_logged') : appSetting('menu_items', 'menu_tabbar_non_logged')),
        [currentUser?.id]
    );

    const tabsSessionKey = currentUser?.id
        ? `user-${currentUser.id}-${currentUser.confirmed}`
        : 'user-guest';


    useEffect(() => {
        if (themeName != 'auto') {
            Appearance.setColorScheme(themeName);
        }
    }, [themeName]);

    const tabsHeight = Platform.OS == 'ios' ? 52 : 56;


    const screenOptions = useMemo(() => ({
        tabBarStyle: {
            backgroundColor: colors.barsBackground,
            height: isShowTabs ? tabsHeight : 0,
            display: isShowTabs ? 'flex' : 'none',
            elevation: 0,
            boxShadow: 'none',
            marginRight: 0,
            marginLeft: 0,
            paddingRight: 6,
            paddingBottom: isShowTabs ? 10 : 0,
            paddingLeft: 6,
        },
        tabBarItemStyle: themeSettings.tabBarItemStyle,
        tabBarBadgeStyle: {
            backgroundColor: appSetting('theme', 'native_tabs', 'badgeBackground') || colors.primary,
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
    }), [colors, isShowTabs, currentUser?.id]);

    // DEEP LINKING

    useEffect(() => {
        // process links if app close
        const fetchInitialUrl = async () => {
            const url = await Linking.getInitialURL();
            if (url) {
                processUrl(url, router, currentUser, TabList);
            }
        };

        fetchInitialUrl();

        const handleUrl = (event) => {
            const url = event.url;
            if (url) {
                setTimeout(() => {
                    processUrl(url, router, currentUser, TabList);
                }, 3000);
            }
        };

        // process links if app open
        if (currentUser?.id) {
            const urlListener = Linking.addEventListener('url', handleUrl);
            return () => {
                urlListener.remove();
            };
        }

    }, [currentUser?.id]);

    useEffect(() => {
        resetAllTabHistory();
        clearAllPageCache();
    }, [currentUser?.id, currentUser?.confirmed]);
    // DEEP LINKING

    // Android system Back → in-tab history (same as header back / re-tap tab), not RN global history.
    useEffect(() => {
        if (Platform.OS !== 'android') return;

        const onHardwareBackPress = () => {
            if (dismissNavigationOverlays()) {
                return true;
            }

            const tabKey = getTabKeyFromPathname(pathname);
            if (canGoBackInTab(tabKey)) {
                navigateBackInTab(router, tabKey, currentUser);
                return true;
            }

            return false;
        };

        const subscription = BackHandler.addEventListener('hardwareBackPress', onHardwareBackPress);
        return () => subscription.remove();
    }, [pathname, router, currentUser]);

    useEffect(() => {
        if (currentUser) {
            return scheduleOneSignalSubscription(currentUser, {
                askPermission: appSetting('notifications', 'onesignal_request_on_load') ?? appSetting('native', 'onesignal_request_on_load'),
            });
        }
    }, [currentUser?.id]);



    useEffect(() => {
        if (currentUser !== null || bootstrapError) return;

        let cancelled = false;
        let hardTimer = null;

        const hardTimeout = new Promise((_, reject) => {
            hardTimer = setTimeout(
                () => reject(new Error('Bootstrap hard timeout')),
                BOOTSTRAP_HARD_TIMEOUT_MS
            );
        });

        (async () => {
            try {
                const data = await Promise.race([
                    getPageData('home', false, {
                        timeoutMs: BOOTSTRAP_TIMEOUT_MS,
                        maxAttempts: 1,
                        silent: true,
                    }),
                    hardTimeout,
                ]);
                if (cancelled) return;
                if (!data?.data) {
                    setBootstrapError(true);
                    void SplashScreen.hideAsync().catch(() => {});
                    return;
                }
                setCurrentUser(data.data.user ?? false);
            } catch {
                if (!cancelled) {
                    setBootstrapError(true);
                    void SplashScreen.hideAsync().catch(() => {});
                }
            } finally {
                if (hardTimer) clearTimeout(hardTimer);
            }
        })();

        return () => {
            cancelled = true;
            if (hardTimer) clearTimeout(hardTimer);
        };
    }, [currentUser, bootstrapError, setCurrentUser]);

    useEffect(() => {
        if (!bootstrapError) return;
        void SplashScreen.hideAsync().catch(() => {});
    }, [bootstrapError]);

    // Conditional render: all hooks must run before this point
    // Prefer offline UI even if fonts are still loading (empty font map / hang).
    if (bootstrapError) {
        const OfflineScreen = staticComponents.bootstrap_offline;
        return OfflineScreen
            ? <OfflineScreen onRetry={() => setBootstrapError(false)} />
            : null;
    }

    if (!fontsLoaded || currentUser === null) {
        return null;
    }

    return (
        <>
            <Suggestions />
            <Subscriber />
            <View className="flex-1">
                <View className="w-full z-50"><AsyncWorker /></View>
                <RouterTabs
                    key={tabsSessionKey}
                    backBehavior="none"
                    detachInactiveScreens={shouldDetachInactiveScreens}
                    screenOptions={screenOptions}
                >
                    {
                        TabList.map((tab, index) => {
                            const useAnimatedIcon = tab.animated === true;
                            const tabRouteName = `tab${index}/index`;
                            const tabUrl = tab.url === '{profile}' ? currentUser?.url : tab.url
                            const options = {
                                tabBarBadge: getBadgeForTab(currentUser, tab),
                                tabBarBadgeAllowFontScaling: false,
                                title: t(tab.title),
                                headerShown: false,
                                tabBarIcon: ({ color, focused }) => (
                                    ((tabUrl == appSetting('dashboard', 'url') || tab.icon == 'dashboard')) ? <View className="h-full ">
                                        <View className=" rounded-full " key={currentUser.id}>
                                            <Profile
                                                {...currentUser}
                                                url_avatar={currentUser?.avatar}
                                                url={tabUrl}
                                                showLinks={false}
                                                displayType="unit_wo_info"
                                                displaySize="xs" />
                                               
                                        </View>
                                    </View> :
                                        <View className="h-full">
                                            <Icon icon={tab.icon} width={iconWidth} height={iconHeight} color={color} animated={useAnimatedIcon} active={useAnimatedIcon ? focused : undefined} className={tab.addClassName} />
                                        </View>
                                )
                            };

                            if (tab.title == '') {
                                options.tabBarLabel = () => null;
                                options.tabBarLabelPosition = 'beside-icon'
                            }

                            if (tab.hide == true)
                                options.href = null;


                            return (
                                <RouterTabs.Screen
                                    key={`tab${index}`}
                                    name={tabRouteName}
                                    initialParams={{ url: tabUrl, name: `tab${index}` }}
                                    listeners={{
                                        tabPress: async (e) => {
                                            const isExternalLink = tabUrl && (tabUrl.startsWith('http://') || tabUrl.startsWith('https://'));
                                            setBottomSheetData(null);
                                            if (isExternalLink) {
                                                e.preventDefault();
                                                await WebBrowser.openBrowserAsync(tabUrl);
                                                FeedbackHaptics('Medium');
                                                return;
                                            }

                                            const tabKey = `/tab${index}`;

                                            if (e.type == 'tabPress') {

                                                if (tabUrl == notificationUrl) {

                                                    clearNotif()
                                                    setCurrentUser({
                                                        notifications: 0,
                                                        notificationsTs: Date.now(),
                                                        counters: {
                                                            ...(currentUser?.counters || {}),
                                                            bx_notifications: 0,
                                                        },
                                                    });
                                                }

                                            }
                                            
                                            if (pathname?.startsWith(tabKey)) {
                                                e.preventDefault?.();
                                                e.stopPropagation?.();

                                                if (canGoBackInTab(tabKey)) {
                                                    navigateBackInTab(router, tabKey, currentUser);
                                                } else {
                                                    emitter.emit('conductor', { action: 'reset_to_first' });
                                                }

                                                scheduleTabFeedback(playTabSound);
                                                return;
                                            }

                                            
                                            scheduleTabFeedback(playTabSound);
                                        },
                                    }}
                                    options={options}
                                />
                            );
                        })
                    }
                </RouterTabs>
                <BottomSheet />
            </View>
        </>
    )
}
