// HeroUI v3 Dropdown Types - aligned with official API
// https://v3.heroui.com/docs/components/dropdown
// Dropdown uses compound pattern: Dropdown.Trigger, Dropdown.Popover, Dropdown.Menu, Dropdown.Item

import type { Key } from "react"

// Extended props for our wrapper
export interface DropdownProps {
  /** Dropdown content (compound children) */
  children: React.ReactNode
  /** Additional className for styling */
  className?: string
}

// Dropdown trigger props
export interface DropdownTriggerProps {
  /** Trigger element (usually a Button) */
  children: React.ReactNode
  /** Additional className */
  className?: string
}

// Dropdown popover props
export interface DropdownPopoverProps {
  /** Popover content */
  children: React.ReactNode
  /** Additional className */
  className?: string
}

// Dropdown menu props
export interface DropdownMenuProps {
  /** Menu items */
  children: React.ReactNode
  /** Action handler */
  onAction?: (key: Key) => void
  /** Selection mode */
  selectionMode?: "none" | "single" | "multiple"
  /** Selected keys (controlled) */
  selectedKeys?: Iterable<Key>
  /** Selection change handler */
  onSelectionChange?: (keys: Set<Key>) => void
  /** Additional className */
  className?: string
}

// Dropdown item props
export interface DropdownItemProps {
  /** Item content */
  children: React.ReactNode
  /** Unique identifier */
  id: Key
  /** Text value for accessibility */
  textValue?: string
  /** Visual variant */
  variant?: "default" | "danger"
  /** Whether this item is disabled */
  isDisabled?: boolean
  /** Additional className */
  className?: string
}

// Dropdown section props
export interface DropdownSectionProps {
  /** Section content */
  children: React.ReactNode
  /** Additional className */
  className?: string
}

// BEM class mappings for Dropdown theming
export const dropdownClasses = {
  root: "dropdown",
  trigger: "dropdown__trigger",
  popover: "dropdown__popover",
  menu: "dropdown__menu",
  item: "dropdown__item",
  section: "dropdown__section",
  itemIndicator: "dropdown__item-indicator",
  variants: {
    default: "dropdown__item--default",
    danger: "dropdown__item--danger",
  },
} as const

