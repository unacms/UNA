"use client"

import { Analytics } from '@vercel/analytics/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'app/provider'
import { CurrentUserProvider } from 'app/context/user';

export default function RootLayout({ children }) {
  const queryClient = new QueryClient()
  return (
    <html lang="en" >
      <body className='bg-bgrbody dark:bg-bgrbody-d'>
      
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