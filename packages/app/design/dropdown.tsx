import * as DropdownMenu from 'zeego/dropdown-menu'
import { styled } from 'nativewind'

export const DropdownMenuRoot = DropdownMenu.Root
export const DropdownMenuTrigger = DropdownMenu.Trigger
export const DropdownMenuContentV = DropdownMenu.create(
  styled(
    DropdownMenu.Content,
    'z-10 w-44 py-2 bg-white/90 dark:bg-neo-800/95 divide-y divide-bordercolor/10 dark:divide-bordercolor-dark/10 text-sm  border dark:border-bordercolor-dark/10 border-bordercolor/10 rounded-lg shadow-xl'
  ),
  'Content'
)

export const DropdownMenuItemV = DropdownMenu.create(
  styled(
    DropdownMenu.Item,
    'block px-4 p-2 hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50 font-medium text-neo-700 dark:text-neo-200 dark:hover:text-white'
  ),
  'Item'
)

export const DropdownMenuContentH = DropdownMenu.create(
  styled(
    DropdownMenu.Content,
    'flex-row z-10 p-2 bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 rounded-lg shadow'
  ),
  'Content'
)

export const DropdownMenuItemH = DropdownMenu.create(
  styled(
    DropdownMenu.Item,
    'block px-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-600  dark:hover:text-white rounded-lg'
  ),
  'Item'
)

export const DropdownMenuItemTitle = DropdownMenu.create(
  styled(
    DropdownMenu.ItemTitle,
    'font-medium text-neo-700 dark:text-neo-200 '
  ),
  'ItemTitle'
)


export const DropdownMenuItemIcon = DropdownMenu.ItemIcon
