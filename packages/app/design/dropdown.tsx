import * as DropdownMenu from 'zeego/dropdown-menu'
import { styled } from 'nativewind'

export const DropdownMenuRoot = DropdownMenu.Root
export const DropdownMenuTrigger = DropdownMenu.Trigger
export const DropdownMenuContentV = DropdownMenu.create(
  styled(
    DropdownMenu.Content,
    'z-10 w-44 overflow-hidden backdrop-blur bg-backgroundmodal dark:bg-backgroundmodal-dark   divide-y divide-bdr dark:divide-bdr-dark text-sm  border dark:border-bdr-dark border-bdr rounded-lg shadow-2xl'
  ),
  'Content'
)

export const DropdownMenuItemV = DropdownMenu.create(
  styled(
    DropdownMenu.Item,
    'flex flex-row-reverse  justify-end items-center px-3 py-2.5 gap-x-3 hover:bg-backgroundbutton-hover dark:hover:bg-backgroundbutton-darkhover font-medium text-neutral-700 dark:text-neutral-200 dark:hover:text-white hover:cursor-pointer'
  ),
  'Item'
)

export const DropdownMenuContentH = DropdownMenu.create(
  styled(
    DropdownMenu.Content,
    'flex-row z-10 p-2 bg-backgroundmodal dark:bg-backgroundmodal-dark text-sm text-neutral-800 dark:text-neutral-200 rounded-full shadow'
  ),
  'Content'
)

export const DropdownMenuItemH = DropdownMenu.create(
  styled(
    DropdownMenu.Item,
    'block px-4 p-2 hover:bg-backgrounditem dark:hover:bg-backgrounditem-dark dark:hover:text-white rounded-full hover:cursor-pointer'
  ),
  'Item'
)

export const DropdownMenuItemTitle = DropdownMenu.create(
  styled(
    DropdownMenu.ItemTitle,
    'text-base text-neutral-700 dark:text-neutral-200 '
  ),
  'ItemTitle'
)

export const DropdownMenuItemIcon = DropdownMenu.create(
  styled(
    DropdownMenu.ItemIcon,
     ' text-xl text-neutral-700 dark:text-neutral-200 '
  ),
  'ItemIcon'
)

