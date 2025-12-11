// GlassyButton Types
// A button with live camera feed as background for reflection effect

import type { ButtonVariant, ButtonSize } from "../button/types"

export interface GlassyButtonProps {
  /** Button content */
  children: React.ReactNode
  /** Visual variant - affects overlay color */
  variant?: GlassyButtonVariant
  /** Size variant */
  size?: ButtonSize
  /** Disabled state */
  isDisabled?: boolean
  /** Loading/pending state */
  isPending?: boolean
  /** Icon-only button */
  isIconOnly?: boolean
  /** Additional className for styling */
  className?: string
  /** Click handler */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  /** Button type */
  type?: "button" | "submit" | "reset"
  /** Mirror the video (selfie mode) - default true */
  mirror?: boolean
  /** Blur amount for the video background - default "sm" (2px) */
  blur?: "none" | "sm" | "md" | "lg"
  /** Opacity of the glass overlay */
  overlayOpacity?: number
}

export type GlassyButtonVariant = 
  | "default"
  | "primary"
  | "secondary"
  | "dark"
  | "light"

// BEM class mappings
export const glassyButtonClasses = {
  base: "glassy-button",
  sizes: {
    sm: "glassy-button--sm",
    md: "glassy-button--md",
    lg: "glassy-button--lg",
  },
  variants: {
    default: "glassy-button--default",
    primary: "glassy-button--primary",
    secondary: "glassy-button--secondary",
    dark: "glassy-button--dark",
    light: "glassy-button--light",
  },
  iconOnly: "glassy-button--icon-only",
} as const
