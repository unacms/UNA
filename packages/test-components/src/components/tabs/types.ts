// HeroUI Tabs Types - Complete variant support
// Based on HeroUI v2.8.5 API with v3 compound pattern
// https://www.heroui.com/docs/components/tabs

import type { Key } from "react"

// Variant styles (from HeroUI v2.8.5)
export type TabsVariant = "solid" | "bordered" | "light" | "underlined"

// Color options (from HeroUI v2.8.5)
export type TabsColor = "default" | "primary" | "secondary" | "success" | "warning" | "danger"

// Orientation options
export type TabsOrientation = "horizontal" | "vertical"

// Size options
export type TabsSize = "sm" | "md" | "lg"

// Radius options (from HeroUI v2.8.5)
export type TabsRadius = "none" | "sm" | "md" | "lg" | "full"

// Placement options (from HeroUI v2.8.5) - for horizontal orientation
export type TabsPlacement = "top" | "bottom" | "start" | "end"

// Extended props for our wrapper - full HeroUI v2.8.5 API
export interface TabsProps {
  /** Tab content (compound children) */
  children: React.ReactNode
  /** Visual style variant */
  variant?: TabsVariant
  /** Color theme for tabs */
  color?: TabsColor
  /** Tab orientation */
  orientation?: TabsOrientation
  /** Tab size */
  size?: TabsSize
  /** Border radius style */
  radius?: TabsRadius
  /** Tab list placement (for horizontal tabs) */
  placement?: TabsPlacement
  /** Whether tabs should take full width */
  fullWidth?: boolean
  /** Controlled selected key */
  selectedKey?: Key
  /** Default selected key (uncontrolled) */
  defaultSelectedKey?: Key
  /** Selection change handler */
  onSelectionChange?: (key: Key) => void
  /** Keys of disabled tabs */
  disabledKeys?: Key[]
  /** Whether all tabs are disabled */
  isDisabled?: boolean
  /** Disable cursor/indicator animation */
  disableCursorAnimation?: boolean
  /** Disable all animations */
  disableAnimation?: boolean
  /** Whether to show separators between tabs (solid variant only) */
  showSeparators?: boolean
  /** Whether to destroy inactive tab panels (for performance) */
  destroyInactiveTabPanel?: boolean
  /** Additional className for styling */
  className?: string
  /** Slot classNames for custom styling */
  classNames?: {
    base?: string
    tabList?: string
    tab?: string
    tabContent?: string
    cursor?: string
    panel?: string
  }
}

// Tab item props
export interface TabProps {
  /** Tab content */
  children: React.ReactNode
  /** Unique identifier for the tab */
  id: string
  /** Tab title (for accessibility) */
  title?: React.ReactNode
  /** Whether this tab is disabled */
  isDisabled?: boolean
  /** URL for tab as link (Next.js router integration) */
  href?: string
  /** Additional className */
  className?: string
}

// Tab panel props
export interface TabPanelProps {
  /** Panel content */
  children: React.ReactNode
  /** Matching id for the tab */
  id: string
  /** Additional className */
  className?: string
}

// Tab list props
export interface TabListProps {
  /** Tab items */
  children: React.ReactNode
  /** Accessible label */
  "aria-label"?: string
  /** Additional className */
  className?: string
}

// Tab list container props
export interface TabListContainerProps {
  /** Tab list and related elements */
  children: React.ReactNode
  /** Additional className */
  className?: string
}

// Tab indicator props
export interface TabIndicatorProps {
  /** Additional className */
  className?: string
}

// BEM class mappings for Tabs theming
export const tabsClasses = {
  root: "tabs",
  listContainer: "tabs__list-container",
  list: "tabs__list",
  tab: "tabs__tab",
  tabContent: "tabs__tab-content",
  panel: "tabs__panel",
  indicator: "tabs__indicator",
  // Variants
  variants: {
    solid: "tabs--solid",
    bordered: "tabs--bordered",
    light: "tabs--light",
    underlined: "tabs--underlined",
  },
  // Colors
  colors: {
    default: "tabs--default",
    primary: "tabs--primary",
    secondary: "tabs--secondary",
    success: "tabs--success",
    warning: "tabs--warning",
    danger: "tabs--danger",
  },
  // Orientations
  orientations: {
    horizontal: "tabs--horizontal",
    vertical: "tabs--vertical",
  },
  // Sizes
  sizes: {
    sm: "tabs--sm",
    md: "tabs--md",
    lg: "tabs--lg",
  },
  // Radius
  radius: {
    none: "tabs--radius-none",
    sm: "tabs--radius-sm",
    md: "tabs--radius-md",
    lg: "tabs--radius-lg",
    full: "tabs--radius-full",
  },
  // Placement
  placement: {
    top: "tabs--placement-top",
    bottom: "tabs--placement-bottom",
    start: "tabs--placement-start",
    end: "tabs--placement-end",
  },
  // Modifiers
  fullWidth: "tabs--full-width",
  noAnimation: "tabs--no-animation",
} as const
