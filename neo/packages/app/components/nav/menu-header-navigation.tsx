import { useState } from 'react'
import DropdownMenu, { type DropdownMenuItemData } from 'app/ui/atoms/dropdown-menu'
import { NeoButtonLink } from 'app/design/controls'
import { Row } from 'app/design/view'
import { getHeaderToolbarNeoButtonDefaults } from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'
import { useTranslation } from 'react-i18next'
import { useIsDesktop } from 'app/context/measure';
import { useMenuNavigationEntries } from 'app/components/nav/menu-header-navigation-entries'
import type { MenuHeaderNavigationProps } from 'app/components/nav/menu-header-navigation.types'

// Log In and Sign Up share the row equally, whatever their label widths.
const AUTH_BUTTON_CLASSES = { root: 'basis-0' }

/**
 * Header-toolbar menu (`menu_navigation`): icon trigger opens the same style of popup
 * menu as navbar “more” (DropdownMenu + menu_items dropdown rows). A group shows as a
 * section under its title. With `auth`, guests below `sm` also get Log In and Sign Up
 * under the rows. Web and Android; iOS has a native menu (menu-header-navigation.ios.tsx).
 */
export default function MenuHeaderNavigation(props: Readonly<MenuHeaderNavigationProps>) {
    const { currentUser } = useCurrentUser()
    const { t } = useTranslation()
    const isDesktop = useIsDesktop()
    const [open, setOpen] = useState(false)
    const entries = useMenuNavigationEntries()
    const items: DropdownMenuItemData[] = entries
        .flatMap(({ key, item, rows }) =>
            rows.length ? [{ type: 'group_header', id: `header-${key}`, name: item.name, title: item.title }, ...rows] : [item]
        )
        .map((item) => (item.description || item.info ? { ...item, description: t(item.description || item.info) } : item))

    if (!items.length) {
        return null
    }

    const {
        neoButton: _neoButton,
        auth = false,
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

    const close = () => setOpen(false)

    return (
        <DropdownMenu
            mode="popup"
            items={items}
            open={open}
            onOpenChange={setOpen}
            footer={
                auth && !currentUser ? (
                    <Row className="sm:hidden gap-2 px-2 pt-3 pb-1.5 mt-1.5 border-t border-border/60">
                        <NeoButtonLink
                            href="/login"
                            label={t('Log In')}
                            style="bordered"
                            borderShape="capsule"
                            width="fill"
                            classNames={AUTH_BUTTON_CLASSES}
                            onPress={close}
                        />
                        <NeoButtonLink
                            href="/create-account"
                            label={t('Sign Up')}
                            style="borderedProminent"
                            borderShape="capsule"
                            width="fill"
                            classNames={AUTH_BUTTON_CLASSES}
                            onPress={close}
                        />
                    </Row>
                ) : null
            }
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
