import { Tabs } from "expo-router";
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon';
import { useCurrentUser } from 'app/context/user';
import { appSetting } from 'app/lib/util'
import { Theme } from 'app/design/theme';
import Profile from 'app/ui/molecules/profile';
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next';
//import BottomSheetDataContext from 'app/context/bottomsheet';
import { FeedbackHaptics } from 'app/lib/util';
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
import { staticComponents } from 'app/static';
import { Platform } from 'react-native'
enableScreens(true);

export default function () {

    const isUseCustomFont = appSetting('layout', 'use_custom_font');
    const fontsToLoad = isUseCustomFont ? { default: require('app/design/fonts/DefaultFont.ttf') } : {};
    const [fontsLoaded] = useFonts(fontsToLoad);
    const { t } = useTranslation();
    let { currentUser, setCurrentUser } = useCurrentUser();
    const router = useRouter();
    const { colors } = Theme();
    const TabList = currentUser ? appSetting('menu_items', 'menu_tabbar_logged') : appSetting('menu_items', 'menu_tabbar_non_logged');
    let iconWidth = 24;
    let iconHeight = 24;

    let profile = null

    // DEEP LINKING

    function processUrl(url) {
        if (currentUser?.id) {
            let a = parseUrl(url);
            let _path = '/' + a.path + (a.queryString ? '?' + a.queryString : '')
            if (_path == '/')
                _path = '/home';
            const index = TabList.findIndex((item) => {
                console.log(item.url, _path)
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

    useEffect(() => {
        // process links if app close
        const fetchInitialUrl = async () => {
            const url = await Linking.getInitialURL();
            if (url) {
                processUrl(url);
            }
        };

        fetchInitialUrl();

        const handleUrl = (event) => {
            const url = event.url;
            if (url) {
                setTimeout(() => {
                    processUrl(url);
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
        if (OneSignal.User) {
            if (currentUser) {
                console.log("OneSignal:" + currentUser.id + ":" + currentUser.hash)
                OneSignal.login('' + currentUser.id);
                OneSignal.User.addTag("user_hash", "" + currentUser.hash);
            }
            else {
                /*try {
                    // MAY BE NEED FIX
                    let s = OneSignal.User.getOnesignalId();
                    console.log("OneSignal:logout:" + s)
                    OneSignal.User.addTag("user_hash", "");
                } catch (error) {
                    console.error('Error adding tag:', error);
                }*/
            }
        }
    }, [currentUser?.id]);

    useEffect(() => {
        if (Platform.OS == 'ios') {
            PushNotificationIOS.setApplicationIconBadgeNumber(currentUser?.notifications);
        }
    }, [currentUser?.notifications]);


    if (currentUser) {
        let dUser = Object.assign({}, currentUser);
        dUser.url_avatar = dUser.avatar
        dUser.url = '/dashboard'
        profile = <Profile {...dUser} displayType="unit_wo_info" displaySize="xs" />
    }

    if (!fontsLoaded) {
        return null;
    }

    const isShowTabs = currentUser || appSetting('layout', 'show_nav_non_logged_native')

    return (
        <><Suggestions />
            <Subscriber />
            <View className="flex-1">
                <View className="w-full"><AsyncWorker /></View>

                <Tabs
                    screenOptions={({ navigation, route }) => ({
                        tabBarStyle: {
                            backgroundColor: colors.barsBackground,
                            height: isShowTabs ? 62 : 0,//55 old
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
                        lazy: currentUser ? false : true,
                    })}
                >
                    {
                        TabList.map((tab, index) => {
                            const options = {
                                tabBarBadge: staticComponents['getBadgeForTab'](currentUser, tab.url),
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
                                                if (d.url == appSetting('layout', 'notifications'))
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