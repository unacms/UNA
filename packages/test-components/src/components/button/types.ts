// Shared button types - used by both web and native implementations

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps {
  /** Button text content */
  children: React.ReactNode
  /** Visual variant */
  variant?: ButtonVariant
  /** Size variant */
  size?: ButtonSize
  /** Disabled state */
  disabled?: boolean
  /** Loading state */
  loading?: boolean
  /** Additional className for styling */
  className?: string
  /** Click/press handler */
  onPress?: () => void
}

// Shared className mappings - work with both Tailwind CSS and Uniwind
export const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  outline: 'border border-border bg-background text-foreground',
  ghost: 'bg-transparent text-foreground',
}

export const buttonSizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

export const buttonBase = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none'

