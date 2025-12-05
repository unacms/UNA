'use client'

// Group Tabs - Client Component for interactive tab navigation
// Uses standard HeroUI v3 Tabs from @heroui/react
// Shows condensed title + avatar + switcher when main header scrolls out of view
//
// IMPORTANT: React Aria's collection system requires Tabs.ListContainer and Tabs.Panel
// to be direct children of Tabs - no wrapper divs allowed between them!
// The sticky header layout is achieved by styling the ListContainer itself.

import { Tabs } from '@neo/test-components'
import { Dropdown, Label, Button } from '@heroui/react'
import { MoreHorizontal, UserPlus, Share2, Flag, Mail } from 'lucide-react'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useNavbarIsland } from '@/app/components/navbar-island'
import { GroupSwitcherTrigger } from '@/app/components/group-switcher'
import { useAuthStateSafe } from '@/app/components/auth-state'

interface GroupTabsProps {
  groupId: string
  groupName: string
  groupAvatar?: string
  feedContent: React.ReactNode
  aboutContent: React.ReactNode
  membersContent: React.ReactNode
  respectContent?: React.ReactNode
  mutesContent?: React.ReactNode
}

// Share Button Component - for guests in navbar
function ShareButton({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return (
    <Button variant="secondary" isIconOnly size={size} aria-label="Share">
      <Share2 className="w-4 h-4" />
    </Button>
  )
}

// Shared Actions Dropdown Component - auth-state aware (for authenticated/member users)
function GroupActionsDropdown({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const { authState } = useAuthStateSafe()
  const isMember = authState === 'group-member'
  
  return (
    <Dropdown>
      <Button aria-label="Actions menu" variant="secondary" isIconOnly size={size}>
        <MoreHorizontal className="w-4 h-4" />
      </Button>
      <Dropdown.Popover>
        <Dropdown.Menu onAction={(key) => console.log(`Action: ${key}`)}>
          {isMember ? (
            <Dropdown.Item id="invite" textValue="Invite Members">
              <Mail className="w-4 h-4" />
              <Label>Invite Members</Label>
            </Dropdown.Item>
          ) : (
            <Dropdown.Item id="join" textValue="Join Group">
              <UserPlus className="w-4 h-4" />
              <Label>Join Group</Label>
            </Dropdown.Item>
          )}
          <Dropdown.Item id="share" textValue="Share">
            <Share2 className="w-4 h-4" />
            <Label>Share</Label>
          </Dropdown.Item>
          <Dropdown.Item id="report" textValue="Report" variant="danger">
            <Flag className="w-4 h-4" />
            <Label>Report</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}

// Condensed header content - shown when scrolled
function CondensedHeader({ 
  showTitle, 
  groupName, 
  groupAvatar, 
  groupId 
}: { 
  showTitle: boolean
  groupName: string
  groupAvatar?: string
  groupId: string
}) {
  return (
    <div 
      className={`
        hidden md:flex items-center gap-2 shrink-0
        transition-all duration-200 ease-out
        ${showTitle ? 'opacity-100 ps-3 sm:ps-4 lg:ps-6' : 'opacity-0 max-w-0 overflow-hidden'}
      `}
    >
      {groupAvatar && (
        <Image 
          src={groupAvatar} 
          alt={groupName}
          width={32}
          height={32}
          unoptimized
          className="w-8 h-8 rounded-full object-cover shrink-0"
        />
      )}
      <h2 className="font-semibold text-xl text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
        {groupName}
      </h2>
      <GroupSwitcherTrigger
        currentGroupId={groupId}
        currentGroupName={groupName}
      />
    </div>
  )
}

// Action buttons - shown when scrolled on desktop
// Uses mounted state to avoid hydration mismatch with auth-dependent rendering
function ActionButtons({ 
  showTitle, 
  isGuest, 
  isMember 
}: { 
  showTitle: boolean
  isGuest: boolean
  isMember: boolean
}) {
  const [mounted, setMounted] = useState(false)
  
  // Only render auth-dependent content after mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="flex items-center gap-2 shrink-0 pe-3 sm:pe-4 lg:pe-6">
      {/* Primary action buttons - visible on lg+ when scrolled, auth-state aware */}
      {/* Only render after mount to prevent hydration mismatch */}
      {mounted && (
        <div 
          className={`
            hidden lg:flex items-center gap-2
            transition-all duration-200 ease-out
            ${showTitle ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
        >
          {/* Guests only see Share, authenticated see Join/Invite + Share */}
          {isGuest ? (
            <Button variant="secondary" size="sm" isIconOnly aria-label="Share">
              <Share2 className="w-4 h-4" />
            </Button>
          ) : (
            <>
              {isMember ? (
                <Button variant="primary" size="sm">
                  <Mail className="w-4 h-4" />
                  Invite
                </Button>
              ) : (
                <Button variant="primary" size="sm">
                  <UserPlus className="w-4 h-4" />
                  Join
                </Button>
              )}
              <Button variant="secondary" size="sm" isIconOnly aria-label="Share">
                <Share2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      )}

      {/* Actions Dropdown - desktop only, not for guests */}
      {/* Only render after mount to prevent hydration mismatch */}
      {mounted && !isGuest && (
        <div className="hidden lg:block">
          <GroupActionsDropdown size={showTitle ? 'sm' : 'md'} />
        </div>
      )}
    </div>
  )
}

export function GroupTabs({ groupId, groupName, groupAvatar, feedContent, aboutContent, membersContent, respectContent, mutesContent }: GroupTabsProps) {
  const [showTitle, setShowTitle] = useState(false)
  const [selectedTab, setSelectedTab] = useState<string>('feed')
  const { setContent, setActions } = useNavbarIsland()
  const { authState } = useAuthStateSafe()
  const isMember = authState === 'group-member'
  const isGuest = authState === 'unauthenticated'

  // Track when the main header scrolls out of view
  useEffect(() => {
    const headerElement = document.getElementById('group-header')
    if (!headerElement) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry) {
          // Show title when header is NOT intersecting (scrolled past)
          const isScrolled = !entry.isIntersecting
          setShowTitle(isScrolled)
          // Update navbar island on mobile with groupId, title, and image for switcher
          setContent(
            isScrolled ? groupName : null, 
            isScrolled && groupAvatar ? groupAvatar : null,
            isScrolled ? groupId : null
          )
          // Set actions in navbar for mobile scrolled state
          // Guests only see Share button, authenticated users see actions dropdown
          if (isScrolled) {
            const isGuestUser = authState === 'unauthenticated'
            setActions(isGuestUser ? <ShareButton size="md" /> : <GroupActionsDropdown size="md" />)
          } else {
            setActions(null)
          }
        }
      },
      { 
        threshold: 0,
        rootMargin: '-64px 0px 0px 0px' // Account for sticky navbar height
      }
    )

    observer.observe(headerElement)
    return () => {
      observer.disconnect()
      // Clean up navbar content when unmounting
      setContent(null, null, null)
      setActions(null)
    }
  }, [groupId, groupName, groupAvatar, setContent, setActions, authState])

  // Render content based on selected tab
  const renderContent = () => {
    switch (selectedTab) {
      case 'feed':
        return feedContent
      case 'about':
        return aboutContent
      case 'members':
        return membersContent
      case 'respect':
        return respectContent
      case 'mutes':
        return mutesContent
      default:
        return feedContent
    }
  }

  return (
    <>
      {/* Sticky tabs header - separate from Tabs to avoid React Aria context conflicts with Dropdown */}
      <div className="bg-card/95 backdrop-blur border-b border-border/60 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto flex items-center">
          {/* Condensed header - shows on scroll */}
          <CondensedHeader 
            showTitle={showTitle} 
            groupName={groupName} 
            groupAvatar={groupAvatar} 
            groupId={groupId} 
          />
          
          {/* Tab list using Tabs component */}
          <Tabs 
            selectedKey={selectedTab} 
            onSelectionChange={(key) => setSelectedTab(key as string)}
            size={showTitle ? 'md' : 'lg'}
            showSeparators={false}
            className="flex-1"
          >
            <Tabs.ListContainer>
              <Tabs.List aria-label="Group sections" className="bg-transparent px-3 sm:px-4 lg:px-6 py-3 flex-nowrap">
                <Tabs.Tab id="feed" className="aria-selected:text-accent-foreground">
                  Feed
                  <Tabs.Indicator className="bg-accent shadow-none" />
                </Tabs.Tab>
                <Tabs.Tab id="about" className="aria-selected:text-accent-foreground">
                  About
                  <Tabs.Indicator className="bg-accent shadow-none" />
                </Tabs.Tab>
                <Tabs.Tab id="members" className="aria-selected:text-accent-foreground">
                  Members
                  <Tabs.Indicator className="bg-accent shadow-none" />
                </Tabs.Tab>
                {respectContent && (
                  <Tabs.Tab id="respect" className="aria-selected:text-accent-foreground">
                    Respect
                    <Tabs.Indicator className="bg-accent shadow-none" />
                  </Tabs.Tab>
                )}
                {mutesContent && (
                  <Tabs.Tab id="mutes" className="aria-selected:text-accent-foreground">
                    Mutes
                    <Tabs.Indicator className="bg-accent shadow-none" />
                  </Tabs.Tab>
                )}
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
          
          {/* Action buttons - OUTSIDE of Tabs to avoid React Aria context conflicts */}
          <ActionButtons showTitle={showTitle} isGuest={isGuest} isMember={isMember} />
        </div>
      </div>

      {/* Tab content - rendered manually based on selection */}
      <div className="p-0">
        {renderContent()}
      </div>
    </>
  )
}

