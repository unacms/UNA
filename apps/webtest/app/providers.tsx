'use client'

// App Providers - Client Component
// Sets up RouterProvider from React Aria Components for Next.js App Router integration
// This enables href navigation in Tabs, Listbox, Dropdown, etc.
// HeroUI v3 is built on React Aria Components, which uses RouterProvider

import { RouterProvider } from 'react-aria-components'
import { useRouter } from 'next/navigation'

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  return (
    <RouterProvider navigate={router.push}>
      {children}
    </RouterProvider>
  )
}

