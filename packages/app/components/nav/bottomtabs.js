import React from 'react';
import { useState, useEffect } from 'react'
import All, { getData } from 'app/all'
import { useRouter } from 'expo-router';
import { View,Pressable } from 'app/design/view'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useRoute } from '@react-navigation/native';
import { Icon } from 'app/components/svg';
import { NavScreen } from 'app/components/nav/screen'
import { useTheme } from '@react-navigation/native';
import { useCurrentUser } from 'app/context/user';

const Tab = createBottomTabNavigator();

export function NavBottomTabs(params) {

    let { currentUser, setCurrentUser } = useCurrentUser();

    const router = useRoute()
    const path = router?.path;

    let iconWidth = 24;
    let iconHeight = 24;

    const { colors } = useTheme();

    const TabList = [
      {
        title: 'Home',
        url: '/home',
        icon: 'app-home'
      },
      {
        title: 'Explore',
        url: '/posts-home',
        icon: 'app-explore'
      },
      {
        title: 'Messages',
        url: '/persons-home',
        icon: 'app-messages'
      },
      {
        title: 'Notifications',
        url: '/notifications-view',
        icon: 'app-notifications'
      },
      {
        title: (currentUser ? 'Logout': 'Login'),
        url: (currentUser ? '/logout': '/login'),
        icon: 'app-usermenu'
      },
    ];

    return (
        <Tab.Navigator
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
                headerLeft: () => getHeaderAction(navigation, route)
            })}
        
            initialRouteName={params.initial?'tab-0':''}
        >
            <Tab.Screen
                name="/pages"
                component={NavScreen}
                options={{  tabBarButton: () => null, tabBarVisible: false, unmountOnBlur: true}}
                initialParams={{ url: path, useUrl: true}}
            />
            {
                TabList.map((tab, index) => (
                    <Tab.Screen
                        key={`tab-${index}`}
                        name={`tab-${index}`}
                        component={NavScreen}
                        initialParams={{ url: tab.url, checkDrawer: true}}
                        options={{  
                            title: tab.title,
                            tabBarIcon: ({color}) => (
                                <Icon icon={tab.icon} width={iconWidth} height={iconHeight} color={color} />  
                            )
                        }}
                    />
            ))}
        </Tab.Navigator>
    );
}

function getHeaderAction(navigation, route) {
    const routerExpo = useRouter();
    const { colors } = useTheme();
  
    if (navigation.isFocused() && route.name === '/pages') {
      return (
        <Pressable
          onPress={routerExpo.back}
          style={({ pressed }) => [
            {
              padding: 14, // Adjust padding to position the icon
              opacity: pressed ? 0.5 : 1,
            },
          ]}
        >
          <Icon icon="app-back" width={24} height={24}  color={colors.barsColor} />
        </Pressable>
      );
    } else {
      return null;
    }
  }