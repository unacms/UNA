import { createDrawerNavigator } from '@react-navigation/drawer';
import { Icon } from 'app/ui/atoms/icon'
import { Pressable, Text } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { NavScreenDrawer } from 'app/components/nav/screen-drawer'

const Drawer = createDrawerNavigator();

export function NavDrawer(params) {
    const { colors } = useTheme();
    if (!params.menu)
        return <></>
    else 
    return (
        <Drawer.Navigator 
            screenOptions={({ navigation }) => ({
            headerStyle: {
                backgroundColor: colors.barsBackground,
                borderWidth:0,
            },
            headerTitleStyle: {
                color: colors.barsColor,
            },
            headerLeft: () =>
                <Pressable
                    onPress={navigation.toggleDrawer}
                    style={({ pressed }) => [
                        {
                            padding: 14, // Adjust padding to position the icon
                            opacity: pressed ? 0.5 : 1,
                        },
                    ]}
                >
                    <Text>
                        <Icon icon="app-menu" width={24} height={24} color={colors.barsColor}    />
                    </Text>
                </Pressable >
            })}
        >
            {params.menu.items.map((menu, index) => (
                <Drawer.Screen
                    key={`drawer-${index}`}
                    name={`drawer-${index}`}
                    component={NavScreenDrawer}
                    initialParams={{ url: '/' + menu.link, pageData: params.pageData,  title: 'Profile Screen'}}
                    options={{    title: menu.title    }}
                />
            ))}
        </Drawer.Navigator>
    );
}
