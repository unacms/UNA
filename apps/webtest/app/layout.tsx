// Root Layout - Server Component
// SSR-first: No React context for theming
// Theme is set via blocking script + CSS variables

import { Suspense } from 'react'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeScript } from './theme-script'
import { SiteNavbar } from './components/navbar'
import { NavbarIslandProvider } from './components/navbar-island'
import { AuthStateProvider } from './components/auth-state'

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
        {/* Blocking script - sets theme BEFORE first paint */}
        <ThemeScript />
        <link rel="dns-prefetch" href="//vercel.live" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {/* AuthStateProvider for prototype auth state switching */}
        <AuthStateProvider>
          {/* NavbarIslandProvider enables pages to inject content into navbar */}
          <NavbarIslandProvider>
            {/* Navbar is server-rendered, only islands inside are client components */}
            <SiteNavbar />
            <Suspense>
              <main>{children}</main>
            </Suspense>
          </NavbarIslandProvider>
        </AuthStateProvider>
      </body>
    </html>
  )
}
