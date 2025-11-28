// Button - Web Implementation (Next.js SSR-safe)
// This is a Server Component by default - no 'use client' needed for static buttons

import type { ButtonProps } from './types'
import { buttonBase, buttonVariants, buttonSizes } from './types'

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className,
  onPress,
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onPress}
      className={cn(
        buttonBase,
        buttonVariants[variant],
        buttonSizes[size],
        // Web-specific: hover states (not available in native)
        variant === 'primary' && 'hover:bg-primary/90',
        variant === 'secondary' && 'hover:bg-secondary/80',
        variant === 'destructive' && 'hover:bg-destructive/90',
        variant === 'outline' && 'hover:bg-accent',
        variant === 'ghost' && 'hover:bg-accent',
        className
      )}
    >
      {loading ? (
        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  )
}

