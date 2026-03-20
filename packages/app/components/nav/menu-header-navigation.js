import DropdownMenu from 'app/ui/atoms/dropdown-menu'
import { Button } from 'app/design/controls'
import { menuItemsByName, appSetting } from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'
import { useTranslation } from 'react-i18next'

/**
 * Mobile-web header nav: icon trigger opens the same style of popup menu as
 * navbar “more” (DropdownMenu + menu_items dropdown rows).
 */
export default function MenuHeaderNavigation(props) {
    const { currentUser } = useCurrentUser()
    const { t } = useTranslation()
    const source = appSetting('menu_items', 'menu_navigation')
    const resolved = menuItemsByName('main_menu', source, currentUser)
    const items = resolved.map((item) => ({ ...item, title: t(item.title) }))

    if (!items.length) {
        return null
    }

    const {
        variant = 'secondary',
        rounded = false,
        size = 'base',
        startDecorator = 'Menu',
        alt = 'Menu',
        ...rest
    } = props

    return (
        <DropdownMenu mode="popup" items={items} defaultOpen={false}>
            <Button
                variant={variant}
                rounded={rounded}
                size={size}
                startDecorator={startDecorator}
                alt={alt}
                {...rest}
            />
        </DropdownMenu>
    )
}
