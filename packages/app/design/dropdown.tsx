import * as DropdownMenu from 'zeego/dropdown-menu'
import { styled } from 'nativewind'

export const DropdownMenuRoot = DropdownMenu.Root
export const DropdownMenuTrigger = DropdownMenu.Trigger
export const DropdownMenuContentV = DropdownMenu.create(
  styled(
    DropdownMenu.Content,
    'z-10 min-w-[200px] overflow-hidden backdrop-blur bg-bgrmodal dark:bg-bgrmodal-d mt-1  divide-y divide-bdr dark:divide-bdr-d text-sm  border dark:border-bdr-d border-bdr rounded-lg shadow-2xl'
  ),
  'Content'
)

export const DropdownMenuItemV = DropdownMenu.create(
  styled(
    DropdownMenu.Item,
    'flex-row items-center justify-between px-3 py-2.5 gap-x-3 bg-bgrmodal dark:bg-bgrmodal-d hover:bg-bgritem dark:hover:bg-bgritem-d font-medium text-neutral-700 dark:text-neutral-200 dark:hover:text-white hover:cursor-pointer'
  ),
  'Item'
)

export const DropdownMenuContentH = DropdownMenu.create(
  styled(
    DropdownMenu.Content,
    'flex-row z-10 p-2 bg-bgrmodal dark:bg-bgrmodal-d text-sm text-neutral-800 dark:text-neutral-200 rounded-full shadow'
  ),
  'Content'
)

export const DropdownMenuItemH = DropdownMenu.create(
  styled(
    DropdownMenu.Item,
    'block px-4 p-2 hover:bg-bgritem dark:hover:bg-bgritem-d dark:hover:text-white rounded-full hover:cursor-pointer'
  ),
  'Item'
)

export const DropdownMenuItemTitle = DropdownMenu.create(
  styled(
    DropdownMenu.ItemTitle,
    'text-base text-neutral-700 dark:text-neutral-200 flex-auto'
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

export const DropdownMenuItemImage = DropdownMenu.create(
  styled(
    DropdownMenu.ItemImage,
     ' text-xl text-neutral-700 dark:text-neutral-200 '
  ),
  'ItemImage'
)

export const DropdownMenuItemSubtitle = DropdownMenu.create(
  styled(
    DropdownMenu.ItemSubtitle,
     ' bg-neutral-500 dark:bg-neutral-500 rounded-full px-2 py-0.5 mx-1 text-center text-white  text-xs font-semibold '
  ),
  'ItemSubtitle'
)

export const DropdownMenuItemSubtitleRed = DropdownMenu.create(
  styled(
    DropdownMenu.ItemSubtitle,
     ' bg-contrast dark:bg-contrast-d rounded-full px-2 py-0.5 mx-1 text-center text-white  text-xs font-semibold '
  ),
  'ItemSubtitle'
)


