"use client"

// Navbar - uses HeroUI v3 components with React Aria
import {
  Dropdown,
  DropdownTrigger,
  DropdownPopover,
  DropdownMenu,
  DropdownItem,
  Link,
} from "@neo/test-components"
import NextLink from "next/link"
import { ThemeSwitcher } from "./theme-switcher"

function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" height="14" viewBox="0 0 24 24" width="14" {...props}>
      <path
        d="M7 10l5 5 5-5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

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

const componentsItems = [
  { id: "button", label: "Button", href: "/components/button", description: "Interactive button with variants" },
  { id: "dialog", label: "Dialog", href: "/components/dialog", description: "Modal dialog component" },
  { id: "tabs", label: "Tabs", href: "/components/tabs", description: "Tabbed content sections" },
  { id: "tooltip", label: "Tooltip", href: "/components/tooltip", description: "Contextual information popup" },
]

const docsItems = [
  { id: "intro", label: "Introduction", href: "/docs", description: "Get started with NEO" },
  { id: "install", label: "Installation", href: "/docs/installation", description: "Setup guide" },
  { id: "typo", label: "Typography", href: "/docs/typography", description: "Text styles and formatting" },
]

export function SiteNavbar() {
  return (
    <header className="sticky top-0 z-50 h-16 px-6 border-b border-border bg-background/95 backdrop-blur">
      <nav className="h-full max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <NextLink href="/" className="flex items-center gap-2">
            <LogoIcon />
            <span className="text-lg font-bold">NEO</span>
          </NextLink>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/" className="px-4 py-2 text-sm font-medium">
              Home
            </Link>

            {/* Components Dropdown */}
            <Dropdown>
              <DropdownTrigger className="px-4 py-2 text-sm font-medium inline-flex items-center gap-1 hover:text-primary transition-colors cursor-pointer">
                Components
                <ChevronDownIcon />
              </DropdownTrigger>
              <DropdownPopover>
                <DropdownMenu items={componentsItems}>
                  {(item) => (
                    <DropdownItem id={item.id} href={item.href} textValue={item.label}>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </DropdownItem>
                  )}
                </DropdownMenu>
              </DropdownPopover>
            </Dropdown>

            {/* Docs Dropdown */}
            <Dropdown>
              <DropdownTrigger className="px-4 py-2 text-sm font-medium inline-flex items-center gap-1 hover:text-primary transition-colors cursor-pointer">
                Docs
                <ChevronDownIcon />
              </DropdownTrigger>
              <DropdownPopover>
                <DropdownMenu items={docsItems}>
                  {(item) => (
                    <DropdownItem id={item.id} href={item.href} textValue={item.label}>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </DropdownItem>
                  )}
                </DropdownMenu>
              </DropdownPopover>
            </Dropdown>

            <Link href="/pricing" className="px-4 py-2 text-sm font-medium">
              Pricing
            </Link>

            <Link href="/about" className="px-4 py-2 text-sm font-medium">
              About
            </Link>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <Link href="/login" className="hidden lg:flex px-4 py-2 text-sm font-medium">
            Sign In
          </Link>
          <NextLink 
            href="/signup"
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Get Started
          </NextLink>
        </div>
      </nav>
    </header>
  )
}
