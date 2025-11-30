// Navbar - Server Component with client islands
// Structure is server-rendered, only interactive parts are client components

import Link from "next/link"
import { ThemeSwitcher } from "./theme-switcher"
import { NavDropdowns } from "./nav-dropdowns"

function LogoIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path
        d="M17 8L10 18h6v6l7-10h-6V8z"
        className="fill-primary-foreground"
        strokeWidth="1.5"
      />
    </svg>
  )
}

// Server Component - no "use client" directive
export function SiteNavbar() {
  return (
    <header className="sticky top-0 z-50 h-16 px-6 border-b border-border bg-background/95 backdrop-blur">
      <nav className="h-full max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Logo - server rendered */}
          <Link href="/" className="flex items-center gap-2">
            <LogoIcon />
            <span className="text-lg font-bold">NEO</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {/* Static links - server rendered */}
            <Link href="/" className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors">
              Home
            </Link>

            {/* Dropdown menus - client island */}
            <NavDropdowns />

            {/* Static links - server rendered */}
            <Link href="/pricing" className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link href="/about" className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors">
              About
            </Link>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme switcher - client island */}
          <ThemeSwitcher />
          
          {/* Auth links - server rendered */}
          <Link 
            href="/login" 
            className="hidden lg:flex px-4 py-2 text-sm font-medium hover:text-primary transition-colors"
          >
            Sign In
          </Link>
          <Link 
            href="/signup" 
            className="button button--sm button--primary"
          >
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  )
}
