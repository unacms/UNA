'use client'

// Tabs Web Implementation - re-exports HeroUI v3 Tabs
// HeroUI v3 Tabs uses React Aria Components internally with strict context requirements
// The compound components MUST be used directly - wrapping them breaks the React Aria context
// https://v3.heroui.com/docs/components/tabs

import { Tabs as HeroUITabs } from "@heroui/react"
import { cn } from "../../theme/utils"
import { tabsClasses, type TabsProps } from "./types"

/**
 * Tabs - Wrapper around HeroUI v3 Tabs with full variant support
 * 
 * IMPORTANT: This component re-exports HeroUI's compound components directly.
 * Do NOT wrap them in custom functions - this breaks React Aria's context system.
 * 
 * @example Basic usage
 * ```tsx
 * <Tabs>
 *   <Tabs.ListContainer>
 *     <Tabs.List aria-label="Options">
 *       <Tabs.Tab id="tab1">
 *         Tab 1
 *         <Tabs.Indicator />
 *       </Tabs.Tab>
 *     </Tabs.List>
 *   </Tabs.ListContainer>
 *   <Tabs.Panel id="tab1">Content 1</Tabs.Panel>
 * </Tabs>
 * ```
 * 
 * @example With variants (via className/data attributes)
 * ```tsx
 * <Tabs variant="underlined" size="lg">
 *   ...
 * </Tabs>
 * ```
 */
function TabsRoot({
  children,
  variant = "solid",
  color = "default",
  orientation = "horizontal",
  size = "md",
  radius,
  placement = "top",
  fullWidth = false,
  selectedKey,
  defaultSelectedKey,
  onSelectionChange,
  disabledKeys,
  isDisabled,
  disableCursorAnimation,
  disableAnimation,
  showSeparators = true,
  destroyInactiveTabPanel,
  className,
  classNames,
}: TabsProps) {
  // Determine effective radius based on variant if not explicitly set
  const effectiveRadius = radius ?? (variant === "solid" ? "full" : variant === "underlined" ? "none" : "lg")
  
  return (
    <HeroUITabs
      orientation={orientation}
      selectedKey={selectedKey as string | undefined}
      defaultSelectedKey={defaultSelectedKey as string | undefined}
      onSelectionChange={onSelectionChange}
      isDisabled={isDisabled}
      className={cn(
        tabsClasses.root,
        tabsClasses.variants[variant],
        tabsClasses.colors[color],
        tabsClasses.orientations[orientation],
        tabsClasses.sizes[size],
        tabsClasses.radius[effectiveRadius],
        tabsClasses.placement[placement],
        fullWidth && tabsClasses.fullWidth,
        disableAnimation && tabsClasses.noAnimation,
        classNames?.base,
        className
      )}
      data-variant={variant}
      data-color={color}
      data-radius={effectiveRadius}
      data-placement={placement}
      data-separators={variant === "solid" && showSeparators ? "true" : "false"}
      data-full-width={fullWidth ? "true" : "false"}
      data-no-animation={disableAnimation || disableCursorAnimation ? "true" : "false"}
    >
      {children}
    </HeroUITabs>
  )
}

// Re-export HeroUI compound components directly
// DO NOT wrap these - React Aria's context system requires direct component references
export const Tabs = Object.assign(TabsRoot, {
  ListContainer: HeroUITabs.ListContainer,
  List: HeroUITabs.List,
  Tab: HeroUITabs.Tab,
  Panel: HeroUITabs.Panel,
  Indicator: HeroUITabs.Indicator,
})
