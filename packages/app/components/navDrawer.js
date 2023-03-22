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
import {Pressable, StyleSheet, Text, } from 'react-native';
import { useRouter, Tabs  } from "expo-router";
import { Button } from 'app/design/controls'
import { useTheme } from '@react-navigation/native';

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

function HomeScreen1(params) {

    const { colors } = useTheme();

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
          headerStyle: {
            backgroundColor: colors.barsBackground,
          },
          headerTitleStyle: {
            color: colors.barsColor,
          },
          headerLeft: () =>
                  <Pressable
                  onPress={navigation.toggleDrawer}
                  style={({ pressed }) => [
                    {
                      padding: 14, // Adjust padding to position the icon
                      opacity: pressed ? 0.5 : 1,
                    },
                  ]}
                >
               <Text>
               <Icon  icon="app-menu" width={24} height={24} color={colors.barsColor}  />
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
                options={{  title: 'Home'  }}
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
            <Drawer.Screen
                name="groups-home"
                component={NavScreen}
                initialParams={{ path: '/groups-home' }}
                options={{  title: 'Groups Home'   }}
            />
        </Drawer.Navigator>
        
    );
  }

  function getHeaderVisibility(route, navigation, initial) {
    if (initial != 'home'){
      return true;
    }
    else{
    
      if (navigation.isFocused() && route.name != 'home' ){
        console.log('aaaaaaaaa', route.name);
        return false;
      }
    }
    return false;
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
          <Icon icon="app-back" width={24} height={24} color={colors.barsColor} />
        </Pressable>
      );
    } else {
      return null;
    }
  }

export function DrawerNav(params) {
    const router = useRoute()
    const path = router?.path;

    let iconWidth = 24;
    let iconHeight = 24;

    const routerExpo = useRouter();

    const { colors } = useTheme();
    
  //console.log("aaaaaa",router);
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
             })
        }
       
       initialRouteName={params.initial?params.initial:''}>
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
                 
                  headerShown: false,
                    title: 'Home',
                    tabBarIcon: ({color}) => (
                        <Icon icon="app-home" width={iconWidth} height={iconHeight} color={color} />  
                    )
                }}
            />
            <Tab.Screen
                name="discover"
                component={NavScreen}
                initialParams={{ path: '/posts-home' }}
                options={{ title: 'Discover',
                tabBarIcon: ({color}) => (
                    <Icon icon="app-discover" width={iconWidth} height={iconHeight} color={color} />  
                )
               }}
            />
            
            <Tab.Screen
                name="create-post"
                component={NavScreen}
                initialParams={{ path: '/create-post' }}
                options={{ title: 'Create',
                tabBarIcon: ({color}) => (
                    <Icon icon="app-create" width={iconWidth} height={iconHeight} color={color} />  
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
                        <Icon icon="app-notifications" width={iconWidth} height={iconHeight} color={color} />  
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
                        <Icon icon="app-messenger" width={iconWidth} height={iconHeight} color={color} />  
                    )

                 }}
            />
        </Tab.Navigator>
    );
}
