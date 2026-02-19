import { Text} from 'app/design/typography'
import { View } from 'app/design/view'
import { useCurrentUser } from 'app/context/user'
import { stripTags } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import { useState, Fragment } from 'react';
import { BlockWrapper } from 'app/components/block-wrapper'

export default function ElementInformer({data, blockWrapperProps}) {
    const [ state, setState ] = useState(0);
    const { currentUser } = useCurrentUser();

    const pressBack = async () => {
        const sRequest = '/api.php?r=system/email_confirmation/TemplServiceAccount&resend[]=1';
        await fetcher(sRequest);
        setState(1);    
    };

    if (!currentUser?.informer?.length)
        return null

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className="w-full mx-auto fixed bottom-16 lg:bottom-1 z-50">
            <View className="  w-full border-border/60 /50 mx-auto ">
            {currentUser?.informer?.map((item, index) => {
                   if (item.id == 'sys-account-unconfirmed-email'){
                        return <Fragment key={item.id}></Fragment>
                        
                    }
                    if (item.id == 'sys-switch-profile-context' || item.id == 'sys-account-profile-system'){
                        return <View key={'informer' + index}></View>
                    }
                    
                    return (                   
                        <View key={'informer' + index} className="max-w-screen-lg mx-auto bg-accent  p-3 rounded-lg m-2 gap-y-3 justify-center items-center">
                            <Text className="text-accent-foreground">{stripTags(item.msg)}</Text>
                        </View>
                    )
                })}
            </View>
        </View>
        </BlockWrapper>
    );
}
