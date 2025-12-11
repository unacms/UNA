// Root Layout - Server Component
// SSR-first: No React context for theming
// Theme is set via blocking script + CSS variables

import { Suspense } from 'react'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeScript } from './theme-script'
import { Providers } from './providers'
import { SiteNavbar } from './components/navbar'
import { NavbarIslandProvider } from './components/navbar-island'
import { AuthStateProvider } from './components/auth-state'

export const metadata: Metadata = {
  title: 'UNA CMS - Open Source Community Platform',
  description: 'Build social experiences with one codebase. UNA CMS provides an open-source backend, universal React/React Native apps, standardized APIs, and enterprise-grade scalability.',
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
        {/* HeroUIProvider enables routing for Tabs, Listbox, Dropdown etc. */}
        <Providers>
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
        </Providers>
      </body>
    </html>
  )
}
