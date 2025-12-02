// Navbar - Server Component with client islands
// Structure is server-rendered, only interactive parts are client components

import Link from "next/link"
import { AppLogo } from "./app-logo"
import { NavbarIsland, NavbarActions } from "./navbar-island"
import { NavbarAuthButtons } from "./navbar-auth"

// Server Component - no "use client" directive
export function SiteNavbar() {
  return (
    <header className="sticky top-0 z-50 h-16  border-b border-border/60 mx-auto bg-card/95 backdrop-blur-xl">
      <nav className="h-full max-w-7xl mx-auto flex items-center justify-between ">
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0 px-3 sm:px-4 lg:px-6 py-3">
          {/* Logo - server rendered */}
          <Link href="/" className="flex items-center shrink-0">
            <AppLogo mode="adaptive" markSize={32} />
          </Link>

          {/* Mobile Island - client component for dynamic page titles */}
          <NavbarIsland />

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/" className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/groups" className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors">
              Groups
            </Link>
            <Link href="/pricing" className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link href="/about" className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors">
              About
            </Link>
          </div>
        </div>

        {/* Right side - Actions (mobile) + Auth buttons (client component) */}
        <div className="flex items-center gap-2 px-3 sm:px-4 lg:px-6 py-3">
          {/* Mobile actions from NavbarIsland */}
          <NavbarActions />
          {/* Auth buttons - responds to auth state */}
          <NavbarAuthButtons />
        </div>
      </nav>
    </header>
  )
}
