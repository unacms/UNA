'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { ChevronRight } from 'lucide-react'
import { GroupSwitcherTrigger } from './group-switcher'

// Context for navbar island content
interface NavbarIslandContextType {
  title: string | null
  image: string | null
  groupId: string | null
  actions: ReactNode | null
  setTitle: (title: string | null) => void
  setImage: (image: string | null) => void
  setGroupId: (groupId: string | null) => void
  setActions: (actions: ReactNode | null) => void
  setContent: (title: string | null, image: string | null, groupId?: string | null) => void
}

const NavbarIslandContext = createContext<NavbarIslandContextType | null>(null)

// Provider component - wrap around app layout
export function NavbarIslandProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState<string | null>(null)
  const [image, setImage] = useState<string | null>(null)
  const [groupId, setGroupId] = useState<string | null>(null)
  const [actions, setActions] = useState<ReactNode | null>(null)
  
  // Helper to set all at once
  const setContent = (newTitle: string | null, newImage: string | null, newGroupId?: string | null) => {
    setTitle(newTitle)
    setImage(newImage)
    setGroupId(newGroupId ?? null)
  }
  
  return (
    <NavbarIslandContext.Provider value={{ title, image, groupId, actions, setTitle, setImage, setGroupId, setActions, setContent }}>
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
  
  const { title, image, groupId } = context
  
  return (
    <>
      <div 
        className={`
          md:hidden flex items-center gap-2 overflow-hidden
          transition-all duration-200 ease-out
          ${title ? 'opacity-100 max-w-[280px]' : 'opacity-0 max-w-0'}
        `}
      >
        <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />
        {image && (
          <Image 
            src={image} 
            alt="" 
            width={32}
            height={32}
            unoptimized
            className="w-8 h-8 rounded-full object-cover shrink-0"
          />
        )}
        <span className="font-semibold text-base text-foreground truncate">
          {title}
        </span>
        {groupId && title && (
          <GroupSwitcherTrigger
            currentGroupId={groupId}
            currentGroupName={title}
          />
        )}
      </div>
    </>
  )
}

// Actions component - renders in navbar right side, next to auth buttons
export function NavbarActions() {
  const context = useContext(NavbarIslandContext)
  
  // If no context (during SSR or outside provider), render nothing
  if (!context) return null
  
  const { actions } = context
  
  // Only show on mobile when actions are set
  if (!actions) return null
  
  return (
    <div className="md:hidden">
      {actions}
    </div>
  )
}

