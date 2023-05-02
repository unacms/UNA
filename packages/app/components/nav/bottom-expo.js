import { Tabs } from "expo-router";
import { Text } from "react-native";

import { useRouter } from 'expo-router';
import { Pressable } from 'app/design/view'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useRoute,useNavigationState  } from '@react-navigation/native';
import { Icon } from 'app/ui/atoms/icon';
import { NavScreen } from 'app/components/nav/screen'

import { Theme } from 'app/design/theme';
import { useCurrentUser } from 'app/context/user';
import { appSetting } from 'app/lib/util'
import { useState, useEffect } from 'react'
import { useNavigation } from '@react-navigation/native';

export default function NavBottomTabs() {

  let { currentUser, setCurrentUser } = useCurrentUser();
  //let currentUser =1;
  
  const TabList = currentUser ? appSetting('menu', 'bottom_tabs_logged') : appSetting('menu', 'bottom_tabs_non_logged');

  console.log(TabList);
  let iconWidth = 24;
  let iconHeight = 24;
  return (
    <Tabs>
      {
        TabList.map((tab, index) => (
            <Tabs.Screen
            key={`tab${index}`}
            name={`tab${index}`}
            initialParams={{ url2: tab.url}}
            options={{
              
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