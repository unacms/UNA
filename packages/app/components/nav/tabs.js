import { Tabs } from "expo-router";
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

export default function () {

    const { t } = useTranslation();
    let { currentUser, setCurrentUser } = useCurrentUser();
    
    const navigation = useNavigation();
    const router = useRouter();
    //let currentUser =1;
    const { colors } = Theme();
    const TabList = currentUser ? appSetting('menu_items', 'menu_tabbar_logged') : appSetting('menu_items', 'menu_tabbar_non_logged');
    let iconWidth = 24;
    let iconHeight = 24;

    let profile = null
    const [notifCount, setNotifCount] = useState(currentUser ? currentUser.notifications : null)

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
        if (currentUser?.notifications && notifCount != currentUser?.notifications)
            setNotifCount(currentUser?.notifications)
    }, [currentUser?.notifications]);
    // DEEP LINKING

    if (currentUser) {
        let dUser = Object.assign({}, currentUser);
        dUser.url_avatar = dUser.avatar
        dUser.url = '/dashboard'
        profile = <Profile {...dUser} displayType="unit_wo_info" displaySize="xs" />
    }
    
    return (
        <BottomSheetDataContext>
            <Tabs
                screenOptions={({ navigation, route }) => ({
                    tabBarStyle: {
                        backgroundColor: colors.barsBackground,
                        height: currentUser || appSetting('layout', 'hide_nav_non_logged_native: true') ? 55 : 0
                    },
                    headerStyle: {
                        backgroundColor: colors.barsBackground,
                    },
                    tabBarItemStyle: {
                        marginBottom: 5,
                        height: 44,
                        marginTop: 5,
                    },
                    tabBarInactiveTintColor: colors.barsColor,
                    tabBarActiveTintColor: colors.primary,
                    freezeOnBlur: true,
                    unmountOnBlur: false,
                })}
            >
                {
                    TabList.map((tab, index) => {
                        const options = {
                            tabBarBadge: (tab.url == appSetting('layout', 'notifications') && notifCount) ? notifCount : null,
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
                                initialParams={{ url2: tab.url }}
                                listeners={{
                                    tabPress: e => {
                                        FeedbackHaptics('Medium');
                                    },
                                }}
                                options={options}
                            />
                        );
                    })
                }
            </Tabs>
        </BottomSheetDataContext>
    )
}