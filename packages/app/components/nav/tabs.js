import { Tabs as RouterTabs, useRouter, usePathname } from 'app/lib/hooks/router';
import { View } from 'app/design/view';
import { Icon } from 'app/ui/atoms/icon';
import { useCurrentUser } from 'app/context/user';
import { appSetting } from 'app/lib/util'
import { Theme, ThemeName } from 'app/design/theme';
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import Profile from 'app/ui/molecules/profile';
import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next';
//import BottomSheetDataContext from 'app/context/bottomsheet';
import { FeedbackHaptics, getPageData, subscribeOneSignal } from 'app/lib/util';
import * as Linking from 'expo-linking';
import { parseUrl } from 'app/lib/util'
import { clearNotif } from 'app/lib/util'
import Suggestions from 'app/ui/molecules/suggestions';
import AsyncWorker from 'app/ui/molecules/async_worker';
import Subscriber from 'app/ui/molecules/subscriber';
import { useFonts } from 'expo-font';
//import PushNotificationIOS from "@react-native-community/push-notification-ios";
import { enableScreens } from 'react-native-screens';
import fonts from 'app/customization/design/fonts/fonts';
import { Platform } from 'react-native'
import { Appearance } from 'react-native';
import { Text } from 'app/design/typography'
//import VersionCheck from 'react-native-version-check';
import { Alert } from 'react-native';
import { useLayoutData } from 'app/context/layout';
import { getAlert } from 'app/lib/util';
import { useLayoutSettings } from 'app/context/layout-settings';
import { registerAll } from 'app/components/registry-init';
import * as WebBrowser from 'expo-web-browser';
import { getDomainFromUrl } from 'app/lib/util';
import { useSound } from 'app/lib/hooks/useSound';

enableScreens(appSetting('native', 'enable_screens'));

const themeSettings = appSetting('theme', 'native_tabs');

