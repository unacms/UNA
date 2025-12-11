'use client'

// NavbarTabs - Client Component for route-integrated navigation tabs
// Uses @neo/test-components Tabs wrapper which applies proper BEM styling
// RouterProvider in providers.tsx enables client-side routing for href
//
// Benefits of href approach:
// - Tabs render as proper <a> elements (SEO-friendly, right-click works)
// - RouterProvider intercepts clicks for client-side navigation
// - Keyboard navigation works (React Aria built-in)
// - Active state synced with current URL

import { Tabs } from '@neo/test-components'
import { usePathname } from 'next/navigation'

const navItems = [
  { id: '/', label: 'Home' },
  { id: '/docs', label: 'Docs' },
  { id: '/pricing', label: 'Pricing' },
  { id: '/about', label: 'About' },
]

export function NavbarTabs() {
  const pathname = usePathname()
  
  // Determine selected tab from pathname
  // Match exact for home, prefix match for other routes
  const selectedKey = navItems.find(item => {
    if (item.id === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(item.id)
  })?.id ?? '/'

  return (
    <Tabs 
      selectedKey={selectedKey}
      variant="light"
      size="lg"
      showSeparators={false}
      aria-label="Main navigation"
    >
      <Tabs.ListContainer>
        <Tabs.List>
          {navItems.map((item) => (
            <Tabs.Tab key={item.id} id={item.id} href={item.id}>
              {item.label}
              <Tabs.Indicator />
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.ListContainer>
    </Tabs>
  )
}

