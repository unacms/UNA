import { Text} from 'app/design/typography'
import { View } from 'app/design/view'

export default function ElementMsg({data}) {
    if (!data.length)
        return null;
    return (
        <View className=" p-4 bg-yellow-100/80 dark:bg-yellow-900/80 border dark:border-yellow-800 border-yellow-300 p-3 rounded-lg mb-4">
                <Text className="text-black dark:text-white text-center">{data}</Text>
        </View>
    );
}
