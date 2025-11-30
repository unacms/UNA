// Root Layout - Server Component
// SSR-first: No React context for theming
// Theme is set via blocking script + CSS variables

import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeScript } from './theme-script'
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
        {/* Blocking script - sets theme BEFORE first paint */}
        <ThemeScript />
        <link rel="dns-prefetch" href="//vercel.live" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {/* Navbar is server-rendered, only ThemeSwitcher inside is a client island */}
        <SiteNavbar />
        <main>{children}</main>
      </body>
    </html>
  )
}
