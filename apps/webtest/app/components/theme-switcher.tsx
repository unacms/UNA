"use client"

// Theme Switcher - Minimal client island
// Uses DOM manipulation, NOT React context
// Only this component re-renders on theme change, not the entire app

import { useCallback, useEffect, useState } from "react"

// Icons as pure functions - no deps
function SunIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" focusable="false" height="18" width="18" viewBox="0 0 24 24" {...props}>
      <g fill="currentColor">
        <path d="M19 12a7 7 0 11-7-7 7 7 0 017 7z" />
        <path d="M12 22.96a.969.969 0 01-1-.96v-.08a1 1 0 012 0 1.038 1.038 0 01-1 1.04zm7.14-2.82a1.024 1.024 0 01-.71-.29l-.13-.13a1 1 0 011.41-1.41l.13.13a1 1 0 010 1.41.984.984 0 01-.7.29zm-14.28 0a1.024 1.024 0 01-.71-.29 1 1 0 010-1.41l.13-.13a1 1 0 011.41 1.41l-.13.13a1 1 0 01-.7.29zM22 13h-.08a1 1 0 010-2 1.038 1.038 0 011.04 1 .969.969 0 01-.96 1zM2.08 13H2a1 1 0 010-2 1.038 1.038 0 011.04 1 .969.969 0 01-.96 1zm16.93-7.01a1.024 1.024 0 01-.71-.29 1 1 0 010-1.41l.13-.13a1 1 0 011.41 1.41l-.13.13a.984.984 0 01-.7.29zm-14.02 0a1.024 1.024 0 01-.71-.29l-.13-.13a1 1 0 011.41-1.41l.13.13a1 1 0 010 1.41.97.97 0 01-.7.29zM12 3.04a.969.969 0 01-1-.96V2a1 1 0 012 0 1.038 1.038 0 01-1 1.04z" />
      </g>
    </svg>
  )
}

function MoonIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" focusable="false" height="18" width="18" viewBox="0 0 24 24" {...props}>
      <path
        d="M21.53 15.93c-.16-.27-.61-.69-1.73-.49a8.46 8.46 0 01-1.88.13 8.409 8.409 0 01-5.91-2.82 8.068 8.068 0 01-1.44-8.66c.44-1.01.13-1.54-.09-1.76s-.77-.55-1.83-.11a10.318 10.318 0 00-6.32 10.21 10.475 10.475 0 007.04 8.99 10 10 0 002.89.55c.16.01.32.02.48.02a10.5 10.5 0 008.47-4.27c.67-.93.49-1.519.32-1.79z"
        fill="currentColor"
      />
    </svg>
  )
}

const colorThemes = [
  { id: "default", label: "Blue", color: "#2563eb" },
  { id: "purple", label: "Purple", color: "#7c3aed" },
  { id: "green", label: "Green", color: "#059669" },
  { id: "orange", label: "Orange", color: "#ea580c" },
] as const

type ColorTheme = typeof colorThemes[number]["id"]
type Mode = "light" | "dark" | "system"

// Pure DOM helpers - no React state needed for initial render
function getIsDark(): boolean {
  if (typeof document === "undefined") return false
  return document.documentElement.classList.contains("dark")
}

function getColorTheme(): ColorTheme {
  if (typeof document === "undefined") return "default"
  return (document.documentElement.getAttribute("data-theme") as ColorTheme) || "default"
}

export function ThemeSwitcher() {
  // Local state only for this component's UI
  const [isDark, setIsDark] = useState(false)
  const [colorTheme, setColorTheme] = useState<ColorTheme>("default")
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Sync state from DOM on mount
  useEffect(() => {
    setIsDark(getIsDark())
    setColorTheme(getColorTheme())
    setMounted(true)

    // Listen for system preference changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      const mode = localStorage.getItem("theme-mode") as Mode || "system"
      if (mode === "system") {
        const newIsDark = mediaQuery.matches
        document.documentElement.classList.toggle("dark", newIsDark)
        document.documentElement.style.colorScheme = newIsDark ? "dark" : "light"
        setIsDark(newIsDark)
      }
    }
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  // Toggle dark/light mode - pure DOM manipulation
  const toggleMode = useCallback(() => {
    const newIsDark = !isDark
    document.documentElement.classList.toggle("dark", newIsDark)
    document.documentElement.style.colorScheme = newIsDark ? "dark" : "light"
    localStorage.setItem("theme-mode", newIsDark ? "dark" : "light")
    setIsDark(newIsDark)
  }, [isDark])

  // Set color theme - pure DOM manipulation
  const setThemeColor = useCallback((theme: ColorTheme) => {
    if (theme === "default") {
      document.documentElement.removeAttribute("data-theme")
    } else {
      document.documentElement.setAttribute("data-theme", theme)
    }
    localStorage.setItem("theme-color", theme)
    setColorTheme(theme)
    setIsOpen(false)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest("[data-theme-dropdown]")) {
        setIsOpen(false)
      }
    }
    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [isOpen])

  // Skeleton placeholder before hydration
  if (!mounted) {
    return (
      <div className="flex items-center gap-1">
        <button
          className="button button--sm button--ghost button--icon-only"
          aria-label="Toggle theme"
        >
          <SunIcon />
        </button>
        <button
          className="button button--sm button--ghost button--icon-only"
          aria-label="Choose color"
        >
          <span className="w-4 h-4 rounded-full bg-primary" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      {/* Dark/Light Toggle - simple button */}
      <button
        className="button button--sm button--ghost button--icon-only"
        onClick={toggleMode}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>

      {/* Color Theme Picker - custom dropdown, no HeroUI dependency */}
      <div className="relative" data-theme-dropdown>
        <button
          className="button button--sm button--ghost button--icon-only"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Choose color theme"
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          <span
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: colorThemes.find(t => t.id === colorTheme)?.color }}
          />
        </button>

        {isOpen && (
          <div
            className="dropdown__popover absolute right-0 top-full mt-2"
            role="menu"
            aria-label="Color themes"
          >
            {colorThemes.map((theme) => (
              <button
                key={theme.id}
                className="dropdown__item w-full flex items-center gap-3"
                role="menuitemradio"
                aria-checked={colorTheme === theme.id}
                onClick={() => setThemeColor(theme.id)}
              >
                <span
                  className="w-5 h-5 rounded-full border-2"
                  style={{
                    backgroundColor: theme.color,
                    borderColor: colorTheme === theme.id ? "var(--color-foreground)" : "transparent",
                  }}
                />
                <span>{theme.label}</span>
                {colorTheme === theme.id && (
                  <span className="ml-auto text-primary">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
