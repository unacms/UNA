// Navbar - Server Component with client islands
// Structure is server-rendered, only interactive parts are client components

import { Suspense } from "react"
import Link from "next/link"
import { AppLogo } from "./app-logo"
import { NavbarIsland, NavbarActions } from "./navbar-island"
import { NavbarAuthButtons } from "./navbar-auth"
import { NavbarTabs } from "./navbar-tabs"

// Server Component - no "use client" directive
export function SiteNavbar() {
  return (
    <header className="sticky top-0 z-50 h-16 mx-auto bg-gradient-to-b from-card to-card/80 backdrop-blur-xl shadow-border">
      <nav className="h-full max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 min-w-0 px-3 sm:px-4 lg:px-6">
          {/* Logo - server rendered */}
          <Link href="/" className="flex items-center shrink-0">
            <AppLogo mode="adaptive" markSize={32} />
          </Link>

          {/* Mobile Island - client component for dynamic page titles */}
          <NavbarIsland />

          {/* Desktop Nav - HeroUI Tabs with route integration */}
          {/* Wrapped in Suspense because NavbarTabs uses usePathname() */}
          <div className="hidden md:block">
            <Suspense>
              <NavbarTabs />
            </Suspense>
          </div>
        </div>

        {/* Right side - Actions (mobile) + Auth buttons (client component) */}
        <div className="flex items-center gap-2 px-3 sm:px-4 lg:px-6">
          {/* Mobile actions from NavbarIsland */}
          <NavbarActions />
          {/* Auth buttons - responds to auth state */}
          <NavbarAuthButtons />
        </div>
      </nav>
    </header>
  )
}
