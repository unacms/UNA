import * as DropdownMenu from 'zeego/dropdown-menu'
import { styled } from 'nativewind'

export const DropdownMenuRoot = DropdownMenu.Root
export const DropdownMenuTrigger = DropdownMenu.Trigger
export const DropdownMenuContentV = DropdownMenu.create(
  styled(
    DropdownMenu.Content,
    'z-10 w-44 overflow-hidden backdrop-blur bg-white/80 dark:bg-neogray-900/80   divide-y divide-neoborder-dark/10 dark:divide-neoborder/5 text-sm  border dark:border-neoborder/5 border-neoborder-dark/20 rounded-lg shadow-lg'
  ),
  'Content'
)

export const DropdownMenuItemV = DropdownMenu.create(
  styled(
    DropdownMenu.Item,
    'block px-4 p-2 hover:bg-neoitem dark:hover:bg-neoitem-dark font-medium text-neogray-700 dark:text-neogray-200 dark:hover:text-white hover:cursor-pointer'
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
    'block px-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white rounded-lg hover:cursor-pointer'
  ),
  'Item'
)

export const DropdownMenuItemTitle = DropdownMenu.create(
  styled(
    DropdownMenu.ItemTitle,
    'font-medium text-neogray-700 dark:text-neogray-200 '
  ),
  'ItemTitle'
)


export const DropdownMenuItemIcon = DropdownMenu.ItemIcon
