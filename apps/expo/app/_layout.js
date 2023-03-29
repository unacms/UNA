import { Provider } from 'app/provider'
import { Stack } from 'expo-router'
import { useColorScheme } from 'react-native';
import { Theme } from 'app/design/theme'
import { ThemeProvider } from "@react-navigation/native";
import { CurrentUserProvider } from 'app/context/user';

export default function Root(props) {
  return (
    
    <ThemeProvider value={Theme()} >
      <Provider>
      <CurrentUserProvider>
          <Stack screenOptions={{  headerStyle: {
                      
                      headerTintColor: '#fff',
                    },headerShown: false, }}></Stack>
        </CurrentUserProvider>
      </Provider>    
    </ThemeProvider>

  )
}
