/**
 * Icon Component for React Native
 * 
 * Primary: Lucide React Native (consistent with web)
 * Fallback: @expo/vector-icons for icon sets not in Lucide
 * 
 * Usage:
 *   // Direct Lucide import (preferred):
 *   import { Home, Settings, Sun } from 'lucide-react-native'
 *   <Home size={24} color="#3b82f6" />
 * 
 *   // DynamicIcon for icons not in Lucide:
 *   <DynamicIcon icon="mdi:account" size={24} color="#3b82f6" />
 */

import React from 'react'
import {
  MaterialCommunityIcons,
  Feather,
  Ionicons,
  FontAwesome5,
  AntDesign,
} from '@expo/vector-icons'

export interface DynamicIconProps {
  /** 
   * Icon name in format "prefix:name" 
   * Supported prefixes: mdi, feather, ion, fa, ant
   * @example "mdi:home", "feather:settings", "ion:person"
   */
  icon: string
  /** Icon size. Defaults to 24 */
  size?: number
  /** Icon color. Defaults to currentColor */
  color?: string
  /** Additional style props */
  style?: object
}

/**
 * Maps icon prefixes to @expo/vector-icons icon sets
 */
const ICON_SETS = {
  // Material Design Icons
  mdi: MaterialCommunityIcons,
  'material-community': MaterialCommunityIcons,
  
  // Feather icons
  feather: Feather,
  
  // Ionicons
  ion: Ionicons,
  ionicons: Ionicons,
  
  // FontAwesome 5
  fa: FontAwesome5,
  fa5: FontAwesome5,
  'font-awesome': FontAwesome5,
  
  // Ant Design Icons
  ant: AntDesign,
  antd: AntDesign,
} as const

type IconSetKey = keyof typeof ICON_SETS

/**
 * DynamicIcon - Fallback for icons not in Lucide
 * 
 * For most icons, prefer direct Lucide import:
 *   import { Home } from 'lucide-react-native'
 * 
 * Use DynamicIcon only for icon sets not available in Lucide.
 */
export function DynamicIcon({ icon, size = 24, color, style }: DynamicIconProps) {
  // Parse "prefix:name" format
  const colonIndex = icon.indexOf(':')
  
  if (colonIndex === -1) {
    console.warn(`DynamicIcon: Invalid format "${icon}". Expected "prefix:name" (e.g., "mdi:home")`)
    return null
  }
  
  const prefix = icon.substring(0, colonIndex).toLowerCase() as IconSetKey
  const name = icon.substring(colonIndex + 1)
  
  // Get the icon set component
  const IconSet = ICON_SETS[prefix]
  
  if (!IconSet) {
    console.warn(`DynamicIcon: Unknown prefix "${prefix}". Supported: ${Object.keys(ICON_SETS).join(', ')}`)
    return null
  }
  
  return (
    <IconSet
      // @ts-expect-error - Icon names are dynamic
      name={name}
      size={size}
      color={color}
      style={style}
    />
  )
}

export default DynamicIcon

/**
 * Icon Usage Guide for NEO Native:
 * 
 * PREFERRED - Direct Lucide imports (same icons as web):
 *   import { Sun, Moon, Home, Settings } from 'lucide-react-native'
 *   <Sun size={24} color="currentColor" />
 * 
 * FALLBACK - DynamicIcon for other icon sets:
 *   <DynamicIcon icon="mdi:account-circle" size={24} />
 * 
 * Available DynamicIcon prefixes:
 * - mdi: MaterialCommunityIcons (7000+ icons)
 * - feather: Feather icons (280+ icons)
 * - ion: Ionicons (1300+ icons)
 * - fa: FontAwesome 5 (1600+ free icons)
 * - ant: Ant Design Icons (600+ icons)
 */
