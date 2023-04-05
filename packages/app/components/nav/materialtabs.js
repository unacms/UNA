
import { Pressable, View } from 'app/design/view'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { A, Text } from 'app/design/typography'
import { NavScreenMaterial } from 'app/components/nav/screen-material'
import { Theme } from 'app/design/theme';
import Animated from 'react-native-reanimated';

export function NavMaterialTabs(params) {

  const Tab = createMaterialTopTabNavigator();
  const { colors } = Theme();

    return (
      <Tab.Navigator
        screenOptions={({ route, focused, navigation }) => {
          const indicatorWidth = 100 / params.data.length;
          return {
            tabBarScrollEnabled: true,
            tabBarLabel: ({ focused, color, size }) => (
              <View>
                <View style={{padding:10}}>
                  <Text style={{ color: focused ? colors.primary : colors.text, fontSize: 14, fontWeight: '600', textTransform: 'capitalize', paddingLeft:5, paddingRight:5, paddingTop:3, paddingBottom:3 }}>
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
              justifyContent:'center',
              
            },
            tabBarItemStyle: { width: 'auto', padding: 0 },
          };
        }}
      >
          {
              params.data.map((tab, index) => (
                  <Tab.Screen
                      key={`toptab-${index}`}
                      name={`toptab-${index}`}
                      component={NavScreenMaterial}
                      initialParams={{ url: '/'+ tab.link, ignoreTabs: true, title:tab.title, pageData: params.pageData}}
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
