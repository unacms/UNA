import Link from 'app/ui/atoms/link'
import { View, Row } from 'app/design/view'
import { Button } from 'app/design/controls'
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
        <Row className="justify-end gap-3 items-center">
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
                                return bNotifs ? <NotificationButton uri={uri} /> : null
                            case "account":
                                return <MenuAccount />
                            case "menu_navigation":
                                return <MenuHeaderNavigation {...(item.props || {})} />
                            case "link":
                                if (item.href === '{messenger}') {
                                    const messengerHref = appSetting('messenger', 'url');
                                    return (
                                        <Button
                                            {...(item.props || {})}
                                            addon={{
                                                variant: "primary",
                                                text: currentUser?.counters?.bx_messenger_new_messages,
                                                hideZero: true,
                                            }}
                                            variant={isDesktop ? 'secondary' : 'text'}
                                            size={isDesktop ? 'base' : 'base'}
                                            pressed={appSetting('messenger', 'url') === '/' + uri}
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
                                    <Link 
                                        {...(item.target ? { target: item.target } : {})} 
                                        href={item.href == '{messenger}' ? appSetting('messenger', 'url') : item.href}
                                        alt={item.alt || item.title || (item.props?.title)}
                                    >
                                        <Button {...(item.props || {})}
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
                                    </Link>
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