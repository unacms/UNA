import { Text} from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { useCurrentUser } from 'app/context/user'
import { stripTags } from 'app/lib/util';
import { Icon } from 'app/ui/atoms/icon'
import { Button } from 'app/design/controls';
import { fetcher } from 'app/lib/fetcher';
import React, { useState } from 'react';

export default function ElementInformer({data}) {
    const [ state, setState ] = useState(0);
    const { currentUser, setCurrentUser } = useCurrentUser();

    const pressBack = async () => {
        const sRequest = '/api.php?r=system/email_confirmation/TemplServiceAccount&resend[]=1';
        const sResponse = await fetcher(sRequest);
        setState(1);  
        
    };

    if (!currentUser?.informer?.length)
        return <></>

    return (
        <View className="w-full mx-auto fixed bottom-0">
            <View className="  w-full border-bdr/50 dark:border-bdr-d/50 mx-auto ">
            {currentUser?.informer?.map((item, index) => {
                   if (item.id == 'sys-account-unconfirmed-email'){
                        return <React.Fragment key={item.id}></React.Fragment>
                        
                    }
                    if (item.id == 'sys-switch-profile-context' || item.id == 'sys-account-profile-system'){
                        return <View key={'informer' + index}></View>
                    }
                    
                    return (                   
                        <View key={'informer' + index} className="max-w-screen-lg mx-auto bg-yellow-100/80 dark:bg-yellow-900/80 border dark:border-yellow-800 border-yellow-300 p-3 rounded-lg m-2 gap-y-3 justify-center items-center">
                            <Text className="text-black dark:text-white">{stripTags(item.msg)}</Text>
                        </View>
                    )
                })}
            </View>
        </View>
    );
}
