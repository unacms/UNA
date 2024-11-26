import { Tabs } from "expo-router";
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
import { FeedbackHaptics, isNumeric } from 'app/lib/util';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { parseUrl } from 'app/lib/util'
import { clearNotif } from 'app/lib/util'
import Suggestions from 'app/ui/molecules/suggestions';
import AsyncWorker from 'app/ui/molecules/async_worker';
import Subscriber from 'app/ui/molecules/subscriber';
import { useFonts } from 'expo-font';
import PushNotificationIOS from "@react-native-community/push-notification-ios";
import { enableScreens } from 'react-native-screens';
import { OneSignal } from 'react-native-onesignal';
import { callFn } from 'app/lib/functions/call';
import fonts from 'app/design/fonts/fonts';
import { Platform } from 'react-native'
enableScreens(appSetting('layout', 'native_enable_screens'));

function processUrl(url, router, currentUser, TabList) {
    if (currentUser?.id) {
        let a = parseUrl(url);
        let _path = '/' + a.path + (a.queryString ? '?' + a.queryString : '')
        if (_path == '/')
            _path = '/home';
        const index = TabList.findIndex((item) => {
            if (item.url == _path) {
                return true;
            }
        });
        if (index !== null && index > -1) {
            router.push({
                pathname: '/tab' + index
            });
        }
        else {
            router.push({
                pathname: '/tab0',
                params: { url: _path }
            });
        }
    }
}

export default function () {
    const { currentUser, setCurrentUser } = useCurrentUser();

    const isUseCustomFont = appSetting('layout', 'use_custom_font');
    const fontsToLoad = isUseCustomFont ? fonts : {};

    const [fontsLoaded] = useFonts(fontsToLoad);
    const { t } = useTranslation();
    
    const router = useRouter();
    const { colors } = Theme();
    const iconWidth = 24;
    const iconHeight = 24;
    const isShowTabs = currentUser || appSetting('layout', 'show_nav_non_logged_native')
    const notificationUrl =  appSetting('layout', 'notifications');

    const TabList = useMemo(() => currentUser ? appSetting('menu_items', 'menu_tabbar_logged') : appSetting('menu_items', 'menu_tabbar_non_logged'), [currentUser?.id]);

    const profile = useMemo(() => {
        if (currentUser) {
            const dUser = { ...currentUser, url_avatar: currentUser?.avatar, url: '/dashboard' };
            return <Profile {...dUser} displayType="unit_wo_info" displaySize="xs" />;
        }
        return null;
    }, [currentUser?.id]);

    const screenOptions = useMemo(() => ({
        tabBarStyle: {
            backgroundColor: colors.barsBackground,
            height: isShowTabs ? 62 : 0,
            opacity: isShowTabs ? 1 : 0,
            elevation: 0,
            boxShadow: 'none',
        },
        tabBarItemStyle: {
            marginBottom: 5,
            height: 44,
            marginTop: 5,
            borderRadius: 10,
            marginLeft: 10,
            marginRight: 10,
        },
        tabBarAllowFontScaling: false,
        tabBarInactiveTintColor: colors.barsColor,
        tabBarActiveTintColor: colors.primary,
        tabBarActiveBackgroundColor: colors.primaryBg,
        freezeOnBlur: true,
        unmountOnBlur: false,
        lazy: currentUser ? appSetting('layout', 'native_lazy_tabs') : true,
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
        //!!!NOT MERGE WITH OTHER USEEFFECT!!!
        if (currentUser) {
            console.log("OneSignal:" + currentUser.id + ":" + currentUser.hash)
            OneSignal.login('' + currentUser.id);
            OneSignal.User.addTag("user_hash", "" + currentUser.hash);
        }
        
    }, [currentUser?.id]); 


    useEffect(() => {
        if (currentUser && Platform.OS == 'ios' && isNumeric(currentUser?.notifications)) {
            PushNotificationIOS.setApplicationIconBadgeNumber(currentUser?.notifications);
        }
    }, [currentUser?.id]);


    if (!fontsLoaded) {
        return null;
    }

    return (
        <><Suggestions />
            <Subscriber />
            <View className="flex-1">
                <View className="w-full"><AsyncWorker /></View>

                <Tabs screenOptions={screenOptions}>
                    {
                        TabList.map((tab, index) => {
                            const options = {
                                tabBarBadge:  callFn("getBadgeForTab", [currentUser, tab.url]),
                                tabBarBadgeAllowFontScaling: false,
                                title: t(tab.title),
                                headerShown: false,
                                tabBarIcon: ({ color }) => (
                                    (tab.url == '/dashboard' && profile) ? profile : <Icon icon={tab.icon} width={iconWidth} height={iconHeight} color={color} />
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
                                            if (e.type == 'tabPress') {
                                                let a = e.target.split('-');
                                                let d = TabList[a[0].replace('tab', '')];
                                                if (d.url == notificationUrl)
                                                    clearNotif(currentUser, setCurrentUser)
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