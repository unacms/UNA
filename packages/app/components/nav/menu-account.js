import { Row, Pressable } from 'app/design/view'
import { Button } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user'
import { appSetting } from 'app/lib/util'
import { menuItemsByName, menuItemsByNameNew, getDataForMenu } from 'app/lib/util'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { useTranslation } from 'react-i18next';
import Profile from 'app/ui/molecules/profile'
import ProfileSwitcher from 'app/components/elements/profile_switcher';
import { useState, useEffect, useMemo } from 'react';
import { Text } from 'app/design/typography'
import { fetcher } from 'app/lib/fetcher';
import RadioButton from 'app/ui/atoms/radiobutton';

export default function MenuAccount({ buttonProps, children }) {

    const { currentUser, setCurrentUser } = useCurrentUser();
    const [menuData, setMenuData] = useState(false);
    const [data, setData] = useState(false)

    const fetchDataPr = async () => {
        const sResponse = await fetcher('/api.php?r=system/account_profile_switcher/TemplServiceProfiles');
        if (sResponse && sResponse.data && sResponse.data[0] && sResponse.data[0].data)
            setData(sResponse.data[0].data);
    };

    useEffect(() => {
        const fetchData = async () => {
            getDataForMenu({ object: 'sys_account_notifications', params: null }, setMenuData);
            fetchDataPr();

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

    if ((menu_account_items.length == 0 && menuData) || !profile)
        return <></>;

    const trigger = children || <Button
        {...buttonProps}
    />

    const profileList = data?.profiles?.map(profile => ({
        ...profile,
        link: "{switch_profile}" // добавляем новое поле
    })) || [];//?.filter((item) => (item.id != currentUser.id));

    const updatedMenu = menu_account_items.flatMap(item =>
        item.link === "{switch_profile}" ? (profileList ? [{ ...currentUser, link: "{switch_profile}" }, ...profileList] : []) : item
    );

    // Find the last switch_profile index
    const lastSwitchProfileIndex = updatedMenu.reduce((lastIndex, item, index) => 
        item.link === '{switch_profile}' ? index : lastIndex, -1);

    const handleSwitch = async (id) => {
        const result = await fetcher('/api.php?r=system/switch_profile/TemplServiceAccount&params[]=' + id);
        setCurrentUser(result.data);
        fetchDataPr();
    };

    return (
        <DropdownMenu
            items={updatedMenu.map(
                (item, index) => {
                    let sTitle = t(item.title);
                    if (item.link == '{switch_profile}') {
                        sTitle = <Pressable className="w-full" onPress={() => handleSwitch(item.id)}><Row key={index} className="items-center justify-between gap-x-3">
                            <Row className="items-center flex-auto gap-x-3">
                            <Profile
                                {...item}
                                url_avatar={item.avatar}
                                displayType="unit_wo_info"
                                displaySize="sm"
                            />
                            <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                                {item.display_name}
                            </Text>
                            </Row>
                            <RadioButton
                                rb_obly={true}
                                value={''}
                                status={item.id == currentUser.id ? 'checked' : 'unchecked'}
                                title={''}
                            />
                        </Row></Pressable>
                    }
                    return (
                        {
                            id: 'menu-' + index,
                            link: item.link.includes("://") ? item.link : '/' + item.link,
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