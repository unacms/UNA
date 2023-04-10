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
import { appSetting } from 'app/lib/util'
function CustomTabBar({ state, descriptors, navigation, position }) {
  const { colors } = Theme();
  const [tabWidths, setTabWidths] = useState({});
  const maxWidth = appSetting('layout', 'max_width');

  return (
    <View 
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        backgroundColor: colors.barsBackground,
        width: '100%',
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label = options.title;
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const translateX = position.interpolate({
              inputRange: [index - 1, index, index + 1],
              outputRange: [-tabWidths[index] / 2, 0, tabWidths[index] / 2],
            });

            const animatedStyle = { transform: [{ translateX }] };

            return (
              <TouchableOpacity
                key={index}
                onPress={onPress}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 14.5,
                }}
              >
                <View
                  onLayout={(event) => {
                    const { width } = event.nativeEvent.layout;
                    setTabWidths((prevWidths) => ({
                      ...prevWidths,
                      [index]: width,
                    }));
                  }}
                >
                  <Text
                    style={{
                      color: isFocused ? colors.primary : colors.text,
                      fontWeight: '600',
                    }}
                  >
                    {label}
                  </Text>
                </View>
                {isFocused && (
                  <Animated.View
                    style={[
                      {
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        height: 3,
                        borderRadius: 2,
                        backgroundColor: colors.primary,
                      },
                      animatedStyle,
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

export function NavMaterialTabs(params) {
  const { colors } = Theme();

  const Tab = createMaterialTopTabNavigator();
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        tabBarScrollEnabled: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,
      }}
    >
      {params.data.map((tab, index) => (
        <Tab.Screen
          key={`tab-${index}`}
          name={tab.link}
          component={NavScreen}
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
