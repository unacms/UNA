'use client'

// Group Actions - Client component for auth-state-aware group actions
// Shows different actions based on auth state:
// - Unauthenticated (Guest): Share only (no Join, no actions menu)
// - Authenticated: Join Group, Share, actions menu
// - Group Member: Invite (primary), Share, actions menu

import { Button } from "@neo/test-components"
import { Dropdown, Label, Button as HeroUIButton } from "@heroui/react"
import { UserPlus, Share2, MoreHorizontal, Flag, Mail } from 'lucide-react'
import { useAuthStateSafe } from '../../components/auth-state'
import { useState, useEffect } from 'react'

interface GroupHeaderActionsProps {
  groupId: string
}

export function GroupHeaderActions({ groupId }: GroupHeaderActionsProps) {
  const { authState } = useAuthStateSafe()
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Wait for hydration to prevent mismatch
  useEffect(() => {
    setIsHydrated(true)
  }, [])
  
  // During SSR and initial hydration, render a consistent placeholder
  // that matches what the server renders (unauthenticated state)
  if (!isHydrated) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="secondary">
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </div>
    )
  }
  
  // Guest users only see Share button
  if (authState === 'unauthenticated') {
    return (
      <div className="flex items-center gap-2">
        <Button variant="secondary">
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </div>
    )
  }
  
  // Group member sees Invite as primary
  if (authState === 'group-member') {
    return (
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
        <Button variant="primary">
          <Mail className="w-4 h-4" />
          Invite
        </Button>
        <Button variant="secondary">
          <Share2 className="w-4 h-4" />
          Share
        </Button>
        </div>
        {/* Actions Dropdown - mobile only */}
        <div className="lg:hidden">
          <GroupActionsDropdown authState={authState} />
        </div>
      </div>
    )
  }
  
  // Authenticated users see Join Group
  return (
    <div className="flex items-center gap-2 justify-between">
      <div className="flex items-center gap-2">
      <Button variant="primary">
        <UserPlus className="w-4 h-4" />
        Join Group
      </Button>
      <Button variant="secondary">
        <Share2 className="w-4 h-4" />
          Share
        </Button>
      </div>
      {/* Actions Dropdown - mobile only */}
      <div className="lg:hidden">
        <GroupActionsDropdown authState={authState} />
      </div>
    </div>
  )
}

// Shared dropdown component
function GroupActionsDropdown({ authState }: { authState: string }) {
  const isMember = authState === 'group-member'
  
  return (
    <Dropdown>
      <HeroUIButton aria-label="Actions menu" variant="secondary" isIconOnly size="md">
        <MoreHorizontal className="w-4 h-4" />
      </HeroUIButton>
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

