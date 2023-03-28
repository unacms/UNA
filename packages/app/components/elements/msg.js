import { Text} from 'app/design/typography'
import { View } from 'app/design/view'

export default function ElementMsg({data}) {
    if (!data.length)
        return null;
    return (
        <View className="alert alert-info ">
                <Text className="text-black dark:text-white">{data}</Text>
        </View>
    );
}
