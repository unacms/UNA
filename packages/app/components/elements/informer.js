import { Text} from 'app/design/typography'
import { View } from 'app/design/view'
import { useCurrentUser } from 'app/context/user'
import { stripTags } from 'app/lib/util';

export default function ElementInformer({data}) {
    const { currentUser, setCurrentUser } = useCurrentUser();
    return (
        <View className="w-full mx-auto">
            <View className="w-3/4 mx-auto ">
            {currentUser?.informer?.map((item, index) => {
                   if (item.id == 'sys-account-unconfirmed-email'){
                        //confirm-email&resend=1
                        return (                   
                            <View className="bg-yellow-100 p-2 rounded m-2">
                                <Text className="text-black dark:text-white">{stripTags(item.msg)}</Text>
                            </View>
                        )
                    }
                    return (                   
                        <View className="bg-pink-500">
                            <Text className="text-black dark:text-white">{stripTags(item.msg)}</Text>
                        </View>
                    )
                })}
            </View>
        </View>
    );
}
