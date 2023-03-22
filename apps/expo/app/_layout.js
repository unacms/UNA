import { Provider } from 'app/provider'
import { CurrentUserProvider } from 'app/context/user';
import { Stack } from 'expo-router'
import { useColorScheme } from 'react-native';
import { CustomLightTheme, CustomDarkTheme } from 'app/design/theme'
import { ThemeProvider } from "@react-navigation/native";

export default function Root(props) {
  const scheme = useColorScheme();

  return (
    <ThemeProvider value={scheme === 'dark' ? CustomDarkTheme : CustomLightTheme} >
    <Provider>
      <CurrentUserProvider>
        <Stack screenOptions={{  headerStyle: {
                    backgroundColor: '#ff00ff',
                    headerTintColor: '#fff',
                  },headerShown: false, }}></Stack>
      </CurrentUserProvider>
    </Provider>    
    </ThemeProvider>

  )
}
