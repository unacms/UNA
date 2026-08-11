import { View, Pressable, Row, ScrollView } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { useState, useRef, useEffect } from 'react'
import { Button } from 'app/design/controls'
import { Text } from 'app/design/typography'
import Profile from 'app/ui/molecules/profile/profile'
import { useCurrentUser } from 'app/context/user'
import { fetcher } from 'app/lib/fetcher';
import Redirect from 'app/ui/atoms/redirect';
import { useTranslation } from 'react-i18next';
import { Modal } from 'app/design/controls'
import { BlockWrapper } from 'app/components/block-wrapper'

export default function ProfileSwitcher({ className, rounded = 'rounded-lg', children, hideTitle, listOnly, blockWrapperProps }) {
    const { t } = useTranslation();
    const { currentUser, setCurrentUser } = useCurrentUser();
    const [data, setData] = useState(false)
    const [show, setShow] = useState(false)
    const redirectdRef = useRef();
    const wrapperClassName = className || '';

    const handleSwitch = async (id) => {
        const result = await fetcher('/api.php?r=system/switch_profile/TemplServiceAccount&params[]=' + id);
        setCurrentUser(result.data);
        setShow(false);
    };

    async function fetchData() {
        const sResponse = await fetcher('/api.php?r=system/account_profile_switcher/TemplServiceProfiles');
        if (sResponse && sResponse.data && sResponse.data[0] && sResponse.data[0].data)
            setData(sResponse.data[0].data);
    }

    useEffect(() => {
        if (show)
            fetchData()
    }, [show]);

    const handleClick = async (id) => {
        setShow(true)
    };

    const profileList = data?.profiles?.filter((item) => (item.id != currentUser.id));

    if (!currentUser || (currentUser.profiles_count < 2 && currentUser?.menu?.items == 0) || currentUser.profiles_count == currentUser.profiles_limit) {
        return <></>;
    }

    return (
        <BlockWrapper {...blockWrapperProps}>
            {true ?
                <Pressable className={wrapperClassName} onPress={() => handleClick()}>
                    {children}
                </Pressable> :
                <Link href={currentUser.url} emulate={true} >
                    <Row className={(rounded + " w-full web:group items-center px-0.5 justify-between cursor-pointer " + wrapperClassName).trim()}>
                        <Row className='flex-row items-center p-1.5'>
                            <Profile
                                {...currentUser}
                                url_avatar={currentUser.avatar}
                                displayType="unit_wo_info"
                                displaySize="base"
                            />
                            <View className='flex-col'>
                                <Text className=" text-base p-1.5 flex-auto my-auto font-semibold truncate text-secondary-foreground  web:group-hover:text-foreground  web:duration-300">
                                    {currentUser.display_name}
                                </Text>
                                <Text className=" text-xs p-1.5 flex-auto my-auto truncate text-muted-foreground  web:group-hover:text-secondary-foreground  web:duration-300">
                                    {currentUser.membership_name}
                                </Text></View>
                        </Row>
                        <View className='flex-none p-1.5'>
                            {currentUser.profiles_count > 1 && <Button
                                variant="text"
                                size="sm"
                                startDecorator="RefreshCw"
                                fullWidth
                                align="right"
                                onPress={() => handleClick()}
                            />}
                        </View>
                    </Row>
                </Link>
            }
            {(show && data) && <Modal id='file-preview' title={t("Your Profiles")} onVisible={show} onClose={() => { setShow(false) }}>
                <Redirect ref={redirectdRef} />
                <ScrollView>
                    <View className="   flex-col">
                        {!hideTitle && <View className="flex-row items-center  justify-between">
                            <Text className="text-lg px-1.5 py-2 font-bold text-secondary-foreground  ">
                                Your Profiles
                            </Text>
                        </View>
                        }
                        {profileList && profileList.map((item, index) => {
                            let dUser = { ...item }
                            dUser.url_avatar = dUser.avatar
                            let profile = <Profile {...dUser} displayType="unit_wo_info" displaySize="base" />
                            return (
                                <Link href={dUser.url} emulate={true} key={index}>
                                    <View key={'index' + index} className=" p-2 flex-row  
                                web:group web:duration-200 rounded-lg  
                                
                                max-w-5xl self-center w-full gap-x-3">
                                        <View className="flex-none ">{profile}</View>
                                        <Text className='text-sm my-auto flex-auto font-semibold truncate text-popover-foreground '>{item.display_name}</Text>
                                        <View className="text-sm bont-semibold flex-none my-auto">
                                            <Button id="menu" startDecorator="RefreshCw" title="Switch" variant='outline' size='sm' onPress={() => handleSwitch(item.id)} />
                                        </View>
                                    </View>
                                </Link>
                            )
                        })}
                        {!listOnly && <View className='sm:flex-row justity-between mt-4 w-full sm:mx-0'>
                            {!!currentUser?.menu?.items && currentUser.menu.items.map((item, index) => (
                                <View key={index} className={'mb-2 sm:mb-0 w-full sm:w-1/' + (currentUser.menu.items.length + 1) + ' pr-2 '}>
                                    <Link href={`/${item.name}`}>
                                        <Button
                                            variant="outline"
                                            title={t("New " + item.title)}
                                            startDecorator="UserCircle"
                                            fullWidth
                                        />
                                    </Link>
                                </View>
                            ))}
                            {!!currentUser?.menu?.items && <View className={'w-full sm:w-1/' + (currentUser.menu.items.length + 1) + ''}>
                                <Link href="/logout">
                                    <Button
                                        variant="outline"
                                        title={t("Sign out")}
                                        startDecorator="LogOut"
                                        fullWidth
                                    />
                                </Link>
                            </View>}
                        </View>}
                    </View>
                </ScrollView>
            </Modal>}
        </BlockWrapper>
    )
}
