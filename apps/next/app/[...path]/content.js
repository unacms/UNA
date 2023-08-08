"use client"

import { Root } from 'app/root'
import 'raf/polyfill'
import { Analytics } from '@vercel/analytics/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

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

import 'app/styles/global.css'

export const metadata = {
  title: 'My Page Title',
}

export  function Page (props) {
  const queryClient = new QueryClient()

  return (
    <>
        <Provider>
          <QueryClientProvider client={queryClient}>
            <CurrentUserProvider>
              {!!process.env['VERCEL'] ? <Analytics /> : null}
              <Root {...props}></Root>
            </CurrentUserProvider>
          </QueryClientProvider>
        </Provider>
      
    </>
  )
}

