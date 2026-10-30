import DropdownMenu from 'app/ui/atoms/dropdown-menu'
import { menuItemsByName, appSetting, getHeaderToolbarNeoButtonDefaults, normalizeMenuItemHref, findIconFromRemote } from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'
import { useTranslation } from 'react-i18next'
import { useIsDesktop } from 'app/context/measure';
import { useMenuData } from 'app/context/menu-data';

/**
 * Mobile-web header nav: icon trigger opens the same style of popup menu as
 * navbar “more” (DropdownMenu + menu_items dropdown rows).
 */
export default function MenuHeaderNavigation(props) {
    const { currentUser } = useCurrentUser()
    const { t } = useTranslation()
    const isDesktop = useIsDesktop()
    // No `menu_navigation` setting: the links come from UNA's footer menu.
    const staticItems = appSetting('menu_items', 'menu_navigation')
    const useFooterMenu = !Array.isArray(staticItems) || !staticItems.length
    const { menuData, isFetched } = useMenuData(useFooterMenu ? appSetting('menu_items', 'objects', 'footer') : null)
    const source = useFooterMenu
        ? (menuData?.items || []).map((item) => ({
            ...item,
            link: normalizeMenuItemHref(item.link),
            icon: findIconFromRemote(item.icon) || 'ChevronRight',
        })).filter((item) => item.link)
        : staticItems
    const resolved = menuItemsByName('main_menu', source, currentUser)
    const items = resolved.map((item) => ({
        ...item,
        title: t(item.title),
        ...(item.description || item.info ? { description: t(item.description || item.info) } : {}),
    }))

    // While the footer menu loads, keep the button so the header doesn't shift.
    if (!items.length && (!useFooterMenu || isFetched)) {
        return null
    }

    const {
        neoButton: _neoButton,
        rounded = false,
        startDecorator = 'Menu',
        alt = 'Menu',
        tooltip,
        // Legacy Button props from header_toolbar — must not reach DropdownPopup
        // or isLegacyButtonProps() picks Button (startDecorator) over NeoButton (image).
        variant: _variant,
        size: _size,
        ...neoButtonProps
    } = props

    return (
        <DropdownMenu
            mode="popup"
            items={items}
            defaultOpen={false}
            buttonProps={{
                ...getHeaderToolbarNeoButtonDefaults(isDesktop),
                ...neoButtonProps,
                image: neoButtonProps.image ?? startDecorator,
                borderShape:
                    neoButtonProps.borderShape ??
                    (rounded ? 'circle' : 'roundedRectangle'),
                accessibilityLabel: neoButtonProps.accessibilityLabel ?? alt,
                tooltip: tooltip ?? neoButtonProps.tooltip ?? alt,
            }}
        />
    )
}
