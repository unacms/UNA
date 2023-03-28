
import { Pressable, View } from 'app/design/view'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Icon } from 'app/components/svg';
import { A, Text } from 'app/design/typography'
import { NavScreenWeb } from 'app/components/nav/screenweb'
import { useTheme } from '@react-navigation/native';
import { NavBottomTabsList } from 'app/components/nav/settings'


export function NavMaterialTabs(params) {

  const Tab = createMaterialTopTabNavigator();

    let iconWidth = 24;
    let iconHeight = 24;

    const { colors } = useTheme();

    const TabList = NavBottomTabsList();

    return (
      <Tab.Navigator
      screenOptions={{ tabBarScrollEnabled: (params.data.length>5? true: false),tabBarIndicatorStyle:{       
    } }}
      >
         
          {
              params.data.map((tab, index) => (
                  <Tab.Screen
                      key={`tab-${index}`}
                      name={tab.link}
                      component={NavScreenWeb}
                      options={{  
                          unmountOnBlur: true,
                          title: tab.title,
                      }}
                  />
          ))}
      </Tab.Navigator>
  );
}
