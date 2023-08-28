import { View } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { Button } from 'app/design/controls'
import { Dimensions, Platform } from 'react-native'
import { appSetting } from 'app/lib/util'
import { Text } from 'app/design/typography'
import Profile from 'app/ui/molecules/profile'
import { useCurrentUser } from 'app/context/user'
import { fetcher } from '../../lib/fetcher';
import Redirect from 'app/ui/atoms/redirect';
import { useRef } from 'react';

export default function ElementProfileSwitcher(props) {
    const { currentUser, setCurrentUser } = useCurrentUser();
    const redirectdRef = useRef();

    const handleSwitch = async (id) => {
        const result = await fetcher('/api.php?r=system/switch_profile/TemplServiceAccount&params[]=' + id);
        redirectdRef.current.redirect('/home');
    };
    console.log(props);
    return (
        <>  
            <Redirect ref={redirectdRef} />
            <View className=" pb-4 overflow-hidden flex-col">
                { !props.hideTitle && <View className="flex-row items-center py-1 justify-between">
                    <Text className="text-lg px-2  font-bold text-neutral-800 dark:text-neutral-200 ">
                        Your Profiles
                    </Text>
                </View>
                }
                {props.data.profiles.filter((item) => (item.id != currentUser.id)).map((item, index) => {
                    let dUser = {...item}
                    dUser.url_avatar = dUser.avatar
                    let profile = <Profile {...dUser} displayType="unit_wo_info" displaySize="base" />
                    return (                   
                        <View key = {'index' + index} className=" p-2 flex-row  
                            group duration-200 overflow-hidden rounded-md  
                            active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive 
                            hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
                            max-w-5xl self-center w-full gap-x-2">
                                <View className="w-10 h-10 bg-blue-500/50 rounded-full flex-none ">{profile}</View>
                                <Text className='text-sm my-auto flex-auto font-semibold truncate text-neutral-900  dark:text-neutral-100'>{item.display_name}</Text>
                                <View className="text-sm bont-semibold flex-none my-auto">
                                <Button id="menu" startDecorator="UserSwitch" variant='outline'  size='sm'  onPress={() => handleSwitch(item.id)} />           
                            </View>
                        </View>
                    )
                })}
            </View>
        </>   
    ) 
}
