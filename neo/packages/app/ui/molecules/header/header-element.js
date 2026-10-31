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

export default function HeaderElement({ url, uri }) {
    const { t } = useTranslation();
    const { currentUser } = useCurrentUser();
    const router = useRouter();
    const bSearch = appSetting('layout', 'search') == true;
    const bNotifs = appSetting('notifications', 'url') ? true : false;
    const isDesktop = useIsDesktop();
    const isWeb = Platform.OS == 'web'
    const toolbarNeoButtonDefaults = getHeaderToolbarNeoButtonDefaults(isDesktop);
    const toolbarConfig = appSetting('header_toolbar', 'hor')
    const itemsToRender = (currentUser
        ? toolbarConfig?.loggedIn
        : toolbarConfig?.loggedOut) || []
    const has = (component) => itemsToRender.some(item => item.component === component)

    // Notifications and Messages show while UNA's member toolbar has them for this viewer (`toolbar`, the names
    // of its items), so a site without the module has no button. Without the list (an older UNA) they show.
    const unaToolbar = currentUser?.toolbar
    const inUnaToolbar = (name) => !Array.isArray(unaToolbar) || unaToolbar.includes(name)
    const addMenu = useMenuAddItems(has('add'))
    const launcherMenu = useMenuLauncherItems(has('launcher'))

    // A tool with nothing to show gets no slot: an empty one would still take the row's gap.
    const isShown = (item) => {
        switch (item.component) {
            case "search":
                return bSearch
            case "launcher":
                return !launcherMenu.empty
            case "add":
                return !addMenu.empty
            case "notifications":
                return bNotifs && inUnaToolbar('notifications-preview')
            case "link":
                return item.href !== '{messenger}' || inUnaToolbar('notifications-messenger')
            case "account":
            case "menu_navigation":
                return true
            default:
                return false
        }
    }
    const shownItems = itemsToRender
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => ((isWeb ? item.web : item.native) ?? true) && isShown(item))

    return (
        <Row className="justify-end gap-3 items-center">
            {shownItems.map(({ item, index }) => (
                <View key={index} className={item.className}>
                    {(() => {
                        switch (item.component) {
                            case "search":
                                return <Search />
                            case "launcher":
                                return <MenuLauncher buttonProps={item.props} />
                            case "add":
                                return <MenuAdd buttonProps={item.props} />
                            case "notifications":
                                return <NotificationButton uri={uri} buttonProps={item.props} />
                            case "account":
                                return (
                                    <Row className="items-center gap-3">
                                        <OperatorAgentHeaderButton />
                                        <MenuAccount buttonProps={item.props} />
                                    </Row>
                                )
                            case "menu_navigation":
                                return <MenuHeaderNavigation {...(item.props || {})} />
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
                                    return (
                                        <NeoButtonLink
                                            {...getHeaderToolbarNeoButtonDefaults(isDesktop, { primary })}
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