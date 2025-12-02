'use client'

// Auth State Context - Prototype for testing different user states
// Not real auth - just for layout prototyping
// Persists selection to localStorage

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type AuthState = 'unauthenticated' | 'authenticated' | 'group-member'

const AUTH_STATE_KEY = 'neo-webtest-auth-state'

interface AuthStateContextType {
  authState: AuthState
  setAuthState: (state: AuthState) => void
}

const AuthStateContext = createContext<AuthStateContextType | null>(null)

// Provider component
export function AuthStateProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthStateInternal] = useState<AuthState>('unauthenticated')
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STATE_KEY)
    if (stored && ['unauthenticated', 'authenticated', 'group-member'].includes(stored)) {
      setAuthStateInternal(stored as AuthState)
    }
    setIsHydrated(true)
  }, [])
  
  // Wrapper to also save to localStorage
  const setAuthState = (state: AuthState) => {
    setAuthStateInternal(state)
    localStorage.setItem(AUTH_STATE_KEY, state)
  }
  
  // Prevent hydration mismatch by rendering children only after hydration
  // But still provide context so hooks don't break
  return (
    <AuthStateContext.Provider value={{ authState: isHydrated ? authState : 'unauthenticated', setAuthState }}>
      {children}
    </AuthStateContext.Provider>
  )
}

// Hook to use auth state
export function useAuthState() {
  const context = useContext(AuthStateContext)
  if (!context) {
    throw new Error('useAuthState must be used within AuthStateProvider')
  }
  return context
}

// Safe hook that returns default state if outside provider
export function useAuthStateSafe(): AuthStateContextType {
  const context = useContext(AuthStateContext)
  return context ?? { authState: 'unauthenticated', setAuthState: () => {} }
}

