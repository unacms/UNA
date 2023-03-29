
import { Pressable, View } from 'app/design/view'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Icon } from 'app/components/svg';
import { A, Text } from 'app/design/typography'
import { NavScreen } from 'app/components/nav/screen'
import { Theme }  from 'app/design/theme'


export function NavMaterialTabs(params) {
    
    const { colors } = Theme();
    
    const Tab = createMaterialTopTabNavigator();
    /*https://reactnavigation.org/docs/material-top-tab-navigator*/
    return (
      <Tab.Navigator
        screenOptions={{ 
          tabBarLabelStyle: { fontSize: 14, textTransform: "none", /*color: colors.barsColor,*/ fontWeight:600 },
          tabBarItemStyle: { width: 'auto' },
          tabBarContentContainerStyle: {
            alignItems: 'center',
            justifyContent: 'center',
            
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.text,
          tabBarStyle: {
            backgroundColor: colors.barsBackground, 
          },
          tabBarIndicatorStyle: {
            display: 'none',
          },

         
        }}
      >
          {
              params.data.map((tab, index) => (
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
