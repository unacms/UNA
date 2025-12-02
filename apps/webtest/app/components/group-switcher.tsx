'use client'

// Group Switcher - Dropdown to quickly switch between groups
// Avatar and title are links to group home
// Only the chevron icon triggers the dropdown
// Uses client-only rendering to avoid hydration mismatch with HeroUI Button

import { Dropdown, Button } from '@heroui/react'
import { ChevronsUpDown, Check } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'

// Mock groups data - in real app would come from user's membership data
const userGroups = [
  {
    id: "ambient-circle",
    name: "Ambient Circle",
    avatar: "https://images.unsplash.com/photo-1516534775068-ba3e7458af70?w=100&h=100&fit=crop",
    initial: "A",
  },
  {
    id: "tech-innovators",
    name: "Tech Innovators",
    avatar: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=100&h=100&fit=crop",
    initial: "T",
  },
]

interface GroupSwitcherProps {
  currentGroupId: string
  currentGroupName: string
  currentGroupAvatar: string
  avatarSize?: 'sm' | 'md' | 'lg'
}

interface GroupSwitcherTriggerProps {
  currentGroupId: string
  currentGroupName: string
}

export function GroupSwitcher({
  currentGroupId,
  currentGroupName,
  currentGroupAvatar,
  avatarSize = 'lg',
}: GroupSwitcherProps) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const avatarSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16 sm:w-20 sm:h-20',
  }

  const groupUrl = `/groups/${currentGroupId}`

  // Render static version during SSR
  if (!mounted) {
    return (
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <Link href={groupUrl} className={`${avatarSizes[avatarSize]} shrink-0 rounded-full overflow-hidden`}>
          <img 
            src={currentGroupAvatar} 
            alt={currentGroupName} 
            className="w-full h-full object-cover"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link href={groupUrl} className="hover:underline">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">
                {currentGroupName}
              </h1>
            </Link>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <ChevronsUpDown className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Client-only: render interactive version
  return (
    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
      {/* Avatar - link to group home */}
      <Link href={groupUrl} className={`${avatarSizes[avatarSize]} shrink-0 rounded-full overflow-hidden`}>
        <img 
          src={currentGroupAvatar} 
          alt={currentGroupName} 
          className="w-full h-full object-cover"
        />
      </Link>
      
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {/* Title - link to group home */}
          <Link href={groupUrl} className="hover:underline">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">
              {currentGroupName}
            </h1>
          </Link>
          
          {/* Chevron - dropdown trigger */}
          <Dropdown>
            <Button
              variant="secondary"
              isIconOnly
              size="sm"
              className="bg-transparent hover:bg-muted active:bg-muted rounded-lg"
              aria-label={`Switch group, currently ${currentGroupName}`}
            >
              <ChevronsUpDown className="w-5 h-5 text-muted-foreground" />
            </Button>
            <Dropdown.Popover className="min-w-[280px]">
              <Dropdown.Menu
                aria-label="Your groups"
                selectedKeys={[currentGroupId]}
                selectionMode="single"
              >
                {userGroups.map((group) => {
                  const isCurrent = group.id === currentGroupId
                  return (
                    <Dropdown.Item
                      key={group.id}
                      id={group.id}
                      textValue={group.name}
                      href={`/groups/${group.id}`}
                    >
                      <div className="w-10 h-10 shrink-0 rounded-full overflow-hidden">
                        <img 
                          src={group.avatar} 
                          alt={group.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="flex-1 font-medium">{group.name}</span>
                      {isCurrent && (
                        <Check className="w-4 h-4 text-primary shrink-0" />
                      )}
                    </Dropdown.Item>
                  )
                })}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </div>
    </div>
  )
}

// Simplified trigger-only component (avatar and title rendered separately)
export function GroupSwitcherTrigger({
  currentGroupId,
  currentGroupName,
}: GroupSwitcherTriggerProps) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  // Render static placeholder during SSR
  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
        <ChevronsUpDown className="w-5 h-5 text-muted-foreground" />
      </div>
    )
  }

  // Client-only: render interactive dropdown
  return (
    <Dropdown>
      <Button
        variant="secondary"
        isIconOnly
        size="sm"
        className="bg-transparent hover:bg-muted active:bg-muted rounded-full shrink-0"
        aria-label={`Switch group, currently ${currentGroupName}`}
      >
        <ChevronsUpDown className="w-5 h-5 text-muted-foreground" />
      </Button>
      <Dropdown.Popover className="min-w-[280px]">
        <Dropdown.Menu
          aria-label="Your groups"
          selectedKeys={[currentGroupId]}
          selectionMode="single"
        >
          {userGroups.map((group) => {
            const isCurrent = group.id === currentGroupId
            return (
              <Dropdown.Item
                key={group.id}
                id={group.id}
                textValue={group.name}
                href={`/groups/${group.id}`}
              >
                <div className="w-10 h-10 shrink-0 rounded-full overflow-hidden">
                  <img 
                    src={group.avatar} 
                    alt={group.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="flex-1 font-medium">{group.name}</span>
                {isCurrent && (
                  <Check className="w-4 h-4 text-primary shrink-0" />
                )}
              </Dropdown.Item>
            )
          })}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}
