import React from 'react';
import { useState, useEffect } from 'react'
import All, { getData } from 'app/all'

import { View } from 'app/design/view'
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useRoute } from '@react-navigation/native';
import { Stack } from 'expo-router'
import { Icon } from 'app/components/svg';
import { NavScreen } from 'app/components/navScreen'
import {Pressable, StyleSheet, Text} from 'react-native';

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();




function HomeScreen1(params) {
    let route = params.route
   
    const [pageData, setPageData] = useState(undefined)

    const path = (route.name == '/pages' ? route.params.path : route.name);
   
    useEffect(() => {
      (async () => {
        if (path.startsWith('/')){
        const d = await getData(path);
        console.log('123', path);
        if (d?.props) {
          setPageData (d?.props)
        }
      }
      })();
    }, [path]);
    console.log('in3',route.name, route.params.path )
    console.log('in4',path )
    return (
        <Drawer.Navigator 
        screenOptions={({ navigation }) => ({
          headerLeft: () =>
             <Pressable onPress={navigation.toggleDrawer}>
               <Text>
               <Icon  onPress={navigation.toggleDrawer} icon="menu2" width={50} height={50} color={'#ff00ff'} />
               </Text>
              </Pressable >
             })}

        
       /* screenOptions={{
          title:'sss',
          drawerLabel:'aaa',
          drawerStyle: {
            backgroundColor: '#c6cbef',
            width: 240,
          },
          drawerIcon: ({focused, size}) => (
            <Icon icon="bottom" width={24} height={24} color={'#ff00ff'} />  
         ),
          drawerPosition:"right",
          drawerType:"back",
          drawerInactiveTintColor: '#ff00ff',
        }}*/
        >
            <Drawer.Screen
                name="/home"
                component={NavScreen}
                initialParams={{ path: '/home' }}
                options={{  title: 'Home'  , drawerIcon: ({focused, size}) => (
                  <Icon  icon="bottom" width={24} height={24} color={'#ff00ff'} />  
               ), }}
            />
            <Drawer.Screen
                name="posts-home"
                component={NavScreen}
                initialParams={{ path: '/posts-home' }}
                options={{  title: 'Posts Home'   }}
            />
             <Drawer.Screen
                name="persons-home"
                component={NavScreen}
                initialParams={{ path: '/persons-home' }}
                options={{  title: 'Persons Home'   }}
            />
        </Drawer.Navigator>
        
    );
  }

export function DrawerNav(params) {
    const router = useRoute()
    const path = router?.path;

    let iconWidth = 24;
    let iconHeight = 24;
    let activeIconColor = "#ff00ff";
    let inactiveIconColor = "#cccccc";

    return (
        <Tab.Navigator screenOptions={{ headerShown: false }} initialRouteName={params.initial?params.initial:''}>
          <Tab.Screen
              name="/pages"
              component={NavScreen}
              options={{  tabBarButton: () => null, tabBarVisible: false}}
              initialParams={{ path: path}}
            />
            <Tab.Screen
                name="home"
                component={HomeScreen1}
                initialParams={{ path: '/home' }}
                options={{  
                    title: 'Home',
                    tabBarIcon: ({color}) => (
                        <Icon icon="bottom" width={iconWidth} height={iconHeight} color={color} />  
                    )
                }}
            />
            <Tab.Screen
                name="messenger"
                component={NavScreen}
                initialParams={{ path: '/messenger' }}
                options={{  
                    title: 'Messenger',
                    tabBarIcon: ({color}) => (
                        <Icon icon="bottom" width={iconWidth} height={iconHeight} color={color} />  
                    )

                 }}
            />
            <Tab.Screen
                name="notifications-view"
                component={NavScreen}
                initialParams={{ path: '/notifications-view' }}
                options={{ 
                    title: 'Notifications',
                    tabBarIcon: ({color}) => (
                        <Icon icon="bottom" width={iconWidth} height={iconHeight} color={color} />  
                    )

                  }}
            />
             <Tab.Screen
                name="contact"
                component={NavScreen}
                initialParams={{ path: '/contact' }}
                options={{ title: 'Contact',
                tabBarIcon: ({color}) => (
                    <Icon icon="bottom" width={iconWidth} height={iconHeight} color={color} />  
                )
               }}
            />
        </Tab.Navigator>
    );
}
