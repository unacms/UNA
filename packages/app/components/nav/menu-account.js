import { Row } from 'app/design/view'
import { Button } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user'
import { appSetting } from 'app/lib/util'
import { menuItemsByName, menuItemsByNameNew, getDataForMenu   } from 'app/lib/util'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { useTranslation } from 'react-i18next';
import Profile from 'app/ui/molecules/profile'
import ProfileSwitcher from 'app/components/elements/profile_switcher';
import { useState, useEffect, useMemo } from 'react';
import { Text } from 'app/design/typography'

export default function MenuAccount({ buttonProps, children }) {

    const { currentUser, setCurrentUser } = useCurrentUser();
    const [menuData, setMenuData] = useState(false);
    
    useEffect(() => {
        const fetchData = async () => {
            getDataForMenu({ object: 'sys_account_notifications', params: null }, setMenuData);
        };
        fetchData();
    }, []);

    const { t } = useTranslation();

    const menu_account_items = appSetting('layout', 'user_remote_config') ? menuItemsByNameNew('menu_post', menuData, currentUser) : menuItemsByName('', appSetting('menu_items', 'menu_account'), currentUser);
    let profile = null
    if (currentUser) {
        let dUser = Object.assign({}, currentUser)
        dUser.url_avatar = dUser.avatar
        dUser.url = appSetting('dashboard', 'url')
        profile = <Profile {...dUser} displayType="unit_wo_info" displaySize="base" />
    }

    buttonProps = buttonProps || {
        tooltip: t("Dashboard"),
        variant: "secondary",
        rounded: true,
        padding: '0px',
        startDecorator: profile,
        onPress: () => { },
    };

    if ((menu_account_items.length == 0  && menuData) || !profile)
        return <></>;

    const trigger = children ||  <Button
        {...buttonProps}
    />
    
    return (

        <DropdownMenu
            items={menu_account_items.map(
                (item, index) => {
                    let sTitle = t(item.title);
                    if (item.link == '{switch_profile}') {
                        sTitle = (
                            <ProfileSwitcher hideTitle={true} >
                                <Row className='items-center justify-center h-6'>
                                    <Profile
                                        {...currentUser}
                                        url_avatar={currentUser.avatar}
                                        displayType="unit_wo_info"
                                        displaySize="xs"
                                    />
                                    <Text className="pl-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-200 ">
                                        {sTitle}
                                    </Text>
                                </Row>
                            </ProfileSwitcher>)
                    }
                    return (
                        {
                            id: 'menu-' + index,
                            link: item.link,
                            title: sTitle,
                            icon: item.icon
                        }
                    )
                }
            )}
        >
            {trigger}
        </DropdownMenu>

    );
}