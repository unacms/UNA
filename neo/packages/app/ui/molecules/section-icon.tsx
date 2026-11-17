import { View } from 'app/design/view'
import { Icon } from 'app/ui/atoms/icon'
import { useMenuData } from 'app/context/menu-data'
import { useCurrentUser } from 'app/context/user'
import { useTabList } from 'app/lib/navigation/tab-bar-menu'
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
 * The section's icon as the app's menus draw it: the header's main menu (the site menu's item for one of the section's
 * pages, lib/section-icon), else the tab bar's (UNA's `sys_tabbar`: Dashboard, Friends, Notifications, which the site
 * menu doesn't list), else the section menu's own icon. The menus come from the stores the header and the tab bar
 * already fill. `routes` defaults to the menu's own items.
 */
export function useSectionIcon(menu: SectionMenu, uri?: string, routes?: RouteLike[]): string {
    const staticNavbar = appSetting('menu_items', 'menu_navbar')
    const useSiteMenu = !Array.isArray(staticNavbar) || !staticNavbar.length
    const { menuData } = useMenuData(menu && useSiteMenu ? appSetting('menu_items', 'objects', 'site') : null)
    const { currentUser } = useCurrentUser()
    const { tabList } = useTabList(currentUser)
    if (!menu) return ''
    const menuSettings = getMenuSettings(menu.object ?? '', menu.config, menu)
    const pages = [uri, ...(routes ?? menuItemList(menu.items)).flatMap((route) => [route?.link, route?.key])]
    const siteIcon = siteMenuIconForPages(useSiteMenu ? menuData?.items : staticNavbar, pages)
        || siteMenuIconForPages(tabList.map((tab) => ({ icon: tab.icon, link: tab.url })), pages)
    return findIconFromRemote(siteIcon || menuSettings?.icon || menu.icon) || ''
}

/**
 * A section's icon before its name (the phone header, the tablet tab row, the desktop section header): the main
 * menu's animated icon at 32px in its current-tab state, in a plain 44px box, as tall as the header's buttons.
 * Its row puts the name 8px after it (gap-2) wherever it shows.
 */
export function SectionIcon({ icon }: Readonly<{ icon?: string }>) {
    if (!icon) return null
    return (
        <View className="size-11 shrink-0 items-center justify-center">
            <Icon icon={icon} animated active size={32} className="text-card-foreground" />
        </View>
    )
}
