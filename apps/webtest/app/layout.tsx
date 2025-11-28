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

// Critical CSS for above-the-fold content - inlined to eliminate render-blocking chain
const criticalCSS = `
:root{--color-background:#fff;--color-foreground:#0a0a0a;--color-primary:#2563eb;--color-primary-foreground:#fafafa;--color-muted-foreground:#52525b;--color-border:#e4e4e7;--color-accent:#f4f4f5;--radius:0.5rem}
body{margin:0;background-color:var(--color-background);color:var(--color-foreground);font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased}
.min-h-screen{min-height:100vh}
.sticky{position:sticky}
.top-0{top:0}
.z-50{z-index:50}
.h-16{height:4rem}
.px-6{padding-left:1.5rem;padding-right:1.5rem}
.border-b{border-bottom-width:1px}
.border-border{border-color:var(--color-border)}
.bg-background\\/95{background-color:rgba(255,255,255,.95)}
.backdrop-blur{backdrop-filter:blur(8px)}
.flex{display:flex}
.items-center{align-items:center}
.justify-between{justify-content:space-between}
.gap-2{gap:.5rem}
.gap-6{gap:1.5rem}
.max-w-7xl{max-width:80rem}
.mx-auto{margin-left:auto;margin-right:auto}
.h-full{height:100%}
.w-8{width:2rem}
.h-8{height:2rem}
.rounded-lg{border-radius:var(--radius)}
.rounded-md{border-radius:calc(var(--radius) - 2px)}
.bg-primary{background-color:var(--color-primary)}
.text-primary-foreground{color:var(--color-primary-foreground)}
.w-5{width:1.25rem}
.h-5{height:1.25rem}
.text-lg{font-size:1.125rem;line-height:1.75rem}
.font-bold{font-weight:700}
.text-sm{font-size:.875rem;line-height:1.25rem}
.font-medium{font-weight:500}
.text-muted-foreground{color:var(--color-muted-foreground)}
.px-4{padding-left:1rem;padding-right:1rem}
.py-2{padding-top:.5rem;padding-bottom:.5rem}
@media(min-width:768px){.hidden{display:none}.md\\:flex{display:flex}}
`.replace(/\n/g, '')

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to Vercel's edge network */}
        <link rel="dns-prefetch" href="//vercel.live" />
        {/* Critical CSS inlined to eliminate render-blocking chain */}
        <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <SiteHeader />
        <main>{children}</main>
      </body>
    </html>
  )
}
