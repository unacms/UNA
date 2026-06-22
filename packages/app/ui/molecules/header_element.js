import Link from 'app/ui/atoms/link'
import { View, Row } from 'app/design/view'
import { NeoButton , ButtonLink, NeoButtonLink } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user'
import { appSetting } from 'app/lib/util'
import Search from 'app/ui/molecules/search'
import NotificationButton from 'app/ui/molecules/notif'
import MenuAdd from 'app/components/nav/menu-add'
import MenuAccount from 'app/components/nav/menu-account'
import MenuLauncher from 'app/components/nav/menu-launcher'
import MenuHeaderNavigation from 'app/components/nav/menu-header-navigation'
import { useIsDesktop } from 'app/context/measure';
import { Platform } from 'react-native'
import { useRouter } from 'app/lib/hooks/router'

export default function HeaderElement({ mode, url, uri }) {
    const { currentUser } = useCurrentUser();
    const router = useRouter();
    const bSearch = appSetting('layout', 'search') == true;
    const bNotifs = appSetting('notifications', 'url') ? true : false;
    const isDesktop = useIsDesktop();
    const isWeb = Platform.OS == 'web'
    const toolbarConfig = appSetting('header_toolbar', 'hor')
    const itemsToRender = currentUser
        ? toolbarConfig?.loggedIn
        : toolbarConfig?.loggedOut

    return (
        <Row className="justify-end gap-2 items-center">
            {itemsToRender?.filter(item => (isWeb ? item.web != false : item.native != false)).map((item, index) => (
                <View key={index} className={item.className}>
                    {(() => {
                        switch (item.component) {
                            case "search":
                                return bSearch ? <Search /> : null
                            case "launcher":
                                return <MenuLauncher />
                            case "add":
                                return <MenuAdd />
                            case "notifications":
                                return bNotifs ? <NotificationButton uri={uri} buttonProps={item.props} /> : null
                            case "account":
                                return <MenuAccount />
                            case "menu_navigation":
                                return <MenuHeaderNavigation {...(item.props || {})} />
                            case "link":
                                if (item.props?.neoButton) {
                                    const { neoButton, ...neoButtonProps } = item.props;
                                    const isMessenger = item.href === '{messenger}';
                                    return (
                                        <NeoButtonLink
                                            style={isDesktop ? 'glass' : 'borderless'}
                                            controlSize={isDesktop ? 'regular' : 'small'}
                                            borderShape="circle"
                                            {...neoButtonProps}
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
                                    return (
                                        <NeoButton
                                            addon={{
                                                variant: "primary",
                                                text: currentUser?.counters?.bx_messenger_new_messages,
                                                hideZero: true,
                                            }}
                                            style={isDesktop ? 'glass' : 'borderless'}
                                            controlSize={isDesktop ? 'regular' : 'small'}
                                            borderShape="circle"
                                            image="MessageSquare"
                                            selected={appSetting('messenger', 'url') === '/' + uri}
                                            role="link"
                                            alt={item.alt || item.title || (item.props?.title)}
                                            onPress={(event) => {
                                                item.props?.onPress?.(event);
                                                if (messengerHref) router?.push?.(messengerHref);
                                            }}
                                        />
                                    )
                                }
                                return (
                                        <ButtonLink {...(item.props || {})}
                                        {...(item.target ? { target: item.target } : {})} 
                                        href={item.href == '{messenger}' ? appSetting('messenger', 'url') : item.href}
                                            {...(item.href === '{messenger}'
                                                ? {
                                                    addon: {
                                                        variant: "primary",
                                                        text: currentUser?.counters?.bx_messenger_new_messages,
                                                        hideZero: true,
                                                    },
                                                    variant: isDesktop ? 'secondary' : 'text',
                                                    size: isDesktop ? 'base' : 'base',
                                                    pressed : appSetting('messenger', 'url') === '/' + uri
                                                }
                                                : {
                                                    variant: item.props.variant ? item.props.variant :  isDesktop ? 'secondary' : 'text',


                                                })}
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