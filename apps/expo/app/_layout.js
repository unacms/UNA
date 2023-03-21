import { Provider } from 'app/provider'
import { Stack } from 'expo-router'
import { useColorScheme } from 'react-native';
import { CustomLightTheme, CustomDarkTheme } from 'app/design/theme'
import { ThemeProvider ,  DarkTheme,
  DefaultTheme,} from "@react-navigation/native";

export default function Root(props) {

  const scheme = useColorScheme();
  console.log(CustomLightTheme);

  
  return (
    <ThemeProvider value={scheme === 'dark' ? CustomDarkTheme : CustomLightTheme} >
    <Provider>
      <Stack screenOptions={{  headerStyle: {
                    backgroundColor: '#ff00ff',
                    headerTintColor: '#fff',
                  },headerShown: false, }}></Stack>
    </Provider>
    </ThemeProvider>

  )
}
