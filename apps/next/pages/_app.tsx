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
import Head from 'next/head'
import React from 'react'

import '../../../packages/app/styles/global.css'

import type { SolitoAppProps } from 'solito'

function MyApp({ Component, pageProps }: SolitoAppProps) {
  return (
    <>
      <Head>
        <title>Solito Example App</title>
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
      <Provider>
        <Component {...pageProps} />
        <Analytics />
      </Provider>
    </>
  )
}

export default MyApp
