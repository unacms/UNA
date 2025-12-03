// Tabs Native Implementation - React Native with HeroUI Native API
// Based on https://github.com/heroui-inc/heroui-native/blob/beta/src/components/tabs/tabs.md
// Supports pill and line variants with animated indicator

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react"
import { View, Text, Pressable, ScrollView, LayoutChangeEvent, StyleSheet } from "react-native"
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  SharedValue,
  AnimatedStyleProp,
} from "react-native-reanimated"
import type { 
  TabsProps, 
  TabProps, 
  TabPanelProps, 
  TabListProps, 
  TabIndicatorProps,
  TabsVariant,
  TabsColor,
  TabsSize,
} from "./types"

// ============================================
// CONTEXT
// ============================================

interface TabLayout {
  x: number
  width: number
  height: number
}

interface TabsContextValue {
  value: string | null
  onValueChange: (value: string) => void
  variant: TabsVariant
  color: TabsColor
  size: TabsSize
  isDisabled?: boolean
  orientation: "horizontal" | "vertical"
  registerTab: (id: string, layout: TabLayout) => void
  indicatorX: SharedValue<number>
  indicatorWidth: SharedValue<number>
  indicatorHeight: SharedValue<number>
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs provider")
  }
  return context
}

// ============================================
// SIZE STYLES
// ============================================

const sizeStyles = {
  sm: { height: 28, fontSize: 12, paddingHorizontal: 12 },
  md: { height: 32, fontSize: 14, paddingHorizontal: 16 },
  lg: { height: 40, fontSize: 16, paddingHorizontal: 20 },
}

// ============================================
// COLOR STYLES (indicator background)
// ============================================

const colorStyles = {
  default: { indicator: "#ffffff", selected: "#0a0a0a" },
  primary: { indicator: "#2563eb", selected: "#ffffff" },
  secondary: { indicator: "#27272a", selected: "#fafafa" },
  success: { indicator: "#22c55e", selected: "#ffffff" },
  warning: { indicator: "#f59e0b", selected: "#000000" },
  danger: { indicator: "#ef4444", selected: "#ffffff" },
}

// ============================================
// MAIN TABS COMPONENT
// ============================================

interface TabsRootProps extends Omit<TabsProps, 'selectedKey' | 'defaultSelectedKey' | 'onSelectionChange'> {
  /** Currently active tab value (controlled) */
  value?: string
  /** Default active tab (uncontrolled) */
  defaultValue?: string
  /** Callback when active tab changes */
  onValueChange?: (value: string) => void
}

function TabsRoot({
  children,
  value: controlledValue,
  defaultValue,
  onValueChange: controlledOnValueChange,
  variant = "solid",
  color = "default",
  size = "md",
  orientation = "horizontal",
  isDisabled,
  className,
}: TabsRootProps) {
  const [internalValue, setInternalValue] = useState<string | null>(controlledValue ?? defaultValue ?? null)
  const tabLayouts = useRef<Map<string, TabLayout>>(new Map())
  
  // Animation values
  const indicatorX = useSharedValue(0)
  const indicatorWidth = useSharedValue(0)
  const indicatorHeight = useSharedValue(variant === "underlined" ? 2 : sizeStyles[size].height)
  
  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : internalValue
  
  const onValueChange = useCallback((newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue)
    }
    controlledOnValueChange?.(newValue)
    
    // Animate indicator to new position
    const layout = tabLayouts.current.get(newValue)
    if (layout) {
      indicatorX.value = withSpring(layout.x, { damping: 20, stiffness: 200 })
      indicatorWidth.value = withSpring(layout.width, { damping: 20, stiffness: 200 })
    }
  }, [isControlled, controlledOnValueChange, indicatorX, indicatorWidth])
  
  const registerTab = useCallback((id: string, layout: TabLayout) => {
    tabLayouts.current.set(id, layout)
    
    // If this is the selected tab, set indicator position
    if (id === value) {
      indicatorX.value = layout.x
      indicatorWidth.value = layout.width
      indicatorHeight.value = variant === "underlined" ? 2 : layout.height
    }
  }, [value, indicatorX, indicatorWidth, indicatorHeight, variant])
  
  // Update indicator when value changes externally
  useEffect(() => {
    if (value) {
      const layout = tabLayouts.current.get(value)
      if (layout) {
        indicatorX.value = withSpring(layout.x, { damping: 20, stiffness: 200 })
        indicatorWidth.value = withSpring(layout.width, { damping: 20, stiffness: 200 })
      }
    }
  }, [value, indicatorX, indicatorWidth])
  
  return (
    <TabsContext.Provider
      value={{
        value,
        onValueChange,
        variant,
        color,
        size,
        isDisabled,
        orientation,
        registerTab,
        indicatorX,
        indicatorWidth,
        indicatorHeight,
      }}
    >
      <View style={[
        styles.container,
        orientation === "vertical" && styles.containerVertical,
      ]}>
        {children}
      </View>
    </TabsContext.Provider>
  )
}

