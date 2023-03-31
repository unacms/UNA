import React, { useState } from 'react';
import {
  TouchableOpacity,
  View,
  Animated,
  ScrollView,
} from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Text } from 'app/design/typography';
import { NavScreen } from 'app/components/nav/screen';
import { Theme } from 'app/design/theme';


export function NavMaterialTabs(params) {
  const { colors } = Theme();

  const Tab = createMaterialTopTabNavigator();
  return (
    <Tab.Navigator
    screenOptions={({ route, focused, navigation }) => {
      const indicatorWidth = 100 / params.data.length;
      return {
        tabBarScrollEnabled: true,
        tabBarLabel: ({ focused, color, size }) => (
          <View  style={{}}>
            <View style={{padding:10,}}>
              <Text style={{ color: focused ? colors.primary : colors.text, fontSize: 14,  textTransform: 'capitalize', lineHeight:30, fontWeight: '600', paddingLeft:5, paddingRight:5 }}>
            {route.params?.title || route.name}
              </Text>
            </View>
            <Animated.View
              style={[
                {
                width:'100%',
                  bottom: 0,
                  borderRadius: 2,
                  height: 3,
                  backgroundColor: focused ? colors.primary : 'transparent',
                },
              
              ]}
            />
          </View>
        ),
        tabBarIndicator: () => <></>,
        
        tabBarContentContainerStyle:{
           minWidth:'100%',
           padding:0,
           margin:0,

           borderWidth:0,
         
        },
        tabBarItemStyle: { width: 'auto', padding: 0,  minHeight:'auto'},
      };
    }}
    >
      {params.data.map((tab, index) => (
        <Tab.Screen
          key={`tab-${index}`}
          name={tab.link}
          component={NavScreen}
          initialParams={{  title:tab.title}}
          options={{
            unmountOnBlur: true,
            upperCaseLabel: false,
            title: tab.title,
          }}
        />
      ))}
    </Tab.Navigator>
  );
}
