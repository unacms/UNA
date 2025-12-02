'use client'

// Navbar Auth Buttons - Client component for auth-state-aware navbar buttons
// Shows different buttons based on auth state:
// - Unauthenticated: Sign In, Get Started
// - Authenticated/Group Member: Messenger, Notifications, Account (icon-only, secondary, md)

import Link from 'next/link'
import { Button } from '@heroui/react'
import { useAuthStateSafe } from './auth-state'
import { MessageCircle, Bell, User } from 'lucide-react'

export function NavbarAuthButtons() {
  const { authState } = useAuthStateSafe()
  
  // Authenticated users see Messenger, Notifications, Account
  if (authState === 'authenticated' || authState === 'group-member') {
    return (
      <>
        <Button 
          variant="secondary" 
          size="md" 
          isIconOnly 
          aria-label="Messages"
        >
          <MessageCircle className="w-5 h-5" />
        </Button>
        <div className="relative">
          <Button 
            variant="secondary" 
            size="md" 
            isIconOnly 
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
          </Button>
          {/* Notification badge */}
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background" />
        </div>
        <Button 
          variant="secondary" 
          size="md" 
          isIconOnly 
          aria-label="Account"
        >
          <User className="w-5 h-5" />
        </Button>
      </>
    )
  }
  
  // Unauthenticated users see Sign In, Get Started
  return (
    <>
      <Link 
        href="/login" 
        className="hidden sm:flex button button--md button--secondary"
      >
        Sign In
      </Link>
      <Link 
        href="/signup" 
        className="button button--md button--primary"
      >
        Get Started
      </Link>
    </>
  )
}

