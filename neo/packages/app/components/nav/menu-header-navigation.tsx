import { useState } from 'react'
import DropdownMenu, { type DropdownMenuItemData } from 'app/ui/atoms/dropdown-menu'
import { NeoButton, NeoButtonLink } from 'app/design/controls'
import { Row } from 'app/design/view'
import { cn, getHeaderToolbarNeoButtonDefaults } from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'
import { useTranslation } from 'react-i18next'
import { useIsDesktop } from 'app/context/measure';
import { useOpenModalByUrl, useOpenModalWithContent } from 'app/context/jotai/modal'
import { AUTH_BUTTONS, useMenuNavigationEntries } from 'app/components/nav/menu-header-navigation-entries'
import type { MenuHeaderNavigationProps } from 'app/components/nav/menu-header-navigation.types'

// Log In and Sign Up share the row equally, whatever their label widths.
const AUTH_BUTTON_CLASSES = { root: 'basis-0' }

/**
 * Header-toolbar menu (`menu_navigation`, else UNA's site menu): icon trigger opens the same style of popup
 * menu as navbar “more” (DropdownMenu + menu_items dropdown rows). A group shows as a
 * section under its title. Items marked as buttons (the site menu's Log In and Sign Up for
 * guests on phones) come first, as the buttons they are outside the menu, above a divider.
 * With `auth`, a menu without such items gives guests below `sm` Log In and Sign Up there.
 * Web and Android; iOS has a native menu (menu-header-navigation.ios.tsx).
 */
export default function MenuHeaderNavigation(props: Readonly<MenuHeaderNavigationProps>) {
    const { currentUser } = useCurrentUser()
    const { t } = useTranslation()
    const isDesktop = useIsDesktop()
    const [open, setOpen] = useState(false)
    const openModalByUrl = useOpenModalByUrl()
    const openModalWithContent = useOpenModalWithContent()
    const { entries, buttons, pending } = useMenuNavigationEntries()
    const items: DropdownMenuItemData[] = entries
        .flatMap(({ key, item, rows }) =>
            rows.length ? [{ type: 'group_header', id: `header-${key}`, name: item.name, title: item.title }, ...rows] : [item]
        )
        .map((item) => (item.description || item.info ? { ...item, description: t(item.description || item.info) } : item))

    // The `auth` fallback follows the toolbar, which has its own Log In and Sign Up from `sm`.
    const authFallback = !buttons.length && !!props.auth && !currentUser
    const shownButtons = authFallback ? AUTH_BUTTONS : buttons

    // While the site menu loads, keep the button so the header doesn't shift.
    if (!items.length && !shownButtons.length && !pending) {
        return null
    }

    const {
        neoButton: _neoButton,
        auth: _auth,
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
            header={
                shownButtons.length ? (
                    <Row
                        className={cn(
                            'gap-2 px-2 pt-1.5 pb-3 border-border/60',
                            items.length && 'mb-1.5 border-b',
                            authFallback && 'sm:hidden'
                        )}
                    >
                        {shownButtons.map(({ key, item, primary }) => {
                            const title = authFallback ? t(item.title) : item.title
                            const look = {
                                label: title,
                                style: primary ? 'borderedProminent' : 'bordered',
                                borderShape: 'capsule',
                                width: 'fill',
                                classNames: AUTH_BUTTON_CLASSES,
                            } as const
                            // As DropdownMenu runs its rows: a `modal` item opens its content (or link) in a
                            // modal, a `_blank` / `blank` one opens in a new tab, any other its page.
                            if (item.target === 'modal') {
                                const openModal = () => {
                                    close()
                                    if (item.content) openModalWithContent({ title, content: item.content })
                                    else openModalByUrl(item.link)
                                }
                                return <NeoButton key={key} {...look} onPress={openModal} />
                            }
                            const blank = item.target === '_blank' || item.target === 'blank'
                            return (
                                <NeoButtonLink
                                    key={key}
                                    {...look}
                                    href={item.link}
                                    target={blank ? '_blank' : undefined}
                                    asExternal={blank}
                                    onPress={close}
                                />
                            )
                        })}
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
