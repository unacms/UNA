"use client"

import { NavigationMenu } from '@base-ui-components/react/navigation-menu'
import Link from 'next/link'

// Navigation data
const gettingStartedLinks = [
  {
    href: '/docs',
    title: 'Introduction',
    description: 'Learn the fundamentals of our platform and get started quickly.',
  },
  {
    href: '/docs/installation',
    title: 'Installation',
    description: 'Step-by-step guide to setting up your development environment.',
  },
  {
    href: '/docs/typography',
    title: 'Typography',
    description: 'Styles for headings, paragraphs, lists and more.',
  },
]

const componentLinks = [
  {
    href: '/components/button',
    title: 'Button',
    description: 'Interactive button component with variants.',
  },
  {
    href: '/components/dialog',
    title: 'Dialog',
    description: 'A modal dialog that interrupts the user.',
  },
  {
    href: '/components/tabs',
    title: 'Tabs',
    description: 'A set of layered sections of content.',
  },
  {
    href: '/components/tooltip',
    title: 'Tooltip',
    description: 'A popup that displays information on hover.',
  },
]

function ChevronIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...props}>
      <path d="M1 3.5L5 7.5L9 3.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function NavLink(props: NavigationMenu.Link.Props) {
  return (
    <NavigationMenu.Link
      render={<Link href={props.href || '/'} />}
      {...props}
    />
  )
}

export function SiteNavigation() {
  return (
    <NavigationMenu.Root className="nav-root">
      <NavigationMenu.List className="nav-list">
        {/* Getting Started Dropdown */}
        <NavigationMenu.Item>
          <NavigationMenu.Trigger className="nav-trigger">
            Getting Started
            <NavigationMenu.Icon className="nav-icon">
              <ChevronIcon />
            </NavigationMenu.Icon>
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className="nav-content">
            <ul className="nav-grid-links nav-grid-links-featured">
              <li style={{ gridRow: 'span 3' }}>
                <NavLink className="nav-featured-card" href="/">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h3 className="nav-featured-title">NEO Platform</h3>
                  <p className="nav-featured-description">
                    Build beautiful, modern applications with our comprehensive design system.
                  </p>
                </NavLink>
              </li>
              {gettingStartedLinks.map((item) => (
                <li key={item.href}>
                  <NavLink className="nav-link-card" href={item.href}>
                    <h3 className="nav-link-title">{item.title}</h3>
                    <p className="nav-link-description">{item.description}</p>
                  </NavLink>
                </li>
              ))}
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        {/* Components Dropdown */}
        <NavigationMenu.Item>
          <NavigationMenu.Trigger className="nav-trigger">
            Components
            <NavigationMenu.Icon className="nav-icon">
              <ChevronIcon />
            </NavigationMenu.Icon>
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className="nav-content">
            <ul className="nav-grid-links nav-grid-links-2col">
              {componentLinks.map((item) => (
                <li key={item.href}>
                  <NavLink className="nav-link-card" href={item.href}>
                    <h3 className="nav-link-title">{item.title}</h3>
                    <p className="nav-link-description">{item.description}</p>
                  </NavLink>
                </li>
              ))}
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        {/* Simple Links */}
        <NavigationMenu.Item>
          <NavLink className="nav-trigger" href="/pricing">
            Pricing
          </NavLink>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <NavLink className="nav-trigger" href="/about">
            About
          </NavLink>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      {/* Shared popup portal for all dropdowns */}
      <NavigationMenu.Portal>
        <NavigationMenu.Positioner
          className="nav-positioner"
          sideOffset={8}
        >
          <NavigationMenu.Popup className="nav-popup">
            <NavigationMenu.Viewport className="nav-viewport" />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  )
}

