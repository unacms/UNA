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

import * as RNLocalize from "react-native-localize";
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from 'app/locales/en/translation.json';
import ru from 'app/locales/ru/translation.json';
import {
  StripeProvider,
} from '@stripe/stripe-react-native';

export default function Root(props) {

  const languageDetector = {
    type: 'languageDetector',
    async: true,
    detect: async (callback) => {
        const locale = await RNLocalize.getLocales();
        callback(locale[0].languageCode);
    },
    init: () => {},
    cacheUserLanguage: () => {},
};

i18n
    .use(initReactI18next)
    .use(languageDetector)
    .init({
        compatibilityJSON: 'v3',
        resources: {
            en: {
                translation: en
            },
            ru: {
                translation: ru
            }
        },
        lng: 'en', // default language
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    }); 

  const scheme = useColorScheme();
  const queryClient = new QueryClient()
  
  return (    
    <ThemeProvider value={Theme(scheme)} >
      <Provider>
        <QueryClientProvider client={queryClient}>
          <CurrentUserProvider>
          <StripeProvider
      publishableKey="pk_test_51Ie1oBIx9MpsEQHDnoz7eIQTtOH2dJQFdv79iLwPjsSHT5a0UL2q1gAtTdCqyYJWxcZEtMRANrqRP84VUxXM7uiV001EPNRmdB"
      urlScheme="your-url-scheme" // required for 3D Secure and bank redirects
      merchantIdentifier="merchant.com.{{YOUR_APP_NAME}}" // required for Apple Pay
    >
            <Stack screenOptions={{ 
              headerShown: false, 
              freezeOnBlur: true,
              unmountOnBlur: false,
              }}></Stack>
            </StripeProvider>
          </CurrentUserProvider>
        </QueryClientProvider>
      </Provider>    
    </ThemeProvider>
  )
}
