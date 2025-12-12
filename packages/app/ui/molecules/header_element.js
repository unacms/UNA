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
import { useIsDesktop } from 'app/context/measure';
import { Platform } from 'react-native'

export default function HeaderElement({ mode, url, uri }) {
    const { currentUser } = useCurrentUser();
    const bSearch = appSetting('layout', 'search') == true;
    const bNotifs = appSetting('notifications', 'url') ? true : false;
    const isDesktop = useIsDesktop();
    const isWeb = Platform.OS == 'web'
    const toolbarConfig = appSetting('header_toolbar', 'hor')
    const itemsToRender = currentUser
        ? toolbarConfig?.loggedIn
        : toolbarConfig?.loggedOut

    return (
        <Row className="justify-end gap-1 lg:gap-2 items-center px-2 ">
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
                            case "link":
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