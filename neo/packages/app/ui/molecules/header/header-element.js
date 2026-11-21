import { View, Row } from 'app/design/view'
import { NeoButton, NeoButtonLink, legacyToNeoButtonProps } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user'
import { appSetting, getHeaderToolbarNeoButtonDefaults } from 'app/lib/util'
import Search from 'app/ui/molecules/sections/search'
import NotificationButton from 'app/ui/molecules/misc/notif'
import MenuAdd, { useMenuAddItems } from 'app/components/nav/menu-add'
import MenuAccount from 'app/components/nav/menu-account'
import MenuLauncher, { useMenuLauncherItems } from 'app/components/nav/menu-launcher'
import MenuHeaderNavigation from 'app/components/nav/menu-header-navigation'
import { OperatorAgentHeaderButton } from 'app/ui/molecules/system/operator-agent'
import { useIsDesktop } from 'app/context/measure';
import { Platform } from 'react-native'
import { useRouter } from 'app/lib/hooks/router'
import { useTranslation } from 'react-i18next'
import { useMenuData } from 'app/context/menu-data'
import { hasAppDrawer } from 'app/context/app-sidebar'

// Web: the side of the desktop breakpoint a toolbar item shows on, read from its classes, so its
// buttons take that tier's style in the server HTML (rendered for desktop) and keep it after
// hydration. 'mobile': hidden from `lg` (or from `sm`); 'desktop': shown only from `lg`; else 'both'.
// Only when the desktop tier starts at `lg` (`layout.tablet_mode_from`), as the classes assume.
const cssTiers = Platform.OS === 'web' && (appSetting('layout', 'tablet_mode_from') || 'lg') === 'lg'
function getItemTier(className) {
    if (!cssTiers) return 'both'
    const tokens = String(className || '').split(/\s+/)
    if (tokens.some((c) => /(^|:)(sm|lg):hidden$/.test(c))) return 'mobile'
    if (tokens.includes('hidden') && tokens.some((c) => /(^|:)lg:(block|flex)$/.test(c))
        && !tokens.some((c) => /(^|:)(sm|md):(block|flex)$/.test(c))) return 'desktop'
    return 'both'
}

// A toolbar slot: its button, a placeholder while its data loads, or no slot at all.
const SLOT = { shown: 'shown', loading: 'loading', hidden: 'hidden' }

// The header's control height (44px), round as its buttons; a labelled button (Log In, Sign Up) is a capsule.
const PLACEHOLDER = {
    round: 'h-11 w-11 rounded-full bg-muted animate-pulse',
    labelled: 'h-11 w-20 rounded-full bg-muted animate-pulse',
}

/** Holds a toolbar slot while its data loads. */
function ToolbarPlaceholder({ labelled = false }) {
    return <View aria-hidden data-neo-toolbar-placeholder className={labelled ? PLACEHOLDER.labelled : PLACEHOLDER.round} />
}

