import { useState } from 'react';
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
import {  processMenu } from 'app/lib/util'


function CustomTabBar({ state, descriptors, navigation, position }) {
  const { colors } = Theme();
  const [tabWidths, setTabWidths] = useState({});



  return (
    <View 
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        backgroundColor: colors.barsBackground,
        width: '100%',
      }}
    ><View style={{
      flexDirection: 'row',
      justifyContent: 'center',
      backgroundColor: colors.barsBackground,
      width:1280,
    }}><View style={{backgroundColor:'red'}}><Text>Begin</Text></View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: '',
          alignItems: 'center',
          marginHorizontal: 16,
          marginVertical: 0,
         
        }}
        style={{
          maxWidth:1280,
        }}
      >
        <View  style={{ flexDirection: 'row', alignItems: 'center' }}>
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
                  paddingVertical: 16,
                  height:50
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
      <View style={{backgroundColor:'blue'}}><Text>End</Text></View></View>
    </View>
  );
}

export function NavMaterialTabs(params) {
  const { colors } = Theme();

  const Tab = createMaterialTopTabNavigator();
  return (
    <Tab.Navigator
      sceneContainerStyle={{ backgroundColor: colors.screenBackground }}
      style={{height:20}}
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        tabBarScrollEnabled: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,
      }}
    >
      {processMenu(params.data.object, params.data.items).map((tab, index) => { 
        return(
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
      )})}
    </Tab.Navigator>
  );
}
