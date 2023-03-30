import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Text } from 'app/design/typography';
import { NavScreen } from 'app/components/nav/screen';
import { Theme } from 'app/design/theme';

function CustomNativeTabBar({ state, descriptors, navigation }) {
  const { colors } = Theme();

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        backgroundColor: colors.barsBackground,
        width: '100%',
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

          return (
            <TouchableOpacity
              key={index}
              onPress={onPress}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 16,
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
              {isFocused && (
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: colors.primary,
                  }}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export function NavMaterialTabs(params) {
  const Tab = createMaterialTopTabNavigator();
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomNativeTabBar {...props} />}
      screenOptions={{
        tabBarScrollEnabled: params.data.length > 3 ? true : false,
      }}
    >
      {params.data.map((tab, index) => (
        <Tab.Screen
          key={`toptab-${index}`}
          name={`toptab-${index}`}
          component={NavScreen}
          initialParams={{ url: '/' + tab.link, ignoreTabs: true }}
          options={{
            unmountOnBlur: true,
            title: tab.title,
          }}
        />
      ))}
    </Tab.Navigator>
  );
}
