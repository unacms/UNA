import 'raf/polyfill'
import { Analytics } from '@vercel/analytics/react'

const fixReanimatedIssue = () => {
  // FIXME remove this once this reanimated fix gets released
  // https://github.com/software-mansion/react-native-reanimated/issues/3355
  if (process.browser) {
    // @ts-ignore
    window._frameTimestamp = null
  }
}

fixReanimatedIssue()

import { Provider } from 'app/provider'
import { CurrentUserProvider } from 'app/context/user';
import Head from 'next/head'
import { useColorScheme } from 'react-native';
import { CustomLightTheme, CustomDarkTheme } from 'app/design/theme'
import { ThemeProvider } from "@react-navigation/native";


import '../../../packages/app/styles/global.css'

function MyApp({ Component, pageProps }) {

  const scheme = useColorScheme();

  return (
    <>
      <Head>
        <title>NEO App</title>
        <meta
          name="description"
          content="Expo + Next.js with Solito. By Fernando Rojo."
        />
        <meta
          name="theme-color"
          content="#ffffff"
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content="#181b20"
          media="(prefers-color-scheme: dark)"
        />
        <link rel="icon" href="/favicon.ico"/>
        <link rel="icon" href="/favicon.svg"/>
        <link rel="icon" href="/favicon.png"/>
      </Head>
      <ThemeProvider value={scheme === 'dark' ? CustomDarkTheme : CustomLightTheme} >
        <Provider>
          <CurrentUserProvider>
            <Component {...pageProps} />
            <Analytics />
          </CurrentUserProvider>
        </Provider>
      </ThemeProvider>
    </>
  )
}

export default MyApp