function getBadgeForTab(currentUser, url) {
    const badgeTextSize = appSetting('theme', 'native_tabs', 'badgeTextSize') || 'text-xs';

    if (
        url == appSetting('notifications', 'url') &&
        currentUser?.notifications
    ) {
        return (
            <Text className={`${badgeTextSize} text-white font-medium`}>
                {currentUser?.notifications}
            </Text>
        )
    }

    if (
        url == appSetting('messenger', 'url') &&
        currentUser?.counters?.bx_messenger_new_messages
    ) {
        return (
            <Text className={`${badgeTextSize} text-white font-medium`}>
                {currentUser?.counters?.bx_messenger_new_messages}
            </Text>
        )
    }
    return null
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
    const { setLayoutData } = useLayoutData()
    const { themeName } = useLayoutSettings();
    const [fontsLoaded] = useFonts(fonts);
    const router = useRouter();
    const pathname = usePathname();

    registerAll();

    const playClick = useSound('click');
    // useTranslation должен вызываться после всех других хуков, чтобы избежать проблем с порядком
    // если i18n не инициализирован, useTranslation может вызывать хуки условно
    const { t } = useTranslation();
    // Используем useColorScheme напрямую, чтобы избежать повторного вызова useLayoutSettings через Theme()
    const defColorScheme = useColorScheme();
    // Вычисляем тему через useMemo, чтобы избежать повторных вычислений и гарантировать стабильный порядок хуков
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
    const isShowTabs = currentUser || appSetting('native', 'show_tabs_non_logged')
    const notificationUrl = appSetting('notifications', 'url');
    const TabList = useMemo(() => currentUser ? appSetting('menu_items', 'menu_tabbar_logged') : appSetting('menu_items', 'menu_tabbar_non_logged'), [currentUser?.id]);


    const preloadDelay = appSetting('native', 'lazy_tabs_preload_delay');
    const [lazyLoadTabs, setLazyLoadTabs] = useState(true);

    const profile = useMemo(() => {
        if (currentUser) {
            const dUser = { ...currentUser, url_avatar: currentUser?.avatar, url: '/dashboard' };
            return <View className=" rounded-full "><Profile {...dUser} showLinks={false} displayType="unit_wo_info" displaySize="xs" /></View>;
        }
        return null;
    }, [currentUser?.id, currentUser?.avatar]);

    useEffect(() => {
        if (themeName != 'auto') {
            Appearance.setColorScheme(themeName);
        }
    }, [themeName]);

    const tabsHeight = Platform.OS == 'ios' ? 52 : 56;

    // Добавить useEffect для отложенной загрузки
    useEffect(() => {
        if (preloadDelay > 0 && lazyLoadTabs) {
            const timer = setTimeout(() => {
                setLazyLoadTabs(false);
            }, preloadDelay);

            return () => clearTimeout(timer);
        }
    }, [preloadDelay, lazyLoadTabs]);


    const screenOptions = useMemo(() => ({
        tabBarStyle: {
            backgroundColor: colors.barsBackground,
            height: isShowTabs ? tabsHeight : 0,
            opacity: isShowTabs ? 1 : 0,
            elevation: 0,
            boxShadow: 'none',
            marginRight: 0,
            marginLeft: 0,
            paddingRight: 6,
            paddingLeft: 6,
        },
        tabBarItemStyle: themeSettings.tabBarItemStyle,
        tabBarBadgeStyle: {
            backgroundColor: appSetting('theme', 'native_tabs', 'badgeBackground') || colors.primary,
            position: 'absolute',
            top: -4,
            end: -6,
            minWidth: 22,
            height: 20,
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
        freezeOnBlur: true,
        unmountOnBlur: false,
        // ЕДИНАЯ ЛОГИКА: для всех пользователей
        lazy: lazyLoadTabs,
    }), [colors, isShowTabs, currentUser?.id, lazyLoadTabs]);

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
    // DEEP LINKING

    useEffect(() => {
        if (currentUser) {
            subscribeOneSignal(currentUser, appSetting('native', 'onesignal_request_on_load'));
        }
    }, [currentUser?.id]);



    useEffect(() => {
        const fetchPageData = async () => {
            const data = await getPageData('home');
            setCurrentUser(data.data.user);
        }
        if (currentUser === null) {
            fetchPageData();
        }

    }, [currentUser]);

    // Условный рендеринг: все хуки должны вызываться до этого места
    // Используем условный рендеринг в JSX вместо раннего return
    if (!fontsLoaded || currentUser === null) {
        return null;
    }

    return (
        <>
            <Suggestions />
            <Subscriber />
            <View className="flex-1">
                <View className="w-full z-50"><AsyncWorker /></View>
                <RouterTabs screenOptions={screenOptions}>
                    {
                        TabList.map((tab, index) => {
                            const options = {
                                tabBarBadge: getBadgeForTab(currentUser, tab.url),
                                tabBarBadgeAllowFontScaling: false,
                                title: t(tab.title),
                                headerShown: false,
                                tabBarIcon: ({ color }) => (
                                    (tab.url == appSetting('dashboard', 'url') && profile) ? <View className="h-full ">{profile}</View> : <View className="h-full"><Icon icon={tab.icon} width={iconWidth} height={iconHeight} color={color} /></View>
                                )
                            };

                            if (tab.title == '') {
                                options.tabBarLabel = () => null;
                            }

                            if (tab.hide == true)
                                options.href = null;

                            return (
                                <RouterTabs.Screen
                                    key={`tab${index}`}
                                    name={`tab${index}`}
                                    initialParams={{ url2: tab.url, name: `tab${index}` }}
                                    listeners={{
                                        tabPress: async (e) => {

                                            let a = e.target.split('-');
                                            let tabData = TabList[a[0].replace('tab', '')];

                                            const isExternalLink = tabData.url && (tabData.url.startsWith('http://') || tabData.url.startsWith('https://'));

                                            if (isExternalLink) {
                                                e.preventDefault(); 
                                                await WebBrowser.openBrowserAsync(tabData.url);
                                                FeedbackHaptics('Medium');
                                                return;
                                            }

                                            if (pathname == `/tab${index}`) {
                                                setLayoutData(getAlert('list:move_to_top', true));
                                            }
                                            if (e.type == 'tabPress') {
                                                let a = e.target.split('-');
                                                let d = TabList[a[0].replace('tab', '')];
                                                if (d.url == notificationUrl) {
                                                    clearNotif()
                                                    setCurrentUser({
                                                        notifications: 0,
                                                        notificationsTs: Date.now()
                                                    });
                                                }

                                            }
                                            playClick();
                                            FeedbackHaptics('Medium');
                                        },
                                    }}
                                    options={options}
                                />
                            );
                        })
                    }
                </RouterTabs>
            </View>
        </>
    )
}
