// HeroUI v3 Tabs Types - aligned with official API
// https://v3.heroui.com/docs/components/tabs
// Tabs use compound pattern: Tabs.ListContainer, Tabs.List, Tabs.Tab, Tabs.Panel, Tabs.Indicator

import type { TabsProps as HeroUITabsProps } from "@heroui/react"

// Re-export HeroUI's tabs props as our base
export type { TabsProps as HeroUITabsProps } from "@heroui/react"

// HeroUI v3 orientation options
export type TabsOrientation = "horizontal" | "vertical"

// Size options
export type TabsSize = "sm" | "md" | "lg"

// Extended props for our wrapper
export interface TabsProps {
  /** Tab content (compound children) */
  children: React.ReactNode
  /** Tab orientation */
  orientation?: TabsOrientation
  /** Tab size */
  size?: TabsSize
  /** Controlled selected key */
  selectedKey?: string
  /** Default selected key (uncontrolled) */
  defaultSelectedKey?: string
  /** Selection change handler */
  onSelectionChange?: (key: React.Key) => void
  /** Additional className for styling */
  className?: string
  /** Whether tabs are disabled */
  isDisabled?: boolean
}

// Tab item props
export interface TabProps {
  /** Tab content */
  children: React.ReactNode
  /** Unique identifier for the tab */
  id: string
  /** Whether this tab is disabled */
  isDisabled?: boolean
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
  panel: "tabs__panel",
  indicator: "tabs__indicator",
  orientations: {
    horizontal: "tabs--horizontal",
    vertical: "tabs--vertical",
  },
  sizes: {
    sm: "tabs--sm",
    md: "tabs--md",
    lg: "tabs--lg",
  },
} as const

