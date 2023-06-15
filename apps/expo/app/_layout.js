import { Provider } from 'app/provider'
import { Stack } from 'expo-router'
import { Theme } from 'app/design/theme'
import { ThemeProvider } from "@react-navigation/native";
import { CurrentUserProvider } from 'app/context/user';
import { useColorScheme } from 'react-native';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
export default function Root(props) {

  const scheme = useColorScheme();
  const queryClient = new QueryClient()
  
  return (    
    <ThemeProvider value={Theme(scheme)} >
      <Provider>
        <QueryClientProvider client={queryClient}>
          <CurrentUserProvider>
            <Stack screenOptions={{ headerShown: false }}></Stack>
          </CurrentUserProvider>
        </QueryClientProvider>
      </Provider>    
    </ThemeProvider>
  )
}
