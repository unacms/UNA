import { Tabs, useRouter, useNavigation, usePathname } from 'app/lib/hooks/router';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon';
import { useCurrentUser } from 'app/context/user';
import { appSetting } from 'app/lib/util'
import { Theme } from 'app/design/theme';
import Profile from 'app/ui/molecules/profile';
import { useState, useEffect, useMemo } from 'react'
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
import { LogLevel, OneSignal } from 'react-native-onesignal';
import { callFn } from 'app/lib/functions/call';
import fonts from 'app/design/fonts/fonts';
import { Platform } from 'react-native'
import { Appearance } from 'react-native';
import VersionCheck from 'react-native-version-check';
import { Alert } from 'react-native';
import { useLayoutData } from 'app/context/layout';
import { getAlert } from 'app/lib/util';

enableScreens(appSetting('native', 'enable_screens'));

const themeSettings = appSetting('theme', 'native_tabs');

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


export default function () {
    const { currentUser, setCurrentUser } = useCurrentUser();
    const { setLayoutData } = useLayoutData()
    const isUseCustomFont = appSetting('native', 'use_custom_font');
    const fontsToLoad = isUseCustomFont ? fonts : {};

    const [fontsLoaded] = useFonts(fontsToLoad);
    const { t } = useTranslation();

    const router = useRouter();
    const { colors } = Theme();
    const iconWidth = 24;
    const iconHeight = 24;
    const isShowTabs = currentUser || appSetting('native', 'show_tabs_non_logged')
    const notificationUrl = appSetting('notifications', 'url');

    const TabList = useMemo(() => currentUser ? appSetting('menu_items', 'menu_tabbar_logged') : appSetting('menu_items', 'menu_tabbar_non_logged'), [currentUser?.id]);

    const profile = useMemo(() => {
        if (currentUser) {
            const dUser = { ...currentUser, url_avatar: currentUser?.avatar, url: '/dashboard' };
            return <View className=" bg-neutral-100 border border-neutral-700 dark:bg-neutral-700 dark:border-neutral-300 rounded-full p-[1px] h-[24px] w-[24px]"><Profile {...dUser} showLinks={false} displayType="unit_wo_info" displaySize="xxs" /></View>;
        }
        return null;
    }, [currentUser?.id, currentUser?.avatar]);

    const theme = appSetting('native', 'default_theme')
    useEffect(() => {
        if (theme != 'auto') {
            Appearance.setColorScheme(theme);
        }
    }, [theme]);

    const tabsHeight = Platform.OS == 'ios' ? 52 : 56;

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
        lazy: currentUser ? appSetting('native', 'lazy_tabs') : true,
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
    // DEEP LINKING

    useEffect(() => {
        if (currentUser) {
            subscribeOneSignal(currentUser, appSetting('native', 'onesignal_request_on_load'));
        }
    }, [currentUser?.id]);

    const isCheckVersion = appSetting('native', 'check_version');

    useEffect(() => {
        const checkVersion = async () => {
            try {
                const res = await VersionCheck.needUpdate();
                const forceUpdate = isCheckVersion == 'required';
                if (res?.isNeeded) {
                    const buttons = [
                        {
                            text: 'Update',
                            onPress: () => Linking.openURL(res.storeUrl),
                        },
                    ];
                    if (!forceUpdate) {
                        buttons.push({
                            text: 'Later',
                            style: 'cancel',
                        });
                    }
                    Alert.alert(
                        'New version avaliable',
                        'Please, update the app to the latest version',
                        buttons,
                        { cancelable: !forceUpdate }
                    );
                }
                //enable for check
                /*else{
                    const res = VersionCheck.getCurrentVersion();
                    const res1 = await VersionCheck.getLatestVersion();
                    Alert.alert(
                        'current '+res,
                        'Store'+res1,
                        [{
                            text: 'Later',
                            style: 'cancel',
                          }]
                     
                    );
                }*/
            } catch (e) {
            }
        };
        if (isCheckVersion != 'no')
            checkVersion();
    }, []);

    const pathname = usePathname();
    console.log("RenderTabs", currentUser)
    useEffect(() => {
        const fetchPageData = async () => {
            console.log("RenderTabs11", currentUser)
             const data = await getPageData('home');
             setCurrentUser(data.data.user);
        }
        if (currentUser === null){
           fetchPageData();
        }
         
    }, [currentUser]);

    if (!fontsLoaded || currentUser === null) {
        return null;
    }


    return (
        <><Suggestions />
            <Subscriber />
            <View className="flex-1">
                <View className="w-full z-50"><AsyncWorker /></View>
                <Tabs screenOptions={screenOptions}>
                    {
                        TabList.map((tab, index) => {
                            const options = {
                                tabBarBadge: callFn("getBadgeForTab", [currentUser, tab.url]),
                                tabBarBadgeAllowFontScaling: false,
                                title: t(tab.title),
                                headerShown: false,
                                tabBarIcon: ({ color }) => (
                                    (tab.url == '/dashboard' && profile) ? <View className="h-full ">{profile}</View> : <View className="h-full"><Icon icon={tab.icon} width={iconWidth} height={iconHeight} color={color} /></View>
                                )
                            };

                            if (tab.title == '') {
                                options.tabBarLabel = () => null;
                            }

                            if (tab.hide == true)
                                options.href = null;

                            return (
                                <Tabs.Screen
                                    key={`tab${index}`}
                                    name={`tab${index}`}
                                    initialParams={{ url2: tab.url, name: `tab${index}` }}
                                    listeners={{
                                        tabPress: e => {

                                           
                                          
                                            if (pathname == `/tab${index}`) {
                                               /* router.setParams({ 
                                                    refresh: Date.now() 
                                                });*/
                                                setLayoutData(getAlert('list:move_to_top', true));
                                            }
                                            if (e.type == 'tabPress') {
                                                let a = e.target.split('-');
                                                let d = TabList[a[0].replace('tab', '')];
                                                if (d.url == notificationUrl){
                                                    clearNotif()
                                                    setCurrentUser({
                                                        notifications: 0,
                                                        notificationsTs:Date.now()
                                                    });
                                                }
                                                    
                                            }
                                            FeedbackHaptics('Medium');
                                        },
                                    }}
                                    options={options}
                                />
                            );
                        })
                    }
                </Tabs>
            </View>
        </>
    )
}