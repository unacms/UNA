// Site Top Nav Layout - Pure Server Component
// No client JavaScript - renders as static HTML shell

import Link from 'next/link'

// Server-rendered navigation - no 'use client' needed
function SiteNav() {
  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'About', href: '/about' },
  ]

  return (
    <header className="h-16 px-6 border-b border-border bg-background/95 backdrop-blur">
      <nav className="h-full max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          {/* Logo - pure SVG, no Icon component */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-lg font-bold">NEO</span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Auth buttons - static HTML, no JS */}
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  )
}

export default function SiteTopNavLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          © 2024 NEO. All rights reserved.
        </div>
      </footer>
    </div>
  )
}


