// Dropdown Native Implementation - placeholder for React Native
// TODO: Implement with React Native components when needed

import { View, Text, Pressable } from "react-native"
import type { DropdownProps, DropdownMenuProps, DropdownItemProps } from "./types"

/**
 * Dropdown - Native placeholder
 * Full implementation TBD with React Native dropdown library
 */
function DropdownRoot({ children }: DropdownProps) {
  return <View>{children}</View>
}

function Trigger({ children }: { children: React.ReactNode }) {
  return <View>{children}</View>
}

function Popover({ children }: { children: React.ReactNode }) {
  return <View>{children}</View>
}

function Menu({ children }: DropdownMenuProps) {
  return <View>{children}</View>
}

function Item({ children, id }: DropdownItemProps) {
  return (
    <Pressable>
      <Text>{children}</Text>
    </Pressable>
  )
}

function Section({ children }: { children: React.ReactNode }) {
  return <View>{children}</View>
}

function ItemIndicator() {
  return <View />
}

function SubmenuTrigger({ children }: { children: React.ReactNode }) {
  return <View>{children}</View>
}

function SubmenuIndicator() {
  return <View />
}

// Create compound component
export const Dropdown = Object.assign(DropdownRoot, {
  Trigger,
  Popover,
  Menu,
  Item,
  Section,
  ItemIndicator,
  SubmenuTrigger,
  SubmenuIndicator,
})

