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
        <View className="w-full mx-auto bg-bgrnavbar dark:bg-bgrnavbar-d">
            <View className="w-3/4 mx-auto ">
            {currentUser?.informer?.map((item, index) => {
                   if (item.id == 'sys-account-unconfirmed-email'){
                        return (                   
                            <View key={'informer' + index} className="bg-yellow-100 p-2 rounded m-2 gap-y-4 justify-center items-center">
                                <Row className='justify-center items-center'>
                                    <View className='mr-4 text-black dark:text-white'><Icon icon="Info" className="w-10 h-10"  /></View>
                                    {(state == 0 && <><Text className="text-black dark:text-white mr-4">{stripTags(item.msg)}</Text><Button variant="primary" title="Send verification letter"  onPress={pressBack} /></>)}
                                    {(state == 1 && <><Text className="text-black dark:text-white">Email verification letter was sent, please check your inbox.</Text></>)}
                                </Row>
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
