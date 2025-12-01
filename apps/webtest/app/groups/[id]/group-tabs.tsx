'use client'

// Group Tabs - Client Component for interactive tab navigation
// Uses standard HeroUI v3 Tabs from @neo/test-components
// Shows condensed title when main header scrolls out of view

import { Tabs } from '@neo/test-components'
import { Dropdown, Label, Button } from '@heroui/react'
import { MessageSquare, Info, Users, MoreHorizontal, UserPlus, Share2, Flag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavbarIsland } from '@/app/components/navbar-island'

interface GroupTabsProps {
  groupName: string
  feedContent: React.ReactNode
  aboutContent: React.ReactNode
  membersContent: React.ReactNode
}

export function GroupTabs({ groupName, feedContent, aboutContent, membersContent }: GroupTabsProps) {
  const [showTitle, setShowTitle] = useState(false)
  const { setTitle } = useNavbarIsland()

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
          // Update navbar island on mobile
          setTitle(isScrolled ? groupName : null)
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
      // Clean up navbar title when unmounting
      setTitle(null)
    }
  }, [groupName, setTitle])

  return (
    <Tabs defaultSelectedKey="feed" size={tabSize}>
      {/* Tabs bar - sticky at top-16 */}
      <div className="bg-card border-b border-border/60 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-2 lg:px-6">
          <div className="flex gap-4 items-center justify-between">
            {/* Left side: Title (md+ only) + Tabs */}
            <div className="flex items-center">
              {/* Condensed title - appears when scrolled, hidden on mobile (shown in separate bar above) */}
              <h2 
                className={`
                  hidden md:block font-semibold text-xl text-foreground whitespace-nowrap overflow-hidden text-ellipsis
                  transition-all duration-200 ease-out
                  ${showTitle ? 'opacity-100 max-w-[200px] mr-4 lg:mr-6' : 'opacity-0 max-w-0 mr-0'}
                `}
              >
                {groupName}
              </h2>

              <Tabs.ListContainer>
                <Tabs.List aria-label="Group sections" className="w-fit bg-card p-0">
                <Tabs.Tab id="feed" className="data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="hidden md:block" />
                    Feed
                  </span>
                  <Tabs.Indicator className="bg-accent shadow-none" />
                </Tabs.Tab>
                <Tabs.Tab id="about" className="data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground">
                  <span className="flex items-center gap-2">
                    <Info className="hidden md:block" />
                    About
                  </span>
                  <Tabs.Indicator className="bg-accent shadow-none" />
                </Tabs.Tab>
                <Tabs.Tab id="members" className="data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground">
                  <span className="flex items-center gap-2">
                    <Users className="hidden md:block" />
                    Members
                  </span>
                  <Tabs.Indicator className="bg-accent shadow-none" />
                </Tabs.Tab>
              </Tabs.List>
              </Tabs.ListContainer>
            </div>

            {/* Right side: Action buttons (lg only when scrolled) + Dropdown */}
            <div className="flex items-center gap-2">
              {/* Primary action buttons - visible on lg+ when scrolled */}
              <div 
                className={`
                  hidden lg:flex items-center gap-2
                  transition-all duration-200 ease-out
                  ${showTitle ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                `}
              >
                <Button variant="primary" size="sm">
                  <UserPlus className="w-4 h-4" />
                  Join
                </Button>
                <Button variant="secondary" size="sm">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>

              {/* Actions Dropdown - smaller when scrolled */}
              <Dropdown>
                <Button aria-label="Actions menu" variant="secondary" isIconOnly size={showTitle ? 'sm' : 'md'}>
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
                <Dropdown.Popover>
                  <Dropdown.Menu onAction={(key) => console.log(`Action: ${key}`)}>
                    <Dropdown.Item id="join" textValue="Join Group">
                      <UserPlus className="w-4 h-4" />
                      <Label>Join Group</Label>
                    </Dropdown.Item>
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
            </div>
          </div>
        </div>
      </div>

      <Tabs.Panel id="feed">
        {feedContent}
      </Tabs.Panel>
      
      <Tabs.Panel id="about">
        {aboutContent}
      </Tabs.Panel>
      
      <Tabs.Panel id="members">
        {membersContent}
      </Tabs.Panel>
    </Tabs>
  )
}

