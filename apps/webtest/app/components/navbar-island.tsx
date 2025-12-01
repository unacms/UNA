'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'

// Context for navbar island content
interface NavbarIslandContextType {
  title: string | null
  image: string | null
  setTitle: (title: string | null) => void
  setImage: (image: string | null) => void
  setContent: (title: string | null, image: string | null) => void
}

const NavbarIslandContext = createContext<NavbarIslandContextType | null>(null)

// Provider component - wrap around app layout
export function NavbarIslandProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState<string | null>(null)
  const [image, setImage] = useState<string | null>(null)
  
  // Helper to set both at once
  const setContent = (newTitle: string | null, newImage: string | null) => {
    setTitle(newTitle)
    setImage(newImage)
  }
  
  return (
    <NavbarIslandContext.Provider value={{ title, image, setTitle, setImage, setContent }}>
      {children}
    </NavbarIslandContext.Provider>
  )
}

// Hook to set navbar island content from any page
export function useNavbarIsland() {
  const context = useContext(NavbarIslandContext)
  if (!context) {
    throw new Error('useNavbarIsland must be used within NavbarIslandProvider')
  }
  return context
}

// Island component - renders in navbar, shows content when title is set
// This is a client component that can be embedded in server navbar
export function NavbarIsland() {
  const context = useContext(NavbarIslandContext)
  
  // If no context (during SSR or outside provider), render nothing
  if (!context) return null
  
  const { title, image } = context
  
  return (
    <div 
      className={`
        md:hidden flex items-center gap-2 overflow-hidden
        transition-all duration-200 ease-out
        ${title ? 'opacity-100 max-w-[220px]' : 'opacity-0 max-w-0'}
      `}
    >
      <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />
      {image && (
        <img 
          src={image} 
          alt="" 
          className="w-6 h-6 rounded-full object-cover shrink-0"
        />
      )}
      <span className="font-semibold text-base text-foreground truncate">
        {title}
      </span>
    </div>
  )
}

