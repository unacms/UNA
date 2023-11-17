import { View, Pressable } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { useState, useEffect, Children } from 'react'
import { Button } from 'app/design/controls'
import { Text } from 'app/design/typography'
import Profile from 'app/ui/molecules/profile'
import { useCurrentUser } from 'app/context/user'
import { fetcher } from 'app/lib/fetcher';
import Redirect from 'app/ui/atoms/redirect';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { Modal } from 'app/design/controls'
export default function ElementProfileSwitcher(props) {
    const { t } = useTranslation();
    const { currentUser, setCurrentUser } = useCurrentUser();
    const [data, setData] = useState(false)
    const redirectdRef = useRef();

    const handleSwitch = async (id) => {
        const result = await fetcher('/api.php?r=system/switch_profile/TemplServiceAccount&params[]=' + id);
        redirectdRef.current.redirect('/home');
    };

    const handleClick = async (id) => {
        const sResponse = await fetcher('/api.php?r=system/account_profile_switcher/TemplServiceProfiles');
        setData(sResponse.data[0].data);
    };

    return (
        <>  
            <Pressable onPress = {() => handleClick()}>
                {props.children}
            </Pressable>
            {data && <Modal id='file-preview' title = { t ("Your Profiles") } onVisible={data} onClose={() => {setData(false)}}>
                <Redirect ref={redirectdRef} />
                <View className="  overflow-hidden flex-col">
                    { !props.hideTitle && <View className="flex-row items-center  justify-between">
                        <Text className="text-lg px-1.5 py-2 font-bold text-neutral-800 dark:text-neutral-200 ">
                            Your Profiles
                        </Text>
                    </View>
                    }
                    {data.profiles.filter((item) => (item.id != currentUser.id)).map((item, index) => {
                        let dUser = {...item}
                        dUser.url_avatar = dUser.avatar
                        let profile = <Profile {...dUser} displayType="unit_wo_info" displaySize="base" />
                        return (     
                            <Link href={dUser.url} emulate={true} key={index}>              
                            <View key = {'index' + index} className=" p-2 flex-row  
                                group duration-200 overflow-hidden rounded-lg  
                                hover:bg-bgritem dark:hover:bg-bgritem-d
                                max-w-5xl self-center w-full gap-x-2">
                                    <View className="w-10 h-10 bg-blue-500/50 rounded-full flex-none ">{profile}</View>
                                    <Text className='text-sm my-auto flex-auto font-semibold truncate text-neutral-900  dark:text-neutral-100'>{item.display_name}</Text>
                                    <View className="text-sm bont-semibold flex-none my-auto">
                                    <Button id="menu" startDecorator="UserSwitch" variant='outline'  size='sm'  onPress={() => handleSwitch(item.id)} />           
                                </View>
                            </View>
                            </Link>
                        )
                    })}
                </View>
            </Modal>}
        </>   
    ) 
}
