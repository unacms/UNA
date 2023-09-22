"use client"

import { Analytics } from '@vercel/analytics/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'app/provider'
import { CurrentUserProvider } from 'app/context/user';
import { appSetting } from 'app/lib/util'

export default function RootLayout({ children }) {
  const queryClient = new QueryClient()
  return (
    <html lang="en" >
      <body className='bg-bgrbody dark:bg-bgrbody-d' style={{backgroundAttachment:'fixed', backgroundImage: appSetting('layout', 'background_image')}}>
        <Provider>
            <QueryClientProvider client={queryClient}>
              <CurrentUserProvider>
                {!!process.env['VERCEL'] ? <Analytics /> : null}
                {children}
              </CurrentUserProvider>
            </QueryClientProvider>
          </Provider>
        </body>
    </html>
  )
}