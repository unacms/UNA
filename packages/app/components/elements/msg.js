import { Text} from 'app/design/typography'
import { View } from 'app/design/view'

export default function ElementMsg({data}) {
    if (!data.length)
        return null;
    return (
        <View className="alert alert-info p-4">
                <Text className="text-black dark:text-white text-center">{data}</Text>
        </View>
    );
}
