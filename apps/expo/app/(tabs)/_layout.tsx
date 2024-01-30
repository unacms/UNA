import { Tabs } from "expo-router";
import { Icon } from 'app/ui/atoms/icon';
import { useCurrentUser } from 'app/context/user';
import { appSetting } from 'app/lib/util'
import { Theme } from 'app/design/theme';
import Profile from 'app/ui/molecules/profile';
import { useState } from 'react'
import EventSource from "react-native-sse";
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheetDataContext from 'app/context/bottomsheet';

export default function AppLayout() {
  const { t } = useTranslation();
  let { currentUser, setCurrentUser } = useCurrentUser();
  //let currentUser =1;
  const { colors } = Theme();
  const TabList = currentUser ? appSetting('menu_items', 'menu_bottom_tabs_logged') : appSetting('menu_items', 'menu_bottom_tabs_non_logged');
  let iconWidth = 24;
  let iconHeight = 24;

  let profile = null
  const [notifCount, setNotifCount] = useState(currentUser ? currentUser.notifications : null)

  if (currentUser) {
    let dUser = Object.assign({}, currentUser);
    dUser.url_avatar = dUser.avatar
    dUser.url = '/dashboard'
    profile = <Profile {...dUser} displayType="unit_wo_info" displaySize="xs" />

    /*const es = new EventSource(appSetting("urls", "notifs") + dUser.id + "&params[]=" + dUser.notifCount);


    es.addEventListener("message", (event) => {
      if (event.data != notifCount)
            setNotifCount(event.data)
    });*/
  }


  return (
    <SafeAreaView edges={['left', 'right']} style={{
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '100%'
    }}>
      <BottomSheetDataContext>
      <Tabs
        screenOptions={({ navigation, route }) => ({
          tabBarStyle: {
            backgroundColor: colors.barsBackground,
            height: 60
          },
          headerStyle: {
            backgroundColor: colors.barsBackground,
          },
          tabBarItemStyle: {
            marginBottom: 15,
            height: 40,
            marginTop: 5,
          },
          tabBarInactiveTintColor: colors.barsColor,
          freezeOnBlur: true,
          unmountOnBlur: false,
        })}
      >
        {
          TabList.map((tab, index) => (
            <Tabs.Screen
              key={`tab${index}`}
              name={`tab${index}`}
              initialParams={{ url2: tab.url }}
              options={{
                tabBarBadge: tab.url == appSetting('layout', 'notifications') ? notifCount : null,
                title: t(tab.title),
                headerShown: false,
                tabBarIcon: ({ color }) => (
                  (tab.url == '/dashboard' && profile) ? profile : <Icon icon={tab.icon} width={iconWidth} height={iconHeight} color={color} />
                )

              }}
            />
          ))}
      </Tabs>
      </BottomSheetDataContext>
    </SafeAreaView>
  );
}
