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


export default function HeaderElement({ mode }) {

    const { currentUser } = useCurrentUser();
    const bSearch = appSetting('layout', 'search') == true;
    const bMessenger = appSetting('messenger', 'url') ? true : false;
    const bNotifs = appSetting('notifications', 'url') ? true : false;

    const toolbarConfig = appSetting('header_toolbar', 'hor')
    const itemsToRender = currentUser
        ? toolbarConfig?.loggedIn
        : toolbarConfig?.loggedOut

    return (
        <Row className="justify-end gap-2 items-center">
            {itemsToRender?.map((item, index) => (
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
                                return bNotifs ? <NotificationButton /> : null
                            case "account":
                                return <MenuAccount />
                            case "link":
                                return (
                                    <Link href={item.href == '{messenger}' ? bMessenger : item.href}>
                                        <Button {...(item.props || {})}
                                            {...(item.href === '{messenger}'
                                                ? {
                                                    addon: {
                                                        variant: "primary",
                                                        text: currentUser?.counters?.bx_messenger_new_messages,
                                                        hideZero: true,
                                                    },
                                                }
                                                : {})}
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