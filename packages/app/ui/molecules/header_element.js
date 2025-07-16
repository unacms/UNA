import { memo, useState, useRef, useEffect } from 'react'
import { useWindowDimensions } from 'react-native'
import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'
import { Button, ButtonRef } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user'
import { appSetting, LAYOUT_BREAKPOINTS } from 'app/lib/util'
import Search from 'app/ui/molecules/search'
import NotificationButton from 'app/ui/molecules/notif'
import { useTranslation } from 'react-i18next'
import MenuAdd from 'app/components/nav/menu-add'
import MenuAccount from 'app/components/nav/menu-account'
import MenuLauncher from 'app/components/nav/menu-launcher'


export default function HeaderElement({ mode }) {

    const { currentUser } = useCurrentUser();
    const { t } = useTranslation();
    const bSearch = appSetting('layout', 'search') == true;
    const bMessenger = appSetting('messenger', 'url') ? true : false;
    const bNotifs = appSetting('notifications', 'url') ? true : false;

    const toolbarConfig = appSetting('header_toolbar', 'hor')
    const itemsToRender = currentUser
        ? toolbarConfig?.loggedIn
        : toolbarConfig?.loggedOut

    if (mode == 'small') {
        return null
    }


    const components = {
        search: bSearch ? <Search /> : null,
        launcher: <MenuLauncher />,
        add: <MenuAdd />,
        notifications: bNotifs ? <NotificationButton /> : null,
        messenger: bMessenger ? (
            <Link href={appSetting('messenger', 'url')} alt={t('Messenger')}>
                <Button
                    tooltip={t('Messenger')}
                    variant="secondary"
                    rounded
                    startDecorator="MessageSquare"
                    id="m2"
                    size="base"
                    hitSlop={4}
                    ring="p-1"
                    addon={{
                        variant: 'primary',
                        text: currentUser?.counters?.bx_messenger_new_messages,
                        hideZero: true,
                    }}
                />
            </Link>
        ) : null,
        account: currentUser ? <MenuAccount /> : null,
        login: !currentUser ? (
            <Link href="/login">
                <ButtonRef
                    variant="secondary"
                    tooltip="Account"
                    rounded
                    size="base"
                    hitSlop={4}
                    aria-label="Account"
                    alt={t('Account')}
                    ring="p-1"
                    startDecorator="UserRound"
                />
            </Link>
        ) : null,
    }


    return (
        <Row className="justify-end gap-x-0.5 items-center">
            {itemsToRender?.map((item, index) => {
                const Component = components[item.component]
                if (!Component) return null
                return (
                    <View key={index} className={item.className}>
                        {Component}
                    </View>
                )
            })}
        </Row>
    )
}