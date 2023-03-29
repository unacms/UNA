
import { Pressable, View } from 'app/design/view'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Icon } from 'app/components/svg';
import { A, Text } from 'app/design/typography'
import { NavScreenWeb } from 'app/components/nav/screenweb'
import { Theme }  from 'app/design/theme'


export function NavMaterialTabs(params) {
    
    const { colors } = Theme();
    
    const Tab = createMaterialTopTabNavigator();
    /*https://reactnavigation.org/docs/material-top-tab-navigator*/
    return (
      <Tab.Navigator
        screenOptions={{ 
          tabBarIndicatorStyle:{},
          tabBarLabelStyle: { fontSize: 14, textTransform: "none", color: colors.barsColor, fontWeight:600 },
          tabBarItemStyle: { width: 'auto' },
          tabBarStyle: {
            backgroundColor: colors.barsBackground, 
          },
          tabBarIndicatorStyle:{
              color: 'red'
          },
          tabBarIndicatorContainerStyle:{
            
          }
        }}
      >
          {
              params.data.map((tab, index) => (
                  <Tab.Screen
                      key={`tab-${index}`}
                      name={tab.link}
                      component={NavScreenWeb}
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
