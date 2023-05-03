import { Tabs } from "expo-router";
import { Text } from "react-native";

import { useRouter } from 'expo-router';
import { Pressable } from 'app/design/view'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useRoute,useNavigationState  } from '@react-navigation/native';
import { Icon } from 'app/ui/atoms/icon';
import { NavScreen } from 'app/components/nav/screen'
import { useCurrentUser } from 'app/context/user';
import { appSetting } from 'app/lib/util'
import { useState, useEffect } from 'react'
import { useNavigation } from '@react-navigation/native';
import { Theme } from 'app/design/theme';

export default function AppLayout() {

  let { currentUser, setCurrentUser } = useCurrentUser();
  //let currentUser =1;
  const { colors } = Theme();
  const TabList = currentUser ? appSetting('menu', 'bottom_tabs_logged') : appSetting('menu', 'bottom_tabs_non_logged');
  let iconWidth = 24;
  let iconHeight = 24;
  return (
    <Tabs
    screenOptions={({ navigation, route  }) => ({
      tabBarStyle: {
          backgroundColor: colors.barsBackground, 
      },
      headerStyle: {
          backgroundColor: colors.barsBackground,
      },
      tabBarItemStyle: {
          marginBottom: 5, 
          marginTop: 5,
      },
      tabBarInactiveTintColor: colors.barsColor,
      
  })}
    >
      {
        TabList.map((tab, index) => (
            <Tabs.Screen
            key={`tab${index}`}
            name={`tab${index}`}
            initialParams={{ url2: tab.url}}
            options={{
              tabBarBadge: index == 4 ? 3 : null,
              title: tab.title,
              headerShown: false,
              tabBarIcon: ({color}) => (
                <Icon icon={tab.icon} width={iconWidth} height={iconHeight} color={color} />  
              )
          
            }}
            />
    ))}
    </Tabs>
  );
}