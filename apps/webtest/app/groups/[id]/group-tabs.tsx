'use client'

// Group Tabs - Client Component for interactive tab navigation
// Uses standard HeroUI v3 Tabs from @neo/test-components
// Shows condensed title + avatar + switcher when main header scrolls out of view

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

export function GroupTabs({ groupId, groupName, groupAvatar, feedContent, aboutContent, membersContent, respectContent, mutesContent }: GroupTabsProps) {
  const [showTitle, setShowTitle] = useState(false)
  const { setContent, setActions } = useNavbarIsland()
  const { authState } = useAuthStateSafe()
  const isMember = authState === 'group-member'
  const isGuest = authState === 'unauthenticated'

  // Determine tab size based on scroll state
  // When scrolled = smaller tabs for compact sticky header
  const tabSize = showTitle ? 'md' : 'lg'

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

  return (
    <Tabs defaultSelectedKey="feed" size={tabSize} showSeparators={false} className="gap-0">
      {/* Tabs bar - sticky at top-16 */}
      <div className="bg-card/95 backdrop-blur border-b border-border/60 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto ">
          <div className="flex items-center">
            {/* Left side: Avatar + Title (md+ only) + Tabs - takes remaining space and scrolls */}
            <div className="flex items-center min-w-0 flex-1 overflow-x-auto scrollbar-none ">
              {/* Condensed avatar + title + switcher - appears when scrolled, hidden on mobile (shown in navbar) */}
              <div 
                className={`
                  hidden md:flex items-center gap-2
                  transition-all duration-200 ease-out
                  ${showTitle ? 'opacity-100  ps-3 sm:ps-4 lg:ps-6 py-3' : 'opacity-0 max-w-0 overflow-hidden'}
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

              <Tabs.ListContainer>
                <Tabs.List aria-label="Group sections" className="w-fit bg-transparent px-3 sm:px-4 lg:px-6 py-3 flex-nowrap">
                <Tabs.Tab id="feed" className="data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground">
                  Feed
                  <Tabs.Indicator className="bg-accent shadow-none" />
                </Tabs.Tab>
                <Tabs.Tab id="about" className="data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground">
                  About
                  <Tabs.Indicator className="bg-accent shadow-none" />
                </Tabs.Tab>
                <Tabs.Tab id="members" className="data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground">
                  Members
                  <Tabs.Indicator className="bg-accent shadow-none" />
                </Tabs.Tab>
                {respectContent && (
                  <Tabs.Tab id="respect" className="data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground">
                    Respect
                    <Tabs.Indicator className="bg-accent shadow-none" />
                  </Tabs.Tab>
                )}
                {mutesContent && (
                  <Tabs.Tab id="mutes" className="data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground">
                    Mutes
                    <Tabs.Indicator className="bg-accent shadow-none" />
                  </Tabs.Tab>
                )}
              </Tabs.List>
              </Tabs.ListContainer>
            </div>

            {/* Right side: Action buttons (lg only when scrolled) + Dropdown */}
            <div className="flex items-center gap-2 shrink-0 pe-3 sm:pe-4 lg:pe-6 py-3">
              {/* Primary action buttons - visible on lg+ when scrolled, auth-state aware */}
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

              {/* Actions Dropdown - desktop only, not for guests */}
              {!isGuest && (
                <div className="hidden lg:block">
                  <GroupActionsDropdown size={showTitle ? 'sm' : 'md'} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Tabs.Panel id="feed" className="p-0">
        {feedContent}
      </Tabs.Panel>
      
      <Tabs.Panel id="about" className="p-0">
        {aboutContent}
      </Tabs.Panel>
      
      <Tabs.Panel id="members" className="p-0">
        {membersContent}
      </Tabs.Panel>
      
      {respectContent && (
        <Tabs.Panel id="respect" className="p-0">
          {respectContent}
        </Tabs.Panel>
      )}
      
      {mutesContent && (
        <Tabs.Panel id="mutes" className="p-0">
          {mutesContent}
        </Tabs.Panel>
      )}
    </Tabs>
  )
}

