import { Tabs } from "expo-router";
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon';
import { useCurrentUser } from 'app/context/user';
import { appSetting } from 'app/lib/util'
import { Theme } from 'app/design/theme';
import Profile from 'app/ui/molecules/profile';
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next';
import BottomSheetDataContext from 'app/context/bottomsheet';
import { FeedbackHaptics } from 'app/lib/util';
import * as Linking from 'expo-linking';
import { useRouter, useNavigation } from 'expo-router';
import { parseUrl } from 'app/lib/util'
import { clearNotif } from 'app/lib/util'
import * as Notifications from 'expo-notifications';
import Suggestions from 'app/ui/molecules/suggestions';
import AsyncWorker from 'app/ui/molecules/async_worker';
import { useFonts } from 'expo-font';
import { Platform } from 'react-native'
import { enableScreens } from 'react-native-screens';
import { OneSignal } from 'react-native-onesignal';
//import { registerBackgroundFetchAsync, unregisterBackgroundFetchAsync } from 'app/ui/molecules/background_tasks';
enableScreens(true);

export default function () {

    const isUseCustomFont = appSetting('layout', 'use_custom_font');
    const fontsToLoad = isUseCustomFont ? { default: require('app/design/fonts/DefaultFont.ttf') } : {};
    const [fontsLoaded] = useFonts(fontsToLoad);

    const { t } = useTranslation();
    let { currentUser, setCurrentUser } = useCurrentUser();

    const navigation = useNavigation();
    const router = useRouter();
    const { colors } = Theme();
    const TabList = currentUser ? appSetting('menu_items', 'menu_tabbar_logged') : appSetting('menu_items', 'menu_tabbar_non_logged');
    let iconWidth = 24;
    let iconHeight = 24;

    let profile = null

    useEffect(() => {
        const handleNotifPermissions = async () => {
          try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
              const { status } = await Notifications.requestPermissionsAsync();
              finalStatus = status;
            }
            if (finalStatus !== 'granted') {
              Alert.alert('Failed to get push token for push notification!');
              return;
            }
            // Further logic for successful permissions can go here
          } catch (error) {
            console.error("Error getting notification permissions: ", error);
          }
        };
    
        handleNotifPermissions();
      }, []);

    Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });


    // DEEP LINKING
    const url = Linking.useURL();
    useEffect(() => {
        if (url && typeof url !== 'undefined') {
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
                navigation.navigate('tab' + index);
            }
        }


    }, [url, currentUser]);

    useEffect(() => {
        if (currentUser)  {
            //console.log("---setExternalUserId")
            OneSignal.login("user"+currentUser.id);
            OneSignal.User.addEmail(currentUser.email);
            OneSignal.User.addTag("user_hash", ""+currentUser.hash);
        }
    },[currentUser]);

    /*useEffect(() => {
        const scheduleNotification = async () => {
            const notificationsCount = Number(currentUser.notifications);
            await Notifications.setBadgeCountAsync(notificationsCount);
            if (notificationsCount > 0){
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: "New notifications",
                        body: 'You have ' + currentUser?.notifications + ' new notifications!',
                    },
                    trigger: { seconds: 2 },
                });
            }
        };     
        if (currentUser)   
            scheduleNotification();
    }, [currentUser, currentUser?.notifications]);*/


   /* useEffect(() => {
        const registerFetch = async () => {
            try {
                const status = await registerBackgroundFetchAsync();
                console.log('Background fetch registered, status:', status);
            } catch (err) {
                console.error('Error registering background fetch:', err);
            }
        };

        registerFetch();
        return () => {
            unregisterBackgroundFetchAsync();
        };
    }, []);
*/

    // DEEP LINKING

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
             <AsyncWorker /><BottomSheetDataContext>
             
            <Tabs
                screenOptions={({ navigation, route }) => ({
                    tabBarStyle: {
                        backgroundColor: colors.barsBackground,
                        height: isShowTabs ? 62 : 0,//55 old
                        opacity: isShowTabs ? 1 : 0,
                        elevation:0,
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
                    lazy: true,
                })}
            >
                {
                    TabList.map((tab, index) => {
                        const options = {
                            tabBarBadge: (tab.url == appSetting('layout', 'notifications') && currentUser?.notifications) ? <Text className={Platform.OS === 'ios' ? 'text-xs': 'text-sm'}>{currentUser?.notifications}</Text> : null,
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
                                initialParams={{ url2: tab.url, name:`tab${index}` }}
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
        </BottomSheetDataContext></>
    )
}