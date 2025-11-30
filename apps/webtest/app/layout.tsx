// Root Layout - Server Component
// Uses HeroUI v3 with proper RSC setup

import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'
import { SiteNavbar } from './components/navbar'

export const metadata: Metadata = {
  title: 'NEO Testground',
  description: 'Experimental UI patterns and server component testing',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="//vercel.live" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>
          <SiteNavbar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  )
}
