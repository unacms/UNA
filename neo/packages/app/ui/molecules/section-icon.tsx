import { View } from 'app/design/view'
import { Icon } from 'app/ui/atoms/icon'
import { useMenuData } from 'app/context/menu-data'
import { siteMenuIconForPages } from 'app/lib/section-icon'
import { appSetting, findIconFromRemote, getMenuSettings } from 'app/lib/util'

type SectionMenu = {
    object?: string
    config?: unknown
    icon?: string
    items?: unknown
} | null | undefined

type RouteLike = { link?: unknown; key?: unknown }

/** A menu's items as an array (UNA sends a list, or an object keyed by name). */
function menuItemList(items: unknown): RouteLike[] {
    if (Array.isArray(items)) return items
    if (items && typeof items === 'object') return Object.values(items) as RouteLike[]
    return []
}

/**
 * The section's icon as the header's main menu draws it: the site menu's item for one of the section's pages
 * (lib/section-icon), from the menu store the header has already filled. Else the section menu's own icon.
 * `routes` defaults to the menu's own items.
 */
export function useSectionIcon(menu: SectionMenu, uri?: string, routes?: RouteLike[]): string {
    const staticNavbar = appSetting('menu_items', 'menu_navbar')
    const useSiteMenu = !Array.isArray(staticNavbar) || !staticNavbar.length
    const { menuData } = useMenuData(menu && useSiteMenu ? appSetting('menu_items', 'objects', 'site') : null)
    if (!menu) return ''
    const menuSettings = getMenuSettings(menu.object, menu.config, menu)
    const pages = [uri, ...(routes ?? menuItemList(menu.items)).flatMap((route) => [route?.link, route?.key])]
    const siteIcon = siteMenuIconForPages(useSiteMenu ? menuData?.items : staticNavbar, pages)
    return findIconFromRemote(siteIcon || menuSettings?.icon || menu.icon) || ''
}

/**
 * A section's icon before its name (the phone header, the tablet tab row, the desktop section header): the main
 * menu's animated icon at 36px in its current-tab state, in a plain 44px box, as tall as the header's buttons.
 */
export function SectionIcon({ icon }: Readonly<{ icon?: string }>) {
    if (!icon) return null
    return (
        <View className="size-11 shrink-0 items-center justify-center">
            <Icon icon={icon} animated active size={36} className="text-card-foreground" />
        </View>
    )
}
