"use client"

// Navigation Dropdowns - Client Island
// Isolated client component for interactive dropdown menus
// Only this component needs client-side JS, rest of navbar is server-rendered

import { useState, useEffect, useRef } from "react"
import Link from "next/link"

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg fill="none" height="14" viewBox="0 0 24 24" width="14" className={className}>
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

interface NavItem {
  id: string
  label: string
  href: string
  description: string
}

const componentsItems: NavItem[] = [
  { id: "button", label: "Button", href: "/components/button", description: "Interactive button with variants" },
  { id: "dialog", label: "Dialog", href: "/components/dialog", description: "Modal dialog component" },
  { id: "tabs", label: "Tabs", href: "/components/tabs", description: "Tabbed content sections" },
  { id: "tooltip", label: "Tooltip", href: "/components/tooltip", description: "Contextual information popup" },
]

const docsItems: NavItem[] = [
  { id: "intro", label: "Introduction", href: "/docs", description: "Get started with NEO" },
  { id: "install", label: "Installation", href: "/docs/installation", description: "Setup guide" },
  { id: "typo", label: "Typography", href: "/docs/typography", description: "Text styles and formatting" },
]

interface DropdownProps {
  label: string
  items: NavItem[]
}

function NavDropdown({ label, items }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [isOpen])

  // Close on escape
  useEffect(() => {
    if (!isOpen) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }
    
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  return (
    <div ref={dropdownRef} className="relative">
      <button
        className="px-4 py-2 text-sm font-medium inline-flex items-center gap-1 hover:text-primary transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {label}
        <ChevronDownIcon className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          className="dropdown__popover absolute left-0 top-full mt-2"
          role="menu"
        >
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="dropdown__item block"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              <div className="font-medium">{item.label}</div>
              <div className="text-xs text-muted-foreground">{item.description}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function NavDropdowns() {
  return (
    <>
      <NavDropdown label="Components" items={componentsItems} />
      <NavDropdown label="Docs" items={docsItems} />
    </>
  )
}

