'use client'

// Auth State Context - Prototype for testing different user states
// Not real auth - just for layout prototyping

import { createContext, useContext, useState, type ReactNode } from 'react'

export type AuthState = 'unauthenticated' | 'authenticated' | 'group-member'

interface AuthStateContextType {
  authState: AuthState
  setAuthState: (state: AuthState) => void
}

const AuthStateContext = createContext<AuthStateContextType | null>(null)

// Provider component
export function AuthStateProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>('unauthenticated')
  
  return (
    <AuthStateContext.Provider value={{ authState, setAuthState }}>
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

