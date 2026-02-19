'use client'

// Minimal client wrappers for interactive elements in test layouts
// These wrap only the parts that genuinely need client-side rendering

import { useState, useEffect } from 'react'
import { Icon as BaseIcon } from 'app/ui/atoms/icon'
import { Button as BaseButton } from 'app/design/controls'
import Link from 'app/ui/atoms/link'
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'

// Client-only Icon wrapper - prevents SSR hydration mismatch
// The base Icon uses localStorage on web which causes server/client mismatch
export function Icon(props) {
    const [mounted, setMounted] = useState(false)
    
    useEffect(() => {
        setMounted(true)
    }, [])
    
    // Return placeholder with same dimensions during SSR
    if (!mounted) {
        return <span style={{ width: props.size || 24, height: props.size || 24, display: 'inline-block' }} />
    }
    
    return <BaseIcon {...props} />
}

// Re-export Button for client interactions
export function Button(props) {
    return <BaseButton {...props} />
}

// Interactive link card with icon - used in index lists
export function LinkCard({ href, icon, title, description, iconColor = 'text-primary', iconBg = 'bg-primary/10' }) {
    const [mounted, setMounted] = useState(false)
    
    useEffect(() => {
        setMounted(true)
    }, [])
    
    return (
        <Link href={href}>
            <View className="flex-row items-center gap-4 p-4 rounded-lg border border-border/60 bg-card hover:bg-accent/50 web:transition-colors web:cursor-pointer">
                <View className={`w-12 h-12 rounded-lg ${iconBg} items-center justify-center`}>
                    {mounted ? (
                        <BaseIcon icon={icon} size={24} className={iconColor} />
                    ) : (
                        <span style={{ width: 24, height: 24, display: 'inline-block' }} />
                    )}
                </View>
                <View className="flex-1">
                    <Text className="text-lg font-semibold text-foreground">{title}</Text>
                    <Text className="text-sm text-muted-foreground">{description}</Text>
                </View>
                {mounted ? (
                    <BaseIcon icon="ChevronRight" size={20} className="text-muted-foreground" />
                ) : (
                    <span style={{ width: 20, height: 20, display: 'inline-block' }} />
                )}
            </View>
        </Link>
    )
}

// Badge component for auth state indicators
export function AuthBadge({ isAuthenticated }) {
    return (
        <View className={`px-2 py-0.5 rounded ${isAuthenticated ? 'bg-green-500/10' : 'bg-amber-500/10'}`}>
            <Text className={`text-xs font-medium ${isAuthenticated ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {isAuthenticated ? 'Authenticated' : 'Unauthenticated'}
            </Text>
        </View>
    )
}

