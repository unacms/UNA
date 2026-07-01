import DropdownMenu from 'app/ui/atoms/dropdown-menu'
import { menuItemsByName, appSetting, getHeaderToolbarNeoButtonDefaults } from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'
import { useTranslation } from 'react-i18next'
import { useIsDesktop } from 'app/context/measure';

/**
 * Mobile-web header nav: icon trigger opens the same style of popup menu as
 * navbar “more” (DropdownMenu + menu_items dropdown rows).
 */
export default function MenuHeaderNavigation(props) {
    const { currentUser } = useCurrentUser()
    const { t } = useTranslation()
    const isDesktop = useIsDesktop()
    const source = appSetting('menu_items', 'menu_navigation')
    const resolved = menuItemsByName('main_menu', source, currentUser)
    const items = resolved.map((item) => ({ ...item, title: t(item.title) }))

    if (!items.length) {
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
