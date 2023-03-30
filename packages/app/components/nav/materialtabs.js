
import { Pressable, View } from 'app/design/view'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Icon } from 'app/components/svg';
import { A, Text } from 'app/design/typography'

import { NavScreen } from 'app/components/nav/screen'


export function NavMaterialTabs(params) {

  const Tab = createMaterialTopTabNavigator();
    return (
      <Tab.Navigator
      screenOptions={{ tabBarScrollEnabled: (params.data.length > 3? true: false),tabBarIndicatorStyle:{       
    } }}
      >
          {
              params.data.map((tab, index) => (
                  <Tab.Screen
                      key={`toptab-${index}`}
                      name={`toptab-${index}`}
                      component={NavScreen}
                      initialParams={{ url: '/'+ tab.link, ignoreTabs: true}}
                      options={{  
                          unmountOnBlur: true,
                          title: tab.title,
                      }}
                  />
          ))}
      </Tab.Navigator>
  );
}
