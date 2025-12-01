// Button - Web Implementation
// Uses native button with BEM classes for theming
// For asChild pattern, uses HeroUI Button which handles it correctly

import { Button as HeroUIButton } from "@heroui/react"
import { buttonClasses } from "./types"
import type { ButtonProps } from "./types"

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ")
}

/**
 * Button component with BEM theming
 * 
 * Uses BEM classes for styling:
 * - .button (base) - includes gap for icon spacing
 * - .button--{variant} (primary, secondary, tertiary, ghost, danger)
 * - .button--{size} (sm, md, lg)
 * - .button--icon-only
 * 
 * Icons are spaced via gap, no margin classes needed on icons.
 * 
 * @example
 * ```tsx
 * // Basic button
 * <Button>Click me</Button>
 * 
 * // Link styled as button (uses asChild)
 * <Button asChild><Link href="/page">Go</Link></Button>
 * ```
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  isDisabled = false,
  isPending = false,
  isIconOnly = false,
  className,
  onPress,
  asChild,
  type = "button",
  ...props
}: ButtonProps & { href?: string; type?: "button" | "submit" | "reset" }) {
  // Build BEM class string
  const bemClasses = cn(
    buttonClasses.base,
    buttonClasses.sizes[size],
    buttonClasses.variants[variant],
    isIconOnly && buttonClasses.iconOnly
  )

  const combinedClassName = cn(bemClasses, className)

  // For asChild pattern, use HeroUI Button which handles it correctly
  // Filter out non-DOM props that shouldn't be passed to child elements
  if (asChild) {
    return (
      <HeroUIButton
        className={combinedClassName}
        asChild
      >
        {children}
      </HeroUIButton>
    )
  }

  // For regular buttons, use native button to avoid class duplication
  // Render prop children not supported in native button mode
  const buttonContent = typeof children === 'function' ? null : children
  
  return (
    <button
      type={type}
      className={combinedClassName}
      disabled={isDisabled || isPending}
      aria-disabled={isDisabled || isPending || undefined}
      data-disabled={isDisabled || undefined}
      data-pending={isPending || undefined}
      {...props}
    >
      {buttonContent}
    </button>
  )
}

// Re-export HeroUI Button for advanced usage if needed
export { HeroUIButton }
