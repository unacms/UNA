import { View, Row } from 'app/design/view'
import { useCurrentUser } from 'app/context/user'
import { appSetting } from 'app/lib/util'
import Search from 'app/ui/molecules/sections/search'
import NotificationButton from 'app/ui/molecules/misc/notif'
import MenuAdd, { useMenuAddItems } from 'app/components/nav/menu-add'
import MenuAccount from 'app/components/nav/menu-account'
import MenuLauncher, { useMenuLauncherItems } from 'app/components/nav/menu-launcher'
import MenuHeaderNavigation from 'app/components/nav/menu-header-navigation'
import { OperatorAgentHeaderButton } from 'app/ui/molecules/system/operator-agent'
import { Platform } from 'react-native'
import { useMenuData } from 'app/context/menu-data'
import { hasAppDrawer } from 'app/context/app-sidebar'
import ToolbarLink, { tierButtonProps } from './toolbar-link'
import { useSectionActions, SectionAddButton, ExploreSearchButton } from './section-actions'
import { useScreenTier } from 'app/context/measure'

// A toolbar slot: its button, a placeholder while its data loads, or no slot at all.
const SLOT = { shown: 'shown', loading: 'loading', hidden: 'hidden' }

// A placeholder is the header's control height (44px) and round, as its buttons.
const PLACEHOLDER = {
    round: 'h-11 w-11 rounded-full bg-muted animate-pulse',
    // Around a labelled button (Log In, Sign Up), which gives it its width.
    labelled: 'rounded-full bg-muted animate-pulse',
}

/**
 * Holds a toolbar slot while its data loads. A labelled button is as wide as its label, in any language: pass the
 * button as `children` and it is drawn hidden inside the placeholder (not shown, not focusable, not read out), so
 * the slot has its final width from the start.
 */
function ToolbarPlaceholder({ children = null }) {
    if (!children) return <View aria-hidden data-neo-toolbar-placeholder className={PLACEHOLDER.round} />
    return (
        <View aria-hidden data-neo-toolbar-placeholder className={PLACEHOLDER.labelled}>
            <View className="invisible">{children}</View>
        </View>
    )
}

/** Whether a toolbar item is for this platform (`web` / `native` on the item; both unless it says otherwise). */
function isForPlatform(item, isWeb) {
    return (isWeb ? item.web : item.native) ?? true
}

export default function HeaderElement({ url, uri, pageData = null }) {
    const { currentUser } = useCurrentUser();
    // Phones: the header's end is the page's section actions, Search with the section's or context's scope and the
    // section's Add ("Add post"); elsewhere global search, which is Explore's field, and the site's Add menu.
    const isPhone = useScreenTier() === 'phone'
    const sectionActions = useSectionActions(pageData)
    const bSearch = appSetting('layout', 'search') == true;
    const bNotifs = appSetting('notifications', 'url') ? true : false;
    const isWeb = Platform.OS == 'web'
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
                if (isPhone && sectionActions.add) return SLOT.shown
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
        .map((item, index) => ({ item, index, slot: isForPlatform(item, isWeb) ? slotOf(item) : SLOT.hidden }))
        .filter(({ slot }) => slot !== SLOT.hidden)

    /** A slot's button (or menu). Style and size per side of `lg` come from `tierButtonProps`. */
    const renderTool = (item) => {
        switch (item.component) {
            case "search":
                if (isPhone && sectionActions.search)
                    return <Search scope={sectionActions.search} params={{ trigger: tierButtonProps(item) || {} }} />
                if (isPhone && appSetting('layout', 'search_explore') !== false)
                    return <ExploreSearchButton buttonProps={tierButtonProps(item)} />
                return <Search />
            case "launcher":
                return <MenuLauncher buttonProps={tierButtonProps(item)} />
            case "add":
                if (isPhone && sectionActions.add)
                    return <SectionAddButton add={sectionActions.add} buttonProps={tierButtonProps(item)} />
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
                // Messages, Log In, Sign Up or a project's own link (./toolbar-link.tsx).
                return <ToolbarLink item={item} uri={uri} />
            default:
                return null
        }
    }
    // While its data loads a slot holds a placeholder: round, or around the hidden labelled button it will show.
    const renderSlot = (item, slot) => {
        if (slot !== SLOT.loading) return renderTool(item)
        return <ToolbarPlaceholder>{item.props?.title ? renderTool(item) : null}</ToolbarPlaceholder>
    }

    // The buttons are 8px apart, as in UNA's site toolbar (Artificer menu_toolbar.html, `gap-2`); a slot's placeholder
    // is a child of the same row.
    return (
        <Row className="justify-end gap-2 items-center">
            {shownItems.map(({ item, index, slot }) => (
                <View key={index} className={item.className}>
                    {renderSlot(item, slot)}
                </View>
            ))}
        </Row>
    )
}