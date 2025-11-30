// HeroUI v3 Button Types - aligned with official API
// https://v3.heroui.com/docs/components/button

import type { ButtonProps as HeroUIButtonProps } from "@heroui/react"

// Re-export HeroUI's button props as our base
export type { ButtonProps as HeroUIButtonProps } from "@heroui/react"

// HeroUI v3 variants
export type ButtonVariant = 
  | "primary" 
  | "secondary" 
  | "tertiary" 
  | "ghost" 
  | "danger" 
  | "danger-soft"

// HeroUI v3 sizes
export type ButtonSize = "sm" | "md" | "lg"

// Extended props for our wrapper (adds RSC-friendly defaults)
export interface ButtonProps {
  /** Button content or render prop */
  children: React.ReactNode | ((values: ButtonRenderProps) => React.ReactNode)
  /** Visual variant - follows HeroUI v3 naming */
  variant?: ButtonVariant
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
  /** Press handler (React Aria pattern) */
  onPress?: (e: PressEvent) => void
  /** Use as child pattern for Link wrapping */
  asChild?: boolean
}

// Render props provided when using function children
export interface ButtonRenderProps {
  isPending: boolean
  isPressed: boolean
  isHovered: boolean
  isFocused: boolean
  isFocusVisible: boolean
  isDisabled: boolean
}

// React Aria PressEvent type
export interface PressEvent {
  type: "pressstart" | "pressend" | "pressup" | "press"
  pointerType: "mouse" | "pen" | "touch" | "keyboard" | "virtual"
  target: Element
  shiftKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
}

// BEM class mappings for HeroUI v3 theming
export const buttonClasses = {
  base: "button",
  sizes: {
    sm: "button--sm",
    md: "button--md",
    lg: "button--lg",
  },
  variants: {
    primary: "button--primary",
    secondary: "button--secondary",
    tertiary: "button--tertiary",
    ghost: "button--ghost",
    danger: "button--danger",
    "danger-soft": "button--danger-soft",
  },
  iconOnly: "button--icon-only",
} as const
