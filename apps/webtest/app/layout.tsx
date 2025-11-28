// Root Layout - Server Component
// Navigation menu uses Base UI primitives with custom styling

import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import './globals.css'

// Lazy load the navigation menu - it's not needed for initial render
const SiteNavigation = dynamic(
  () => import('./components/navigation').then((mod) => mod.SiteNavigation),
  { 
    ssr: true,
    loading: () => <NavPlaceholder />
  }
)

// Lightweight placeholder while navigation loads
function NavPlaceholder() {
  return (
    <div className="flex gap-1">
      {['Getting Started', 'Components', 'Pricing', 'About'].map((item) => (
        <span key={item} className="px-4 py-2 text-sm font-medium text-muted-foreground">
          {item}
        </span>
      ))}
    </div>
  )
}

export const metadata: Metadata = {
  title: 'NEO Testground',
  description: 'Experimental UI patterns and server component testing',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
}

// Server-rendered header shell with client navigation
function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 h-16 px-6 border-b border-border bg-background/95 backdrop-blur">
      <nav className="h-full max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Logo - Server rendered */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-lg font-bold">NEO</span>
          </Link>

          {/* Navigation Menu - Client component for interactivity */}
          <div className="hidden md:flex">
            <SiteNavigation />
          </div>
        </div>

        {/* Auth buttons - Server rendered */}
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to Vercel's analytics/speed insights if used */}
        <link rel="dns-prefetch" href="//vercel.live" />
        {/* Inline critical CSS variables to prevent FOUC */}
        <style
          dangerouslySetInnerHTML={{
            __html: `:root{--color-background:#fff;--color-foreground:#0a0a0a;--color-primary:#2563eb}`,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <SiteHeader />
        <main>{children}</main>
      </body>
    </html>
  )
}
