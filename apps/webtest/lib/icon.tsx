'use client'

/**
 * DynamicIcon - Client-side Iconify wrapper for dynamic/unknown icons
 * 
 * USE THIS ONLY when icon name is dynamic or not available in Lucide.
 * For static icons, import directly from 'lucide-react' (Server Component compatible).
 * 
 * @see https://iconify.design/docs/icon-components/react/
 * @see https://icon-sets.iconify.design/ for available icons
 * 
 * Usage:
 *   // For dynamic icons (e.g., from API/user input)
 *   <DynamicIcon icon="mdi:home" />
 *   <DynamicIcon icon="heroicons:user" size={24} />
 * 
 *   // For static icons, prefer Lucide (Server Component):
 *   import { Home, User } from 'lucide-react'
 *   <Home size={24} />
 */

import { Icon as IconifyIcon } from '@iconify/react'
import type { IconProps as IconifyIconProps } from '@iconify/react'

export interface DynamicIconProps extends Omit<IconifyIconProps, 'icon' | 'width' | 'height'> {
  /** 
   * Icon name in format "prefix:name" 
   * @example "mdi:home", "lucide:settings", "heroicons:user"
   */
  icon: string
  /** Icon size (width and height). Defaults to "1em" for font-relative sizing */
  size?: number | string
  /** Additional CSS classes */
  className?: string
}

/**
 * DynamicIcon - Fallback for icons not in Lucide or dynamic icon names
 * 
 * Features:
 * - Loads icons on-demand from Iconify API
 * - Access to 200,000+ icons from 200+ sets
 * - Uses currentColor for theme integration
 * 
 * Note: This is a CLIENT component. For Server Components, use Lucide directly.
 */
export function DynamicIcon({ icon, size = '1em', className = '', ...props }: DynamicIconProps) {
  return (
    <IconifyIcon
      icon={icon}
      width={size}
      height={size}
      className={className}
      {...props}
    />
  )
}

/**
 * Icon sets available via DynamicIcon (Iconify):
 * 
 * - mdi: Material Design Icons (7000+ icons)
 * - heroicons: Heroicons (450+ icons)
 * - tabler: Tabler icons (4000+ icons)
 * - phosphor: Phosphor icons (6000+ icons)
 * - solar: Solar icons (7000+ icons)
 * - gravity-ui: Gravity UI icons (HeroUI Pro uses these)
 * - lucide: Also available, but prefer direct import
 * 
 * Browse all: https://icon-sets.iconify.design/
 */

