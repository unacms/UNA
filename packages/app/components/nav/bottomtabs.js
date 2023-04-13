import { useRouter } from 'expo-router';
import { Pressable } from 'app/design/view'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useRoute } from '@react-navigation/native';
import { Icon } from 'app/ui/atoms/icon';
import { NavScreen } from 'app/components/nav/screen'
import { useTheme } from '@react-navigation/native';
import { useCurrentUser } from 'app/context/user';
import { appSetting } from 'app/lib/util'

const Tab = createBottomTabNavigator();

export function NavBottomTabs(params) {
    let { currentUser, setCurrentUser } = useCurrentUser();
    const router = useRoute();
    let path = router?.path;

    if (!path || path.startsWith('expo-development-client/'))
      path = '/home';

    let iconWidth = 24;
    let iconHeight = 24;

    const { colors } = useTheme();

    const TabList = currentUser ? appSetting('menu', 'bottom_tabs_logged') : appSetting('menu', 'bottom_tabs_non_logged');
    console.log('------------', params.route)
    return (
        <Tab.Navigator
            screenOptions={({ navigation, route  }) => ({
                tabBarStyle: {
                    backgroundColor: colors.barsBackground, 
                },
                headerStyle: {
                    backgroundColor: colors.barsBackground,
                },
                tabBarItemStyle: {
                    marginBottom: 5, 
                    marginTop: 5,
                },
                tabBarInactiveTintColor: colors.barsColor,
                headerLeft: () => getHeaderAction(navigation, route)
            })}
        
            initialRouteName={params.initial ? 'tab-Home' : '' }
        >
            <Tab.Screen
                name="/pages"
                component={NavScreen}
                options={{tabBarButton: () => null, tabBarVisible: false, unmountOnBlur: true}}
                initialParams={{ url: path, useUrl: true}}
            />
            {
                TabList.map((tab, index) => (
                    <Tab.Screen
                        key={`tab-${index}`}
                        name={'tab-' + tab.title}
                        component={NavScreen}
                        initialParams={{ url: tab.url, checkDrawer: true}}
                        options={{  
                            title: tab.title,
                            tabBarIcon: ({color}) => (
                                <Icon icon={tab.icon} width={iconWidth} height={iconHeight} color={color} />  
                            )
                        }}
                    />
            ))}
        </Tab.Navigator>
    );
}

function getHeaderAction(navigation, route) {
    const routerExpo = useRouter();
    const { colors } = useTheme();
  
    if (navigation.isFocused() && route.name === '/pages') {
      return (
        <Pressable
        className="pl-4"
          onPress={routerExpo.back}
          style={({ pressed }) => [
            {
              opacity: pressed ? 0.5 : 1,
              backgroundColor:'red'
            },
          ]}
        >
          <Icon icon="left" width={24} height={24}  color={colors.barsColor} />
        </Pressable>
      );
    } else {
      return null;
    }
  }