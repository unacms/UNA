import { Text} from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { useCurrentUser } from 'app/context/user'
import { stripTags } from 'app/lib/util';
import { Icon } from 'app/ui/atoms/icon'
import { Button } from 'app/design/controls';
import { fetcher } from 'app/lib/fetcher';
import { useState } from 'react';

export default function ElementInformer({data}) {
    const [ state, setState ] = useState(0);
    const { currentUser, setCurrentUser } = useCurrentUser();

    const pressBack = async () => {
        const sRequest = '/api.php?r=system/email_confirmation/TemplServiceAccount&resend[]=1';
        const sResponse = await fetcher(sRequest);
        setState(1);  
        
    };

    return (
        <View className="w-full mx-auto ">
            <View className="  w-full border-bdr/50 dark:border-bdr-d/50 mx-auto ">
            {currentUser?.informer?.map((item, index) => {
                   if (item.id == 'sys-account-unconfirmed-email'){
                        return (                   
                            <View key={'informer' + index} className="max-w-screen-lg mx-auto bg-yellow-100/80 dark:bg-yellow-900/80 border dark:border-yellow-800 border-yellow-300 p-3 rounded-lg m-2 gap-y-3 justify-center items-center">
                                <View className='flex-row  gap-x-3'>
                                    <View className='flex-none text-black dark:text-white'><Icon icon="Info" className="w-10 h-10"  /></View>
                                    <View className='flex-col justify-center flex-auto gap-y-3'>
                                    {(state == 0 && <><Text className="text-black  dark:text-white ">{stripTags(item.msg)}</Text>
                                    <Button variant="primary" title="Send verification letter"  onPress={pressBack} /></>)}
                                    </View>
                                    {(state == 1 && <><Text className="text-black dark:text-white">Email verification letter was sent, please check your inbox.</Text></>)}
                                </View>
                            </View>
                        )
                    }
                    if (item.id == 'sys-switch-profile-context'){
                        return <View key={'informer' + index}></View>
                    }
                    
                    return (                   
                        <View key={'informer' + index} className="bg-pink-100 p-2 rounded m-2">
                            <Text className="text-black dark:text-white">{stripTags(item.msg)}</Text>
                        </View>
                    )
                })}
            </View>
        </View>
    );
}
