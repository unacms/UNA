'use client'

// Tabs Web Implementation - wraps HeroUI v3 Tabs
// Supports HeroUI v2.8.5 variants with v3 compound pattern
// https://v3.heroui.com/docs/components/tabs
// https://www.heroui.com/docs/components/tabs

import { Tabs as HeroUITabs } from "@heroui/react"
import { cn } from "../../theme/utils"
import { tabsClasses, type TabsProps, type TabListContainerProps, type TabListProps, type TabProps, type TabPanelProps, type TabIndicatorProps } from "./types"

/**
 * Tabs - Wrapper around HeroUI v3 Tabs with full variant support
 * Uses compound component pattern with sub-components
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
 * @example With variants
 * ```tsx
 * <Tabs variant="underlined" color="primary" size="lg">
 *   ...
 * </Tabs>
 * ```
 * 
 * @example With Next.js router
 * ```tsx
 * <Tabs selectedKey={pathname} onSelectionChange={(key) => router.push(key)}>
 *   <Tabs.Tab id="/dashboard" href="/dashboard">Dashboard</Tabs.Tab>
 *   <Tabs.Tab id="/settings" href="/settings">Settings</Tabs.Tab>
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

// Custom ListContainer with our BEM classes
function ListContainer({ children, className }: TabListContainerProps) {
  return (
    <HeroUITabs.ListContainer className={cn(tabsClasses.listContainer, className)}>
      {children}
    </HeroUITabs.ListContainer>
  )
}

// Custom List with our BEM classes
function List({ children, className, "aria-label": ariaLabel }: TabListProps) {
  return (
    <HeroUITabs.List aria-label={ariaLabel} className={cn(tabsClasses.list, className)}>
      {children}
    </HeroUITabs.List>
  )
}

// Custom Tab with our BEM classes
function Tab({ children, id, title, isDisabled, href, className }: TabProps) {
  return (
    <HeroUITabs.Tab 
      id={id} 
      isDisabled={isDisabled} 
      href={href}
      className={cn(tabsClasses.tab, className)}
      aria-label={title ? String(title) : undefined}
    >
      {children}
    </HeroUITabs.Tab>
  )
}

// Custom Panel with our BEM classes
function Panel({ children, id, className }: TabPanelProps) {
  return (
    <HeroUITabs.Panel id={id} className={cn(tabsClasses.panel, className)}>
      {children}
    </HeroUITabs.Panel>
  )
}

// Custom Indicator with our BEM classes
function Indicator({ className }: TabIndicatorProps) {
  return <HeroUITabs.Indicator className={cn(tabsClasses.indicator, className)} />
}

// Create compound component
export const Tabs = Object.assign(TabsRoot, {
  ListContainer,
  List,
  Tab,
  Panel,
  Indicator,
})
