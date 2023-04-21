import { Provider } from 'app/provider'
import { Stack } from 'expo-router'
import { Theme } from 'app/design/theme'
import { ThemeProvider } from "@react-navigation/native";
import { CurrentUserProvider } from 'app/context/user';
import { useColorScheme } from 'react-native';

export default function Root(props) {

  const scheme = useColorScheme();

  return (    
    <ThemeProvider value={Theme(scheme)} >
      <Provider>
        <CurrentUserProvider>
          <Stack screenOptions={{ headerShown: false }}></Stack>
        </CurrentUserProvider>
      </Provider>    
    </ThemeProvider>
  )
}