export default function HeaderElement({ url, uri }) {
    const { t } = useTranslation();
    const { currentUser } = useCurrentUser();
    const router = useRouter();
    const bSearch = appSetting('layout', 'search') == true;
    const bNotifs = appSetting('notifications', 'url') ? true : false;
    const isDesktop = useIsDesktop();
    const isWeb = Platform.OS == 'web'
    const toolbarNeoButtonDefaults = getHeaderToolbarNeoButtonDefaults(isDesktop);
    // Style and size for an item that shows on one side of `lg` only; the item's own props win.
    const tierButtonProps = (item) => {
        const tier = getItemTier(item.className)
        return tier === 'both' ? item.props : { ...getHeaderToolbarNeoButtonDefaults(tier === 'desktop'), ...item.props }
    }
    const toolbarConfig = appSetting('header_toolbar', 'hor')
    const itemsToRender = (currentUser
        ? toolbarConfig?.loggedIn
        : toolbarConfig?.loggedOut) || []
    const has = (component) => itemsToRender.some(item => item.component === component)

    // Notifications, Messages and Search show while UNA's member toolbar has them for this viewer (`toolbar`, the
    // names of its items), so a site without the module has no button. Without the list (an older UNA) they show.
    // Guests have no `toolbar`: their tools (Search) come from that menu itself, each shown once UNA says it is
    // "Active (for App)" (Studio > Navigation), so switching it off there hides it in the apps too.
    const unaToolbar = currentUser?.toolbar
    const inUnaToolbar = (name) => !Array.isArray(unaToolbar) || unaToolbar.includes(name)
    // A web guest is `null` on the server and through hydration (seeded only in a layout effect), and
    // `false` afterwards; the guest toolbar is server-seeded, so fetch it for both so Search is in the
    // server HTML and doesn't pop in on hydration. A member is an object here and never reaches this.
    // Log In and Sign Up (`una: <item name>`) follow it the same way: the site's guest header is that menu.
    const followsGuestToolbar = has('search') || itemsToRender.some((item) => !!item.una)
    const { menuData: guestToolbar, isFetched: guestToolbarFetched } = useMenuData(
        !currentUser && followsGuestToolbar ? appSetting('menu_items', 'objects', 'toolbar') : null
    )
    const inGuestToolbar = (name) => Array.isArray(guestToolbar?.items) && guestToolbar.items.some((item) => item?.name === name)
    // The page brings a visitor's toolbar along; it loads here only after a change of viewer without a page load.
    const guestToolbarLoading = !currentUser && followsGuestToolbar && !guestToolbar && !guestToolbarFetched
    const guestSlot = (name) => {
        if (guestToolbarLoading) return isWeb ? SLOT.loading : SLOT.hidden
        return inGuestToolbar(name) ? SLOT.shown : SLOT.hidden
    }
    const addMenu = useMenuAddItems(has('add'))
    const launcherMenu = useMenuLauncherItems(has('launcher'))
    const menuSlot = (menu) => {
        if (menu.loading) return isWeb ? SLOT.loading : SLOT.shown
        return menu.empty ? SLOT.hidden : SLOT.shown
    }
    const shownIf = (condition) => (condition ? SLOT.shown : SLOT.hidden)

    // A tool with nothing to show gets no slot: an empty one would still take the row's gap. On the web one whose
    // data is still loading keeps its slot with a placeholder the size of its button, so the toolbar is as wide from
    // its first paint as it will be (the main menu beside it fits its tabs in the room the toolbar leaves) and gives
    // the slot up only when the data says it is empty. Native is as it was: a menu's button shows while its menu
    // loads, a visitor's tools once their toolbar has.
    const slotOf = (item) => {
        switch (item.component) {
            case "search":
                if (!bSearch) return SLOT.hidden
                return currentUser ? shownIf(inUnaToolbar('search')) : guestSlot('search')
            case "launcher":
                return menuSlot(launcherMenu)
            case "add":
                return menuSlot(addMenu)
            case "notifications":
                return shownIf(bNotifs && inUnaToolbar('notifications-preview'))
            case "link":
                if (item.una && !currentUser) return guestSlot(item.una)
                return shownIf(item.href !== '{messenger}' || inUnaToolbar('notifications-messenger'))
            case "account":
                return SLOT.shown
            case "menu_navigation":
                // Native: the drawer has the menu's place (Log In, Sign Up and the links), opened from the header's start.
                return shownIf(isWeb || !hasAppDrawer(currentUser))
            default:
                return SLOT.hidden
        }
    }
    const shownItems = itemsToRender
        .map((item, index) => ({ item, index, slot: ((isWeb ? item.web : item.native) ?? true) ? slotOf(item) : SLOT.hidden }))
        .filter(({ slot }) => slot !== SLOT.hidden)

    // The buttons are 8px apart, as in UNA's site toolbar (Artificer menu_toolbar.html, `gap-2`); a slot's placeholder
    // is a child of the same row.
    return (
        <Row className="justify-end gap-2 items-center">
            {shownItems.map(({ item, index, slot }) => (
                <View key={index} className={item.className}>
                    {(() => {
                        if (slot === SLOT.loading) return <ToolbarPlaceholder labelled={!!item.props?.title} />
                        switch (item.component) {
                            case "search":
                                return <Search />
                            case "launcher":
                                return <MenuLauncher buttonProps={tierButtonProps(item)} />
                            case "add":
                                return <MenuAdd buttonProps={tierButtonProps(item)} />
                            case "notifications":
                                return <NotificationButton uri={uri} buttonProps={tierButtonProps(item)} />
                            case "account":
                                return (
                                    <Row className="items-center gap-2">
                                        <OperatorAgentHeaderButton />
                                        <MenuAccount buttonProps={tierButtonProps(item)} />
                                    </Row>
                                )
                            case "menu_navigation":
                                return <MenuHeaderNavigation {...(tierButtonProps(item) || {})} url={url} uri={uri} />
                            case "link":
                                if (item.props?.neoButton) {
                                    const { neoButton, primary, ...neoButtonProps } = item.props;
                                    const isMessenger = item.href === '{messenger}';
                                    // Visual label only from props.title. Item title is a11y
                                    // metadata — using it as label turns icon-only circles
                                    // (mobile Log In) into padded labelled buttons.
                                    const translatedTitle = neoButtonProps.title
                                        ? t(neoButtonProps.title)
                                        : undefined;
                                    const translatedA11y = neoButtonProps.accessibilityLabel
                                        ? t(neoButtonProps.accessibilityLabel)
                                        : (item.title ? t(item.title) : undefined);
                                    const renderLink = (desktop) => (
                                        <NeoButtonLink
                                            {...getHeaderToolbarNeoButtonDefaults(desktop, { primary })}
                                            borderShape="circle"
                                            {...neoButtonProps}
                                            {...(translatedTitle ? { title: translatedTitle, label: translatedTitle } : {})}
                                            {...(translatedA11y ? { accessibilityLabel: translatedA11y } : {})}
                                            {...(item.target ? { target: item.target } : {})}
                                            href={isMessenger ? appSetting('messenger', 'url') : item.href}
                                            {...(isMessenger
                                                ? {
                                                    image: neoButtonProps.image ?? 'MessageSquare',
                                                    addon: {
                                                        variant: "primary",
                                                        text: currentUser?.counters?.bx_messenger_new_messages,
                                                        hideZero: true,
                                                    },
                                                    selected: appSetting('messenger', 'url') === '/' + uri,
                                                }
                                                : {})}
                                        />
                                    )
                                    const tier = getItemTier(item.className)
                                    if (tier !== 'both') return renderLink(tier === 'desktop')
                                    // Shown on both sides of `lg`: one copy per tier, picked with classes.
                                    if (cssTiers) {
                                        return (
                                            <>
                                                <View className="lg:hidden">{renderLink(false)}</View>
                                                <View className="hidden lg:flex">{renderLink(true)}</View>
                                            </>
                                        )
                                    }
                                    return renderLink(isDesktop)
                                }

                                if (item.href === '{messenger}') {
                                    const messengerHref = appSetting('messenger', 'url');
                                    const messengerLabel = item.alt || item.title || item.props?.title;
                                    return (
                                        <NeoButton
                                            {...toolbarNeoButtonDefaults}
                                            addon={{
                                                variant: "primary",
                                                text: currentUser?.counters?.bx_messenger_new_messages,
                                                hideZero: true,
                                            }}
                                            borderShape="circle"
                                            image="MessageSquare"
                                            selected={appSetting('messenger', 'url') === '/' + uri}
                                            role="link"
                                            alt={messengerLabel ? t(messengerLabel) : undefined}
                                            accessibilityLabel={messengerLabel ? t(messengerLabel) : undefined}
                                            onPress={(event) => {
                                                item.props?.onPress?.(event);
                                                if (messengerHref) router?.push?.(messengerHref);
                                            }}
                                        />
                                    )
                                }
                                const linkTitle = item.props?.title || item.title;
                                return (
                                        <NeoButtonLink
                                            {...legacyToNeoButtonProps({
                                                ...(item.props || {}),
                                                ...(linkTitle ? { title: t(linkTitle) } : {}),
                                                ...(item.href === '{messenger}'
                                                    ? {
                                                        addon: {
                                                            variant: "primary",
                                                            text: currentUser?.counters?.bx_messenger_new_messages,
                                                            hideZero: true,
                                                        },
                                                        variant: isDesktop ? 'secondary' : 'text',
                                                        size: 'base',
                                                        pressed: appSetting('messenger', 'url') === '/' + uri,
                                                    }
                                                    : {
                                                        variant: item.props?.variant || (isDesktop ? 'secondary' : 'text'),
                                                    }),
                                            })}
                                            {...(item.target ? { target: item.target } : {})}
                                            href={item.href == '{messenger}' ? appSetting('messenger', 'url') : item.href}
                                        />
                                )
                            default:
                                return null
                        }
                    })()}
                </View>
            ))}
        </Row>
    )
}