'use client'

// Auth State Switcher - Footer component to toggle between auth states
// For prototyping only

import { useAuthStateSafe, type AuthState } from './auth-state'
import { User, UserCheck, Users } from 'lucide-react'
import { useState, useEffect } from 'react'

const authStates: { value: AuthState; label: string; icon: typeof User }[] = [
  { value: 'unauthenticated', label: 'Guest', icon: User },
  { value: 'authenticated', label: 'Logged In', icon: UserCheck },
  { value: 'group-member', label: 'Member', icon: Users },
]

export function AuthStateSwitcher() {
  const { authState, setAuthState } = useAuthStateSafe()
  const [mounted, setMounted] = useState(false)
  
  // Only render dynamic content after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
      {authStates.map(({ value, label, icon: Icon }) => {
        // Use static classes during SSR, dynamic after mount
        const isActive = mounted && authState === value
        return (
          <button
            key={value}
            onClick={() => setAuthState(value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
              isActive 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        )
      })}
    </div>
  )
}

