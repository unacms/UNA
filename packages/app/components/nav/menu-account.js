import { Row, Pressable, View } from 'app/design/view'
import { Button } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user'
import { appSetting, LAYOUT_BREAKPOINTS } from 'app/lib/util'
import {
    menuItemsByName,
    menuItemsByNameNew,
    getDataForMenu,
} from 'app/lib/util'
import DropdownMenu from 'app/ui/atoms/dropdown-menu'
import { useTranslation } from 'react-i18next'
import Profile from 'app/ui/molecules/profile'
import ProfileSwitcher from 'app/components/elements/profile_switcher'
import { useState, useEffect, useRef } from 'react'
import { Text } from 'app/design/typography'
import { fetcher } from 'app/lib/fetcher'
import RadioButton from 'app/ui/atoms/radiobutton'
import Redirect from 'app/ui/atoms/redirect'
import MenuFooter from 'app/components/nav/menu-footer'
import { useIsDesktop } from 'app/context/measure';

export default function MenuAccount({ buttonProps, children }) {
    const redirectdRef = useRef()
    const { currentUser, setCurrentUser } = useCurrentUser()
    const [menuData, setMenuData] = useState(false)
    const [menuData1, setMenuData1] = useState(false)
    const [data, setData] = useState(false)
    const isDesktop = useIsDesktop();

    const fetchDataPr = async () => {
        const sResponse = await fetcher(
            '/api.php?r=system/account_profile_switcher/TemplServiceProfiles'
        )
        if (
            sResponse &&
            sResponse.data &&
            sResponse.data[0] &&
            sResponse.data[0].data
        )
            setData(sResponse.data[0].data)
    }

    useEffect(() => {
        const fetchData = async () => {
            getDataForMenu(
                {
                    object: appSetting('menu_items', 'objects', 'account'),
                    params: null,
                },
                setMenuData
            )
            getDataForMenu(
                {
                    object: appSetting('menu_items', 'objects', 'footer'),
                    params: null,
                },
                setMenuData1
            )
            fetchDataPr()
        }
        fetchData()
    }, [])

    const { t } = useTranslation()

    const menu_account_items = appSetting('layout', 'user_remote_config')
        ? menuItemsByNameNew('menu_post', menuData, currentUser)
        : menuItemsByName(
            '',
            appSetting('menu_items', 'menu_account'),
            currentUser
        )

    const menu_footer_items = appSetting('layout', 'user_remote_config')
        ? menuItemsByNameNew('menu_post', menuData1, currentUser)
        : menuItemsByName(
            '',
            appSetting('menu_items', 'menu_footer'),
            currentUser
        )

    let profile = null
    if (currentUser) {
        let dUser = Object.assign({}, currentUser)
        dUser.url_avatar = dUser.avatar
        dUser.url = ''
        profile = (
            <Profile {...dUser} displayType="unit_wo_info" displaySize="base" />
        )
    }

    const defaultButtonProps = {
        tooltip: t('Dashboard'),
        variant: isDesktop ? 'secondary' : 'text',
        rounded: true,
        padding: '0px',
        startDecorator: profile,
        size: isDesktop ? 'base' : 'base',
    }

    buttonProps = { ...defaultButtonProps, ...(buttonProps || {}) }

    if ((menu_account_items.length == 0 && menuData) || !profile) return <></>

    const trigger = children || <Button {...buttonProps} />

    let profileList =
        data?.profiles
            ?.map((profile) => ({
                ...profile,
                link: '{switch_profile}',
            }))
            .slice(0, 3) || []

    if (data?.profiles?.length > 3) {
        profileList = [
            ...profileList,
            { link: '{separator}' },
            { link: '{switch_profile_selector}' },
        ]
    }

    const updatedMenu = menu_account_items.flatMap((item) =>
        item.link === '{switch_profile}'
            ? profileList
                ? [
                    { ...currentUser, link: '{switch_profile}' },
                    { link: '{separator}' },
                    ...profileList,
                    { link: '{separator}' },
                ]
                : []
            : item
    )

    const handleSwitch = async (id) => {
        if (id != currentUser.id) {
            const result = await fetcher(
                '/api.php?r=system/switch_profile/TemplServiceAccount&params[]=' +
                id
            )
            setCurrentUser(result.data)
            redirectdRef.current.redirect('/')
        } else {
            redirectdRef.current.redirect(currentUser.url)
        }
    }



    return (
        <>
            <Redirect ref={redirectdRef} />
            <DropdownMenu
                items={updatedMenu.map((item, index) => {
                    let sTitle = t(item.title)
                    let sType = ''
                    if (item.link == '{switch_profile}') {
                        sTitle = (
                            <Pressable
                                className="w-full"
                                onPress={() => handleSwitch(item.id)}
                            >
                                <Row
                                    key={index}
                                    className="items-center justify-between gap-x-3 w-full px-2 py-1.5 h-12 web:hover:bg-muted/60 rounded-lg"
                                >
                                    <Row className="items-center flex-auto">
                                        
                                            <Profile
                                                {...item}
                                                url_avatar={item.avatar}
                                                displayType="unit_wo_info"
                                                displaySize="sm"
                                            />
                                        
                                        <Text className="text-sm leading-8 px-1.5 font-medium text-neutral-700 dark:text-neutral-200 whitespace-nowrap">
                                            {item.display_name}
                                        </Text>
                                    </Row>
                                    <RadioButton
                                        rb_obly={true}
                                        value={''}
                                        status={
                                            item.id == currentUser.id
                                                ? 'checked'
                                                : 'unchecked'
                                        }
                                        title={''}
                                    />
                                </Row>
                            </Pressable>
                        )
                    }
                    if (item.link == '{separator}') {
                        sTitle = (
                            <Row className="items-center flex-auto my-1 sm:border-t border-border/60"></Row>
                        )
                        sType = 'separator'
                    }
                    if (item.link == '{switch_profile_selector}') {
                        sTitle = (
                            <Row className="w-full items-center flex-auto my-1">
                                <ProfileSwitcher className="w-full" hideTitle={true}>
                                    <Button
                                        variant="secondary"
                                        fullWidth
                                        align="center"
                                        solid
                                        size="sm"

                                        startDecorator="CircleUserRound"
                                        title={t('See all profiles')}
                                    />
                                </ProfileSwitcher>
                            </Row>
                        )
                        sType = 'separator'
                    }
                    return {
                        id: 'menu-' + index,
                        link: item.link.includes('://')
                            ? item.link
                            : item.link.startsWith('/')
                                ? item.link
                                : '/' + item.link,
                        title: sTitle,
                        type: sType,
                        icon: item.icon,
                    }
                })}
                footer={
                    menu_footer_items.length > 0 ? (
                        <MenuFooter
                            cntClasses="flex w-full items-center border-t border-border/60 justify-center flex-row gap-x-2 gap-y-1 p-2 pb-1 mt-1 max-w-64"
                            variant="ghost"
                            size="sm"
                            itemClassName="text-xs p-1 text-nowrap"
                            menu_items={menu_footer_items}
                        />
                    ) : null
                }
            >
                {trigger}
            </DropdownMenu>
        </>
    )
}