// ============================================
// LIST CONTAINER (optional wrapper for scroll)
// ============================================

function ListContainer({ children }: { children: React.ReactNode }) {
  return <View style={styles.listContainer}>{children}</View>
}

// ============================================
// TAB LIST
// ============================================

interface TabListInternalProps extends TabListProps {
  children: React.ReactNode
}

function List({ children, "aria-label": ariaLabel }: TabListInternalProps) {
  const { variant, orientation } = useTabsContext()
  
  const listStyle = [
    styles.list,
    variant === "solid" && styles.listSolid,
    variant === "bordered" && styles.listBordered,
    variant === "light" && styles.listLight,
    variant === "underlined" && styles.listUnderlined,
    orientation === "vertical" && styles.listVertical,
  ]
  
  return (
    <View 
      style={listStyle}
      accessibilityRole="tablist"
      accessibilityLabel={ariaLabel}
    >
      {children}
    </View>
  )
}

// ============================================
// SCROLL VIEW (for many tabs)
// ============================================

interface ScrollViewProps {
  children: React.ReactNode
  scrollAlign?: "start" | "center" | "end" | "none"
}

function TabsScrollView({ children, scrollAlign = "center" }: ScrollViewProps) {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {children}
    </ScrollView>
  )
}

// ============================================
// TAB TRIGGER
// ============================================

interface TriggerProps {
  children: React.ReactNode
  value: string
  isDisabled?: boolean
}

function Trigger({ children, value: tabValue, isDisabled: tabDisabled }: TriggerProps) {
  const { 
    value, 
    onValueChange, 
    variant, 
    color, 
    size, 
    isDisabled: allDisabled,
    registerTab,
  } = useTabsContext()
  
  const isSelected = value === tabValue
  const isDisabled = allDisabled || tabDisabled
  const sizeConfig = sizeStyles[size]
  const colorConfig = colorStyles[color]
  
  const handleLayout = (event: LayoutChangeEvent) => {
    const { x, width, height } = event.nativeEvent.layout
    registerTab(tabValue, { x, width, height })
  }
  
  const handlePress = () => {
    if (!isDisabled) {
      onValueChange(tabValue)
    }
  }
  
  return (
    <Pressable
      onLayout={handleLayout}
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityRole="tab"
      accessibilityState={{ selected: isSelected, disabled: isDisabled }}
      style={[
        styles.trigger,
        { 
          height: sizeConfig.height,
          paddingHorizontal: sizeConfig.paddingHorizontal,
        },
        isSelected && { zIndex: 1 },
        isDisabled && styles.triggerDisabled,
      ]}
    >
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          // Pass selected state to children (Label, etc.)
          return React.cloneElement(child as React.ReactElement<any>, {
            isSelected,
            color: isSelected ? 
              (variant === "underlined" && color !== "default" ? colorConfig.indicator : colorConfig.selected) : 
              undefined,
            fontSize: sizeConfig.fontSize,
          })
        }
        return child
      })}
    </Pressable>
  )
}

// ============================================
// TAB LABEL
// ============================================

interface LabelProps {
  children: React.ReactNode
  isSelected?: boolean
  color?: string
  fontSize?: number
}

