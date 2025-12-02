'use client'

// AppIntroCard - Guest-only CTA card
// Only shows for unauthenticated users (guests)
// Logged in users and members should not see this
// Supports two variants: 'default' (tech groups) and 'warm' (ambient circle style)

import { Card, CardContent, Button } from "@neo/test-components"
import Link from "next/link"
import { useAuthStateSafe } from "../../components/auth-state"
import { AppLogo } from "../../components/app-logo"

interface AppIntroCardProps {
  variant?: 'default' | 'warm'
}

export function AppIntroCard({ variant = 'default' }: AppIntroCardProps) {
  const { authState } = useAuthStateSafe()
  
  // Only show for guests
  if (authState !== 'unauthenticated') {
    return null
  }

  if (variant === 'warm') {
    return (
      <Card className="p-2 overflow-hidden bg-gradient-to-b from-stone-100 via-amber-50 to-orange-50 dark:from-stone-900 dark:via-amber-950/50 dark:to-orange-950/30">
        <div className="relative">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              {/* Left side - Text content */}
              <div className="p-4 md:p-6 flex flex-col justify-center">
                <h2 className="text-2xl md:text-3xl font-bold text-stone-800 dark:text-stone-100 leading-tight mb-4">
                  Where important conversations happen
                </h2>
                <p className="text-lg text-stone-600 dark:text-stone-300 mb-6">
                  You don&apos;t have to go through it alone
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary" className="bg-stone-700 hover:bg-stone-800 text-white" asChild>
                    <Link href="/groups">Join a community</Link>
                  </Button>
                  <Button variant="secondary" className="bg-stone-200/80 hover:bg-stone-300 text-stone-800 border-stone-300" asChild>
                    <Link href="/signup">Start a community</Link>
                  </Button>
                </div>
              </div>
              
              {/* Right side - Illustration */}
              <div className="relative min-h-[280px] md:min-h-[320px] flex items-end justify-center overflow-hidden rounded">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1543269865-cbf427effbad?w=500&h=400&fit=crop"
                  alt="People connecting in conversation"
                  loading="lazy"
                  decoding="async"
                  className="relative z-10 w-full h-full object-cover object-top"
                />
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    )
  }

  // Default variant
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="shrink-0 w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
            <AppLogo mode="mark" markSize={40} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">Join the Community</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Sign up to join groups, connect with members, and participate in discussions.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" size="sm" asChild>
                <Link href="/signup">Create Account</Link>
              </Button>
              <Button variant="tertiary" size="sm" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

