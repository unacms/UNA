import React from 'react';
import { useState, useEffect } from 'react'
import All, { getData } from 'app/all'

import { View } from 'app/design/view'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useRoute } from '@react-navigation/native';
import { Icon } from 'app/components/svg';
import { NavScreen } from 'app/components/navScreen'
import { useRouter } from "expo-router";
import { useTheme } from '@react-navigation/native';

const Tab = createBottomTabNavigator();

export function NavBottomTabs(params) {
    const router = useRoute()
    const path = router?.path;

    let iconWidth = 24;
    let iconHeight = 24;

    const routerExpo = useRouter();
    const { colors } = useTheme();

    const TabList = [
      {
        title: 'Home',
        url: '/home',
        icon: 'app-home'
      },
      {
        title: 'Discover',
        url: '/posts-home',
        icon: 'app-discover'
      },
      {
        title: 'Create',
        url: '/persons-home',
        icon: 'app-create'
      },
      {
        title: 'Notifications',
        url: '/notifications-view',
        icon: 'app-notifications'
      },
      {
        title: 'Messenger',
        url: '/messenger',
        icon: 'app-messenger'
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
            })}
        
            initialRouteName={params.initial?params.initial:''}
        >
            <Tab.Screen
                name="/pages"
                component={NavScreen}
                options={{  tabBarButton: () => null, tabBarVisible: false}}
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