function Label({ children, isSelected, color, fontSize = 14 }: LabelProps) {
  return (
    <Text
      style={[
        styles.label,
        { fontSize },
        isSelected && styles.labelSelected,
        color && { color },
      ]}
    >
      {children}
    </Text>
  )
}

// ============================================
// TAB INDICATOR
// ============================================

interface IndicatorInternalProps extends TabIndicatorProps {
  animationConfig?: {
    type: "spring" | "timing"
    config?: object
  }
}

function Indicator({ className, animationConfig }: IndicatorInternalProps) {
  const { variant, color, indicatorX, indicatorWidth, indicatorHeight } = useTabsContext()
  const colorConfig = colorStyles[color]
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: indicatorX.value }],
      width: indicatorWidth.value,
      height: indicatorHeight.value,
    }
  }, [])
  
  if (variant === "underlined") {
    return (
      <Animated.View
        style={[
          styles.indicatorUnderlined,
          { backgroundColor: colorConfig.indicator },
          animatedStyle,
        ]}
      />
    )
  }
  
  return (
    <Animated.View
      style={[
        styles.indicator,
        variant === "solid" && styles.indicatorSolid,
        variant === "bordered" && styles.indicatorBordered,
        variant === "light" && styles.indicatorLight,
        { backgroundColor: color === "default" ? "#ffffff" : colorConfig.indicator },
        animatedStyle,
      ]}
    />
  )
}

// ============================================
// TAB CONTENT (Panel)
// ============================================

interface ContentProps {
  children: React.ReactNode
  value: string
}

function Content({ children, value: contentValue }: ContentProps) {
  const { value } = useTabsContext()
  
  if (value !== contentValue) {
    return null
  }
  
  return (
    <View style={styles.content} accessibilityRole="tabpanel">
      {children}
    </View>
  )
}

// ============================================
// LEGACY API WRAPPERS (for compatibility with web API)
// ============================================

// Tab wrapper - converts web API to native API
function Tab({ children, id, isDisabled }: TabProps) {
  return (
    <Trigger value={id} isDisabled={isDisabled}>
      {React.Children.map(children, child => {
        // Handle string children as labels
        if (typeof child === "string") {
          return <Label>{child}</Label>
        }
        // Pass through other elements (icons, Indicator)
        return child
      })}
    </Trigger>
  )
}

// Panel wrapper - converts web API to native API
function Panel({ children, id }: TabPanelProps) {
  return <Content value={id}>{children}</Content>
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  containerVertical: {
    flexDirection: "row",
  },
  listContainer: {
    position: "relative",
  },
  list: {
    flexDirection: "row",
    position: "relative",
  },
  listVertical: {
    flexDirection: "column",
  },
  listSolid: {
    backgroundColor: "#f4f4f5",
    borderRadius: 24,
    padding: 4,
  },
  listBordered: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 12,
    padding: 4,
  },
  listLight: {
    backgroundColor: "transparent",
    gap: 8,
  },
  listUnderlined: {
    backgroundColor: "transparent",
    borderBottomWidth: 2,
    borderBottomColor: "#e4e4e7",
  },
  scrollContent: {
    flexDirection: "row",
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 20,
  },
  triggerDisabled: {
    opacity: 0.5,
  },
  label: {
    fontWeight: "500",
    color: "#71717a",
  },
  labelSelected: {
    color: "#0a0a0a",
  },
  indicator: {
    position: "absolute",
    borderRadius: 20,
  },
  indicatorSolid: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  indicatorBordered: {
    // Uses default style
  },
  indicatorLight: {
    // Uses default style
  },
  indicatorUnderlined: {
    position: "absolute",
    bottom: 0,
    borderRadius: 2,
  },
  content: {
    padding: 16,
  },
})

// ============================================
// COMPOUND EXPORT
// ============================================

export const Tabs = Object.assign(TabsRoot, {
  // Native API (HeroUI Native pattern)
  List,
  ListContainer,
  ScrollView: TabsScrollView,
  Trigger,
  Label,
  Indicator,
  Content,
  // Web API compatibility
  Tab,
  Panel,
})
