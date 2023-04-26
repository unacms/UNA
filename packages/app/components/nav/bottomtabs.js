import { useRouter } from 'expo-router';
import { Pressable } from 'app/design/view'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useRoute,useNavigationState  } from '@react-navigation/native';
import { Icon } from 'app/ui/atoms/icon';
import { NavScreen } from 'app/components/nav/screen'

import { Theme } from 'app/design/theme';
import { useCurrentUser } from 'app/context/user';
import { appSetting } from 'app/lib/util'
import { useState, useEffect } from 'react'
import { useNavigation } from '@react-navigation/native';

const Tab = createBottomTabNavigator();

export function NavBottomTabs(params) {

   

    let { currentUser, setCurrentUser } = useCurrentUser();
    const router = useRoute();
    let path = router?.path;

    const [count, setCount] = useState('');

    if (!path || path.startsWith('expo-development-client/'))
      path = '/home';

      //console.log('!!!!!!',path, router);
    let iconWidth = 24;
    let iconHeight = 24;
   
   /* const navigation = useNavigation();
    useEffect(() => {
      console.log('++++',path, router);
      navigation.navigate('pages');
   }, [path]);*/
   const navigation = useNavigation();


   /*setTimeout(() => {
    if (path.includes('view-post')){
      navigation.navigate('pages');
    }
    }, 1000);*/
    /*console.log('-------------', path, '------', count);
    if (path  != count){
      console.log('++++++++++', path, '++++++++', count);
      setCount(path);
    }
    */
    /*const activeTabName = useNavigationState((state) =>
    state
  );

  useEffect(() => {
    console.log('Active Tab:', activeTabName);
  }, [activeTabName]);
*/
    const { colors } = Theme();
    const TabList = currentUser ? appSetting('menu', 'bottom_tabs_logged') : appSetting('menu', 'bottom_tabs_non_logged');
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
        
            initialRouteName={path=='/home'? 'tab-Home': 'pages' }
        >
            <Tab.Screen
                name="pages"
                component={NavScreen}
                options={{ 
                  unmountOnBlur: true,
                  /*tabBarButton: () => null,*/
                }}
                initialParams={{ url2: path,  useUrl: true}}
            />
            {
                TabList.map((tab, index) => (
                    <Tab.Screen
                        key={`tab-${index}`}
                        name={'tab-' + tab.title}
                        component={NavScreen}
                        initialParams={{ url2: tab.url, checkDrawer: true}}
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
    const { colors } = Theme();
  
    if (navigation.isFocused() && route.name === 'pages') {
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