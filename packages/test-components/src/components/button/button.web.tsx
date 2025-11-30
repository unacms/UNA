// Button - Web Implementation using HeroUI v3
// Re-exports HeroUI Button with proper BEM class integration
// RSC-compatible for static buttons; client-side for interactive

import { Button as HeroUIButton } from "@heroui/react"
import { buttonClasses } from "./types"
import type { ButtonProps } from "./types"

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ")
}

/**
 * Button component wrapping HeroUI v3 Button
 * 
 * Uses BEM classes for theming:
 * - .button (base)
 * - .button--{variant} (primary, secondary, tertiary, ghost, danger)
 * - .button--{size} (sm, md, lg)
 * - .button--icon-only
 * 
 * @see https://v3.heroui.com/docs/components/button
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
  ...props
}: ButtonProps & { href?: string }) {
  // Build BEM class string
  const bemClasses = cn(
    buttonClasses.base,
    buttonClasses.sizes[size],
    buttonClasses.variants[variant],
    isIconOnly && buttonClasses.iconOnly
  )

  return (
    <HeroUIButton
      className={cn(bemClasses, className)}
      isDisabled={isDisabled}
      isPending={isPending}
      onPress={onPress}
      {...props}
    >
      {children}
    </HeroUIButton>
  )
}

// Re-export the HeroUI Button for advanced usage
export { Button as HeroUIButton } from "@heroui/react"
