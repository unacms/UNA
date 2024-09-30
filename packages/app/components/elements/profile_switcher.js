import { View, Pressable, Row } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { useState, Children, useRef, useEffect } from 'react'
import { Button } from 'app/design/controls'
import { Text } from 'app/design/typography'
import Profile from 'app/ui/molecules/profile'
import { useCurrentUser } from 'app/context/user'
import { fetcher } from 'app/lib/fetcher';
import Redirect from 'app/ui/atoms/redirect';
import { useTranslation } from 'react-i18next';
import { Modal } from 'app/design/controls'

export default function (props) {
    const { t } = useTranslation();
    const { currentUser, setCurrentUser } = useCurrentUser();
    const [data, setData] = useState(false)
    const [show, setShow] = useState(false)
    const redirectdRef = useRef();

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

    if (!currentUser) {
        return <></>;
    }

    const rounded = props.rounded ? props.rounded : 'rounded-xl'
    return (
        <>
            {!props.useDefault ?
                <Pressable onPress={() => handleClick()}>
                    {props.children}
                </Pressable> :
                <Link href={currentUser.url} emulate={true} >
                    <Row className={rounded + " items-center justify-between cursor-pointer hover:bg-bgrbutton-h dark:hover:bg-bgrbutton-dh active:opacity-50"}>
                        <Row className='flex-row px-1 items-center'>
                            <Profile
                                {...currentUser}
                                url_avatar={currentUser.avatar}
                                displayType="unit_wo_info"
                                displaySize="base"
                            />
                            <Text className="text-lg pl-2.5 flex-auto my-auto font-semibold truncate text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-900  dark:group-hover:text-neutral-100">
                                {currentUser.display_name}
                            </Text>
                        </Row>
                        <View className='flex-none '>
                            {currentUser.profiles_count > 1 && <Button
                                variant="text"
                                size="sm"
                                tooltip={t('Switch profile')}
                                startDecorator="UserSwitch"
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
                <View className="  overflow-hidden flex-col">
                    {!props.hideTitle && <View className="flex-row items-center  justify-between">
                        <Text className="text-lg px-1.5 py-2 font-bold text-neutral-800 dark:text-neutral-200 ">
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
                                group duration-200 overflow-hidden rounded-lg  
                                hover:bg-bgritem dark:hover:bg-bgritem-d
                                max-w-5xl self-center w-full gap-x-2">
                                    <View className="w-10 h-10 bg-blue-500/50 rounded-full flex-none ">{profile}</View>
                                    <Text className='text-sm my-auto flex-auto font-semibold truncate text-neutral-900 dark:text-neutral-100'>{item.display_name}</Text>
                                    <View className="text-sm bont-semibold flex-none my-auto">
                                        <Button id="menu" startDecorator="UserSwitch" tooltip={t('Switch profile')} variant='outline' size='sm' onPress={() => handleSwitch(item.id)} />
                                    </View>
                                </View>
                            </Link>
                        )
                    })}
                    <View className='sm:flex-row justity-between mt-4 m-2 w-full sm:mx-0'>
                        {currentUser?.menu?.items && currentUser.menu.items.map((item, index) => (
                            <View key={index} className={'mb-2 sm:mb-0 w-full sm:w-1/' + (currentUser.menu.items.length + 1) + ' pr-2 '}>
                                <Link href={item.name}>
                                    <Button
                                        variant="outline"
                                        title={t("New " + item.title)}
                                        startDecorator="UserCircle"
                                        fullWidth
                                    />
                                </Link>
                            </View>
                        ))}
                        <View className={'w-full sm:w-1/' + (currentUser.menu.items.length + 1) + ''}>
                            <Link href="/logout">
                                <Button
                                    variant="outline"
                                    title={t("Sign out")}
                                    startDecorator="SignOut"
                                    fullWidth
                                />
                            </Link>
                        </View>
                    </View>
                </View>
            </Modal>}
        </>
    )
}
