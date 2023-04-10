import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Text } from 'app/design/typography';
import { NavScreenMaterial } from 'app/components/nav/screen-material';
import { Theme } from 'app/design/theme';

export function NavMaterialTabs(params) {
  const Tab = createMaterialTopTabNavigator();
  const { colors } = Theme();

  return (
    <Tab.Navigator
      screenOptions={({ route, focused, navigation }) => {
        return {
          tabBarScrollEnabled: true,
          tabBarLabel: ({ focused, color, size }) => (
            <Text
              style={{
                color: focused ? colors.primary : colors.text,
                backgroundColor:   focused ? colors.activeTabBackground : colors.tabsBackground,
                fontSize: 14,
                fontWeight: '600',
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 8,
                overflow: 'hidden',
                
                
              }}
            >
              {route.params?.title || route.name}
            </Text>
          ),
          tabBarIndicatorStyle: {
            bottom: 0,
            height: 2,
            marginHorizontal: 4,
            backgroundColor: colors.primary,
          },
          tabBarContentContainerStyle: {
            minWidth: '100%',
            justifyContent: 'flex-start',
          },
          tabBarStyle: {
            borderRadius: 0,
            backgroundColor: colors.card,
            paddingHorizontal: 4,
            
          },
          tabBarItemStyle: {
            width: 'auto',
            
            
            
            
            
            
            
          },
        };
      }}
    >
      {params.data.map((tab, index) => (
        <Tab.Screen
          key={`toptab-${index}`}
          name={`toptab-${index}`}
          component={NavScreenMaterial}
          initialParams={{
            url: '/' + tab.link,
            ignoreTabs: true,
            title: tab.title,
            pageData: params.pageData,
          }}
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
