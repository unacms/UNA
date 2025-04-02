import { Row, Pressable, View } from 'app/design/view'
import { Button } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user'
import { appSetting } from 'app/lib/util'
import { menuItemsByName, menuItemsByNameNew, getDataForMenu } from 'app/lib/util'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { useTranslation } from 'react-i18next';
import Profile from 'app/ui/molecules/profile'
import ProfileSwitcher from 'app/components/elements/profile_switcher';
import { useState, useEffect, useRef } from 'react';
import { Text } from 'app/design/typography'
import { fetcher } from 'app/lib/fetcher';
import RadioButton from 'app/ui/atoms/radiobutton';
import Redirect from 'app/ui/atoms/redirect'

export default function MenuAccount({ buttonProps, children }) {
    const redirectdRef = useRef();
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
            getDataForMenu({ object: appSetting('menu_items', 'objects', 'account'), params: null }, setMenuData);
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
        
        startDecorator: profile,
        onPress: () => { },
    };

    if ((menu_account_items.length == 0 && menuData) || !profile)
        return <></>;

    const trigger = children || <Button
        {...buttonProps}
    />

    let profileList = data?.profiles?.map(profile => ({
        ...profile,
        link: "{switch_profile}" 
    })).slice(0, 3) || [];

    if (data?.profiles?.length > 3) {
        profileList = [...profileList, {  link: "{separator}" }, { link: "{switch_profile_selector}" }]
    }

    const updatedMenu = menu_account_items.flatMap(item =>
        item.link === "{switch_profile}" ? (profileList ? [
            { ...currentUser, link: "{switch_profile}" },
            {  link: "{separator}" }, 
            ...profileList,
            {  link: "{separator}" }] : []) : item
    );


    const handleSwitch = async (id) => {
        if(id != currentUser.id){
            const result = await fetcher('/api.php?r=system/switch_profile/TemplServiceAccount&params[]=' + id);
            setCurrentUser(result.data);
            redirectdRef.current.redirect('/');
        }
        else{
            redirectdRef.current.redirect(currentUser.url);
        }
    };

    return (
        <>
            <Redirect ref={redirectdRef} />
            <DropdownMenu
                items={updatedMenu.map(
                    (item, index) => {
                        let sTitle = t(item.title);
                        let sType ="";
                        if (item.link == '{switch_profile}') {
                            sTitle = <Pressable className="w-full" onPress={() => handleSwitch(item.id)}><Row key={index} className="items-center justify-between gap-x-3 w-full">
                                <Row className="items-center flex-auto">
                                <View className="px-[2px]">
                                    <Profile
                                        {...item}
                                        url_avatar={item.avatar}
                                        displayType="unit_wo_info"
                                        displaySize="sm"
                                    />
                                </View>
                                <Text className="text-sm leading-[32px] px-[6px] font-medium text-neutral-700 dark:text-neutral-200">
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
                        if (item.link == '{separator}') {
                            sTitle = <Row className="items-center flex-auto my-[4px] sm:border-t border-bdr dark:border-bdr-d"></Row>
                            sType="separator";
                        }
                        if (item.link == '{switch_profile_selector}') {
                            sTitle = (
                                <Row className="w-full items-center flex-auto my-[4px]">
                                    <ProfileSwitcher hideTitle={true}>
                                    <Button
                                        variant="text"
                                        size="sm"
                                        bgrDecorator
                                        fullWidth
                                        align="start"
                                        solid
                                        startDecorator="CircleUserRound"
                                        title={t("See all profiles")}/>
                                </ProfileSwitcher>
                                </Row>)
                            sType="separator";
                        }
                        return (
                            {
                                id: 'menu-' + index,
                                link: item.link.includes("://") ? item.link : '/' + item.link,
                                title: sTitle,
                                type: sType,
                                icon: item.icon
                            }
                        )
                    }
                )}
            >
                {trigger}
            </DropdownMenu>
        </>

    );
}
/*if (item.link == '{switch_profile}') {
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
                            </ProfileSwitcher>)*/