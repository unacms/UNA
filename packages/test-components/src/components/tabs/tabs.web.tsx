'use client'

// Tabs Web Implementation - wraps HeroUI v3 Tabs
// https://v3.heroui.com/docs/components/tabs

import { Tabs as HeroUITabs } from "@heroui/react"
import { cn } from "../../theme/utils"
import { tabsClasses, type TabsProps } from "./types"

/**
 * Tabs - Wrapper around HeroUI v3 Tabs
 * Uses compound component pattern with sub-components
 * 
 * @example
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
 */
function TabsRoot({
  children,
  orientation = "horizontal",
  size = "md",
  selectedKey,
  defaultSelectedKey,
  onSelectionChange,
  className,
  isDisabled,
  showSeparators = true,
}: TabsProps) {
  return (
    <HeroUITabs
      orientation={orientation}
      selectedKey={selectedKey}
      defaultSelectedKey={defaultSelectedKey}
      onSelectionChange={onSelectionChange}
      isDisabled={isDisabled}
      className={cn(
        tabsClasses.root,
        tabsClasses.orientations[orientation],
        tabsClasses.sizes[size],
        className
      )}
      data-separators={showSeparators ? "true" : "false"}
    >
      {children}
    </HeroUITabs>
  )
}

// Re-export sub-components from HeroUI with our class additions
const ListContainer = HeroUITabs.ListContainer
const List = HeroUITabs.List
const Tab = HeroUITabs.Tab
const Panel = HeroUITabs.Panel
const Indicator = HeroUITabs.Indicator

// Create compound component
export const Tabs = Object.assign(TabsRoot, {
  ListContainer,
  List,
  Tab,
  Panel,
  Indicator,
})

