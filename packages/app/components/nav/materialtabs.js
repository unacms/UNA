
import { Pressable, View } from 'app/design/view'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Icon } from 'app/components/svg';
import { A, Text } from 'app/design/typography'
import { NavScreen } from 'app/components/nav/screen'
import { Theme } from 'app/design/theme';

export function NavMaterialTabs(params) {

  const Tab = createMaterialTopTabNavigator();
  const { colors } = Theme();

    return (
      <Tab.Navigator
        screenOptions={({ route, focused, navigation }) => {
         // const { options } = descriptors[route.key];
          //const label = options.title;
          const indicatorWidth = 100 / params.data.length;
          return {
            tabBarScrollEnabled: (params.data.length > 3? true: false),
            tabBarLabel: ({ focused, color, size }) => (
              <Text style={{ color: focused ? colors.primary : colors.text, fontSize: 14,  textTransform: 'capitalize', paddingLeft:5, paddingRight:5 }}>
                {route.params?.title || route.name}
              </Text>
            ),
            tabBarIndicatorStyle: {
              backgroundColor: colors.primary,
              height: 3,
              borderRadius: 2
            },
            tabBarItemStyle: { width: 'auto' },
          };
        }}
        tabBarOptions={{
          tabBarItemStyle: { backgroundColor: 'white' },
          tabBarIndicatorStyle: { backgroundColor: 'red' }, // Change the indicator color here
        }}
      >
          {
              params.data.map((tab, index) => (
                  <Tab.Screen
                      key={`toptab-${index}`}
                      name={`toptab-${index}`}
                      component={NavScreen}
                      initialParams={{ url: '/'+ tab.link, ignoreTabs: true, title:tab.title}}
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
